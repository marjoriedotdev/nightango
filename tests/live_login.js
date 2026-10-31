const { JSDOM } = require('jsdom');
const { concatSources, layerSources } = require('../scripts/build.mjs');
const live = concatSources(process.argv[2], layerSources('bridge'));
function run(label, setup) {
  // BetterChatango's client document holds its PM tab from the start (inject.js:10601).
  const dom = new JSDOM('<!doctype html><body><span data-sidebar="private"></span></body>', { runScripts: 'outside-only' });
  const w = dom.window;
  let shown = 0;
  w.__TORCH_LIVE__ = true;
  w.__TORCH_SHOW__ = () => { shown++; };
  w.eval(`
    class FakeClient {
      constructor() { this.events = {}; this.user = { name: '' }; this.groups = {}; this.event = { group: {}, private: {} }; }
      emit(event, data) { var e = new CustomEvent('chatango_' + event, { detail: data }); this.events[event] = e; document.dispatchEvent(e); }
      on(event, cb) { document.addEventListener('chatango_' + event, cb); }
      connect() {}
    }
    window.client = new FakeClient();
    window.__betterChatangoRefs = { client: window.client, chatango: {} };
  `);
  w.eval(live + '; window.__bridge = liveBridge;');
  return setup(w).then(() => { console.log((shown === 1 ? 'ok  ' : 'FAIL') + ' ' + label + ' (show called ' + shown + 'x)'); w.close(); });
}
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  await run('clientLogin event', async w => { w.client.user.name = 'Marjorie'; w.client.emit('clientLogin', w.client); await wait(50); });
  await run('polling fallback', async w => { w.client.user.name = 'Marjorie'; w.client.groups.foo = {}; await wait(1200); });
  await run('event then poll, no double show', async w => { w.client.user.name = 'x'; w.client.emit('clientLogin', w.client); w.client.groups.foo = {}; await wait(1200); });
  process.exit(0);
})();
