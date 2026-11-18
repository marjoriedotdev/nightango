import { appMount } from './env.js';
import { React, ReactDOM, T, h, useContext, useEffect, useLayoutEffect, useRef, useState } from './globals.js';
import { cx } from './util.js';
// -- Layers, menus, dialogs and toasts ----------------------------------------
export var LayerCtx = React.createContext(null);
/**
 * Gives the interface inside it its layer node and its stack of open dialogs.
 * @param {{mount: ?Element, children: *}} p Mount point of this interface when it is not the application's, such as a floating window, and interface.
 */
export function Layers(p) {
  var ref = useRef(null);
  if (!ref.current) ref.current = { node: null, dialogs: [], mount: p.mount || null };
  return h(LayerCtx.Provider, { value: ref.current }, p.children);
}
/**
 * Returns the layer node next to the mount point, created again once it has left the document.
 * @param {{node: ?Element}} layer Layer given by Layers.
 */
function layerRoot(layer) {
  if (layer.node && layer.node.isConnected) return layer.node;
  var mountEl = layer.mount || appMount(), doc = mountEl ? mountEl.ownerDocument : document;
  layer.node = doc.createElement('div');
  layer.node.id = 'layer';
  (mountEl && mountEl.parentNode ? mountEl.parentNode : doc.body).appendChild(layer.node);
  return layer.node;
}
export function Portal(p) { return ReactDOM.createPortal(p.children, layerRoot(useContext(LayerCtx))); }
export function useOutside(ref, open, onClose, extraRef) {
  useEffect(function () {
    if (!open) return;
    function onDown(e) {
      var path = e.composedPath ? e.composedPath() : [e.target];
      if (ref.current && path.indexOf(ref.current) < 0 && !(extraRef && extraRef.current && path.indexOf(extraRef.current) >= 0)) onClose(e);
    }
    function onKey(e) { if (e.key === 'Escape') onClose(e); }
    // The document of the trigger: a floating window has its own.
    var doc = ref.current ? ref.current.ownerDocument : document;
    doc.addEventListener('mousedown', onDown);
    doc.addEventListener('touchstart', onDown);
    doc.addEventListener('keydown', onKey);
    return function () { doc.removeEventListener('mousedown', onDown); doc.removeEventListener('touchstart', onDown); doc.removeEventListener('keydown', onKey); };
  }, [open]);
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
export function useFloating(anchorRef, floatRef, open, onClose, o) {
  useOutside(anchorRef, open, onClose, floatRef);
  var ps = useState(null), place = ps[0], setPlace = ps[1];
  // Fixed position computed from the trigger, flipped up or down if the layer would leave the screen.
  useLayoutEffect(function () {
    if (!open) { setPlace(null); return; }
    if (!anchorRef.current) return;
    var doc = anchorRef.current.ownerDocument;
    var r = o.at ? { top: o.at.y, bottom: o.at.y, left: o.at.x, right: o.at.x } : anchorRef.current.getBoundingClientRect(), vw = doc.documentElement.clientWidth, vh = doc.defaultView.innerHeight;
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
    var doc = anchorRef.current ? anchorRef.current.ownerDocument : document, win = doc.defaultView;
    function onMove(e) { if (e.type === 'scroll' && e.target !== doc && !e.target.contains(anchorRef.current)) return; onClose(e); }
    win.addEventListener('resize', onMove);
    doc.addEventListener('scroll', onMove, true);
    return function () { win.removeEventListener('resize', onMove); doc.removeEventListener('scroll', onMove, true); };
  }, [open]);
  // After placement: a layer still in visibility hidden refuses focus in a real browser.
  useEffect(function () {
    if (place && floatRef.current) { var first = floatRef.current.querySelector('button:not(:disabled)'); if (first) first.focus(); }
  }, [!!place]);
  return place || FLOAT_UNPLACED;
}
/**
 * Joins groups of menu entries with a divider between them, without the missing entries or the empty groups.
 * @param {Array<Array>} groups Entries of each group, null for a missing one.
 */
export function menuGroups(groups) {
  var out = [];
  groups.forEach(function (g) {
    var items = g.filter(Boolean);
    if (items.length) out = out.concat(out.length ? [{ divider: true }] : [], items);
  });
  return out;
}
export function MenuButton(p) {
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
    : h(T.IconButton, { icon: p.icon || 'more', label: p.label, size: p.size, iconSize: p.iconSize, onClick: toggle, 'aria-expanded': String(open), 'aria-haspopup': 'menu' });
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
          it.presence ? h('span', { className: 'tc-presence tc-presence-' + it.presence + ' menu-presence' }) : it.swatch ? h('span', { className: 'swatch', style: { background: it.swatch } }) : it.icon ? h(T.Icon, { name: it.icon, size: 16 }) : null,
          h('span', { className: 'grow' }, it.label),
          it.checked ? h(T.Icon, { name: 'check', size: 14 }) : null);
      }))) : null);
}
/**
 * Makes the interface behind the top dialog inert so that Tab and screen readers stay in it.
 * The app and the dialogs under the top one become inert. Menus and toasts, above the dialogs, stay reachable, except the toasts during a session loss (Toasts, under).
 * @param {{dialogs: Array}} layer Layer given by Layers.
 */
