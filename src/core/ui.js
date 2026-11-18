import { Frag, React, T, h, useContext, useEffect, useRef, useState, useSyncExternalStore } from './globals.js';
import { MIN } from './util.js';
import { ACCENTS, onAccentOf } from './colors.js';
/* ---------- Context and UI primitives ---------- */
export var Ctx = React.createContext(null);
export function useApp() { return useContext(Ctx); }
// The parts of the application context that stay the same object for the whole session.
export var ApiCtx = React.createContext(null);
/**
 * Returns the parts of the application context that never change: actions, ui, nav, update, drafts, the state store, the minute clock and keepUsers (useShownUsers).
 * A component that reads only them renders again for its own props and state only. Its state is the shown state at the time it is read, for handlers:
 * a render takes what it shows from its props or useStatePart.
 */
export function useAppApi() { return useContext(ApiCtx); }
/**
 * Returns a part of the shown state and renders again only when that part changes.
 * @param {function(Object): *} part Reads the part: a value of the state, never an object built on each call.
 */
export function useStatePart(part) {
  var store = useAppApi().store;
  return useSyncExternalStore(store.subscribe, function () { return part(store.shown()); });
}
/**
 * Clock that ticks every minute on a single timer, running while something listens to it.
 * @returns {{subscribe: function(Function): Function, now: function(): number}} Subscription, and time of the last tick.
 */
