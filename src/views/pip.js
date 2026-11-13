/* ---------- Floating conversation (Document Picture-in-Picture) ---------- */
// One floating window at a time: the browser closes the previous one when a new one opens.
var PIP = { win: null, mount: null, root: null, observer: null };

function canPopOut() { return 'documentPictureInPicture' in window; }

/**
 * Opens the floating window, with the interface stylesheets and the theme of the root kept in sync.
 * @param {function()} onGone Called once this window closes, by the user or by a newer one.
 * @returns {Promise} Settles once the window is ready.
 */
function openPipWindow(onGone) {
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
function closePipWindow() { if (PIP.win) PIP.win.close(); }

/**
 * Menu entry that pops a conversation out into the floating window, absent where the browser has none or when it already shows there.
 * @param {Object} app Application context.
 * @param {{view: string, id: string}} route Conversation to pop out.
 */
function popOutItem(app, route) {
  return canPopOut() && !isTarget(app.state.pip, route.view, route.id) ? { label: 'Pop out', icon: 'external', onSelect: function () { app.actions.openPip(route); } } : null;
}

/**
 * Renders the popped out conversation into the floating window, with the contexts of the application.
 * It renders nothing in the page.
 */
function PipHost() {
  var app = useApp(), api = useAppApi(), season = useContext(SeasonCtx), target = app.state.pip;
  useEffect(function () {
    // Signed out, or the conversation went away: the window closes.
    if (!target || !paneShown(app.state, target)) { if (PIP.win) closePipWindow(); return; }
    if (!PIP.mount) return;
    if (!PIP.root) PIP.root = ReactDOM.createRoot(PIP.mount);
    PIP.root.render(h(Layers, { mount: PIP.mount }, h(ApiCtx.Provider, { value: api }, h(SeasonCtx.Provider, { value: season }, h(Ctx.Provider, { value: app },
      h('div', { className: 'pip' }, target.view === 'group'
        ? h(GroupView, { key: 'pip:' + target.id, gid: target.id, markerTs: target.markerTs, compact: true, onClose: closePipWindow, closeLabel: 'Close the floating window' })
        : h('div', { key: 'pip:' + target.id, className: 'main', style: { flexDirection: 'row' } },
          h(DmThread, { id: target.id, onClose: closePipWindow, closeLabel: 'Close the floating window', column: { open: false, pressed: null, toggle: function () { app.ui.openProfile(target.id, null); } } }))))))));
  });
  return null;
}