function syncInert(layer) {
  // Dialogs that close in the same render have already lost their node: they no longer keep the app inert.
  var layers = layer.dialogs.filter(function (r) { return r.current; }).map(function (r) { return r.current.closest('.overlay'); });
  (layer.mount || appMount()).toggleAttribute('inert', layers.length > 0);
  layers.forEach(function (el, i) { el.toggleAttribute('inert', i < layers.length - 1); });
}
/**
 * Puts a modal layer on top of the open dialogs.
 * @param {{dialogs: Array}} layer Layer given by Layers.
 * @param {Object} ref Ref of the layer overlay or of an element inside it.
 */
export function openModal(layer, ref) { layer.dialogs.push(ref); syncInert(layer); }
/**
 * Takes a modal layer out of the open dialogs.
 * It comes before the focus goes back to where it was, since an element in an inert app takes no focus.
 * @param {{dialogs: Array}} layer Layer given by Layers.
 * @param {Object} ref Ref given to openModal.
 */
export function closeModal(layer, ref) { layer.dialogs.splice(layer.dialogs.indexOf(ref), 1); syncInert(layer); }
export function Dialog(p) {
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
    var blocking = !p.onClose, doc = ref.current ? ref.current.ownerDocument : document;
    doc.addEventListener('keydown', onKey);
    if (blocking) doc.addEventListener('keydown', onEscape, true);
    return function () {
      closeModal(layer, ref);
      doc.removeEventListener('keydown', onKey);
      if (blocking) doc.removeEventListener('keydown', onEscape, true);
      if (prev && prev.focus) prev.focus();
    };
  }, []);
  return h(Portal, null, h('div', { className: cx('overlay', p.sheet && 'sheet', p.center && 'center'), onMouseDown: function (e) { if (e.target === e.currentTarget && p.onClose) p.onClose(); } },
    h('div', { className: cx('dialog', p.wide && 'wide', p.sheet && 'sheet', p.className), role: p.role || 'dialog', 'aria-modal': 'true', 'aria-label': p.label || p.title, style: p.style, ref: ref },
      p.title ? h('div', { className: 'dialog-head' }, h('h2', p.focusTitle ? { tabIndex: -1, 'data-autofocus': true } : null, p.title), p.description ? h('p', null, p.description) : null) : null,
      p.children,
      p.footer ? h('div', { className: 'dialog-foot' }, p.footer) : null)));
}
export function ConfirmDialog(p) {
  var c = p.confirm;
  return h(Dialog, {
    title: c.title, description: c.body, onClose: p.onClose,
    footer: [
      h(T.Button, { key: 'c', variant: 'ghost', onClick: p.onClose }, 'Cancel'),
      h(T.Button, { key: 'o', variant: c.danger ? 'danger' : 'primary', 'data-autofocus': true, onClick: function () { p.onClose(); c.onConfirm(); } }, c.confirmLabel || 'Confirm')
    ]
  });
}
var TOAST_MS = 4500, TOAST_BASE_MS = 2500, TOAST_CHAR_MS = 55, TOAST_ERROR_MS = 8000, TOAST_ACTION_MS = 2500, TOAST_MAX_MS = 10000, TOAST_LEAVE_MS = 200;
var TOAST_ICON = { success: 'check', info: 'info', error: 'alert' };
/**
 * Returns how long a notification stays: longer for a long text, for a failure and for an action to reach.
 * @param {{text: string, tone: string=, action: Object=}} t Notification.
 * @returns {number} Delay in milliseconds.
 */
