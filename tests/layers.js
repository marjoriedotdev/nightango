// Layers of src/core/ui.js, mounted in a Shadow DOM as in live: focus given back by menus.
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

w.eval(concatSources(ROOT, layerSources('core')) + '; window.ui = { MenuButton: MenuButton };');
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

function Harness() {
  return h(R.Fragment, null,
    h('p', { id: 'blank' }, 'Plain text'),
    h(ui.MenuButton, { label: 'Message options', items: [{ label: 'Copy text', onSelect() {} }] }));
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

  console.log(log.join('\n'));
  console.log('ERRORS: ' + (errors.length ? '\n' + errors.join('\n') : 'none'));
  process.exit(log.some(l => l.indexOf('FAIL') === 0) || errors.length ? 1 : 0);
})().catch(e => { console.log(log.join('\n')); console.log('CRASH', e.stack); console.log('ERRORS: ' + (errors.join('\n') || 'none')); process.exit(2); });
