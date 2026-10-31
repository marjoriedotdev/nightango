const fs = require('fs');
const { JSDOM, VirtualConsole } = require('jsdom');
const { concatSources, layerSources } = require('../scripts/build.mjs');
const live = concatSources(process.argv[2], layerSources('bridge'));
const journal = fs.readFileSync(process.argv[2] + '/src/loader/skin-journal.js', 'utf8');
// Starts a page with the journal, a fake BetterChatango and the bridge, its local storage filled from storage (key to value).
function boot(storage) {
  // BetterChatango's client document holds its PM tab from the start (inject.js:10601).
  // Silent console: the cases read the bridge warnings in the journal.
  const dom = new JSDOM('<!doctype html><body><span data-sidebar="private"></span></body>', { url: 'https://st.chatango.com/', runScripts: 'outside-only', virtualConsole: new VirtualConsole() });
  const w = dom.window;
  Object.keys(storage || {}).forEach(k => w.localStorage.setItem(k, storage[k]));
  w.shown = 0;
  w.__TORCH_LIVE__ = true;
  w.__TORCH_SHOW__ = () => { w.shown++; };
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
  return w;
}
function run(label, setup) {
  const w = boot();
  // A setup that returns a detail object adds its own check: ok tells whether it passed.
  return setup(w).then(extra => {
    const ok = w.shown === 1 && (!extra || extra.ok);
    console.log((ok ? 'ok  ' : 'FAIL') + ' ' + label + ' (show called ' + w.shown + 'x)' + (extra && !extra.ok ? ' -> ' + JSON.stringify(extra) : ''));
    w.close();
  });
}
function check(label, ok, detail) { console.log((ok ? 'ok  ' : 'FAIL') + ' ' + label + (ok ? '' : ' -> ' + JSON.stringify(detail))); }
const wait = ms => new Promise(r => setTimeout(r, ms));
// One page from load to close: an event before sign-in, sign-in as name, an event after. jsdom keeps storage per window, so the next page gets a copy.
async function signInPage(storage, name, marker) {
  const w = boot(storage);
  w.__TORCH_JOURNAL__.add('test', marker + ' before sign-in');
  w.client.user.name = name; w.client.emit('clientLogin', w.client); await wait(50);
  w.__TORCH_JOURNAL__.add('test', marker + ' after sign-in');
  const texts = w.__TORCH_JOURNAL__.entries().map(e => e.m);
  w.dispatchEvent(new w.Event('pagehide'));
  const kept = {};
  for (let i = 0; i < w.localStorage.length; i++) kept[w.localStorage.key(i)] = w.localStorage.getItem(w.localStorage.key(i));
  w.close();
  return { texts, storage: kept };
}
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

  /* Diagnostic journal kept per account: alice, then bob, then alice again on the same browser */
  const shared = JSON.stringify([{ t: 1, k: 'socket', m: '#oldgroup [1] connecting to s1.chatango.com' }]);
  const alice = await signInPage({ 'torch-skin:journal': shared }, 'alice', 'alice page 1');
  const bob = await signInPage(alice.storage, 'bob', 'bob page');
  const back = await signInPage(bob.storage, 'alice', 'alice page 2');
  const loads = texts => texts.filter(m => /^Page loaded/.test(m)).length;
  const inOrder = (texts, list) => list.every((m, i) => texts.indexOf(m) >= 0 && (!i || texts.indexOf(list[i - 1]) < texts.indexOf(m)));
  check('journal: events before sign-in join the account, the log shared by earlier versions is gone',
    inOrder(alice.texts, ['alice page 1 before sign-in', 'Signed in', 'alice page 1 after sign-in']) && loads(alice.texts) === 1
      && !alice.texts.some(m => /oldgroup/.test(m)) && !('torch-skin:journal' in alice.storage), alice);
  check('journal: another account starts from its own log',
    inOrder(bob.texts, ['bob page before sign-in', 'Signed in', 'bob page after sign-in']) && loads(bob.texts) === 1 && !bob.texts.some(m => /alice|oldgroup/.test(m)), bob.texts);
  check('journal: signing back in brings back the earlier events of the account',
    inOrder(back.texts, ['alice page 1 before sign-in', 'alice page 1 after sign-in', 'alice page 2 before sign-in', 'alice page 2 after sign-in'])
      && loads(back.texts) === 2 && !back.texts.some(m => /bob|oldgroup/.test(m)), back.texts);
  process.exit(0);
})();
