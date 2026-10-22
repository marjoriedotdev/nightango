// Test de bout en bout du mode live : faux client Torch, interface pilotée comme par un utilisateur.
const fs = require('fs');
const { JSDOM, VirtualConsole } = require('jsdom');
const S = process.argv[2];
const errors = [];
const vc = new VirtualConsole();
vc.on('error', e => errors.push(String(e && e.message || e)));
vc.on('jsdomError', e => errors.push('jsdom: ' + e.message));
vc.on('warn', e => { if (!/act\(|ReactDOM.render|useLayoutEffect|\[torch-skin\]/.test(String(e))) errors.push('warn: ' + String(e).slice(0, 300)); });

const dom = new JSDOM(`<!doctype html><html><head></head><body>
  <input data-text-field="age" value="34"><select data-text-field="gender"><option value="?">?</option><option value="M" selected>M</option><option value="F">F</option></select>
  <input data-text-field="location" value="Rouen"><textarea data-text-field="about">Hello there</textarea><textarea data-text-field="full">FULL PAGE</textarea>
  <div data-setting="show_profile"><input type="checkbox" checked></div>
  <div data-preload="fonts"><form data-form="msgstyles">
    <label><input type="checkbox" name="bold"><span class="fa-bold"></span></label><label><input type="checkbox" name="italics"><span class="fa-italic"></span></label>
    <label><input type="checkbox" name="underline"><span class="fa-underline"></span></label><label><input type="checkbox" name="strikethrough"><span class="fa-strikethrough"></span></label>
    <span class="text-field font-size"><select class="font-size text-input">${Array.from({ length: 14 }, (_, i) => `<option value="${i + 9}"${i + 9 === 11 ? ' selected' : ''}>${i + 9}</option>`).join('')}</select></span>
    <input type="color" value="#000000" data-color="fontColor"><input type="color" value="#000000" data-color="nameColor">
    <span class="text-field font-face"><select class="font-face text-input">${Array.from({ length: 9 }, (_, i) => `<option value="${i}">${i}</option>`).join('')}</select></span>
    <input type="checkbox" name="stylesOn">
  </form></div>
  <div id="app"></div></body></html>`, { runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole: vc, url: 'https://st.chatango.com/' });
const w = dom.window, d = w.document;
w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
w.HTMLElement.prototype.scrollIntoView = function () {};
w.Element.prototype.setPointerCapture = function () {};
// jsdom n'a pas IntersectionObserver : le test déclenche lui-même l'intersection.
const observers = [];
w.IntersectionObserver = function (cb, opts) {
  const o = { cb, opts, targets: [], observe(t) { o.targets.push(t); }, unobserve(t) { o.targets = o.targets.filter(x => x !== t); }, disconnect() { o.targets = []; } };
  observers.push(o);
  return o;
};

/* ---------- Faux client Torch ---------- */
const sent = [], posts = [], calls = [];
let shown = 0;
w.__TORCH_LIVE__ = true;
w.__TORCH_SKIN_VERSION__ = '0.2.0-test';
w.__TORCH_SHOW__ = () => { shown++; };
w.__TORCH_MOUNT__ = d.getElementById('app');
function noop() {}
const groupHandlers = ['b', 'i', 'u', 'ok', 'mods', 'inited', 'groupflagsupdate', 'getannc', 'annc', 'bw', 'blocklist', 'blocked', 'unblocked', 'allunblocked', 'modactions', 'nomore', 'delete', 'deleteall', 'clearall', 'g_participants', 'participant', 'n', 'denied', 'updgroupinfo', 'msglexceeded'];
const privHandlers = ['OK', 'presence', 'msg', 'msgoff', 'wl', 'wladd', 'wldelete', 'wlonline', 'wloffline', 'idleupdate', 'block_list', 'unblocked', 'show_fw', 'kickingoff'];
const pmRecords = [
  { target: 'dave', data: 'msg:dave:marjorie:unknown:1700000000.5:0:<n000/>Hello &amp; welcome', unread: 0 },
  { target: 'dave', data: 'msg:marjorie:marjorie:unknown:1700000100.5:0:<n000/>Thanks', unread: 0 },
  { target: 'fay', data: 'msg:fay:marjorie:unknown:1700000050.5:0:<n3366FF/><m v="1"><g x12s9900cc="4">Old styled</g></m>', unread: 0 }
];
// Relevé du style de Torch au moment où il construit un corps de message (sendMessage avec length).
let styleProbe = null;
const styleAtBuild = [];
function fakeGroup() { return { socket: { readyState: 1 }, user: { badge: 0, channel: { select: 0 } }, room: { information: { title: 'Test group', description: 'A test room' } }, load: 5 }; }
const C = {
  // DENIED : Torch affiche un alert() bloquant.
  // msgoff : Torch archive le message dans sa base d'historique (saveMessage), une seule fois.
  event: { group: Object.fromEntries(groupHandlers.map(n => [n, noop])), private: Object.assign(Object.fromEntries(privHandlers.map(n => [n, noop])), { DENIED() { calls.push(['alert']); }, msgoff() { calls.push(['archive', !!C.database.pm]); } }) },
  user: { name: '', avatar: { x0: 50, y0: 50, ts: 50 }, style: false }, groups: {}, focus: 'test',
  settings: { privacy: { groups: { connect_own: false, connect_recent: false, connect_favorite: true, favorite: [] } } },
  on(ev, cb) { d.addEventListener('chatango_' + ev, cb); },
  emit(ev, data) { d.dispatchEvent(new w.CustomEvent('chatango_' + ev, { detail: data })); },
  socket(gid, frame) { sent.push([gid, frame]); },
  sendMessage(data, length, group, user) {
    if (length && styleProbe) styleAtBuild.push({ group, style: styleProbe() });
    // Comme Torch, le corps d'un MP remplace un lien YouTube par sa balise <i>.
    if (length) return group === 'private_message' ? '<n3366FF/><m v="1"><g x12s9900cc="4">' + data.replace(/https:\/\/youtu\.be\/([\w-]{11})\S*/, '<i s="vid://yt:$1" w="126" h="93"/>') + '</g></m>' : '<n000/><f x11000="0">' + data;
    calls.push(['pm', group, user, data]);
  },
  // Comme socketEvent de Torch : un groupe encore dans cache.connect est ignoré, sa promesse ne se règle jamais.
  cache: { connect: [] },
  connect(gid) {
    if (C.cache.connect.includes(gid)) return new Promise(noop);
    C.cache.connect.push(gid);
    calls.push(['connect', gid, !!C.database.pm]); if (gid !== 'private_message' && !C.groups[gid]) C.groups[gid] = fakeGroup(); return Promise.resolve({});
  },
  setFocus(o) { calls.push(['focus', o.group]); }, disconnectFrom(gid) { calls.push(['disconnect', gid]); delete C.groups[gid]; },
  systemMessage() {}, setNotice() {}, setProfile(dt) { calls.push(['setProfile', dt]); },
  post(url, form) { const f = {}; form.forEach((v, k) => { f[k] = v; }); posts.push({ url, f }); return Promise.resolve(/creategroup/.test(url) ? 'groupcreated' : 'age=40&sex=M&loc=Paris&eline=Hi&dir=checked'); },
  private: { focus: false, socket: { readyState: 0 }, clearHistory(t) { calls.push(['clearHistory', t]); } },
  database: { pm: { transaction() { return { objectStore() { return { openCursor() {
    const req = {}; let i = 0;
    const next = () => setTimeout(() => req.onsuccess({ target: { result: i < pmRecords.length ? { value: pmRecords[i], continue() { i++; next(); } } : null } }), 0);
    next(); return req;
  } }; } }; } } }
};
const CH = {
  getAnon() { return '!anon1234'; }, path(p, sub) { return 'https://' + (sub ? sub + '.' : '') + 'chatango.com/' + p; },
  subdomain: { mod1: n => 'https://ust.chatango.com/' + n + '/mod1.xml', mod2: n => 'https://ust.chatango.com/' + n + '/mod2.xml', custom_profile: n => 'https://ust.chatango.com/' + n + '/custom_profile.css' }, error: { creategroup: { groupexists: 'The group name is taken.' } }
};
const SB = { renderGroup(dt) { calls.push(['renderGroup', dt.group]); } };
w.__torchRefs = { client: C, chatango: CH, sidebar: SB, torch: { environment: 'torchenv' } };
const fetches = [];
let searchHold = null;
const SEARCH_BODY = 'h=zoe;1;2:yann;3:marjorie;9';
let searchBody = SEARCH_BODY;
const ABOUT = encodeURIComponent('<b>Bold</b> hi<script>alert(1)</script><img src="x" onerror="alert(2)"><a href="javascript:alert(3)">bad</a> <a href="https://example.com/p">good</a> <font color="#ff0000" size="5">red</font>');
// Âge Chatango, comme Torch : année courante moins année de naissance.
const ZOE_BIRTH = '1995-04-02', ZOE_ASL = (new Date().getFullYear() - +ZOE_BIRTH.slice(0, 4)) + ' · F · Lyon';
const FULL = encodeURIComponent('<h1>Zoe page</h1><script>parent.alert(4)</script><img src="https://img.example/a.png">');
// Fond Premium au format réel de custom_profile.css (compte goddess). Sans fichier, Chatango renvoie une image JPEG.
const PREMIUM_END = Math.floor(Date.now() / 1000) + 30 * 86400;
const GODDESS_CSS = 'body { background-color: #9e9ffc; background-image: url(https://cdn.donmai.us/a.png); background-repeat: no-repeat; color: #666564; }\n.profile_text { color: #666564; }\na, a:visited, a:active { color: #5c8a8a; text-decoration: none; }\na:hover { color: #5c8a8a; text-decoration: underline; }\n';
w.fetch = (url, opts) => {
  const f = {}; if (opts && opts.body && opts.body.forEach) opts.body.forEach((v, k) => { f[k] = v; });
  fetches.push({ url, f, credentials: opts && opts.credentials });
  let body = '', type = null, status = 200;
  if (/\/search$/.test(url)) body = searchBody;
  else if (/zoe\/mod1\.xml/.test(url)) body = '<?xml version="1.0"?><mod><body>' + ABOUT + '</body><s>F</s><b>' + ZOE_BIRTH + '</b><l c="FR">Lyon</l></mod>';
  else if (/zoe\/mod2\.xml/.test(url)) body = '<?xml version="1.0"?><mod><body>' + FULL + '</body></mod>';
  else if (/marjorie\/mod1\.xml/.test(url)) {
    // Chatango sert la bio du dernier enregistrement.
    const saved = posts.filter(p => /updateprofile/.test(p.url)).pop();
    body = '<?xml version="1.0"?><mod><body>' + encodeURIComponent(saved ? saved.f.line : 'Old bio') + '</body><s>M</s><b>1990-01-01</b><l>Rouen</l></mod>';
  }
  else if (/\/(goddess|expired|sith|lost)\/mod1\.xml/.test(url)) {
    const end = /expired/.test(url) ? PREMIUM_END - 60 * 86400 : PREMIUM_END;
    body = '<?xml version="1.0"?><mod><body>' + encodeURIComponent('Hi <a href="https://example.com/g">my page</a>') + '</body><s>F</s><b>1990-01-01</b><l>Paris</l><d>' + end + '</d></mod>';
  }
  else if (/goddess\/custom_profile\.css/.test(url)) { body = GODDESS_CSS; type = 'text/css'; }
  else if (/sith\/custom_profile\.css/.test(url)) { body = 'body { background-color: #123456; }'; type = 'image/jpeg'; }
  else if (/lost\/custom_profile\.css/.test(url)) { body = 'body { background-color: #123456; }'; type = 'text/css'; status = 404; }
  const res = { ok: status === 200, status, headers: { get: k => k.toLowerCase() === 'content-type' ? type : null }, text: () => Promise.resolve(body) };
  return searchHold && /\/search$/.test(url) ? searchHold.then(() => res) : Promise.resolve(res);
};

// Pont vissle du userscript simulé : la réponse revient par événement, comme depuis le bac à sable.
const vissleReqs = [];
let vissleReply = () => ({ action: 'activity', get: [] });
d.addEventListener('torch-skin:vissle-request', e => {
  const q = JSON.parse(e.detail);
  vissleReqs.push(q);
  setTimeout(() => d.dispatchEvent(new w.CustomEvent('torch-skin:vissle-response', { detail: JSON.stringify({ id: q.id, data: vissleReply(q) }) })), 0);
});

w.eval(fs.readFileSync('node_modules/react/umd/react.development.js', 'utf8'));
w.eval(fs.readFileSync('node_modules/react-dom/umd/react-dom.development.js', 'utf8'));
w.eval(fs.readFileSync(S + '/torchds/project/components/bundle.js', 'utf8'));
w.eval(fs.readFileSync(S + '/dist/app.js', 'utf8'));

/* ---------- Outils ---------- */
const wait = ms => new Promise(r => setTimeout(r, ms));
const $ = s => d.querySelector(s), $$ = s => [...d.querySelectorAll(s)];
function click(el) { if (!el) throw new Error('missing element'); el.dispatchEvent(new w.MouseEvent('click', { bubbles: true })); }
function byText(sel, txt) { return $$(sel).find(e => e.textContent.trim() === txt) || $$(sel).find(e => e.textContent.includes(txt)); }
function type(el, v) {
  if (!el) throw new Error('missing field');
  const proto = el.tagName === 'TEXTAREA' ? w.HTMLTextAreaElement.prototype : el.tagName === 'SELECT' ? w.HTMLSelectElement.prototype : w.HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v);
  el.dispatchEvent(new w.Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
}
function key(el, k) { el.dispatchEvent(new w.KeyboardEvent('keydown', { key: k, bubbles: true })); }
function row(title) { const r = $$('.tc-row').find(x => { const t = x.querySelector('.tc-row-title'); return t && t.firstChild && t.firstChild.textContent === title; }); return r && r.querySelector('input, select, button'); }
function menuItem(txt) { return byText('.menu button', txt); }
function frame(prefix) { return sent.map(x => x[1]).filter(f => f.indexOf(prefix) === 0); }
function g(name, room, data) { C.event.group[name](C, {}, room, data); }
function pm(name, data) { C.event.private[name](C, {}, 'private_message', data); }
const log = [];
function step(name, ok, detail) { log.push((ok ? 'ok   ' : 'FAIL ') + name + (ok || detail === undefined ? '' : ' -> ' + JSON.stringify(detail))); }
const MOD = 64 | 16384 | 128 | 256 | 65536;

(async () => {
  await wait(200);
  /* Connexion et groupe */
  C.user.name = 'marjorie'; C.user.full = 'Marjorie';
  C.groups.test = fakeGroup();
  C.emit('clientLogin', C);
  await wait(100);
  step('overlay shown after login', shown === 1);
  SB.renderGroup({ group: 'test', header: 'Test' });
  g('ok', 'test', ['marjorie', '', '', '', '1700000000', '', 'alice,' + MOD + ';bob,' + (MOD | 2 | 16), String(64)]);
  await wait(100);
  const groupSkeleton = { beforeInit: !!$('.log .tc-skeleton') };
  g('inited', 'test', []);
  g('g_participants', 'test', ['S1:1700:U1:Alice:None;S2:1700:U2:Bob:None;S3:1700:U3:None:None']);
  await wait(150);
  groupSkeleton.afterInit = !!$('.log .tc-skeleton');
  step('group opens', !!byText('h1', 'test'));
  step('announcement requested after init', frame('getannouncement').length >= 1);
  step('owner shown in staff', !!$$('.members .mrow').find(x => x.textContent.includes('marjorie') && x.textContent.includes('Owner')));
  step('admin derived from flags', !!$$('.members .mrow').find(x => x.textContent.includes('bob') && x.textContent.includes('Admin')));

  /* Messages, réponses, modifications */
  g('b', 'test', ['1700000200.1', 'Alice', '', 'u1', 'UNID1', 'tmp1', '1.2.3.4', '0', '', '<n000/><f x11000="0">Hi all']);
  g('u', 'test', ['tmp1', 'A-B_C=']);
  g('b', 'test', ['1700000210.1', 'Bob', '', 'u2', 'UNID2', 'tmp2', '5.6.7.8', '2048', '', '<n000/><f x11000="0"><rAhypheNBunderSC/>Welcome back']);
  g('u', 'test', ['tmp2', 'BOB1=']);
  await wait(80);
  step('reply resolves original', !!$$('.tc-msg-reply').find(x => x.textContent.includes('alice') && x.textContent.includes('Hi all')));
  g('b', 'test', ['1700000220.1', 'Alice', '', 'u1', 'UNID1', 'tmp3', '1.2.3.4', '0', '', '<n000/><f x11000="0"><eAhypheNBunderSC/>Hi everyone']);
  await wait(80);
  step('edit replaces original text', d.body.textContent.includes('Hi everyone') && !d.body.textContent.includes('Hi all') && d.body.textContent.includes('(edited)'));

  /* Style d'un membre : celui de son message le plus récent, quel que soit l'ordre d'arrivée (face 4 = Impact) */
  const logFont = txt => { const p = $$('.log .tc-msg-text').find(x => x.textContent === txt); return p ? p.style.fontFamily : null; };
  g('b', 'test', ['1700000280.1', 'Hana', '', 'u8', 'UNID8', 'tmp20', '2.2.2.2', '0', '', '<n000/><f x11000="4">Hana new']);
  g('i', 'test', ['1700000150.1', 'Hana', '', 'u8', 'UNID8', 'H1=', '2.2.2.2', '0', '', '<n000/><f x11000="1">Hana old']);
  await wait(80);
  step('group history keeps newest style', /Impact/.test(logFont('Hana new') || ''), logFont('Hana new'));
  g('i', 'test', ['1700000190.1', 'Ivy', '', 'u9', 'UNID9', 'H2=', '3.3.3.3', '0', '', '<n000/><f x11000="4">Ivy newer']);
  g('i', 'test', ['1700000180.1', 'Ivy', '', 'u9', 'UNID9', 'H3=', '3.3.3.3', '0', '', '<n000/><f x11000="1">Ivy older']);
  await wait(80);
  step('group history batch keeps its newest style', /Impact/.test(logFont('Ivy newer') || ''), logFont('Ivy newer'));

  /* Envoi : échappement, réponse, canal */
  const ta = $('.tc-composer textarea'), bar = $('.tc-composer-bar');
  $('button[aria-label="Group options"]').focus();
  bar.dispatchEvent(new w.MouseEvent('mousedown', { bubbles: true, cancelable: true })); click(bar); await wait(20);
  step('composer click focuses input', d.activeElement === ta, d.activeElement && d.activeElement.outerHTML.slice(0, 80));
  type(ta, 'a < b & c'); key(ta, 'Enter'); await wait(30);
  const plain = frame('bm:').pop() || '';
  step('message escaped for Chatango', /^bm:[a-z0-9]+:0:<n000\/><f x11000="0">a &lt; b &amp; c$/.test(plain), plain);
  const aliceMsg = $$('.tc-msg').find(x => x.textContent.includes('Hi everyone'));
  click(aliceMsg.querySelector('button[aria-label="Reply"]')); await wait(30);
  type($('.tc-composer textarea'), 'yes'); key($('.tc-composer textarea'), 'Enter'); await wait(30);
  const reply = frame('bm:').pop() || '';
  step('reply frame carries <r> after the style', /^bm:[a-z0-9]+:0:<n000\/><f x11000="0"><rAhypheNBunderSC\/>yes$/.test(reply), reply);

  /* Modération depuis un message */
  click(aliceMsg.querySelector('button[aria-label="More actions"]')); await wait(30);
  const floating = $('#layer .menu.floating');
  step('menus float in the layer with a fixed position', !!floating && floating.style.position === 'fixed' && !$('#app .menu'));
  click(menuItem('Delete message')); await wait(30);
  step('delete frame', frame('delmsg:').pop() === 'delmsg:A-B_C=', frame('delmsg:'));
  click(aliceMsg.querySelector('button[aria-label="More actions"]')); await wait(30);
  click(menuItem('Ban from #test')); await wait(50);
  step('dialogs render in the overlay layer, outside the layout', !!$('#layer .overlay .dialog') && !$('#app .overlay'));
  click(byText('.tc-checkline', 'Also delete their recent messages').querySelector('input')); await wait(20);
  click(byText('.dialog-foot button', 'Ban')); await wait(30);
  step('ban frame', frame('block:').pop() === 'block:UNID1:1.2.3.4:alice', frame('block:'));
  step('delete-all frame with ban', frame('delallmsg:').pop() === 'delallmsg:UNID1:1.2.3.4:alice', frame('delallmsg:'));
  g('blocked', 'test', ['UNID1', '1.2.3.4', 'alice', 'marjorie']); await wait(50);
  step('ban event shown', d.body.textContent.includes('alice was banned'));
  g('delete', 'test', ['BOB1=']); await wait(50);
  step('server delete marks message', d.body.textContent.includes('Message deleted by staff'));

  /* Régressions relevées en relecture */
  g('u', 'test', ['tmp9', 'REAL9=']);
  g('b', 'test', ['1700000230.1', 'Carol', '', 'u3', 'UNID3', 'tmp9', '3.3.3.3', '0', '', '<n000/><f x11000="0">Early id']);
  await wait(60);
  const early = $$('.tc-msg').find(x => x.textContent.includes('Early id'));
  click(early.querySelector('button[aria-label="More actions"]')); await wait(30);
  click(menuItem('Delete message')); await wait(30);
  step('u before b keeps the real id', frame('delmsg:').pop() === 'delmsg:REAL9=', frame('delmsg:'));
  g('b', 'test', ['1700000240.1', '', 'foo', 'u4', 'GUEST1', 'tmp10', '7.7.7.7', '0', '', '<n000/><f x11000="0">First guest']);
  g('u', 'test', ['tmp10', 'G1=']);
  g('b', 'test', ['1700000250.1', '', 'foo', 'u5', 'GUEST2', 'tmp11', '8.8.8.8', '0', '', '<n000/><f x11000="0">Second guest']);
  g('u', 'test', ['tmp11', 'G2=']);
  await wait(60);
  const guest = $$('.tc-msg').find(x => x.textContent.includes('First guest'));
  click(guest.querySelector('button[aria-label="More actions"]')); await wait(30);
  click(menuItem('Ban from #test')); await wait(50);
  click(byText('.dialog-foot button', 'Ban')); await wait(30);
  step('ban targets the clicked message, not the latest same name', frame('block:').pop() === 'block:GUEST1:7.7.7.7:', frame('block:'));
  g('ok', 'torchenv', ['torchbot', '', '', '', '1700000000', '', '', '0']);
  g('b', 'torchenv', ['1700000260.1', 'Bot', '', 'u6', 'X', 'tmp12', '1.1.1.1', '0', '', 'env']);
  await wait(60);
  step("Torch's environment room stays hidden", !byText('.tc-nav', 'torchenv'));

  /* Avertissements et connexion */
  C.systemMessage({ content: 'Your message exceeded the character limit.', group: 'test' }); await wait(50);
  step('Torch notice shown as a toast, not in the thread', !!byText('.toast', 'exceeded the character limit') && !$$('.log .ev').some(x => x.textContent.includes('exceeded the character limit')));
  let reloads = 0;
  C.setNotice({ icon: 'warning', content: 'Relogin required.', button: 'Reload', action: () => { reloads++; } }); await wait(50);
  const t = byText('.toast', 'Relogin required.');
  step('Torch warning becomes a toast with its action', !!t && !!byText('.toast button', 'Reload'));
  click(byText('.toast button', 'Reload'));
  step('toast action calls Torch', reloads === 1);
  C.groups.test.socket.readyState = 3; await wait(2300);
  step('disconnect banner', !!byText('.banner-wrap', 'Disconnected from #test'));
  click(byText('.banner-wrap button', 'Reconnect')); await wait(30);
  step('reconnect asks Torch', calls.some(c => c[0] === 'connect' && c[1] === 'test'));
  C.groups.test.socket.readyState = 1; await wait(2300);
  step('banner clears once connected', !byText('.banner-wrap', 'Disconnected'));
  C.groups.test.socket.readyState = 3; await wait(2300);
  click(byText('.banner-wrap button', 'Reconnect')); await wait(30);
  const testConnects = calls.filter(c => c[0] === 'connect' && c[1] === 'test').length;
  step('reconnect twice', testConnects === 2 && !C.cache.connect.includes('test'), { testConnects, cache: C.cache.connect });
  C.groups.test.socket.readyState = 1; await wait(2300);

  /* Historique */
  click(byText('button', 'Load earlier messages')); await wait(30);
  step('get_more uses Torch counter', frame('get_more:').pop() === 'get_more:20:5');
  g('nomore', 'test', []); await wait(50);
  step('history end shown', d.body.textContent.includes('beginning of the history'));

  /* Réglages de groupe */
  click($('button[aria-label="Group options"]')); await wait(30);
  click(menuItem('Group settings')); await wait(80);
  step('settings requested', ['getannouncement', 'getbannedwords', 'getratelimit', 'getmodactions:prev:0:50'].every(f => frame(f).length));
  g('getannc', 'test', ['1', 'test', '5', '900', '<nF00/><f x12F00="1">Be kind']);
  g('bw', 'test', ['spam%2Cscam', 'idiot']);
  g('getratelimit', 'test', ['0', '0']);
  g('modactions', 'test', [encodeURIComponent('7,amod,marjorie,1.1.1.1,bob,1700000000,') + ';' + encodeURIComponent('6,chbw,bob,2.2.2.2,,1699990000,')]);
  await wait(80);
  click(byText('.tc-nav', 'Media and links')); await wait(50);
  const links = row('Allow links');
  step('links off from flags', links && links.checked === false);
  click(links); await wait(30);
  click($('.tc-savebar .tc-btn-primary')); await wait(30);
  step('flag update frame', frame('updategroupflags:').pop() === 'updategroupflags:0:64', frame('updategroupflags:'));
  step('pending state while waiting', !!byText('.tc-banner', 'Waiting for Chatango'));
  g('groupflagsupdate', 'test', ['0']); await wait(80);
  step('confirmed by server', !byText('.tc-banner', 'Waiting for Chatango') && row('Allow links').checked === true);

  click(byText('.tc-nav', 'AutoMod')); await wait(50);
  step('banned words loaded', $('#bw-part') && $('#bw-part').value === 'spam,scam');
  type($('#bw-part'), 'spam, scam, fraud'); await wait(20);
  type($('#slow'), '10'); await wait(20);
  click($('.tc-savebar .tc-btn-primary')); await wait(30);
  step('banned words frame', frame('setbannedwords:').pop() === 'setbannedwords:spam%2Cscam%2Cfraud:idiot', frame('setbannedwords:'));
  step('slow mode frame', frame('setratelimit:').pop() === 'setratelimit:10', frame('setratelimit:'));
  g('bw', 'test', ['spam%2Cscam%2Cfraud', 'idiot']); g('ratelimitset', 'test', ['10']); await wait(80);

  click(byText('.tc-nav', 'Announcement')); await wait(50);
  step('announcement loaded', $('#ann-text') && $('#ann-text').value === 'Be kind' && $('#ann-int').value === '15');
  type($('#ann-text'), 'Be kind <3\nThanks'); await wait(20);
  click($('.tc-savebar .tc-btn-primary')); await wait(30);
  step('announcement keeps style, escapes, keeps line breaks', frame('updateannouncement:').pop() === 'updateannouncement:1:900:<nF00/><f x12F00="1">Be kind &lt;3<br/>Thanks', frame('updateannouncement:'));
  g('getannc', 'test', ['1', 'test', '5', '900', '<nF00/><f x12F00="1">Be kind &lt;3<br/>Thanks']); await wait(80);

  click(byText('.tc-nav', 'Staff and roles')); await wait(50);
  step('staff list from mods frame', !!byText('.role-btn', 'alice') && !!byText('.role-btn', 'bob'));
  click(byText('.role-btn', 'alice')); await wait(30);
  click(row('See IP addresses')); await wait(20);
  type($('#add-mod'), 'Carol'); click(byText('button', 'Add')); await wait(30);
  click(byText('.role-btn', 'bob')); await wait(30);
  click(byText('.btnrow button', 'Remove')); await wait(30);
  click($('.tc-savebar .tc-btn-primary')); await wait(30);
  step('permission change frame keeps other bits', frame('addmod:alice:').pop() === 'addmod:alice:' + (MOD & ~16384), frame('addmod:'));
  step('new moderator frame', frame('addmod:carol:').pop() === 'addmod:carol:' + MOD, frame('addmod:'));
  step('remove moderator frame', frame('removemod:').pop() === 'removemod:bob');
  g('mods', 'test', ['alice,' + (MOD & ~16384), 'carol,' + MOD]); await wait(80);

  click(byText('.tc-nav', 'Bans')); await wait(50);
  step('ban list requested', frame('blocklist:block:0:next:500:anons:1').length >= 1);
  g('blocklist', 'test', ['UNID1:1.2.3.4:alice:1700000300:marjorie;UNID9:9.9.9.9::1700000000:bob']); await wait(50);
  step('ban list shown', !!byText('.lrow', 'alice') && !!byText('.lrow', '!anon'));
  click(byText('.lrow', 'alice').querySelector('button')); await wait(20);
  step('unban frame', frame('removeblock:').pop() === 'removeblock:UNID1:1.2.3.4');

  click(byText('.tc-nav', 'Audit log')); await wait(50);
  step('audit entries', !!byText('.lrow', 'made bob a moderator') && !!byText('.lrow', 'changed banned words'));

  click(byText('.tc-nav', 'Media and links')); await wait(50);
  click(row('Allow videos')); await wait(20);
  const addmodBefore = frame('addmod:').length;
  g('mods', 'test', ['alice,' + (MOD & ~16384), 'carol,' + MOD, 'zed,' + MOD]);
  g('groupflagsupdate', 'test', [String(16)]);
  await wait(80);
  click($('.tc-savebar .tc-btn-primary')); await wait(30);
  step('save sends only what the user changed', frame('updategroupflags:').pop() === 'updategroupflags:128:0', frame('updategroupflags:'));
  step("another admin's new moderator is kept", frame('removemod:zed').length === 0 && frame('addmod:').length === addmodBefore, frame('addmod:'));
  g('groupflagsupdate', 'test', [String(16 | 128)]); await wait(80);

  click(byText('.tc-nav', 'Close group')); await wait(30);
  click(byText('.dialog-foot button', 'Close group')); await wait(30);
  step('close frame', frame('updategroupflags:262144:0').length === 1);
  click(byText('.tc-nav', 'Back to chat')); await wait(50);

  /* Favori écrit dans les réglages de Torch */
  click($('button[aria-label="Group options"]')); await wait(30);
  click(menuItem('Add to favorites')); await wait(50);
  const torchSettings = JSON.parse(w.localStorage.getItem('settings') || '{}');
  step('favorite persisted in Torch settings', C.settings.privacy.groups.favorite.indexOf('test') >= 0 && torchSettings.privacy.groups.favorite.indexOf('test') >= 0, torchSettings);

  /* Messages privés : base d'historique de Torch ouverte par le pont, avec son schéma */
  const fakeDb = C.database.pm, schema = [];
  C.database.pm = false;
  w.indexedDB = { open(name, version) {
    const req = {};
    setTimeout(() => {
      schema.push(['open', name, version]);
      req.onupgradeneeded({ target: { result: { createObjectStore(n, o) { schema.push(['store', n, o.keyPath]); return { createIndex(i, k) { schema.push(['index', i, JSON.stringify(k)]); } }; } } } });
      req.onsuccess({ target: { result: fakeDb } });
    }, 0);
    return req;
  } };
  click(byText('.tc-nav', 'Private messages')); await wait(50);
  const pmSkeleton = { beforeReady: !!$('.convs .tc-skeleton') };
  C.private.socket.readyState = 1;
  pm('OK', []); await wait(150);
  pmSkeleton.afterHistory = !!$('.convs .tc-skeleton');
  step('loading skeletons', groupSkeleton.beforeInit && !groupSkeleton.afterInit && pmSkeleton.beforeReady && !pmSkeleton.afterHistory, { groupSkeleton, pmSkeleton });
  step("Torch's history base opened with its exact schema", JSON.stringify(schema) === JSON.stringify([['open', 'marjorie_history', 1], ['store', 'messages', 'ts'], ['index', 'target_idx', '"target"'], ['index', 'target_read_idx', '["target","unread"]'], ['index', 'target_ts_idx', '["target","ts"]']]), schema);
  step('base handed to Torch for archiving', C.database.pm === fakeDb);
  click(byText('.tc-nav', 'Private messages')); await wait(50);
  step('pm history loaded from Torch', !!byText('.conv', 'dave'));
  click(byText('.conv', 'dave')); await wait(50);
  step('history text decoded', d.body.textContent.includes('Hello & welcome'));
  step('Torch pm focus follows the open conversation', C.private.focus === 'dave');
  type($('.thread .tc-composer textarea'), 'x < y'); key($('.thread .tc-composer textarea'), 'Enter'); await wait(30);
  step('pm escaped', calls.some(c => c[0] === 'pm' && c[1] === 'private_message' && c[2] === 'dave' && c[3] === 'x &lt; y'));
  click(byText('.profile .mrow', 'Add friend')); await wait(30);
  step('add friend frame', frame('wladd:dave').length === 1);
  pm('wladd', ['nobody', 'invalid']); await wait(50);
  step('unknown friend reported', !!byText('.toast', 'No Chatango user named nobody.'));
  click(byText('.profile .mrow', 'Block')); await wait(30);
  click(byText('.dialog-foot button', 'Block')); await wait(30);
  step('pm block frame', frame('block:dave:dave:S').length === 1);
  pm('wl', ['erin', '0', 'off', '0']); await wait(30);
  pm('wlonline', ['erin']); await wait(50);
  step('friend online notification', !!byText('.toast', 'erin is online.'));

  /* Styles Chatango et médias, avec les réglages activés comme dans Apparence */
  click($('button[aria-label="Settings"]')); await wait(50);
  click(byText('.pick', 'Light')); await wait(30);
  step('name colors and fonts on by default', row('Name colors').checked && row('Fonts and text colors').checked && !row('Message backgrounds').checked);
  click(byText('.tc-nav', 'Back to chat')); await wait(50);
  const styled = txt => { const p = $$('.thread .tc-msg-text').find(x => x.textContent === txt); const a = p && p.closest('.tc-msg'); return { p, name: a && a.querySelector('.tc-msg-author') }; };
  const styleOk = r => !!r.p && r.p.style.fontFamily.includes('Impact') && r.p.style.color === 'rgb(153, 0, 204)' && !!r.name && r.name.style.color === 'rgb(51, 102, 255)';
  pm('msg', ['dave', 'marjorie', 'unknown', '1700000300.5', '0', '<n3366FF/><m v="1"><g x12s9900cc="4">Hi</g></m>']); await wait(50);
  const live = styled('Hi');
  step('pm style rendered', styleOk(live), live.p && [live.p.style.cssText, live.name && live.name.style.cssText]);
  click(byText('.conv', 'fay')); await wait(50);
  const old = styled('Old styled');
  step('pm history keeps style', styleOk(old), old.p && [old.p.style.cssText, old.name && old.name.style.cssText]);
  type($('.thread .tc-composer textarea'), 'Mine'); key($('.thread .tc-composer textarea'), 'Enter'); await wait(50);
  const mine = styled('Mine');
  const minePms = calls.filter(c => c[0] === 'pm' && c[2] === 'fay' && c[3] === 'Mine').length;
  step('own pm carries own style', styleOk(mine) && minePms === 1, { minePms, style: mine.p && [mine.p.style.cssText, mine.name && mine.name.style.cssText] });

  click(byText('.tc-nav', 'test')); await wait(50);
  g('b', 'test', ['1700000270.1', 'Eve', '', 'u7', 'UNID7', 'tmp13', '9.9.9.9', '0', '', '<n000/><f x11000="2">Look at this']);
  g('b', 'test', ['1700000271.1', 'Eve', '', 'u7', 'UNID7', 'tmp14', '9.9.9.9', '0', '', '<n000/><f x11000="0"><i s="vid://yt:PLe_UgXBBCU" w="126" h="93"/>']);
  await wait(60);
  const yt = $('.log .embed-video'), eveText = $$('.log .tc-msg-text').find(x => x.textContent === 'Look at this');
  const ytBefore = { raw: d.body.textContent.includes('vid://'), card: !!yt, media: !!yt && !!yt.querySelector('iframe, img'), font: eveText && eveText.style.fontFamily };
  if (yt) { click(yt); await wait(30); }
  const ytFrame = $('.log iframe');
  step('youtube embed loads on click', !ytBefore.raw && ytBefore.card && !ytBefore.media && !!ytFrame && ytFrame.getAttribute('src').indexOf('https://www.youtube-nocookie.com/embed/PLe_UgXBBCU') === 0 && ytBefore.font === '', [ytBefore, ytFrame && ytFrame.getAttribute('src')]);

  click(byText('.tc-nav', 'Private messages')); await wait(50);
  const convPrev = n => { const c = $$('.conv').find(x => x.querySelector('.conv-name') && x.querySelector('.conv-name').textContent === n); return c ? c.querySelector('.conv-prev').textContent : null; };
  pm('msg', ['gus', 'marjorie', 'unknown', '1700000400.5', '0', '<n000/><m v="1"><g x12s000="0"><i s="https://x.test/a.png"/></g></m>']); await wait(50);
  const prevImage = convPrev('gus');
  pm('msg', ['gus', 'marjorie', 'unknown', '1700000401.5', '0', '<n000/><m v="1"><g x12s000="0"><i s="img://cam:abc123"/></g></m>']); await wait(50);
  const prevPhoto = convPrev('gus');
  click(byText('.conv', 'gus')); await wait(50);
  const imgsBefore = $$('.thread .embeds img').length;
  $$('.thread .embeds button').filter(x => x.textContent.includes('Show image')).forEach(click); await wait(30);
  const imgs = $$('.thread .embeds img').map(x => [x.getAttribute('src'), x.getAttribute('referrerpolicy')]);
  click($('button[aria-label="Settings"]')); await wait(50);
  click(byText('.tc-nav', 'Safety')); await wait(30);
  click(row('Embed images')); await wait(30);
  click(byText('.tc-nav', 'Back to chat')); await wait(50);
  const linksOnly = !$('.thread .embeds img') && !!$('.thread a[href="https://x.test/a.png"]') && !!$('.thread a[href="https://chatango.com/pmmessageimg?i=abc123"]');
  click($('button[aria-label="Settings"]')); await wait(50);
  click(byText('.tc-nav', 'Safety')); await wait(30);
  click(row('Embed images')); await wait(30);
  click(byText('.tc-nav', 'Back to chat')); await wait(50);
  step('pm image embed and settings', prevImage === 'Image' && prevPhoto === 'Photo' && imgsBefore === 0 && JSON.stringify(imgs) === JSON.stringify([['https://x.test/a.png', 'no-referrer'], ['https://chatango.com/pmmessageimg?i=abc123', 'no-referrer']]) && linksOnly, { prevImage, prevPhoto, imgsBefore, imgs, linksOnly });

  /* Fermer ou supprimer une conversation */
  const listed = n => $$('.convs .conv-name').some(x => x.textContent === n);
  const hiddenStored = () => JSON.parse(w.localStorage.getItem('torch-skin:marjorie') || '{}').hidden || [];
  const closeConv = async n => {
    const r = $$('.conv-row').find(x => x.querySelector('.conv-name') && x.querySelector('.conv-name').textContent === n);
    const b = r && r.querySelector('button[aria-label="Options for ' + n + '"]');
    if (b) { click(b); await wait(30); }
    if (menuItem('Close conversation')) { click(menuItem('Close conversation')); await wait(50); }
  };
  await closeConv('dave');
  const closed = { listed: listed('dave'), cleared: calls.some(c => c[0] === 'clearHistory'), hidden: hiddenStored().includes('dave') };
  pm('msg', ['dave', 'marjorie', 'unknown', '1700000500.5', '0', '<n000/>Back again']); await wait(50);
  const back = listed('dave');
  await closeConv('dave');
  click($('.convs button[aria-label="New message"]')); await wait(50);
  type($('#newdm'), 'dave'); click(byText('.dialog-foot button', 'Start conversation')); await wait(50);
  const reopened = { hidden: hiddenStored().includes('dave'), listed: listed('dave'), history: !!$('.thread') && $('.thread').textContent.includes('Hello & welcome') };
  step('close keeps history and reopens', !closed.listed && !closed.cleared && closed.hidden && back && !reopened.hidden && reopened.listed && reopened.history, { closed, back, reopened });
  click($('.thread button[aria-label="Conversation options"]')); await wait(30);
  click(menuItem('Delete conversation')); await wait(30);
  click(byText('.dialog-foot button', 'Delete')); await wait(50);
  step('delete clears Torch history', calls.some(c => c[0] === 'clearHistory' && c[1] === 'dave') && !listed('dave'), calls.filter(c => c[0] === 'clearHistory'));
  click($('.convs button[aria-label="New message"]')); await wait(50);
  const dmChips = $$('.dialog .chip').length;
  type($('#newdm'), 'hank'); key($('#newdm'), 'Enter'); await wait(50);
  const hankHead = $('.thread .topbar h2');
  step('new dm has no suggestions', dmChips === 0 && !$('.dialog') && !!hankHead && hankHead.textContent === 'hank', { dmChips, dialog: !!$('.dialog'), head: hankHead && hankHead.textContent });
  const convRow = n => $$('.conv-row').find(x => x.querySelector('.conv-name') && x.querySelector('.conv-name').textContent === n);
  const menuLabels = () => $$('.menu button').map(x => x.textContent);
  const hasRowItems = l => l.includes('Close conversation') && l.some(x => x.indexOf('Delete conversation') === 0);
  const hankRow = convRow('hank');
  if (hankRow) hankRow.querySelector('.conv').dispatchEvent(new w.MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 60, clientY: 80 }));
  await wait(30);
  const ctxItems = menuLabels();
  key(d, 'Escape'); await wait(30);
  const hankMore = hankRow && hankRow.querySelector('button[aria-label="Options for hank"]');
  if (hankMore) { click(hankMore); await wait(30); }
  const moreItems = menuLabels();
  if (menuItem('Delete conversation')) { click(menuItem('Delete conversation')); await wait(30); }
  const asked = !!$('.dialog') && !calls.some(c => c[0] === 'clearHistory' && c[1] === 'hank');
  if (asked) { click(byText('.dialog-foot button', 'Delete')); await wait(50); }
  const hankDeleted = calls.some(c => c[0] === 'clearHistory' && c[1] === 'hank') && !listed('hank');
  const gusRow = convRow('gus');
  const pointer = (type, x) => {
    const e = new w.MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: 100 });
    Object.defineProperties(e, { pointerId: { value: 1 }, pointerType: { value: 'touch' } });
    gusRow.querySelector('.conv').dispatchEvent(e);
  };
  pointer('pointerdown', 250); pointer('pointermove', 240); pointer('pointermove', 120); pointer('pointerup', 120);
  click(gusRow.querySelector('.conv')); await wait(30);
  const swipeButtons = [...gusRow.querySelectorAll('button')].filter(b => !b.closest('.conv')).map(b => b.textContent);
  const gusOpened = !!$('.thread .topbar h2') && $('.thread .topbar h2').textContent === 'gus';
  step('chat row actions', hasRowItems(ctxItems) && hasRowItems(moreItems) && asked && hankDeleted && swipeButtons.includes('Close') && swipeButtons.includes('Delete') && !gusOpened, { ctxItems, moreItems, asked, hankDeleted, swipeButtons, gusOpened });

  /* Amis et rencontres */
  click(byText('.tc-nav', 'Friends')); await wait(60);
  const friendRows = $$('.convs .conv').map(x => x.querySelector('.conv-name').textContent);
  step('friends list shown with online first', friendRows[0] === 'erin' && friendRows.indexOf('erin') >= 0, friendRows);
  type($('#add-friend'), 'Newbie'); click(byText('.convs button', 'Add')); await wait(30);
  step('add friend from the list', frame('wladd:newbie').length === 1);
  pm('wladd', ['zoe', 'on', '0']);
  pm('msg', ['zoe', 'marjorie', 'unknown', '1700000600.5', '0', '<n000/><m v="1"><g x12s000="0">See you at 8</g></m>']); await wait(150);
  const zoeRow = $$('.convs .conv').find(x => x.querySelector('.conv-name') && x.querySelector('.conv-name').textContent === 'zoe');
  const zoeText = zoeRow ? zoeRow.textContent : '';
  step('friends rows show ASL and last message', zoeText.includes(ZOE_ASL) && zoeText.includes('See you at 8') && !zoeText.includes('Bold'), zoeText);
  const nowS = Date.now() / 1000;
  pm('wl', ['zoe', String(nowS), 'on', '0', 'erin', String(nowS - 3 * 86400), 'off', '0', 'frank', String(nowS - 600), 'off', '0', 'abe', 'None', 'off', '0']); await wait(60);
  const friendMeta = () => $$('.convs .conv').map(x => [x.querySelector('.conv-name').textContent, x.querySelector('.conv-meta').textContent]);
  const seen = friendMeta(), metaOf = n => (seen.find(x => x[0] === n) || [])[1] || '';
  pm('presence', ['frank', '30', 'offline']); await wait(60);
  const frankRow = $$('.convs .conv').find(x => x.querySelector('.conv-name').textContent === 'frank');
  const frankOffline = !!frankRow && !!frankRow.querySelector('.tc-presence-offline');
  step('friends last online and order', JSON.stringify(seen.map(x => x[0])) === JSON.stringify(['zoe', 'frank', 'erin', 'abe']) && metaOf('erin').includes('Last online') && !metaOf('abe').includes('Last online')
    && seen.every(x => !/\b(Online|Idle|Offline)\b/.test(x[1])) && frankOffline, { seen, frankOffline });
  click(byText('.tc-nav', 'Meet people')); await wait(120);
  const search = fetches.find(x => /\/search$/.test(x.url));
  step('meet search uses Torch parameters and the browser session', !!search && search.credentials === 'include' && search.f.s === 'B' && String(search.f.o) === '1' && String(search.f.ami) === '13' && String(search.f.ama) === '99' && String(search.f.f) === '0' && String(search.f.t) === '40', search);
  step('presence requested for results', frame('getpresence:').pop() === 'getpresence:zoe;yann;marjorie');
  pm('presence', ['zoe', '0', 'online', 'yann', '5', 'online']); await wait(60);
  const meetRows = $$('.convs .conv').map(x => [x.textContent, (x.querySelector('.tc-presence') || {}).className]);
  step('meet results with status', meetRows.length === 3 && meetRows[0][0].includes('zoe') && /tc-presence-online/.test(meetRows[0][1]) && /tc-presence-idle/.test(meetRows[1][1]), meetRows);

  /* Filtres de Meet people dans une fenêtre */
  const searchesBefore = fetches.filter(x => /\/search$/.test(x.url)).length;
  click(byText('.convs button', 'Filters')); await wait(50);
  click(byText('.dialog .tc-seg button', 'Women')); await wait(20);
  click(byText('.dialog-foot button', 'Show results')); await wait(80);
  const fs2 = fetches.filter(x => /\/search$/.test(x.url));
  step('filters dialog applies the search', fs2.length === searchesBefore + 1 && fs2[fs2.length - 1].f.s === 'F', fs2[fs2.length - 1]);
  step('active filter shown as a chip and counted', !!byText('.filter-chip', 'Women') && !!$('.filter-count') && $('.filter-count').textContent === '1');
  click(byText('.filter-chip', 'Women').querySelector('button')); await wait(80);
  const fs3 = fetches.filter(x => /\/search$/.test(x.url));
  step('removing the chip searches again without it', fs3[fs3.length - 1].f.s === 'B' && !$('.filter-chip'));
  pm('presence', ['zoe', '0', 'online', 'yann', '5', 'online']); await wait(150);
  step('meet cards show the mini profile', !!$$('.conv.person').find(x => x.textContent.includes('zoe') && x.textContent.includes('Lyon') && x.textContent.includes('Bold hi')));

  /* Profils */
  click(byText('.convs .conv', 'zoe')); await wait(120);
  const card = $('.dialog');
  const rich = card && card.querySelector('.about.rich');
  step('mini profile loaded (age, gender, location)', !!card && card.textContent.includes(ZOE_ASL), card && card.textContent);
  step('mini profile keeps formatting', !!rich && !!rich.querySelector('b') && rich.querySelector('b').textContent === 'Bold' && !!rich.querySelector('span[style*="color"]'));
  step('mini profile drops scripts and handlers', !!rich && !rich.querySelector('script') && !rich.innerHTML.includes('onerror') && !rich.innerHTML.includes('javascript:') && !rich.innerHTML.includes('alert'));
  step('mini profile keeps safe links only', !!rich && $$('.about.rich a').length === 1 && rich.querySelector('a').getAttribute('href') === 'https://example.com/p');
  click(byText('.dialog button', 'Full profile')); await wait(120);
  const frameEl = $('iframe.fullprofile');
  const sd = frameEl ? frameEl.getAttribute('srcdoc') : '';
  step('full profile in an isolated frame', !!frameEl && !/allow-scripts|allow-same-origin/.test(frameEl.getAttribute('sandbox')) && sd.includes("default-src 'none'") && sd.includes('Zoe page'));
  step('full profile blocks external media until asked', sd.includes("img-src data:") || !!byText('.dialog-foot button', 'Load images'));
  click(byText('.dialog-foot button', 'Close')); await wait(30);
  key(d, 'Escape'); await wait(30);

  /* Actualiser Meet people avec les filtres en cours */
  click(byText('.convs button', 'Filters')); await wait(50);
  click(byText('.dialog .tc-seg button', 'Women')); await wait(20);
  click(byText('.dialog-foot button', 'Show results')); await wait(80);
  const searches = () => fetches.filter(x => /\/search$/.test(x.url));
  const refreshBtn = () => $('.convs button[aria-label="Refresh"]');
  const searchesBeforeRefresh = searches().length;
  let releaseSearch;
  searchHold = new Promise(r => { releaseSearch = r; });
  if (refreshBtn()) { click(refreshBtn()); await wait(30); }
  const during = { count: searches().length - searchesBeforeRefresh, disabled: !!refreshBtn() && refreshBtn().disabled };
  releaseSearch(); searchHold = null; await wait(80);
  const lastSearch = searches().pop();
  step('meet refresh', during.count === 1 && during.disabled && lastSearch.f.s === 'F' && String(lastSearch.f.o) === '1' && String(lastSearch.f.f) === '0' && !!refreshBtn() && !refreshBtn().disabled, { during, f: lastSearch.f });

  /* Défilement infini de Meet people : pages pleines de 40 noms, la seconde reprend un nom déjà affiché, la sentinelle entre deux fois dans la zone visible */
  const meetPage = (start, n) => Array.from({ length: n }, (_, i) => 'p' + (start + i) + ';1').join(':');
  const reachBottom = async () => {
    const o = observers.find(x => x.targets.length);
    if (o) o.cb(o.targets.map(target => ({ isIntersecting: true, target })), o);
    await wait(80);
    return !!o;
  };
  searchBody = 'h=' + meetPage(0, 40);
  click(refreshBtn()); await wait(80);
  const searchesBeforeScroll = searches().length;
  searchBody = 'h=p0;1:' + meetPage(40, 39);
  const observed = [await reachBottom()];
  const cards = $$('.conv.person').length;
  observed.push(await reachBottom());
  const scrollSearches = searches().slice(searchesBeforeScroll);
  step('meet infinite scroll', scrollSearches.length === 2 && String(scrollSearches[0].f.f) === '40' && String(scrollSearches[0].f.t) === '80' && cards === 79
    && String(scrollSearches[1].f.f) === '80' && String(scrollSearches[1].f.t) === '120' && !byText('.convs button', 'Load more'),
    { observed, cards, requests: scrollSearches.map(x => [x.f.f, x.f.t]), loadMore: !!byText('.convs button', 'Load more') });

  /* Fond Premium du mini profil : Premium actif lu dans custom_profile.css, Premium expiré jamais demandé, réponse JPEG ou 404 sans fond */
  searchBody = 'h=goddess;1:expired;1:sith;1:lost;1';
  click(refreshBtn()); await wait(150);
  const personOf = n => $$('.conv.person').find(x => x.querySelector('.conv-name').textContent === n);
  const cssAsked = n => fetches.some(x => x.url.indexOf('/' + n + '/custom_profile.css') >= 0);
  const premiumCards = ['goddess', 'expired', 'sith', 'lost'].map(n => [n, personOf(n) ? personOf(n).style.backgroundColor : null]);
  if (personOf('goddess')) { click(personOf('goddess')); await wait(120); }
  const aboutKv = $$('.dialog .kv').find(x => x.querySelector('h3') && x.querySelector('h3').textContent === 'About');
  const aboutLink = aboutKv && aboutKv.querySelector('a');
  const premiumAbout = aboutKv ? { bg: aboutKv.style.backgroundColor, text: aboutKv.style.color, link: aboutLink && aboutLink.style.color } : null;
  key(d, 'Escape'); await wait(30);
  step('premium profile background', JSON.stringify(premiumCards) === JSON.stringify([['goddess', 'rgb(158, 159, 252)'], ['expired', ''], ['sith', ''], ['lost', '']])
    && cssAsked('goddess') && !cssAsked('expired') && cssAsked('sith') && cssAsked('lost')
    && !!premiumAbout && premiumAbout.bg === 'rgb(158, 159, 252)' && premiumAbout.text === 'rgb(61, 61, 60)' && premiumAbout.link === 'rgb(41, 62, 62)',
    { premiumCards, css: ['goddess', 'expired', 'sith', 'lost'].map(cssAsked), premiumAbout });
  searchBody = SEARCH_BODY;

  /* Statut */
  click($('.me-btn')); await wait(30);
  click(menuItem('Idle')); await wait(30);
  step('idle status frame', frame('idle:0').length === 1);

  /* Profil */
  const NOW = Date.now() / 1000, KINDS = ['log', 'like', 'dislike', 'msg', 'refer'];
  const firstPage = Array.from({ length: 16 }, (_, i) => ({ user: i === 15 ? 'sentinel' : i === 5 ? '!anon5681' : 'visitor' + i, action: KINDS[i % 5], time: NOW - 600 * i - 0.25, msg: i % 5 === 3 ? 'Nice page' : undefined }));
  vissleReply = q => ({ action: 'activity', get: q.page === 1 ? firstPage : firstPage.slice(0, 3).map((x, i) => ({ user: 'older' + i, action: 'log', time: NOW - 86400 - i })) });
  click($('button[aria-label="Settings"]')); await wait(50);
  click(byText('.tc-nav', 'Profile')); await wait(50);
  const visitors = () => $('section[aria-label="Visitors"]') || d.createElement('section'), visitorRows = () => [...visitors().querySelectorAll('.lrow')].map(x => x.textContent);
  const rows1 = visitorRows();
  step('own visitors list: first page shows 15 rows with vissle labels',
    vissleReqs.length === 1 && vissleReqs[0].page === 1 && vissleReqs[0].get === 'all' && rows1.length === 15 && !visitors().textContent.includes('sentinel')
      && rows1[0].includes('visitor0 visited') && rows1[1].includes('visitor1 liked profile') && rows1[2].includes('visitor2 disliked profile')
      && rows1[3].includes('visitor3 commented on') && rows1[3].includes('Nice page') && rows1[4].includes('visitor4 referred by'), { reqs: vissleReqs, rows1 });
  click(byText('section[aria-label="Visitors"] button', 'Load more')); await wait(50);
  step('own visitors list: load more sends the time of the 15th row',
    vissleReqs[1].page === firstPage[14].time && vissleReqs[1].get === 'all' && visitorRows().length === 18 && !byText('section[aria-label="Visitors"] button', 'Load more'), { req: vissleReqs[1], rows: visitorRows().length });
  vissleReply = () => ({ action: 'activity', get: [{ user: 'liker', time: NOW - 30 }] });
  click(byText('section[aria-label="Visitors"] button', 'Likes')); await wait(50);
  step('own visitors list: likes filter', vissleReqs[2].get === 'like' && vissleReqs[2].page === 1 && visitorRows().length === 1 && visitorRows()[0].includes('liker liked profile'), { req: vissleReqs[2], rows: visitorRows() });
  vissleReply = () => ({ error: 'This profile has tracking turned off.' });
  click(visitors().querySelector('button[aria-label="Refresh"]')); await wait(50);
  step('own visitors list: vissle error shown as sent', vissleReqs[3].page === 1 && vissleReqs[3].get === 'like' && visitors().textContent.includes('This profile has tracking turned off.'), visitors().textContent);
  step('profile read from Torch fields', $('#pf-age').value === '34' && $('#pf-gender').value === 'Male' && $('#pf-loc').value === 'Rouen');
  type($('#pf-loc'), 'Paris'); await wait(20);
  click($('.tc-savebar .tc-btn-primary')); await wait(80);
  const pp = posts.find(p => /updateprofile/.test(p.url));
  step('profile posted through Torch', !!pp && pp.f.location === 'Paris' && pp.f.gender === 'M' && pp.f.full_profile === 'FULL PAGE' && pp.f.dir === 'checked' && pp.f.line === 'Hello there' && !('p' in pp.f), pp);
  step('no password field anywhere in requests', posts.every(p => !('p' in p.f) && !('pwd' in p.f) && !('password' in p.f)));
  click(byText('.tc-nav', 'Password and email')); await wait(50);
  step('account page has no password form', !$('input[type=password]') && !!byText('.tc-banner', 'never handles your password'));
  click(byText('.tc-nav', 'Chatango Premium')); await wait(50);
  step('premium page has no purchase form', !!byText('.tc-banner', 'does not take payments'));
  click(byText('.tc-nav', 'Notifications')); await wait(50);
  step('notifications: no email or sound columns', !byText('th', 'Email') && !byText('th', 'Sound') && !!byText('.tc-banner', 'Torch plays alert sounds'));
  click(byText('.tc-nav', 'Back to chat')); await wait(50);

  /* Bio : line Chatango brute dans le champ, rendue dans l'aperçu */
  const ownCard = async () => {
    click(byText('.tc-nav', 'test')); await wait(50);
    click(byText('.members .mrow', 'marjorie (you)')); await wait(120);
    const r = $('.dialog .about.rich'), out = { text: r ? r.textContent : null, br: !!(r && r.querySelector('br')) };
    key(d, 'Escape'); await wait(30);
    return out;
  };
  const cardBefore = await ownCard();
  d.querySelector('[data-text-field="about"]').value = 'a<br/>b';
  click($('button[aria-label="Settings"]')); await wait(50);
  click(byText('.tc-nav', 'Profile')); await wait(50);
  const side = $('aside.side'), preview = side && side.querySelector('.about');
  const bioPage = { field: $('#pf-bio').value, br: !!(preview && preview.querySelector('br')), literal: !!side && side.textContent.includes('<br') };
  type($('#pf-loc'), 'Nantes'); await wait(20);
  click($('.tc-savebar .tc-btn-primary')); await wait(80);
  const bioPost = posts.filter(p => /updateprofile/.test(p.url)).pop().f.line;
  click(byText('.tc-nav', 'Back to chat')); await wait(50);
  const cardAfter = await ownCard();
  step('own bio raw in field', cardBefore.text === 'Hello there' && bioPage.field === 'a<br/>b' && bioPage.br && !bioPage.literal && bioPost === 'a<br/>b' && cardAfter.br && cardAfter.text === 'ab', { cardBefore, bioPage, bioPost, cardAfter });

  /* Création de groupe */
  click(byText('.tc-nav', 'Discover groups')); await wait(50);
  click(byText('button', 'Create a group')); await wait(50);
  type($('#cg-name'), 'newroom'); type($('#cg-title'), 'New room'); await wait(20);
  click(byText('.dialog-foot button', 'Create group')); await wait(100);
  const cp = posts.find(p => /creategrouploginjs/.test(p.url));
  step('group creation posted through Torch', !!cp && cp.f.u === 'newroom' && cp.f.n === 'New room' && cp.f.owner === 'marjorie' && cp.f.authType === 'cookie', cp);
  step('new group joined', calls.some(c => c[0] === 'connect' && c[1] === 'newroom'));

  /* Style perso : champs de Torch écrits avant l'envoi, jamais enregistrés chez Chatango */
  const fontsEl = d.querySelector('[data-preload="fonts"]'), emph = cls => fontsEl.querySelector(cls).previousElementSibling;
  let submits = 0;
  fontsEl.querySelector('form').addEventListener('submit', e => { submits++; e.preventDefault(); });
  const torchStyle = () => JSON.stringify({
    face: d.querySelector('.font-face').firstElementChild.value, size: d.querySelector('.font-size .text-input').value,
    text: fontsEl.querySelector('[data-color="fontColor"]').value, name: fontsEl.querySelector('[data-color="nameColor"]').value,
    bold: emph('.fa-bold').checked, italic: emph('.fa-italic').checked, underline: emph('.fa-underline').checked, on: fontsEl.querySelector('[name="stylesOn"]').checked, user: C.user.style
  });
  const WANT = JSON.stringify({ face: '4', size: '14', text: '#9900cc', name: '#3366ff', bold: true, italic: false, underline: false, on: true, user: true });
  // Torch recharge le style du compte à la reconnexion : ses champs reviennent aux valeurs de Chatango.
  const resetTorchStyle = () => {
    d.querySelector('.font-face').firstElementChild.value = '0'; d.querySelector('.font-size .text-input').value = '11';
    fontsEl.querySelector('[data-color="fontColor"]').value = '#000000'; fontsEl.querySelector('[data-color="nameColor"]').value = '#000000';
    emph('.fa-bold').checked = false; fontsEl.querySelector('[name="stylesOn"]').checked = false; C.user.style = false;
  };
  const postsBeforeStyle = posts.length;
  styleProbe = torchStyle;
  click(byText('.tc-nav', 'test')); await wait(50);
  const styleBtn = $('.tc-composer button[aria-label="Message style"]');
  if (styleBtn) {
    click(styleBtn); await wait(50);
    type($('#ms-face'), '4'); type($('#ms-size'), '14'); type($('#ms-text'), '#9900cc'); type($('#ms-name'), '#3366ff');
    click(byText('.dialog .tc-checkline', 'Bold').querySelector('input')); await wait(20);
    click(byText('.dialog-foot button', 'Save')); await wait(50);
    resetTorchStyle();
    type($('.tc-composer textarea'), 'Styled'); key($('.tc-composer textarea'), 'Enter'); await wait(30);
  }
  const storedStyle = JSON.stringify(JSON.parse(w.localStorage.getItem('torch-skin:marjorie') || '{}'));
  resetTorchStyle();
  click(byText('.tc-nav', 'Private messages')); await wait(50);
  click(byText('.conv', 'fay')); await wait(50);
  type($('.thread .tc-composer textarea'), 'Styled pm'); key($('.thread .tc-composer textarea'), 'Enter'); await wait(30);
  styleProbe = null;
  const atGroup = styleAtBuild.filter(x => x.group === 'test').map(x => x.style), atPm = styleAtBuild.filter(x => x.group === 'private_message').map(x => x.style);
  step('own style applied locally', !!styleBtn && atGroup.length === 1 && atGroup[0] === WANT && storedStyle.includes('#9900cc') && storedStyle.includes('#3366ff') && atPm.length === 1 && atPm[0] === WANT && posts.length === postsBeforeStyle && submits === 0,
    { button: !!styleBtn, atGroup, storedStyle, atPm, posts: posts.slice(postsBeforeStyle), submits });

  /* Style d'un MP : l'historique privé rejoué à OK n'écrase pas le style d'un message plus récent reçu en direct */
  const threadFont = txt => { const p = $$('.thread .tc-msg-text').find(x => x.textContent === txt); return p ? p.style.fontFamily : null; };
  pmRecords.push({ target: 'kim', data: 'msg:kim:marjorie:unknown:1700000700.5:0:<n000/><m v="1"><g x12s000="1">Older kim</g></m>', unread: 0 });
  pm('msg', ['kim', 'marjorie', 'unknown', '1700000800.5', '0', '<n000/><m v="1"><g x12s000="4">Newer kim</g></m>']); await wait(50);
  pm('OK', []); await wait(150);
  click(byText('.conv', 'kim')); await wait(50);
  step('pm history does not override live style', /Impact/.test(threadFont('Newer kim') || ''), threadFont('Newer kim'));

  /* Médias d'un MP envoyé : affichés dès l'envoi, sans doublon quand OK rejoue l'archive de Torch */
  type($('.thread .tc-composer textarea'), 'Watch https://youtu.be/PLe_UgXBBCU'); key($('.thread .tc-composer textarea'), 'Enter'); await wait(50);
  const sentVideo = $$('.thread .embed-video').length;
  pmRecords.push({ target: 'kim', data: 'msg:marjorie:marjorie:unknown:' + (Date.now() / 1000 + 20).toFixed(1) + ':0:<n3366FF/><m v="1"><g x12s9900cc="4">Watch <i s="vid://yt:PLe_UgXBBCU" w="126" h="93"/></g></m>', unread: 0 });
  pm('OK', []); await wait(150);
  const watch = { sentVideo, videos: $$('.thread .embed-video').length, texts: $$('.thread .tc-msg-text').filter(x => x.textContent.indexOf('Watch') === 0).length };
  step('own pm media shows at once and is not duplicated by history', watch.sentVideo === 1 && watch.videos === 1 && watch.texts === 1, watch);

  /* MP reçus hors ligne : base ouverte avant la connexion privée, msgoff juste après OK, deux « ok » identiques à 10 s d'écart dans l'historique */
  pmRecords.push(
    { target: 'gus', data: 'msg:gus:marjorie:unknown:1700000400.5:0:<n000/>ok', unread: 1 },
    { target: 'gus', data: 'msg:gus:marjorie:unknown:1700000410.5:0:<n000/>ok', unread: 1 });
  C.database.pm = false;
  C.private.socket.readyState = 3; await wait(2300);
  w.dispatchEvent(new w.Event('online')); await wait(50);
  pm('OK', []);
  pm('msgoff', ['gus', 'marjorie', 'unknown', '1700000420.5', '0', '<n000/>Missed you']); await wait(150);
  const pmConnect = calls.filter(c => c[0] === 'connect' && c[1] === 'private_message').pop();
  const archived = calls.filter(c => c[0] === 'archive');
  click(byText('.tc-nav', 'Private messages')); await wait(50);
  click(byText('.conv', 'gus')); await wait(50);
  const oks = $$('.thread .tc-msg-text').filter(x => x.textContent === 'ok').length;
  step('offline messages archived', !!pmConnect && pmConnect[2] === true && archived.length === 1 && archived[0][1] === true && oks === 2, { pmConnect, archived, oks });
  C.private.socket.readyState = 1; await wait(2300);

  /* Session coupée : connecté ailleurs, hors ligne, connexion perdue, session expirée */
  const overlay = () => { const el = $('#layer [role="alertdialog"]'); return el ? { text: el.textContent, buttons: [...el.querySelectorAll('button')].map(b => b.textContent) } : null; };
  const connects = gid => calls.filter(c => c[0] === 'connect' && c[1] === gid).length;
  C.private.socket.readyState = 3;
  pm('kickingoff', []); await wait(2300);
  const kicked = overlay();
  const pmConnects = connects('private_message');
  if (kicked) { click(byText('[role="alertdialog"] button', 'Reconnect here')); await wait(30); }
  const hereAsked = connects('private_message') === pmConnects + 1;
  C.private.socket.readyState = 1; await wait(2300);
  const afterHere = overlay();
  w.dispatchEvent(new w.Event('offline')); await wait(50);
  const offline = overlay();
  C.groups.test.socket.readyState = 3; await wait(2300);
  const testConnects2 = connects('test');
  w.dispatchEvent(new w.Event('online')); await wait(50);
  const onlineReconnects = connects('test') - testConnects2;
  Object.keys(C.groups).forEach(k => { C.groups[k].socket.readyState = 3; }); C.private.socket.readyState = 3; await wait(2300);
  const lost = overlay();
  pm('DENIED', []); await wait(50);
  const denied = overlay();
  step('session overlay',
    !!kicked && kicked.text.includes("You're signed in somewhere else") && kicked.buttons.includes('Reload') && kicked.buttons.includes('Reconnect here') && hereAsked && !afterHere
      && !!offline && offline.text.includes("You're offline") && onlineReconnects === 1
      && !!lost && lost.text.includes('Connection lost')
      && !!denied && denied.text.includes('Your session expired') && !calls.some(c => c[0] === 'alert'),
    { kicked, hereAsked, afterHere, offline, onlineReconnects, lost, denied, alerts: calls.filter(c => c[0] === 'alert').length });

  console.log(log.join('\n'));
  console.log('ERRORS: ' + (errors.length ? '\n' + errors.join('\n') : 'none'));
  process.exit(log.some(l => l.indexOf('FAIL') === 0) || errors.length ? 1 : 0);
})().catch(e => { console.log(log.join('\n')); console.error('CRASH', e); process.exit(2); });
