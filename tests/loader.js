// Test des userscripts complets, lisible et minifié : démarrage de Torch, attente, montage de l'interface, pages à ignorer.
const fs = require('fs');
const vm = require('vm');
const { JSDOM, VirtualConsole } = require('jsdom');
const S = process.argv[2];
const USERSCRIPTS = ['torch-skin.user.js', 'torch-skin.min.user.js'];
const react = fs.readFileSync('node_modules/react/umd/react.development.js', 'utf8');
const rdom = fs.readFileSync('node_modules/react-dom/umd/react-dom.development.js', 'utf8');
const START = 'https://vissle.me/client/start';
const wait = ms => new Promise(r => setTimeout(r, ms));
const log = [];
function step(name, ok, detail) { log.push((ok ? 'ok   ' : 'FAIL ') + name + (ok || detail === undefined ? '' : ' -> ' + JSON.stringify(detail))); }

function page(userscript, url, before) {
  const vc = new VirtualConsole(); const errors = [];
  vc.on('error', e => errors.push(String(e && e.message || e)));
  const dom = new JSDOM('<!doctype html><html><head></head><body><h1>Chatango</h1><div class="login"></div></body></html>', { url, runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc });
  const w = dom.window;
  w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  if (before) before(w);
  const injected = [], gm = [];
  new w.MutationObserver(rs => rs.forEach(r => r.addedNodes.forEach(n => { if (n.tagName === 'SCRIPT' && !n.src) injected.push(n.textContent); })))
    .observe(w.document, { childList: true, subtree: true });
  // Bac à sable Tampermonkey : globales propres, DOM partagé, page atteinte par unsafeWindow.
  const sandbox = vm.createContext({
    document: w.document, location: w.location, unsafeWindow: w, CustomEvent: w.CustomEvent, console, setTimeout, clearTimeout,
    GM_xmlhttpRequest: details => { gm.push(details); }
  });
  sandbox.window = sandbox.top = sandbox.self = sandbox;
  vm.runInContext(userscript, sandbox);
  return { w, d: w.document, errors, injected, gm };
}
function fakeBetterChatango(w) {
  w.eval(`window.client = {
    event: { group: {}, private: {} }, user: { name: '' }, groups: {},
    on(ev, cb) { document.addEventListener('chatango_' + ev, cb); },
    emit(ev, data) { document.dispatchEvent(new CustomEvent('chatango_' + ev, { detail: data })); },
    connect() { return Promise.resolve(); }, socket() {}, systemMessage() {}, setNotice() {}
  }; window.chatango = { getAnon() { return '!anon'; } };`);
}
// Socket factice : jsdom ouvrirait une vraie connexion.
function fakeSocket(w) {
  w.eval(`window.WebSocket = function (url) { this.url = url; this.on = {}; };
    WebSocket.prototype.addEventListener = function (type, fn) { (this.on[type] = this.on[type] || []).push(fn); };
    WebSocket.prototype.fire = function (type, e) { (this.on[type] || []).forEach(function (fn) { fn(e || {}); }); };
    WebSocket.OPEN = 1;`);
}
// jsdom ne télécharge pas les scripts : on exécute React à la main puis on signale le chargement.
async function deliverReact(w) {
  for (const s of [...w.document.querySelectorAll('script[src*="cdnjs"]')]) {
    w.eval(/react-dom/.test(s.src) ? rdom : react);
    s.dispatchEvent(new w.Event('load'));
    await wait(20);
  }
  await wait(20);
  for (const s of [...w.document.querySelectorAll('script[src*="react-dom"]')]) {
    if (!w.ReactDOM) { w.eval(rdom); s.dispatchEvent(new w.Event('load')); }
  }
}

