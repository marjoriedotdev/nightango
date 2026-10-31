// -- Recovery screen ----------------------------------------------------------
// Plain elements and design system buttons only: nothing from Root, which may be what failed.
function RecoveryScreen() {
  return h('main', { className: 'recovery' },
    h('div', { className: 'empty', role: 'alert' },
      h('h1', null, 'Nightango ran into an error'),
      // The bridge keeps BetterChatango's PM handlers, whose connect can call vissle outside the allowed list.
      h('p', null, LIVE
        ? "Reload the page to start Nightango again. Your groups keep working in BetterChatango meanwhile. Private messages won't open there until you reload."
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
  // Without a listener the bridge keeps every later operation for Root, for as long as BetterChatango stays open.
  if (liveBridge) liveBridge.onOp(function () {});
};
Recovery.prototype.render = function () { return this.state.failed ? h(RecoveryScreen, null) : this.props.children; };

// -- Mounting -----------------------------------------------------------------
function start(data) {
  ReactDOM.createRoot(window.__TORCH_MOUNT__ || document.getElementById('app')).render(h(Recovery, null, h(Root, { boot: data && data.state })));
}
var hotApi = window.claude && window.claude.hot;
if (hotApi && hotApi.ready) hotApi.ready(start); else start((hotApi && hotApi.data) || {});
