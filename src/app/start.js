function start(data) {
  ReactDOM.createRoot(window.__TORCH_MOUNT__ || document.getElementById('app')).render(h(Root, { boot: data && data.state }));
}
var hotApi = window.claude && window.claude.hot;
if (hotApi && hotApi.ready) hotApi.ready(start); else start((hotApi && hotApi.data) || {});
