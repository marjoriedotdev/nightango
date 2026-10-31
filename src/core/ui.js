/* ---------- Context and UI primitives ---------- */
var Ctx = React.createContext(null);
function useApp() { return useContext(Ctx); }
// The parts of the application context that stay the same object for the whole session.
var ApiCtx = React.createContext(null);
// Season whose decorations are shown, apart: an avatar reads it without rendering again on every state change.
var SeasonCtx = React.createContext(null);
/**
 * Returns the parts of the application context that never change: actions, ui, nav, update, drafts, the state store and the minute clock.
 * A component that reads only them renders again for its own props and state only. Its state is the shown state at the time it is read, for handlers:
 * a render takes what it shows from its props or useStatePart.
 */
function useAppApi() { return useContext(ApiCtx); }
/**
 * Returns a part of the shown state and renders again only when that part changes.
 * @param {function(Object): *} part Reads the part: a value of the state, never an object built on each call.
 */
function useStatePart(part) {
  var store = useAppApi().store;
  return useSyncExternalStore(store.subscribe, function () { return part(store.shown()); });
}
/**
 * Clock that ticks every minute on a single timer, running while something listens to it.
 * @returns {{subscribe: function(Function): Function, now: function(): number}} Subscription, and time of the last tick.
 */
function minuteClock() {
  var listeners = [], timer = null, now = Date.now();
  return {
    now: function () { return now; },
    subscribe: function (l) {
      if (!listeners.length) timer = setInterval(function () { now = Date.now(); listeners.forEach(function (f) { f(); }); }, MIN);
      listeners.push(l);
      return function () {
        listeners = listeners.filter(function (x) { return x !== l; });
        if (!listeners.length) clearInterval(timer);
      };
    }
  };
}
/**
 * Renders again on each tick of the minute clock of the application, which all relative times share.
 */
function useMinute() {
  var clock = useAppApi().clock;
  useSyncExternalStore(clock.subscribe, clock.now);
}
/**
 * Returns functions that keep their identity from one render to the next and call those of the latest render.
 * @param {Object<string, Function>} fns Functions of this render, always the same keys.
 */
function useLatestCalls(fns) {
  var latest = useRef(fns), calls = useRef(null);
  latest.current = fns;
  if (!calls.current) {
    calls.current = {};
    Object.keys(fns).forEach(function (k) { calls.current[k] = function () { return latest.current[k].apply(null, arguments); }; });
  }
  return calls.current;
}

/* Single layer for dialogs, menus and notifications: out of the flow, they no longer distort the layout. */
var LayerCtx = React.createContext(null);
function appMount() { return window.__TORCH_MOUNT__ || document.getElementById('app'); }
/**
 * Gives the interface inside it its layer node and its stack of open dialogs.
 * @param {{children: *}} p Interface.
 */
function Layers(p) {
  var ref = useRef(null);
  if (!ref.current) ref.current = { node: null, dialogs: [] };
  return h(LayerCtx.Provider, { value: ref.current }, p.children);
}
/**
 * Returns the layer node next to the mount point, created again once it has left the document.
 * @param {{node: ?Element}} layer Layer given by Layers.
 */
function layerRoot(layer) {
  if (layer.node && layer.node.isConnected) return layer.node;
  var mountEl = appMount();
  layer.node = document.createElement('div');
  layer.node.id = 'layer';
  (mountEl && mountEl.parentNode ? mountEl.parentNode : document.body).appendChild(layer.node);
  return layer.node;
}
function Portal(p) { return ReactDOM.createPortal(p.children, layerRoot(useContext(LayerCtx))); }

