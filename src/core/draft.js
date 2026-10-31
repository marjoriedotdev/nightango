/* ---------- State drafts: copy on write ---------- */
// Key under which a draft proxy gives its node: a symbol never collides with a state key.
var DRAFT = Symbol('draft');
// Array methods that only move elements: they run on the copy itself, without a draft for each element.
var ARRAY_MOVES = { push: true, unshift: true, splice: true, sort: true, reverse: true };
function isObj(v) { return v !== null && typeof v === 'object'; }

/**
 * Draft node, also the target of its proxy: the object it stands for, its copy once written, its parent and the drafts read under each key.
 * wide marks a copy given objects or reordered: its settlement looks at every key, not only at the drafts read.
 * @param {Object} base Object of the state, never changed.
 * @param {?Object} parent Node of the object that holds it.
 * @param {{open: boolean, fresh: Set}} scope Draft it belongs to, closed once its state is built, with the objects given during the draft.
 */
function draftNode(base, parent, scope) {
  // An array target keeps Array.isArray and JSON.stringify working on the proxy.
  var n = Array.isArray(base) ? [] : {};
  n.base = base; n.copy = null; n.parent = parent; n.scope = scope; n.children = null; n.wide = false; n.done = false; n.out = null;
  n.proxy = new Proxy(n, DRAFT_TRAPS);
  return n;
}
/**
 * Copies a node and the nodes above it on their first change.
 * @param {Object} n Changed node.
 */
function markChanged(n) {
  if (!n.scope.open) throw new Error('State changed outside update');
  for (var x = n; x && !x.copy; x = x.parent) x.copy = shallowCopy(x.base);
}
function shallowCopy(o) {
  if (Array.isArray(o)) return o.slice();
  // A loop rather than Object.assign: three times faster on the users map, an object with thousands of keys.
  var c = {};
  for (var k in o) c[k] = o[k];
  return c;
}
/**
 * Records an object given during the draft: it is changed in place and searched for drafts once the state is built.
 * @param {Object} n Node that receives it.
 * @param {*} v Value given.
 */
function keepGiven(n, v) {
  if (!isObj(v)) return;
  n.wide = true;
  if (!v[DRAFT]) n.scope.fresh.add(v);
}
/**
 * Runs an array method that only moves elements on a plain array, each draft already read moving with its element.
 * The array changes only if the elements or their order change: a sort of a sorted array keeps it.
 * @param {Object} n Node of the array.
 * @param {string} method Name in ARRAY_MOVES.
 * @param {Arguments} args Arguments of the call.
 */
function moveElements(n, method, args) {
  var before = (n.copy || n.base).slice(), k, i;
  if (n.children) for (k in n.children) if (before[k] === n.children[k].base) before[k] = n.children[k].proxy;
  var after = before.slice(), out = Array.prototype[method].apply(after, args);
  if (method === 'sort' || method === 'reverse') out = n.proxy;
  if (after.length === before.length && after.every(function (v, j) { return v === before[j]; })) return out;
  markChanged(n);
  n.copy = after;
  n.children = null;
  n.wide = true;
  for (i = 0; i < args.length; i++) keepGiven(n, args[i]);
  return out;
}
var DRAFT_TRAPS = {
  get: function (n, key) {
    if (key === DRAFT) return n;
    var src = n.copy || n.base, v = src[key];
    if (ARRAY_MOVES[key] === true && Array.isArray(src)) return function () { return moveElements(n, key, arguments); };
    if (!isObj(v) || typeof key === 'symbol' || key === '__proto__' || v[DRAFT] || n.scope.fresh.has(v)) return v;
    var c = n.children && n.children[key];
    if (!c || c.base !== v) {
      if (!n.children) n.children = Object.create(null);
      c = n.children[key] = draftNode(v, n, n.scope);
    }
    return c.proxy;
  },
  set: function (n, key, value) {
    var src = n.copy || n.base, cur = src[key];
    if (cur === value && (value !== undefined || key in src)) return true;
    // A draft written back where it was read, as sort and splice do through the proxy: nothing changes.
    if (isObj(value) && value[DRAFT] && n.children && n.children[key] === value[DRAFT] && cur === value[DRAFT].base) return true;
    markChanged(n);
    keepGiven(n, value);
    n.copy[key] = value;
    return true;
  },
  deleteProperty: function (n, key) {
    if (!(key in (n.copy || n.base))) return true;
    markChanged(n);
    delete n.copy[key];
    return true;
  },
  defineProperty: function (n, key, desc) {
    markChanged(n);
    keepGiven(n, desc.value);
    return Reflect.defineProperty(n.copy, key, desc);
  },
  has: function (n, key) { return key in (n.copy || n.base); },
  ownKeys: function (n) { return Reflect.ownKeys(n.copy || n.base); },
  getOwnPropertyDescriptor: function (n, key) {
    var desc = Reflect.getOwnPropertyDescriptor(n.copy || n.base, key);
    // A proxy may report a fixed property only if its target has it: of the target nodes, only an array has one, its length.
    if (desc && !(Array.isArray(n) && key === 'length')) desc.configurable = true;
    return desc;
  }
};
/**
 * Returns the object a node becomes in the next state: its base if nothing under it changed, its copy with the drafts it holds resolved otherwise.
 * @param {Object} n Draft node.
 */
