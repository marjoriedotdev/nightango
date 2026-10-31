const fs = require('fs');
const { JSDOM, VirtualConsole } = require('jsdom');
const { concatSources, layerSources } = require('../scripts/build.mjs');
const live = concatSources(process.argv[2], layerSources('bridge'));
const journal = fs.readFileSync(process.argv[2] + '/src/loader/skin-journal.js', 'utf8');
function run(label, setup) {
  // Silent console: the cases read the bridge warnings in the journal.
  const dom = new JSDOM('<!doctype html><body></body>', { runScripts: 'outside-only', virtualConsole: new VirtualConsole() });
  const w = dom.window;
  let shown = 0;
  w.__TORCH_LIVE__ = true;
  w.__TORCH_SHOW__ = () => { shown++; };
  // Like the page code, the diagnostic journal is set up before BetterChatango and the bridge.
  w.eval(journal);
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
  // A setup that returns a detail object adds its own check: ok tells whether it passed.
  return setup(w).then(extra => {
    const ok = shown === 1 && (!extra || extra.ok);
    console.log((ok ? 'ok  ' : 'FAIL') + ' ' + label + ' (show called ' + shown + 'x)' + (extra && !extra.ok ? ' -> ' + JSON.stringify(extra) : ''));
    w.close();
  });
}
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  await run('clientLogin event', async w => { w.client.user.name = 'Marjorie'; w.client.emit('clientLogin', w.client); await wait(50); });
  await run('polling fallback', async w => { w.client.user.name = 'Marjorie'; w.client.groups.foo = {}; await wait(1200); });
  await run('event then poll, no double show', async w => { w.client.user.name = 'x'; w.client.emit('clientLogin', w.client); w.client.groups.foo = {}; await wait(1200); });
  await run('throwing listener journaled, other listeners and sign-in go on', async w => {
    const ops = [];
    w.__bridge.onOp(() => { throw new w.TypeError('listener failed'); });
    w.__bridge.onOp(op => { ops.push(op.op); });
    w.client.user.name = 'Marjorie'; w.client.emit('clientLogin', w.client); await wait(50);
    const texts = w.__TORCH_JOURNAL__.entries().map(e => e.m);
    return { ok: ops.includes('login') && texts.includes('[torch-skin] could not apply the login operation: TypeError: listener failed'), ops, texts };
  });
  process.exit(0);
})();
