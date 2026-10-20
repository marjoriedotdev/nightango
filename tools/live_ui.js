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
  <div id="app"></div></body></html>`, { runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole: vc, url: 'https://st.chatango.com/' });
const w = dom.window, d = w.document;
w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
w.HTMLElement.prototype.scrollIntoView = function () {};

/* ---------- Faux client Torch ---------- */
const sent = [], posts = [], calls = [];
let shown = 0;
w.__TORCH_LIVE__ = true;
w.__TORCH_SKIN_VERSION__ = '0.2.0-test';
w.__TORCH_SHOW__ = () => { shown++; };
w.__TORCH_MOUNT__ = d.getElementById('app');
function noop() {}
const groupHandlers = ['b', 'i', 'u', 'ok', 'mods', 'inited', 'groupflagsupdate', 'getannc', 'annc', 'bw', 'blocklist', 'blocked', 'unblocked', 'allunblocked', 'modactions', 'nomore', 'delete', 'deleteall', 'clearall', 'g_participants', 'participant', 'n', 'denied', 'updgroupinfo', 'msglexceeded'];
const privHandlers = ['OK', 'presence', 'msg', 'msgoff', 'wl', 'wladd', 'wldelete', 'wlonline', 'wloffline', 'idleupdate', 'block_list', 'unblocked', 'show_fw'];
const pmRecords = [
  { target: 'dave', data: 'msg:dave:marjorie:unknown:1700000000.5:0:<n000/>Hello &amp; welcome', unread: 0 },
  { target: 'dave', data: 'msg:marjorie:marjorie:unknown:1700000100.5:0:<n000/>Thanks', unread: 0 },
  { target: 'fay', data: 'msg:fay:marjorie:unknown:1700000050.5:0:<n3366FF/><m v="1"><g x12s9900cc="4">Old styled</g></m>', unread: 0 }
];
function fakeGroup() { return { socket: { readyState: 1 }, user: { badge: 0, channel: { select: 0 } }, room: { information: { title: 'Test group', description: 'A test room' } }, load: 5 }; }
const C = {
  event: { group: Object.fromEntries(groupHandlers.map(n => [n, noop])), private: Object.fromEntries(privHandlers.map(n => [n, noop])) },
  user: { name: '', avatar: { x0: 50, y0: 50, ts: 50 } }, groups: {}, focus: 'test',
  on(ev, cb) { d.addEventListener('chatango_' + ev, cb); },
  emit(ev, data) { d.dispatchEvent(new w.CustomEvent('chatango_' + ev, { detail: data })); },
  socket(gid, frame) { sent.push([gid, frame]); },
  sendMessage(data, length, group, user) {
    if (length) return group === 'private_message' ? '<n3366FF/><m v="1"><g x12s9900cc="4">' + data + '</g></m>' : '<n000/><f x11000="0">' + data;
    calls.push(['pm', group, user, data]);
  },
  connect(gid) { calls.push(['connect', gid]); if (gid !== 'private_message' && !C.groups[gid]) C.groups[gid] = fakeGroup(); return Promise.resolve({}); },
  setFocus(o) { calls.push(['focus', o.group]); }, disconnectFrom(gid) { calls.push(['disconnect', gid]); delete C.groups[gid]; },
  systemMessage() {}, setNotice() {}, setProfile(dt) { calls.push(['setProfile', dt]); },
  post(url, form) { const f = {}; form.forEach((v, k) => { f[k] = v; }); posts.push({ url, f }); return Promise.resolve(/creategroup/.test(url) ? 'groupcreated' : 'age=40&sex=M&loc=Paris&eline=Hi&dir=checked'); },
  private: { focus: false, socket: { readyState: 1 }, clearHistory(t) { calls.push(['clearHistory', t]); } },
  database: { pm: { transaction() { return { objectStore() { return { openCursor() {
    const req = {}; let i = 0;
    const next = () => setTimeout(() => req.onsuccess({ target: { result: i < pmRecords.length ? { value: pmRecords[i], continue() { i++; next(); } } : null } }), 0);
    next(); return req;
  } }; } }; } } }
};
const CH = {
  getAnon() { return '!anon1234'; }, path(p, sub) { return 'https://' + (sub ? sub + '.' : '') + 'chatango.com/' + p; },
  subdomain: { mod1: n => 'https://ust.chatango.com/' + n + '/mod1.xml', mod2: n => 'https://ust.chatango.com/' + n + '/mod2.xml' }, error: { creategroup: { groupexists: 'The group name is taken.' } }
};
const SB = { renderGroup(dt) { calls.push(['renderGroup', dt.group]); } };
w.__torchRefs = { client: C, chatango: CH, sidebar: SB, torch: { environment: 'torchenv' } };
const fetches = [];
let searchHold = null;
const ABOUT = encodeURIComponent('<b>Bold</b> hi<script>alert(1)</script><img src="x" onerror="alert(2)"><a href="javascript:alert(3)">bad</a> <a href="https://example.com/p">good</a> <font color="#ff0000" size="5">red</font>');
const FULL = encodeURIComponent('<h1>Zoe page</h1><script>parent.alert(4)</script><img src="https://img.example/a.png">');
w.fetch = (url, opts) => {
  const f = {}; if (opts && opts.body && opts.body.forEach) opts.body.forEach((v, k) => { f[k] = v; });
  fetches.push({ url, f, credentials: opts && opts.credentials });
  let body = '';
  if (/\/search$/.test(url)) body = 'h=zoe;1;2:yann;3:marjorie;9';
  else if (/zoe\/mod1\.xml/.test(url)) body = '<?xml version="1.0"?><mod><body>' + ABOUT + '</body><s>F</s><b>1995-04-02</b><l c="FR">Lyon</l></mod>';
  else if (/zoe\/mod2\.xml/.test(url)) body = '<?xml version="1.0"?><mod><body>' + FULL + '</body></mod>';
  else if (/marjorie\/mod1\.xml/.test(url)) {
    // Chatango sert la bio du dernier enregistrement.
    const saved = posts.filter(p => /updateprofile/.test(p.url)).pop();
    body = '<?xml version="1.0"?><mod><body>' + encodeURIComponent(saved ? saved.f.line : 'Old bio') + '</body><s>M</s><b>1990-01-01</b><l>Rouen</l></mod>';
  }
  const res = { ok: true, text: () => Promise.resolve(body) };
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
w.eval(fs.readFileSync(S + '/torch-prototype/app.js', 'utf8'));

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
  g('inited', 'test', []);
  g('g_participants', 'test', ['S1:1700:U1:Alice:None;S2:1700:U2:Bob:None;S3:1700:U3:None:None']);
  await wait(150);
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

  /* Envoi : échappement, réponse, canal */
  const ta = $('.tc-composer textarea');
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
  step('Torch notice shown in group', $$('.ev').some(x => x.textContent.includes('exceeded the character limit')));
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

  /* Favori conservé */
  click($('button[aria-label="Group options"]')); await wait(30);
  click(menuItem('Add to favorites')); await wait(50);
  const stored = JSON.parse(w.localStorage.getItem('torch-skin:marjorie') || '{}');
  step('favorite persisted per account', (stored.fav || []).indexOf('test') >= 0, stored);

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
  pm('OK', []); await wait(150);
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
  step('own pm carries own style', styleOk(mine) && calls.some(c => c[0] === 'pm' && c[2] === 'fay' && c[3] === 'Mine'), mine.p && [mine.p.style.cssText, mine.name && mine.name.style.cssText]);

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
    const b = r && r.querySelector('button[aria-label="Close conversation"]');
    if (b) { click(b); await wait(50); }
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
  step('friends rows show ASL and last message', /(30|31) · Female · Lyon/.test(zoeText) && zoeText.includes('See you at 8') && !zoeText.includes('Bold'), zoeText);
  click(byText('.tc-nav', 'Meet people')); await wait(120);
  const search = fetches.find(x => /\/search$/.test(x.url));
  step('meet search uses Torch parameters and the browser session', !!search && search.credentials === 'include' && search.f.s === 'B' && String(search.f.o) === '1' && String(search.f.ami) === '13' && String(search.f.ama) === '99' && String(search.f.f) === '0' && String(search.f.t) === '40', search);
  step('presence requested for results', frame('getpresence:').pop() === 'getpresence:zoe;yann;marjorie');
  pm('presence', ['zoe', '0', 'online', 'yann', '5', 'online']); await wait(60);
  const meetRows = $$('.convs .conv').map(x => x.textContent);
  step('meet results with status, without me', meetRows.length === 2 && meetRows[0].includes('zoe') && meetRows[0].includes('Online') && meetRows[1].includes('Idle'), meetRows);

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
  step('mini profile loaded (age, gender, location)', !!card && /(30|31) · Female · Lyon/.test(card.textContent));
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

  /* Bio : sauts de ligne au format Chatango */
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
  step('own bio renders line breaks', cardBefore.text === 'Hello there' && bioPage.field === 'a\nb' && bioPage.br && !bioPage.literal && bioPost === 'a<br/>b' && cardAfter.br && cardAfter.text === 'ab', { cardBefore, bioPage, bioPost, cardAfter });

  /* Création de groupe */
  click(byText('.tc-nav', 'Discover groups')); await wait(50);
  click(byText('button', 'Create a group')); await wait(50);
  type($('#cg-name'), 'newroom'); type($('#cg-title'), 'New room'); await wait(20);
  click(byText('.dialog-foot button', 'Create group')); await wait(100);
  const cp = posts.find(p => /creategrouploginjs/.test(p.url));
  step('group creation posted through Torch', !!cp && cp.f.u === 'newroom' && cp.f.n === 'New room' && cp.f.owner === 'marjorie' && cp.f.authType === 'cookie', cp);
  step('new group joined', calls.some(c => c[0] === 'connect' && c[1] === 'newroom'));

  console.log(log.join('\n'));
  console.log('ERRORS: ' + (errors.length ? '\n' + errors.join('\n') : 'none'));
  process.exit(log.some(l => l.indexOf('FAIL') === 0) || errors.length ? 1 : 0);
})().catch(e => { console.log(log.join('\n')); console.error('CRASH', e); process.exit(2); });