function settleNode(n) {
  if (n.done) return n.out;
  n.done = true;
  n.out = n.copy || n.base;
  if (!n.copy) return n.out;
  var c = n.copy, k;
  if (!n.wide) { for (k in n.children) settleSlot(n, c, k); }
  else if (Array.isArray(c)) { for (k = 0; k < c.length; k++) settleSlot(n, c, k); }
  else for (k in c) settleSlot(n, c, k);
  return n.out;
}
function settleSlot(n, c, k) {
  var v = c[k];
  if (!isObj(v)) return;
  var d = v[DRAFT], child = n.children && n.children[k];
  if (d) c[k] = settleNode(d);
  else if (n.scope.fresh.has(v)) c[k] = settleGiven(v, n.scope);
  else if (child && child.base === v) c[k] = settleNode(child);
}
/**
 * Resolves the drafts held by an object given during the draft, which can hold drafts read elsewhere at any depth.
 * @param {Object} v Given object.
 * @param {{fresh: Set}} scope Draft it was given in.
 */
function settleGiven(v, scope) {
  var d = v[DRAFT];
  if (d) return settleNode(d);
  // Settled once: the same object can be given at several places.
  scope.fresh.delete(v);
  Object.keys(v).forEach(function (k) {
    var x = v[k];
    if (!isObj(x)) return;
    var y = settleGiven(x, scope);
    if (y !== x) v[k] = y;
  });
  return v;
}
/**
 * Returns the object behind a draft as it stands, or the value itself outside a draft.
 * A scan that only reads goes through it: a draft for each element would cost more than the scan. Its elements are changed through the draft only.
 * @param {*} v Draft or value.
 */
function plainOf(v) {
  var n = isObj(v) && v[DRAFT];
  if (!n) return v;
  var src = n.copy || n.base, out = src, k, c;
  // A child changed through the draft holds its changes in its own copy until the state is built: its draft reads them.
  for (k in n.children) {
    c = n.children[k];
    if (c.copy && src[k] === c.base) { if (out === src) out = shallowCopy(src); out[k] = c.proxy; }
  }
  return out;
}
/**
 * Opens a draft of a state: changed like the state, it copies only the objects a change reaches, from the changed one up to the root.
 * @param {Object} base State the draft starts from, never changed.
 * @returns {{root: Object, finish: function(): Object}} Draft of the root, and the next state, which shares every object the changes left alone.
 */
function openDraft(base) {
  var scope = { open: true, fresh: new Set() }, root = draftNode(base, null, scope);
  return { root: root.proxy, finish: function () { scope.open = false; return settleNode(root); } };
}
