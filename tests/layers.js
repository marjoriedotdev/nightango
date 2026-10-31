// Layers of src/core/ui.js, mounted in a Shadow DOM as in live: focus given back by menus, focus trap and inert background of dialogs, toast delays.
const fs = require('fs');
const { JSDOM, VirtualConsole } = require('jsdom');
const { concatSources, layerSources } = require('../scripts/build.mjs');

const ROOT = process.argv[2];
const errors = [];
const vc = new VirtualConsole();
vc.on('error', e => errors.push(String(e && e.message || e)));
vc.on('jsdomError', e => errors.push('jsdom: ' + e.message));
vc.on('warn', e => { if (!/act\(|ReactDOM.render|useLayoutEffect/.test(String(e))) errors.push('warn: ' + String(e).slice(0, 300)); });
const dom = new JSDOM('<!doctype html><body></body>', { runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole: vc, url: 'https://st.chatango.com/' });
const w = dom.window, d = w.document;
w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
w.eval(fs.readFileSync('node_modules/react/umd/react.development.js', 'utf8'));
w.eval(fs.readFileSync('node_modules/react-dom/umd/react-dom.development.js', 'utf8'));
w.eval(fs.readFileSync(ROOT + '/torchds/project/components/bundle.js', 'utf8'));

// The app timers run on a clock the cases move forward. React, loaded above, keeps the real timers.
let now = 0, nextTimer = 1;
const timers = new Map();
w.Date.now = () => now;
w.setTimeout = (fn, ms) => { timers.set(nextTimer, { at: now + (ms || 0), fn }); return nextTimer++; };
w.clearTimeout = id => { timers.delete(id); };
// Like a browser, an element under an inert ancestor takes no focus. jsdom ignores inert.
const nativeFocus = w.HTMLElement.prototype.focus;
w.HTMLElement.prototype.focus = function (o) { if (!this.closest('[inert]')) nativeFocus.call(this, o); };

w.eval(concatSources(ROOT, layerSources('core')) + '; window.ui = { MenuButton: MenuButton, Dialog: Dialog, Toasts: Toasts };');
const ui = w.ui, R = w.React, h = R.createElement;

// Like skin-page.js: #app in the shadow root of the host, the layer next to it.
const host = d.createElement('div');
host.id = 'torch-skin';
d.body.appendChild(host);
const shadow = host.attachShadow({ mode: 'open' });
const mount = d.createElement('div');
mount.id = 'app';
shadow.appendChild(mount);
w.__TORCH_MOUNT__ = mount;

let api = null;
function Harness() {
  const [outer, setOuter] = R.useState(false), [inner, setInner] = R.useState(false), [toasts, setToasts] = R.useState([]);
  api = { setOuter, setInner, setToasts };
  return h(R.Fragment, null,
    h('p', { id: 'blank' }, 'Plain text'),
    h(ui.MenuButton, { label: 'Message options', items: [{ label: 'Copy text', onSelect() {} }, { label: 'Open dialog', onSelect() { setOuter(true); } }] }),
    h('button', { type: 'button', id: 'behind' }, 'Behind'),
    outer ? h(ui.Dialog, { title: 'Outer', onClose() { setOuter(false); }, footer: h('button', { type: 'button', disabled: true }, 'Save') },
      h('input', { id: 'outer-field' }),
      h('button', { type: 'button', id: 'open-inner', onClick() { setInner(true); } }, 'Open inner')) : null,
    inner ? h(ui.Dialog, { title: 'Inner', onClose() { setInner(false); } }, h('button', { type: 'button', id: 'inner-button' }, 'Inner button')) : null,
    h(ui.Toasts, { toasts, dismiss: id => setToasts(list => list.filter(t => t.id !== id)) }));
}

/* ---------- Helpers ---------- */
const flush = () => new Promise(r => setTimeout(r, 30));
/**
 * Moves the clock forward and runs the timers due on the way.
 * @param {number} ms Time to add.
 */
async function advance(ms) {
  const end = now + ms;
  for (;;) {
    const due = [...timers.entries()].filter(([, t]) => t.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
    if (!due) break;
    timers.delete(due[0]);
    now = due[1].at;
    due[1].fn();
    await flush();
  }
  now = end;
  await flush();
}
const $ = s => shadow.querySelector(s), $$ = s => [...shadow.querySelectorAll(s)];
const focused = () => shadow.activeElement;
const label = el => el ? (el.id || el.getAttribute('aria-label') || el.textContent) : null;
const trigger = () => $('button[aria-label="Message options"]');
const menuItem = txt => $$('.menu button').find(b => b.textContent === txt);
function click(el) { if (!el) throw new Error('missing element'); el.dispatchEvent(new w.MouseEvent('click', { bubbles: true, composed: true })); }
function key(el, k, extra) { el.dispatchEvent(new w.KeyboardEvent('keydown', Object.assign({ key: k, bubbles: true, composed: true, cancelable: true }, extra))); }
/**
 * Presses the mouse on a spot that takes no focus. Like a browser once the event is over, the press clears the focus.
 * @param {Element} el Spot pressed.
 */
function pressBlank(el) {
  el.dispatchEvent(new w.MouseEvent('mousedown', { bubbles: true, composed: true }));
  if (focused()) focused().blur();
}
/**
 * Moves the pointer onto an element from outside it, or off it.
 * @param {Element} el Element the pointer enters or leaves.
 * @param {boolean} enter The pointer enters.
 */
function hover(el, enter) { el.dispatchEvent(new w.MouseEvent(enter ? 'mouseover' : 'mouseout', { bubbles: true, composed: true, relatedTarget: enter ? null : d.body })); }
const toast = txt => $$('.toast').find(t => t.textContent.includes(txt));
const isInert = el => !!el && el.hasAttribute('inert');
const overlayOf = title => { const dl = $$('.dialog').find(x => x.getAttribute('aria-label') === title); return dl && dl.closest('.overlay'); };
async function openMenu() { click(trigger()); await flush(); }
const log = [];
function step(name, ok, detail) { log.push((ok ? 'ok   ' : 'FAIL ') + name + (ok || detail === undefined ? '' : ' -> ' + JSON.stringify(detail))); }

(async () => {
  w.ReactDOM.createRoot(mount).render(h(Harness));
  await flush();

  /* Menus give the focus back to their button */
  await openMenu();
  const opened = label(focused());
  key(focused(), 'Escape'); await advance(0);
  step('Escape closes the menu and focuses its button', opened === 'Copy text' && !$('.menu') && focused() === trigger(), { opened, menu: !!$('.menu'), focused: label(focused()) });
  await openMenu();
  click(menuItem('Copy text')); await advance(0);
  step('a choice closes the menu and focuses its button', !$('.menu') && focused() === trigger(), { menu: !!$('.menu'), focused: label(focused()) });
  await openMenu();
  pressBlank($('#blank')); await advance(0);
  step('a click outside closes the menu and focuses its button', !$('.menu') && focused() === trigger(), { menu: !!$('.menu'), focused: label(focused()) });

  /* Dialogs: inert background and focus trap */
  await openMenu();
  click(menuItem('Open dialog')); await advance(0);
  const one = { app: isInert(mount), outer: isInert(overlayOf('Outer')), focused: label(focused()) };
  $('#open-inner').focus(); click($('#open-inner')); await advance(0);
  const two = { app: isInert(mount), outer: isInert(overlayOf('Outer')), inner: isInert(overlayOf('Inner')), focused: label(focused()) };
  key(focused(), 'Escape'); await advance(0);
  const back = { app: isInert(mount), outer: isInert(overlayOf('Outer')), focused: label(focused()) };
  step('a dialog makes the app inert, and the dialogs under the top one',
    one.app && !one.outer && one.focused === 'outer-field' && two.app && two.outer && !two.inner && two.focused === 'inner-button' && back.app && !back.outer && back.focused === 'open-inner',
    { one, two, back });
  key(focused(), 'Tab');
  const wrapped = label(focused());
  key(focused(), 'Tab', { shiftKey: true });
  const wrappedBack = label(focused());
  step('the focus trap skips a disabled last button', wrapped === 'outer-field' && wrappedBack === 'open-inner', { wrapped, wrappedBack });
  key(focused(), 'Escape'); await advance(0);
  step('closing the last dialog frees the app and focuses the menu button again', !isInert(mount) && !$('.overlay') && focused() === trigger(), { app: isInert(mount), focused: label(focused()) });
  api.setOuter(true); await flush();
  $('#open-inner').focus(); click($('#open-inner')); await flush();
  api.setOuter(false); api.setInner(false); await flush();
  step('dialogs closed together free the app and focus what had the focus before them', !isInert(mount) && !$('.overlay') && focused() === trigger(), { app: isInert(mount), focused: label(focused()) });

  /* A toast with an action waits while it is hovered or focused */
  api.setToasts([{ id: 'a', text: 'alice was banned from #test.', action: { label: 'Undo', run() {} } }, { id: 'p', text: 'Message deleted.' }]);
  await flush();
  await advance(3000);
  hover(toast('alice'), true); await flush();
  await advance(10000);
  const hovered = { action: !!toast('alice'), plain: !!toast('Message deleted.') };
  hover(toast('alice'), false); await flush();
  await advance(3900);
  const leftEarly = !!toast('alice');
  await advance(200);
  step('a toast with an action stays while hovered, then closes once the rest of its delay has run',
    hovered.action && !hovered.plain && leftEarly && !toast('alice'), { hovered, leftEarly, after: !!toast('alice') });
  api.setToasts([{ id: 'b', text: 'bob was banned from #test.', action: { label: 'Undo', run() {} } }]);
  await flush();
  await advance(1000);
  toast('bob').querySelector('button').focus(); await flush();
  await advance(10000);
  toast('bob').querySelector('button[aria-label="Dismiss"]').focus(); await flush();
  await advance(10000);
  const held = !!toast('bob');
  $('#behind').focus(); await flush();
  await advance(5900);
  const blurredEarly = !!toast('bob');
  await advance(200);
  step('a toast with an action stays while it holds the focus, then closes once the rest of its delay has run',
    held && blurredEarly && !toast('bob'), { held, blurredEarly, after: !!toast('bob') });

  console.log(log.join('\n'));
  console.log('ERRORS: ' + (errors.length ? '\n' + errors.join('\n') : 'none'));
  process.exit(log.some(l => l.indexOf('FAIL') === 0) || errors.length ? 1 : 0);
})().catch(e => { console.log(log.join('\n')); console.log('CRASH', e.stack); console.log('ERRORS: ' + (errors.join('\n') || 'none')); process.exit(2); });