function toastDelay(t) {
  var ms = Math.max(TOAST_MS, TOAST_BASE_MS + String(t.text).length * TOAST_CHAR_MS);
  if (t.tone === 'error') ms = Math.max(ms, TOAST_ERROR_MS);
  return Math.min(TOAST_MAX_MS, ms + (t.action ? TOAST_ACTION_MS : 0));
}
/**
 * Stack of notifications.
 * @param {{toasts: Array, dismiss: function(string), under: boolean=}} p Notifications, their closing by id, and true to put them under the dialogs.
 */
export function Toasts(p) {
  return h(Portal, null, h('div', { className: cx('toasts', p.under && 'toasts-under'), role: 'status', 'aria-live': 'polite' },
    p.toasts.map(function (t) { return h(Toast, { key: t.id, toast: t, dismiss: p.dismiss }); })));
}
/**
 * Notification that folds away once its delay has run.
 * The delay waits while the toast is hovered or holds the focus, and while the page is hidden. A toast shown again (rev) starts it over.
 * @param {{toast: Object, dismiss: function(string)}} p Notification and its closing by id.
 */
function Toast(p) {
  var t = p.toast, tone = t.tone || 'info', ref = useRef(null);
  var a = useState(false), hovered = a[0], setHovered = a[1];
  var b = useState(false), focused = b[0], setFocused = b[1];
  var c = useState(document.visibilityState !== 'visible'), hidden = c[0], setHidden = c[1];
  var e = useState(false), leaving = e[0], setLeaving = e[1];
  var left = useRef(0);
  var held = hovered || focused || hidden;
  useEffect(function () {
    function onVisibility() { setHidden(document.visibilityState !== 'visible'); }
    document.addEventListener('visibilitychange', onVisibility);
    return function () { document.removeEventListener('visibilitychange', onVisibility); };
  }, []);
  // Declared before the timer: on a new rev, the timer stops on what was left, then starts on the full delay set here.
  useEffect(function () { left.current = toastDelay(t); setLeaving(false); }, [t.rev]);
  useEffect(function () {
    if (held || leaving) return;
    var start = Date.now(), timer = setTimeout(function () { setLeaving(true); }, left.current);
    return function () { clearTimeout(timer); left.current -= Date.now() - start; };
  }, [held, leaving, t.rev]);
  useLayoutEffect(function () {
    if (!leaving) return;
    var el = ref.current;
    // Height set in pixels and read back before it goes to zero: a transition has no start on an automatic height.
    el.style.height = el.offsetHeight + 'px';
    el.getBoundingClientRect();
    el.style.height = '0';
    var timer = setTimeout(function () { p.dismiss(t.id); }, TOAST_LEAVE_MS);
    return function () { clearTimeout(timer); el.style.height = ''; };
  }, [leaving]);
  return h('div', {
    ref: ref, className: cx('toast', leaving && 'toast-leaving'), 'data-tone': tone,
    onMouseEnter: function () { setHovered(true); }, onMouseLeave: function () { setHovered(false); },
    onFocus: function () { setFocused(true); },
    // The focus moving from one of its buttons to the other keeps the toast held.
    onBlur: function (ev) { if (!ev.currentTarget.contains(ev.relatedTarget)) setFocused(false); }
  },
    h('span', { key: t.rev || 0, className: 'toast-icon' }, h(T.Icon, { name: t.icon || TOAST_ICON[tone], size: 16 })),
    h('span', { className: cx('grow', t.clamp && 'toast-clamp') }, t.text),
    t.action ? h(T.Button, { size: 'sm', variant: 'ghost', className: 'toast-action', onClick: function () { setLeaving(true); t.action.run(); } }, t.action.label) : null,
    h(T.IconButton, { icon: 'x', label: 'Dismiss', size: 28, iconSize: 14, className: 'toast-close', onClick: function () { setLeaving(true); } }));
}