async function suite(userscript) {
  /* Page d'accueil, Torch absent : le script le démarre */
  const a = page(userscript, 'https://st.chatango.com/');
  const starts = a.d.querySelectorAll('script[src="' + START + '"]');
  step('starts Torch once on the home page', starts.length === 1);
  step('shows the Torch loading text', a.d.querySelector('h1').textContent === 'Loading...');
  step('no overlay before Torch is ready', !a.d.getElementById('torch-skin'));
  step('React loaded with integrity check', [...a.d.querySelectorAll('script[src*="cdnjs"]')].every(s => s.integrity.indexOf('sha384-') === 0 && s.crossOrigin === 'anonymous'));
  await deliverReact(a.w);
  // Torch remplace tout le document par son client, écran de connexion compris.
  a.d.documentElement.innerHTML = '<head></head><body><div class="login"><div class="login-wrapper"></div></div></body>';
  await wait(20);
  fakeBetterChatango(a.w);
  await wait(700);
  const host = a.d.getElementById('torch-skin');
  step('overlay mounted once Torch is ready, still hidden', !!host && host.style.display === 'none');
  a.d.body.removeChild(host);
  a.w.client.user.name = 'Marjorie';
  a.w.client.emit('clientLogin', a.w.client);
  await wait(150);
  const host2 = a.d.getElementById('torch-skin');
  step('overlay shown after sign-in, re-attached if Torch removed it', !!host2 && host2.style.display === 'block' && !!host2.shadowRoot.querySelector('#app').children.length);
  step('app runs in the page world',
    a.injected.some(t => t.indexOf('__TORCH_SKIN__') >= 0) && a.w.__TORCH_SKIN__ === true && a.w.__TORCH_LIVE__ === true
      && typeof a.w.client.event.group.getratelimit === 'function' && !!host2 && !!host2.shadowRoot.querySelector('#app').children.length,
    { injected: a.injected.length, skin: a.w.__TORCH_SKIN__, live: a.w.__TORCH_LIVE__ });

  /* Pont vissle : seul le profil connecté est interrogé, sans cookies */
  const replies = [];
  a.d.addEventListener('torch-skin:vissle-response', e => replies.push(JSON.parse(e.detail)));
  a.d.dispatchEvent(new a.w.CustomEvent('torch-skin:vissle-request', { detail: JSON.stringify({ id: 'q1', profile: 'someoneelse', page: 1700000000.5, order: 'desc', get: 'like' }) }));
  await wait(20);
  const call = a.gm[0], body = call ? JSON.parse(call.data) : {};
  if (call) call.onload({ status: 200, responseText: JSON.stringify({ action: 'activity', get: [{ user: 'zoe', time: 1700000000.1 }] }) });
  await wait(20);
  const reply = replies.find(r => r.id === 'q1');
  step('vissle bridge queries own profile only',
    a.gm.length === 1 && call.method === 'POST' && call.url === 'https://vissle.me/track1/activity' && call.anonymous === true
      && body.action === 'activity' && body.profile === 'marjorie' && body.page === 1700000000.5 && body.order === 'desc' && body.get === 'like'
      && !!reply && reply.data.get[0].user === 'zoe',
    { calls: a.gm.map(c => ({ method: c.method, url: c.url, anonymous: c.anonymous, data: c.data })), replies });
  step('no page errors', a.errors.length === 0, a.errors);
  a.w.close();

  /* Fenêtre de discussion intégrée ailleurs : rien ne se passe */
  const b = page(userscript, 'https://st.chatango.com/h5/gz/r1013231200/id.html');
  step('ignores Chatango embeds', !b.d.querySelector('script[src="' + START + '"]') && !b.d.querySelector('script[src*="cdnjs"]') && !b.w.__TORCH_SKIN__);
  b.w.close();

  /* Torch déjà lancé (ancien favori) : pas de second démarrage */
  const c = page(userscript, 'https://st.chatango.com/', fakeBetterChatango);
  step('does not start Torch twice', !c.d.querySelector('script[src="' + START + '"]'));
  c.w.close();

  /* Torch injoignable : message, pas de rechargement en boucle */
  const e = page(userscript, 'https://st.chatango.com/');
  const s = e.d.querySelector('script[src="' + START + '"]');
  s.dispatchEvent(new e.w.Event('error'));
  await wait(20);
  step('explains when Torch cannot be reached', /could not be reached/.test(e.d.querySelector('h1').textContent));
  e.w.close();

  /* Journal de diagnostic : cycle de vie des sockets, jamais le contenu des trames */
  const j = page(userscript, 'https://st.chatango.com/', fakeSocket);
  const journal = j.w.__TORCH_JOURNAL__;
  const sock = new j.w.WebSocket('wss://c1.chatango.com:8081/');
  sock.fire('open');
  sock.fire('message', { data: 'OK\r\n\0' });
  sock.fire('message', { data: 'msg:bob:bob:0:0:0:1700000000:0:<n0/>secret text\r\n\0' });
  sock.fire('close', { code: 1006, reason: '', wasClean: false });
  j.w.console.log('PRIVATE MESSAGE RECEIVED: secret text');
  j.w.console.log('conn closed: mygroup');
  j.w.console.log('[UNKNOWN] (weird): secret text');
  j.w.console.log(new j.w.TypeError('boom'));
  const texts = journal ? journal.entries().map(x => x.m) : [];
  step('journal records the socket lifecycle',
    sock instanceof j.w.WebSocket && texts.includes('private messages [1] received OK')
      && texts.some(m => /^private messages \[1\] closed, code 1006, not clean, open for \d+s, 2 frames received/.test(m)), texts);
  step('journal keeps Torch connection lines and errors only',
    texts.includes('Torch: conn closed: mygroup') && texts.includes('Torch: unhandled frame weird') && texts.includes('TypeError: boom'), texts);
  step('journal keeps no frame or message text', journal && !texts.some(m => /secret/.test(m)), texts);
  j.w.dispatchEvent(new j.w.Event('pagehide'));
  const stored = JSON.parse(j.w.localStorage.getItem('torch-skin:journal') || '[]');
  step('journal saved when the page is hidden', !!journal && stored.length === journal.entries().length);
  for (let i = 0; i < 1100; i++) if (journal) journal.add('test', 'event ' + i);
  const kept = journal ? journal.entries() : [];
  step('journal keeps the latest 1000 events', kept.length === 1000 && kept[999].m === 'event 1099', kept.length);
  j.w.close();
}

(async () => {
  for (const name of USERSCRIPTS) {
    log.push('-- dist/' + name);
    await suite(fs.readFileSync(S + '/dist/' + name, 'utf8'));
  }
  console.log(log.join('\n'));
  process.exit(log.some(l => l.indexOf('FAIL') === 0) ? 1 : 0);
})().catch(err => { console.log(log.join('\n')); console.error('CRASH', err); process.exit(2); });