export function minuteClock() {
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
export function useMinute() {
  var clock = useAppApi().clock;
  useSyncExternalStore(clock.subscribe, clock.now);
}
/**
 * Keeps the members a component shows in the state while it shows them, even when nothing in the state refers to them (usePrunedUsers).
 * @param {string[]} names Members shown.
 */
export function useShownUsers(names) {
  var keep = useAppApi().keepUsers;
  useEffect(function () { return keep(names); }, [names.join(',')]);
}
/**
 * Returns functions that keep their identity from one render to the next and call those of the latest render.
 * @param {Object<string, Function>} fns Functions of this render, always the same keys.
 */
export function useLatestCalls(fns) {
  var latest = useRef(fns), calls = useRef(null);
  latest.current = fns;
  if (!calls.current) {
    calls.current = {};
    Object.keys(fns).forEach(function (k) { calls.current[k] = function () { return latest.current[k].apply(null, arguments); }; });
  }
  return calls.current;
}

/* Single layer for dialogs, menus and notifications: out of the flow, they no longer distort the layout. */


export var LOAD_BELOW_MARGIN = '0px 0px 400px 0px';

/**
 * Requests the next page when a sentinel approaches the visible area.
 * @param {Object} rootRef Ref of the scrolling area.
 * @param {Object} sentinelRef Ref of the sentinel.
 * @param {*} enabled A next page can be requested when truthy. Another truthy value observes the sentinel again, which reports it at once if it is still in view.
 * @param {Function} onReach Request for the next page.
 * @param {string} margin Approach margin in rootMargin format.
 */
export function useInfiniteScroll(rootRef, sentinelRef, enabled, onReach, margin) {
  useEffect(function () {
    if (!enabled) return;
    var io = new IntersectionObserver(function (entries) {
      if (entries.some(function (e) { return e.isIntersecting; })) onReach();
    }, { root: rootRef.current, rootMargin: margin });
    io.observe(sentinelRef.current);
    return function () { io.disconnect(); };
  }, [enabled]);
}

var ROW_BATCH = 100;
/**
 * Renders a long list in batches: the first rows, then one more batch each time the sentinel after them approaches the visible area.
 * A rendered row stays rendered when rows are added or removed around it, until the list is reset.
 * @param {Object} rootRef Ref of the scrolling area.
 * @param {Array<string>} keys Keys of the rows in list order, empty while the list is not rendered.
 * @param {string} reset Search, filter or tab of the list: a new value renders the first batch again.
 * @returns {{limit: number, sentinel: ?Object}} Rows to render, and the element to place after them while rows are left.
 */
export function useRowBatches(rootRef, keys, reset) {
  var st = useState({ reset: reset, limit: ROW_BATCH }), batch = st[0], setBatch = st[1];
  var sentinelRef = useRef(null), lastRef = useRef(null);
  if (batch.reset !== reset) { batch = { reset: reset, limit: ROW_BATCH }; setBatch(batch); }
  var last = lastRef.current && lastRef.current.reset === reset ? lastRef.current : null, limit = batch.limit, i;
  if (last) {
    var added = 0, was;
    for (i = 0; i < keys.length; i++) if (last.at[keys[i]] === undefined) added++;
    // Rows added above a rendered row would push it past the batch limit, out of the DOM with its focus and swipe.
    for (i = keys.length - 1; i >= limit; i--) {
      was = last.at[keys[i]];
      // A row moved further down than rows were added, like a member gone offline, waits for its batch: following it would render every row above it.
      if (was !== undefined && was < last.limit && i - was <= added) { limit = i + 1; break; }
    }
  }
  useEffect(function () {
    var at = Object.create(null);
    keys.forEach(function (k, j) { at[k] = j; });
    lastRef.current = { reset: reset, at: at, limit: limit };
  });
  var more = keys.length > limit;
  // The limit as enabled: each batch observes the sentinel again, so a sentinel still in view loads the next batch.
  useInfiniteScroll(rootRef, sentinelRef, more && limit, function () {
    // Functional update: the observer keeps the callback of its limit, which can predate a reset to the same limit.
    setBatch(function (b) { return { reset: b.reset, limit: Math.max(b.limit, limit) + ROW_BATCH }; });
  }, LOAD_BELOW_MARGIN);
  return { limit: limit, sentinel: more ? h('div', { ref: sentinelRef, 'aria-hidden': 'true', style: { height: 1 } }) : null };
}


// Only breakpoint of the right column: app.css does not repeat it, the column is only rendered above it.
var NARROW_LAYOUT = '(max-width:1180px)';
/**
 * Tells whether the window is wide enough for a right column or two conversations side by side, and follows its changes.
 */
export function useWideLayout() {
  var a = useState(function () { return !window.matchMedia(NARROW_LAYOUT).matches; }), wide = a[0], setWide = a[1];
  useEffect(function () {
    var mq = window.matchMedia(NARROW_LAYOUT);
    function onChange() { setWide(!mq.matches); }
    mq.addEventListener('change', onChange);
    return function () { mq.removeEventListener('change', onChange); };
  }, []);
  return wide;
}
/**
 * Toggles the right column when the window leaves room for it and otherwise opens its content full screen.
 * @param {Function} openFull Opens the same content full screen.
 */
export function useRightColumn(openFull) {
  var fits = useWideLayout();
  var b = useState(true), shown = b[0], setShown = b[1];
  return { open: fits && shown, pressed: fits ? shown : null, toggle: function () { if (fits) setShown(!shown); else openFull(); } };
}



/* Button that opens an action menu. items: {label, icon, onSelect, danger, disabled, checked, divider, swatch, presence}. open and onOpenChange make it controlled, at {x, y} anchors it to a point */

/**
 * Color field with its hex value.
 * @param {{id: string, label: string, value: string, onChange: function(string)}} p Id, label, #rrggbb color and change callback.
 */
export function ColorField(p) {
  return h('div', { className: 'tc-field' },
    h('label', { className: 'tc-label', htmlFor: p.id }, p.label),
    h('div', { style: { display: 'flex', alignItems: 'center', gap: 8 } },
      h('input', { id: p.id, type: 'color', className: 'color-in', style: { borderRadius: 7 }, value: p.value, onChange: function (e) { p.onChange(e.target.value); } }),
      h('span', { className: 'tnum', style: { fontSize: 'var(--font-size-caption)', color: 'var(--text-2)' } }, p.value)));
}

/**
 * Accent color swatches followed by a custom color.
 * @param {{label: string, value: ?string, fallback: string, onChange: function(string)}} p Group label, chosen #rrggbb color or null for none, color of the custom field without a choice, and change callback.
 */
export function AccentSwatches(p) {
  var custom = p.value != null && !ACCENTS.some(function (a) { return a[1] === p.value; });
  return h('div', { className: 'swatches', role: 'radiogroup', 'aria-label': p.label },
    ACCENTS.map(function (a) {
      var on = p.value === a[1];
      return h('button', { key: a[1], type: 'button', role: 'radio', className: 'sw-dot', 'aria-checked': String(on), 'aria-label': a[0], title: a[0], style: { background: a[1] }, onClick: function () { p.onChange(a[1]); } },
        on ? h(T.Icon, { name: 'check', size: 16, strokeWidth: 2.6, style: { color: onAccentOf(a[1]) } }) : null);
    }),
    h('span', { className: 'vsep', style: { margin: '0 4px' } }),
    h('label', { style: { display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 'var(--font-size-body-sm)', color: 'var(--text-2)' } },
      h('input', { type: 'color', className: 'color-in', value: p.value || p.fallback, 'aria-label': 'Custom ' + p.label.toLowerCase(), onChange: function (e) { p.onChange(e.target.value); }, style: custom ? { boxShadow: '0 0 0 2px var(--bg), 0 0 0 4px var(--text)' } : null }),
      'Custom'));
}

/**
 * Button that opens the JSON file picker.
 * @param {{onFile: function(File), icon: ?string, size: ?string, children: *}} p Callback for the chosen file, icon, size and button label.
 */
export function JsonFileButton(p) {
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
export function SkeletonRows(p) {
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
