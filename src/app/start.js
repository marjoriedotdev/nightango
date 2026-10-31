// -- Recovery screen ----------------------------------------------------------
// Plain elements and buttons only: the screen must not depend on what may have failed.
function RecoveryScreen() {
  return h('main', { className: 'recovery' },
    h('div', { className: 'empty', role: 'alert' },
      h('h1', null, 'Nightango ran into an error'),
      h('p', null, LIVE
        ? "You're still connected. Reload the page to start Nightango again, or show BetterChatango to keep chatting."
        : 'Reload the page to start again.'),
      h('div', { className: 'recovery-actions' },
        LIVE ? h(T.Button, { variant: 'ghost', onClick: function () { window.__TORCH_HIDE__(); } }, 'Show BetterChatango') : null,
        h(T.Button, { variant: 'primary', onClick: function () { location.reload(); } }, 'Reload'))));
}

/**
 * Error boundary around the interface: an error while rendering a view shows the recovery screen instead of an empty page.
 * @param {{children: *}} props Interface.
 */
function Recovery(props) {
  React.Component.call(this, props);
  this.state = { failed: false };
}
Recovery.prototype = Object.create(React.Component.prototype);
Recovery.prototype.constructor = Recovery;
Recovery.getDerivedStateFromError = function () { return { failed: true }; };
Recovery.prototype.componentDidCatch = function (error) {
  // The error alone, never the component stack: the journal keeps its name and message only (ADR-0011).
  console.error('[torch-skin] interface stopped by an error, recovery screen shown:', error);
};
Recovery.prototype.render = function () { return this.state.failed ? h(RecoveryScreen, null) : this.props.children; };

// -- Mounting -----------------------------------------------------------------
function start(data) {
  ReactDOM.createRoot(window.__TORCH_MOUNT__ || document.getElementById('app')).render(h(Recovery, null, h(Root, { boot: data && data.state })));
}
var hotApi = window.claude && window.claude.hot;
if (hotApi && hotApi.ready) hotApi.ready(start); else start((hotApi && hotApi.data) || {});