function useOutside(ref, open, onClose, extraRef) {
  useEffect(function () {
    if (!open) return;
    function onDown(e) {
      var path = e.composedPath ? e.composedPath() : [e.target];
      if (ref.current && path.indexOf(ref.current) < 0 && !(extraRef && extraRef.current && path.indexOf(extraRef.current) >= 0)) onClose(e);
    }
    function onKey(e) { if (e.key === 'Escape') onClose(e); }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    document.addEventListener('keydown', onKey);
    return function () { document.removeEventListener('mousedown', onDown); document.removeEventListener('touchstart', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);
}

var LOAD_BELOW_MARGIN = '0px 0px 400px 0px';

/**
 * Requests the next page when a sentinel approaches the visible area.
 * @param {Object} rootRef Ref of the scrolling area.
 * @param {Object} sentinelRef Ref of the sentinel.
 * @param {boolean} enabled A next page can be requested.
 * @param {Function} onReach Request for the next page.
 * @param {string} margin Approach margin in rootMargin format.
 */
function useInfiniteScroll(rootRef, sentinelRef, enabled, onReach, margin) {
  useEffect(function () {
    if (!enabled) return;
    var io = new IntersectionObserver(function (entries) {
      if (entries.some(function (e) { return e.isIntersecting; })) onReach();
    }, { root: rootRef.current, rootMargin: margin });
    io.observe(sentinelRef.current);
    return function () { io.disconnect(); };
  }, [enabled]);
}

var FLOAT_UNPLACED = { position: 'fixed', visibility: 'hidden', top: 0, left: 0 };
/**
 * Anchors a floating layer to its trigger, closes it on an outside click, on Escape, on scroll of the page or of a trigger container and on resize, and focuses its first button.
 * @param {Object} anchorRef Ref of the trigger.
 * @param {Object} floatRef Ref of the layer.
 * @param {boolean} open The layer is open.
 * @param {function(Event)} onClose Closing, with the event that causes it.
 * @param {{up: boolean, align: string, at: ?{x: number, y: number}}} o Opening upward, alignment on the left edge of the trigger, anchor point that replaces the trigger.
 * @returns {Object} Position style, hidden until the layer is measured.
 */
function useFloating(anchorRef, floatRef, open, onClose, o) {
  useOutside(anchorRef, open, onClose, floatRef);
  var ps = useState(null), place = ps[0], setPlace = ps[1];
  // Fixed position computed from the trigger, flipped up or down if the layer would leave the screen.
  useLayoutEffect(function () {
    if (!open) { setPlace(null); return; }
    if (!anchorRef.current) return;
    var r = o.at ? { top: o.at.y, bottom: o.at.y, left: o.at.x, right: o.at.x } : anchorRef.current.getBoundingClientRect(), vw = document.documentElement.clientWidth, vh = window.innerHeight;
    var mh = floatRef.current ? floatRef.current.offsetHeight : 0, up = o.up ? r.top - mh - 4 >= 8 || r.bottom + mh + 4 > vh : r.bottom + mh + 4 > vh - 8 && r.top - mh - 4 >= 8;
    var mw = floatRef.current ? floatRef.current.offsetWidth : 0;
    var st = { position: 'fixed' };
    if (up) st.bottom = (vh - r.top + 4) + 'px'; else st.top = (r.bottom + 4) + 'px';
    // Slid along the screen edge rather than flipped to the other side of the trigger: on a phone, the flip pushed a wide layer off screen.
    if (o.align === 'left') st.left = Math.max(8, Math.min(r.left, vw - 8 - mw)) + 'px'; else st.right = Math.max(8, Math.min(vw - r.right, vw - 8 - mw)) + 'px';
    setPlace(st);
  }, [open, o.at]);
  useEffect(function () {
    if (!open) return;
    // Only the scroll of a trigger container moves the layer, not the scroll of the message log receiving a message.
    function onMove(e) { if (e.type === 'scroll' && e.target !== document && !e.target.contains(anchorRef.current)) return; onClose(e); }
    window.addEventListener('resize', onMove);
    document.addEventListener('scroll', onMove, true);
    return function () { window.removeEventListener('resize', onMove); document.removeEventListener('scroll', onMove, true); };
  }, [open]);
  // After placement: a layer still in visibility hidden refuses focus in a real browser.
  useEffect(function () {
    if (place && floatRef.current) { var first = floatRef.current.querySelector('button:not(:disabled)'); if (first) first.focus(); }
  }, [!!place]);
  return place || FLOAT_UNPLACED;
}

// Only breakpoint of the right column: app.css does not repeat it, the column is only rendered above it.
var NARROW_LAYOUT = '(max-width:1180px)';
/**
 * Toggles the right column when the window leaves room for it and otherwise opens its content full screen.
 * @param {Function} openFull Opens the same content full screen.
 */
function useRightColumn(openFull) {
  var a = useState(function () { return !window.matchMedia(NARROW_LAYOUT).matches; }), fits = a[0], setFits = a[1];
  var b = useState(true), shown = b[0], setShown = b[1];
  useEffect(function () {
    var mq = window.matchMedia(NARROW_LAYOUT);
    function onChange() { setFits(!mq.matches); }
    mq.addEventListener('change', onChange);
    return function () { mq.removeEventListener('change', onChange); };
  }, []);
  return { open: fits && shown, pressed: fits ? shown : null, toggle: function () { if (fits) setShown(!shown); else openFull(); } };
}

/**
 * Composer text kept when leaving the conversation and given back on return.
 * The drafts belong to Root, which gives them through the context.
 * @param {string} key Conversation, as group:<id> or dm:<name>.
 * @returns {Array} Text, its setter, and a ref to the text saved on leaving, which the view may replace after the call.
 */
function useDraft(key) {
  var drafts = useApp().drafts;
  var a = useState(function () { return drafts.current[key] || ''; }), kept = useRef('');
  kept.current = a[0];
  useEffect(function () {
    return function () { if (kept.current) drafts.current[key] = kept.current; else delete drafts.current[key]; };
  }, [key]);
  return [a[0], a[1], kept];
}

/* Button that opens an action menu. items: {label, icon, onSelect, danger, disabled, checked, divider, swatch, presence}. open and onOpenChange make it controlled, at {x, y} anchors it to a point */
function MenuButton(p) {
  var st = useState(false), open = p.open != null ? p.open : st[0];
  var ref = useRef(null), menuRef = useRef(null);
  function setOpen(n) { if (p.open == null) st[1](n); if (p.onOpenChange) p.onOpenChange(n); }
  function close() {
    var trigger = ref.current && ref.current.querySelector('button');
    var held = menuRef.current && menuRef.current.contains(menuRef.current.getRootNode().activeElement);
    setOpen(false);
    if (!trigger || !held) return;
    // Before the menu leaves: its focused item would take the focus with it, to the page body.
    trigger.focus({ preventScroll: true });
    // A press on a spot that takes no focus clears it once the event is over: the button takes it back then.
    setTimeout(function () { var a = trigger.getRootNode().activeElement; if (!a || a === document.body) trigger.focus({ preventScroll: true }); }, 0);
  }
  var place = useFloating(ref, menuRef, open, close, { up: p.up, align: p.align, at: p.at });
  function toggle() { if (open) close(); else setOpen(true); }
  function onKey(e) {
    if (!menuRef.current) return;
    var items = Array.prototype.slice.call(menuRef.current.querySelectorAll('button:not(:disabled)'));
    var i = items.indexOf(menuRef.current.getRootNode().activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
  }
  var trigger = p.renderTrigger
    ? p.renderTrigger({ onClick: toggle, 'aria-expanded': String(open), 'aria-haspopup': 'menu' })
    : h(T.IconButton, { icon: p.icon || 'more', label: p.label, size: p.size || 32, iconSize: p.iconSize, onClick: toggle, 'aria-expanded': String(open), 'aria-haspopup': 'menu' });
  return h('div', { className: 'menu-anchor', ref: ref },
    trigger,
    open ? h(Portal, null, h('div', { className: 'menu floating', role: 'menu', ref: menuRef, onKeyDown: onKey, style: place },
      p.items.filter(Boolean).map(function (it, i) {
        if (it.divider) return h('hr', { key: 'd' + i });
        return h('button', {
          key: i, type: 'button', role: it.checked != null ? 'menuitemradio' : 'menuitem', 'aria-checked': it.checked != null ? String(!!it.checked) : undefined,
          className: it.danger ? 'danger' : undefined, disabled: it.disabled,
          onClick: function () { close(); it.onSelect(); }
        },
          it.presence ? h('span', { className: 'tc-presence tc-presence-' + it.presence + ' menu-presence' }) : it.swatch ? h('span', { className: 'swatch', style: { background: it.swatch } }) : it.icon ? h(T.Icon, { name: it.icon, size: 15 }) : null,
          h('span', { className: 'grow' }, it.label),
          it.checked ? h(T.Icon, { name: 'check', size: 14 }) : null);
      }))) : null);
}

/**
 * Color field with its hex value.
 * @param {{id: string, label: string, value: string, onChange: function(string)}} p Id, label, #rrggbb color and change callback.
 */
function ColorField(p) {
  return h('div', { className: 'tc-field' },
    h('label', { className: 'tc-label', htmlFor: p.id }, p.label),
    h('div', { style: { display: 'flex', alignItems: 'center', gap: 8 } },
      h('input', { id: p.id, type: 'color', className: 'color-in', style: { borderRadius: 7 }, value: p.value, onChange: function (e) { p.onChange(e.target.value); } }),
      h('span', { className: 'tnum', style: { fontSize: 12.5, color: 'var(--text-2)' } }, p.value)));
}

/**
 * Button that opens the JSON file picker.
 * @param {{onFile: function(File), icon: ?string, size: ?string, children: *}} p Callback for the chosen file, icon, size and button label.
 */
function JsonFileButton(p) {
  var ref = useRef(null);
  function change(e) {
    var file = e.target.files && e.target.files[0];
    // Picker cleared: choosing the same file again must read it again.
    e.target.value = '';
    if (file) p.onFile(file);
  }
  return h(Frag, null,
    h('input', { ref: ref, type: 'file', accept: '.json,application/json', hidden: true, onChange: change }),
    h(T.Button, { icon: p.icon, size: p.size, onClick: function () { ref.current.click(); } }, p.children));
}

var SKELETON_WIDTHS = ['62%', '44%', '70%', '52%', '66%', '40%'];
/**
 * Placeholder rows shaped like a list.
 * @param {{count: number, avatar: number, square: boolean, twoLines: boolean, label: string}} p Row count, avatar size, group avatar, second text line and announcement read by screen readers.
 */
function SkeletonRows(p) {
  var rows = [];
  for (var i = 0; i < p.count; i++) {
    rows.push(h('div', { key: i, className: 'skel-row' },
      h(T.Skeleton, { circle: !p.square, width: p.avatar, height: p.avatar }),
      h('span', { className: 'skel-lines' },
        h(T.Skeleton, { width: SKELETON_WIDTHS[i % SKELETON_WIDTHS.length], height: 12 }),
        p.twoLines ? h(T.Skeleton, { width: '85%', height: 10 }) : null)));
  }
  return h('div', { role: 'status' }, h('span', { className: 'tc-sr' }, p.label), rows);
}

/**
 * Makes the interface behind the top dialog inert so that Tab and screen readers stay in it.
 * The app and the dialogs under the top one become inert. Menus and toasts, above the dialogs, stay reachable.
 * @param {{dialogs: Array}} layer Layer given by Layers.
 */
function syncInert(layer) {
  // Dialogs that close in the same render have already lost their node: they no longer keep the app inert.
  var layers = layer.dialogs.filter(function (r) { return r.current; }).map(function (r) { return r.current.closest('.overlay'); });
  appMount().toggleAttribute('inert', layers.length > 0);
  layers.forEach(function (el, i) { el.toggleAttribute('inert', i < layers.length - 1); });
}
/**
 * Puts a modal layer on top of the open dialogs.
 * @param {{dialogs: Array}} layer Layer given by Layers.
 * @param {Object} ref Ref of the layer overlay or of an element inside it.
 */
function openModal(layer, ref) { layer.dialogs.push(ref); syncInert(layer); }
/**
 * Takes a modal layer out of the open dialogs.
 * It comes before the focus goes back to where it was, since an element in an inert app takes no focus.
 * @param {{dialogs: Array}} layer Layer given by Layers.
 * @param {Object} ref Ref given to openModal.
 */
function closeModal(layer, ref) { layer.dialogs.splice(layer.dialogs.indexOf(ref), 1); syncInert(layer); }
function Dialog(p) {
  var ref = useRef(null), layer = useContext(LayerCtx);
  useEffect(function () {
    var rootNode = ref.current ? ref.current.getRootNode() : document;
    var prev = rootNode.activeElement;
    var el = ref.current && ref.current.querySelector('[data-autofocus], input, textarea, select, button');
    if (el) el.focus();
    openModal(layer, ref);
    function onKey(e) {
      // Every dialog listens on document: only the top one reacts.
      if (layer.dialogs[layer.dialogs.length - 1] !== ref) return;
      if (e.key === 'Escape' && p.onClose) { e.stopPropagation(); p.onClose(); }
      if (e.key === 'Tab' && ref.current) {
        // A disabled control takes no focus: at either end of the list, Tab would leave the dialog past it.
        var f = ref.current.querySelectorAll('button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        var active = rootNode.activeElement;
        if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
      }
    }
    // Dialog that cannot be closed: Escape is stopped in the capture phase, before the dialogs and menus open below that listen on document.
    function onEscape(e) { if (e.key === 'Escape') e.stopPropagation(); }
    var blocking = !p.onClose;
    document.addEventListener('keydown', onKey);
    if (blocking) document.addEventListener('keydown', onEscape, true);
    return function () {
      closeModal(layer, ref);
      document.removeEventListener('keydown', onKey);
      if (blocking) document.removeEventListener('keydown', onEscape, true);
      if (prev && prev.focus) prev.focus();
    };
  }, []);
  return h(Portal, null, h('div', { className: cx('overlay', p.sheet && 'sheet'), onMouseDown: function (e) { if (e.target === e.currentTarget && p.onClose) p.onClose(); } },
    h('div', { className: cx('dialog', p.wide && 'wide', p.sheet && 'sheet', p.className), role: p.role || 'dialog', 'aria-modal': 'true', 'aria-label': p.label || p.title, style: p.style, ref: ref },
      p.title ? h('div', { className: 'dialog-head' }, h('h2', p.focusTitle ? { tabIndex: -1, 'data-autofocus': true } : null, p.title), p.description ? h('p', null, p.description) : null) : null,
      p.children,
      p.footer ? h('div', { className: 'dialog-foot' }, p.footer) : null)));
}

function ConfirmDialog(p) {
  var c = p.confirm;
  return h(Dialog, {
    title: c.title, description: c.body, onClose: p.onClose,
    footer: [
      h(T.Button, { key: 'c', variant: 'ghost', onClick: p.onClose }, 'Cancel'),
      h(T.Button, { key: 'o', variant: c.danger ? 'danger' : 'primary', 'data-autofocus': true, onClick: function () { p.onClose(); c.onConfirm(); } }, c.confirmLabel || 'Confirm')
    ]
  });
}

var TOAST_MS = 4500, TOAST_ACTION_MS = 7000;
function Toasts(p) {
  return h(Portal, null, h('div', { className: 'toasts', role: 'status', 'aria-live': 'polite' },
    p.toasts.map(function (t) { return h(Toast, { key: t.id, toast: t, dismiss: p.dismiss }); })));
}
/**
 * Notification that closes once its delay has run.
 * The delay of a toast with an action waits while the toast is hovered or holds the focus, so that its action stays within reach.
 * @param {{toast: Object, dismiss: function(string)}} p Notification and its closing by id.
 */
function Toast(p) {
  var t = p.toast;
  var a = useState(false), hovered = a[0], setHovered = a[1];
  var b = useState(false), focused = b[0], setFocused = b[1];
  var left = useRef(t.action ? TOAST_ACTION_MS : TOAST_MS);
  var held = !!t.action && (hovered || focused);
  useEffect(function () {
    if (held) return;
    var start = Date.now(), timer = setTimeout(function () { p.dismiss(t.id); }, left.current);
    return function () { clearTimeout(timer); left.current -= Date.now() - start; };
  }, [held]);
  return h('div', {
    className: 'toast',
    onMouseEnter: function () { setHovered(true); }, onMouseLeave: function () { setHovered(false); },
    onFocus: function () { setFocused(true); },
    // The focus moving from one of its buttons to the other keeps the toast held.
    onBlur: function (e) { if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false); }
  },
    t.icon ? h(T.Icon, { name: t.icon, size: 16, style: { color: 'var(--text-2)' } }) : null,
    h('span', { className: cx('grow', t.clamp && 'toast-clamp') }, t.text),
    t.action ? h(T.Button, { size: 'sm', onClick: function () { p.dismiss(t.id); t.action.run(); } }, t.action.label) : null,
    h(T.IconButton, { icon: 'x', label: 'Dismiss', size: 26, iconSize: 13, onClick: function () { p.dismiss(t.id); } }));
}

var CONN_DONE_MS = 2000, CONN_LEAVE_MS = 150;
var CONN_COPY = {
  trying: { title: 'Reconnecting to ', text: 'Messages you send now may not arrive.' },
  done: { title: 'Reconnected to ', text: null },
  failed: { title: "Couldn't reconnect to ", text: 'Try again, or reload the page if it keeps failing.' }
};
/**
 * Returns the phase the connection banner moves to from the one it shows.
 * A first connection has no sequence of attempts and shows nothing.
 * @param {{conn: string, retrying: boolean}} p Connection state and sequence of automatic attempts in progress.
 * @param {?string} phase Phase shown: trying, done, failed, leaving or null.
 * @returns {?string}
 */
function connPhase(p, phase) {
  if (p.conn === 'open') return phase === 'trying' || phase === 'failed' ? 'done' : phase;
  if (p.retrying) return 'trying';
  if (p.conn === 'closed') return 'failed';
  return phase ? 'trying' : null;
}
/**
 * Banner of a lost live connection: one block whose icon and text change in place from reconnecting to reconnected, then folds away, or to failed.
 * @param {{name: string, conn: string, retrying: boolean, onRetry: Function, inset: number=}} p Named connection (#group or private messages), its state, its automatic attempts, a new sequence of attempts and the side margin.
 */
function ConnectionBanner(p) {
  var st = useState(function () { return connPhase(p, null); }), phase = st[0], setPhase = st[1];
  var next = connPhase(p, phase);
  if (next !== phase) setPhase(next);
  useEffect(function () {
    if (phase !== 'done' && phase !== 'leaving') return;
    var t = setTimeout(function () { setPhase(phase === 'done' ? 'leaving' : null); }, phase === 'done' ? CONN_DONE_MS : CONN_LEAVE_MS);
    return function () { clearTimeout(t); };
  }, [phase]);
  if (!next) return null;
  var shown = next === 'leaving' ? 'done' : next, copy = CONN_COPY[shown];
  return h('div', { className: cx('conn-banner', next === 'leaving' && 'conn-banner-leaving'), 'data-phase': shown, role: 'status', style: p.inset != null ? { marginLeft: p.inset, marginRight: p.inset } : null },
    h('div', { className: 'conn-banner-clip' }, h(T.Banner, {
      icon: h(ConnectionIcon),
      title: h('span', { key: shown, className: 'conn-fade' }, copy.title + p.name),
      action: shown === 'failed' ? h('span', { className: 'conn-banner-actions conn-fade' },
        h(T.Button, { size: 'sm', variant: 'ghost', onClick: p.onRetry }, 'Try again'),
        h(T.Button, { size: 'sm', onClick: function () { location.reload(); } }, 'Reload')) : null
    }, copy.text ? h('span', { key: shown, className: 'conn-fade' }, copy.text) : null)));
}
/**
 * Icon of the connection banner. The three icons stay stacked so that the phase cross-fades them in CSS.
 */
function ConnectionIcon() {
  return h('span', { className: 'conn-icon' },
    h('span', { className: 'conn-icon-spin' }, h(T.Spinner, { size: 16 })),
    h('span', { className: 'conn-icon-check' }, h('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': 'true' },
      h('path', { d: 'M20 6 9 17l-5-5', pathLength: 1 }))),
    h('span', { className: 'conn-icon-alert' }, h(T.Icon, { name: 'alert', size: 16 })));
}

// -- People -------------------------------------------------------------------
/**
 * Shows the short role of a member as a badge next to their name.
 * @param {?string} role Role of the member in the group.
 */
function roleBadge(role) { return role ? h(T.Badge, { icon: role === 'owner' ? 'crown' : 'shield' }, ROLE_LABEL[role]) : null; }
/**
 * Marks the user's own row in a list.
 * @param {boolean} isMe Row of the signed-in user.
 */
function youBadge(isMe) { return isMe ? h(T.Badge, null, 'You') : null; }
// Registered accounts only: a guest carries a # before their name and cannot impersonate it.
var DEVELOPERS = ['marjorie'];
/**
 * Marks a Nightango developer next to their name, as an icon in lists and messages.
 * @param {string} name Member name, in lowercase.
 * @param {boolean} [full] Shows the text, in the open profile.
 */
function developerBadge(name, full) { return DEVELOPERS.indexOf(name) !== -1 ? traitBadge('code', 'Nightango developer', full) : null; }
/**
 * Marks a Chatango Premium account next to its name, as an icon in lists.
 * @param {boolean} premium Premium active according to the mini profile.
 * @param {boolean} [full] Shows the text, in the open profile.
 */
function premiumBadge(premium, full) { return premium ? traitBadge('gem', 'Premium', full) : null; }
/**
 * Badge of a trait of a person, icon only unless the text is asked for.
 * @param {string} icon Icon name.
 * @param {string} label Trait name.
 * @param {boolean} [full] Shows the text.
 */
function traitBadge(icon, label, full) { return full ? h(T.Badge, { tone: 'accent', icon: icon }, label) : h(T.Badge, { tone: 'accent', icon: icon, label: label }); }
/**
 * Gives the presence of a list row to screen readers while the avatar dot stays visual only.
 * @param {string} status Member presence.
 */
function presenceSr(status) { return h('span', { className: 'tc-sr' }, ', ' + statusLabel(status)); }
/**
 * Avatar and name of a person in a single button that opens their profile card.
 * @param {{name: string, label: string, gid: string, size: number, status: string, ring: string, avatarOnly: boolean, inert: boolean}} p Account name, shown name if it differs, group the card opens from, avatar size, presence and outline of its dot, avatar without the name, plain text for someone without an account.
 */
function Person(p) {
  var app = useAppApi(), label = p.label || p.name;
  var avatar = h(T.Avatar, { name: p.name, size: p.size, status: p.status, ring: p.ring }), text = p.avatarOnly ? null : h('span', { className: 'namebtn' }, label);
  if (p.inert) return h('span', { className: 'person-tag' }, avatar, text);
  return h('button', { type: 'button', className: p.avatarOnly ? 'avatar-btn' : 'person-tag', 'aria-label': 'View ' + label + "'s profile", onClick: function () { app.ui.openProfile(p.name, p.gid || null); } }, avatar, text);
}
