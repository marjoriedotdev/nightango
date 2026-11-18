import { ROOT_EL } from '../core/env.js';
import { ReactDOM } from '../core/globals.js';
import { isTarget } from '../core/selectors.js';
// -- Floating window (Document Picture-in-Picture) ----------------------------
// The window itself: opening, closing, the menu entry and what renders in it. PipHost (views/pip.js) chooses what that is.

// One floating window at a time: the browser closes the previous one when a new one opens.
var PIP = { win: null, mount: null, root: null, observer: null };

function canPopOut() { return 'documentPictureInPicture' in window; }

/**
 * Opens the floating window, with the interface stylesheets and the theme of the root kept in sync.
 * @param {function()} onGone Called once this window closes, by the user or by a newer one.
 * @returns {Promise} Settles once the window is ready.
 */
export function openPipWindow(onGone) {
  return window.documentPictureInPicture.requestWindow({ width: 420, height: 640 }).then(function (win) {
    unmountPip();
    var doc = win.document, shadow = ROOT_EL.shadowRoot, mount = doc.createElement('div'), mirror;
    mount.id = 'app';
    doc.title = 'Nightango';
    doc.body.style.margin = '0';
    var sheets = (shadow || document).querySelectorAll('style');
    // In live the stylesheet targets :host: the window gets a shadow root of its own, like the page.
    if (shadow) {
      mirror = doc.createElement('div');
      doc.body.appendChild(mirror);
      var root = mirror.attachShadow({ mode: 'open' });
      sheets.forEach(function (s) { root.appendChild(s.cloneNode(true)); });
      root.appendChild(mount);
    } else {
      mirror = doc.documentElement;
      sheets.forEach(function (s) { doc.head.appendChild(s.cloneNode(true)); });
      doc.body.appendChild(mount);
    }
    // Theme, accent, reduced motion and season live on the root: the window follows them.
    function sync() {
      ['data-theme', 'class', 'style'].forEach(function (a) {
        var v = ROOT_EL.getAttribute(a);
        if (v == null) mirror.removeAttribute(a); else mirror.setAttribute(a, v);
      });
    }
    sync();
    var observer = new MutationObserver(sync);
    observer.observe(ROOT_EL, { attributes: true, attributeFilter: ['data-theme', 'class', 'style'] });
    PIP.win = win; PIP.mount = mount; PIP.observer = observer;
    win.addEventListener('pagehide', function () {
      if (PIP.win !== win) return;
      unmountPip();
      PIP.win = null;
      onGone();
    });
  });
}
function unmountPip() {
  if (PIP.root) PIP.root.unmount();
  if (PIP.observer) PIP.observer.disconnect();
  PIP.root = null; PIP.mount = null; PIP.observer = null;
}
export function closePipWindow() { if (PIP.win) PIP.win.close(); }

/**
 * Menu entry that pops a conversation out into the floating window, absent where the browser has none or when it already shows there.
 * @param {Object} app Application context.
 * @param {{view: string, id: string}} route Conversation to pop out.
 */
export function popOutItem(app, route) {
  return canPopOut() && !isTarget(app.state.pip, route.view, route.id) ? { label: 'Pop out', icon: 'external', onSelect: function () { app.actions.openPip(route); } } : null;
}

/**
 * Tells whether the floating window is open.
 */
export function pipOpen() { return !!PIP.win; }
/**
 * Renders into the floating window once it is ready, with a React root of its own.
 * @param {function(Element): Object} render Builds the element from the mount point of the window.
 */
export function renderInPip(render) {
  if (!PIP.mount) return;
  if (!PIP.root) PIP.root = ReactDOM.createRoot(PIP.mount);
  PIP.root.render(render(PIP.mount));
}
