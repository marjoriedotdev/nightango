// End-to-end test of live mode: fake BetterChatango client, interface driven like a user would.
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
// jsdom has no IntersectionObserver: the test triggers the intersection itself.
const observers = [];
w.IntersectionObserver = function (cb, opts) {
  const o = { cb, opts, targets: [], observe(t) { o.targets.push(t); }, unobserve(t) { o.targets = o.targets.filter(x => x !== t); }, disconnect() { o.targets = []; } };
  observers.push(o);
  return o;
};

// jsdom has neither CSS.supports nor ResizeObserver: the message log takes the path without native anchoring or measuring.
w.CSS = { supports: () => false };
w.ResizeObserver = function () { return { observe() {}, disconnect() {} }; };

/* ---------- Fake BetterChatango client ---------- */
const sent = [], posts = [], calls = [];
// vissle response to a file upload (chatango/upload).
let uploadReply = () => Promise.resolve('data:abc/f.png');
let shown = 0;
w.__TORCH_LIVE__ = true;
w.__TORCH_SHOW__ = () => { shown++; };
w.__TORCH_MOUNT__ = d.getElementById('app');
function noop() {}
const groupHandlers = ['b', 'i', 'u', 'ok', 'mods', 'inited', 'groupflagsupdate', 'getannc', 'annc', 'bw', 'blocklist', 'unblocklist', 'blocked', 'unblocked', 'allunblocked', 'bansearchresult', 'badbansearchstring', 'modactions', 'nomore', 'delete', 'deleteall', 'clearall', 'g_participants', 'participant', 'n', 'denied', 'updgroupinfo', 'msglexceeded'];
const privHandlers = ['OK', 'presence', 'msg', 'msgoff', 'wl', 'wladd', 'wldelete', 'wlonline', 'wloffline', 'idleupdate', 'block_list', 'unblocked', 'show_fw', 'kickingoff'];
// Record of the BetterChatango history database (saveMessage): key ts, the frame timestamp.
const pmRecord = (target, data, unread) => ({ target, ts: parseFloat(data.split(':')[4]), data, unread });
const pmRecords = [
  // Archived unread before the update: the migration marks it read.
  pmRecord('dave', 'msg:dave:marjorie:unknown:1700000000.5:0:<n000/>Hello &amp; welcome', 1),
  pmRecord('dave', 'msg:marjorie:marjorie:unknown:1700000100.5:0:<n000/>Thanks', 0),
  pmRecord('fay', 'msg:fay:marjorie:unknown:1700000050.5:0:<n3366FF/><m v="1"><g x12s9900cc="4">Old styled</g></m>', 0)
];
// Like BetterChatango: a received PM is archived unread, since the bridge never gives BetterChatango the PM focus.
// Key already taken: BetterChatango retries one second later (ConstraintError), frame timestamp included.
function saveMessage(data) {
  while (pmRecords.some(r => r.ts === parseFloat(data[3]))) data[3] = String(parseFloat(data[3]) + 1);
  pmRecords.push(pmRecord(data[0], 'msg:' + data.join(':'), 1));
}
const { keyCmp, keyRange, fakePmDb } = require('./fake-pm-db.js');
w.IDBKeyRange = keyRange;
const migrationFlag = () => !!JSON.parse(w.localStorage.getItem('torch-skin:marjorie') || '{}').pmReadMigrated;
const pmTransaction = fakePmDb(pmRecords, () => calls.push(['written', migrationFlag()]));
// BetterChatango favorite_media database: media object store keyed by url, url and name indexes, writes applied at the end of the transaction.
const mediaRecords = [{ url: 'https://x.test/old.png', name: 'old' }];
function mediaTransaction() {
  const tx = {}, writes = [];
  // Like IndexedDB, a transaction without any request also completes.
  setTimeout(() => { if (!writes.length && tx.oncomplete) tx.oncomplete(); }, 0);
  const answer = value => { const req = {}; setTimeout(() => { req.result = value(); req.onsuccess({ target: req }); }, 0); return req; };
  const write = op => {
    if (!writes.length) setTimeout(() => { writes.forEach(f => f()); if (tx.oncomplete) tx.oncomplete(); }, 0);
    writes.push(op); return {};
  };
  const cursor = list => {
    const req = {}; let i = 0;
    const read = () => { const rec = list[i]; req.onsuccess({ target: { result: rec ? { value: Object.assign({}, rec), continue() { i++; setTimeout(read, 0); } } : null } }); };
    setTimeout(read, 0); return req;
  };
  const store = {
    transaction: tx,
    index: name => ({ openCursor: range => cursor(mediaRecords.filter(r => typeof r[name] === 'string' && (!range || keyCmp(r[name], range.lower) >= 0)).sort((a, b) => keyCmp([a[name], a.url], [b[name], b.url]))) }),
    get: url => answer(() => mediaRecords.find(r => r.url === url)),
    getAll: () => answer(() => mediaRecords.slice().sort((a, b) => keyCmp(a.url, b.url))),
    put: rec => write(() => { const i = mediaRecords.findIndex(r => r.url === rec.url); mediaRecords.splice(i >= 0 ? i : mediaRecords.length, i >= 0 ? 1 : 0, Object.assign({}, rec)); }),
    delete: url => write(() => { const i = mediaRecords.findIndex(r => r.url === url); if (i >= 0) mediaRecords.splice(i, 1); })
  };
  tx.objectStore = () => store;
  return tx;
}
// Snapshot of the BetterChatango style when it builds a message body (sendMessage with length).
let styleProbe = null;
// Like BetterChatango, each PM build draws a new <i…/> key: a second build would not give the key that was sent.
let pmBuilds = 0;
const styleAtBuild = [];
function fakeGroup() { return { socket: { readyState: 1 }, user: { badge: 0, channel: { select: 0 } }, room: { information: { title: 'Test group', description: 'A test room' } }, load: 5 }; }
const C = {
  // DENIED: BetterChatango shows a blocking alert().
  // msg and msgoff: BetterChatango archives the message in its history database (saveMessage), only once.
  // connect: BetterChatango opens its own PM screen.
  event: { group: Object.fromEntries(groupHandlers.map(n => [n, noop])), private: Object.assign(Object.fromEntries(privHandlers.map(n => [n, noop])), { DENIED() { calls.push(['alert']); }, msg(c, s, room, data) { saveMessage(data); }, msgoff(c, s, room, data) { calls.push(['archive', !!C.database.pm]); saveMessage(data); }, connect() { calls.push(['betterChatangoPmScreen']); } }) },
  user: { name: '', avatar: { x0: 50, y0: 50, ts: 50 }, style: false }, groups: {}, focus: 'test',
  settings: { privacy: { groups: { connect_own: false, connect_recent: false, connect_favorite: true, favorite: [] } }, notifications: { muted: { groups: [] }, sound: { play_mention: true, volume_mention: 30, play_online: false, volume_online: '45' } }, safety: { users: { ignore: [] }, whitelist: { enable: true, domain: ['i.imgur.com'] } } },
  on(ev, cb) { d.addEventListener('chatango_' + ev, cb); },
  emit(ev, data) { d.dispatchEvent(new w.CustomEvent('chatango_' + ev, { detail: data })); },
  socket(gid, frame) { sent.push([gid, frame]); },
  sendMessage(data, length, group, user) {
    if (length && styleProbe) styleAtBuild.push({ group, style: styleProbe() });
    // Like BetterChatango, a PM body replaces a YouTube link with its <i> tag.
    if (length) return group === 'private_message' ? '<n3366FF/><ipm' + String(++pmBuilds).padStart(5, '0') + '/><m v="1"><g x12s9900cc="4">' + data.replace(/https:\/\/youtu\.be\/([\w-]{11})\S*/, '<i s="vid://yt:$1" w="126" h="93"/>') + '</g></m>' : '<n000/><f x11000="0">' + data;
    calls.push(['pm', group, user, data]);
  },
  // Like BetterChatango's socketEvent: a group still in cache.connect is ignored, its promise never settles.
  cache: { connect: [] },
  connect(gid) {
    if (C.cache.connect.includes(gid)) return new Promise(noop);
    C.cache.connect.push(gid);
    calls.push(['connect', gid, !!C.database.pm]); if (gid !== 'private_message' && !C.groups[gid]) C.groups[gid] = fakeGroup(); return Promise.resolve({});
  },
  setFocus(o) { calls.push(['focus', o.group]); }, disconnectFrom(gid) { calls.push(['disconnect', gid]); delete C.groups[gid]; },
  systemMessage() {}, setNotice() {}, setProfile(dt) { calls.push(['setProfile', dt]); },
  // Like BetterChatango, which fetches the oEmbed of a received YouTube link on its own (inject.js:7157).
  renderYouTube(link) { w.fetch('https://www.youtube.com/oembed?url=' + link + '&format=json'); },
  post(url, form, item) {
    const f = {}; form.forEach((v, k) => { f[k] = v; }); posts.push({ url, f, item });
    if (/chatango\/upload$/.test(url)) return uploadReply();
    // BetterChatango avatar and cropping forms: pix for the picture, full profile with the square for the cropping.
    if (f.action === 'fullpic') return Promise.resolve('pix:1');
    if (f.action === 'thumb') return Promise.resolve('x0=' + f.x0 + '&y0=' + f.y0 + '&ts=' + f.ts + '&age=40&sex=M&loc=Paris&eline=Hi&dir=checked');
    return Promise.resolve(/creategroup/.test(url) ? 'groupcreated' : 'age=40&sex=M&loc=Paris&eline=Hi&dir=checked');
  },
  private: { focus: false, socket: { readyState: 0 }, premium: {}, clearHistory(t) { calls.push(['clearHistory', t]); } },
  database: { pm: { transaction: pmTransaction } }
};
const CH = {
  // Like BetterChatango, which fetches the msgbg.xml of a Premium message author on its own (inject.js:504).
  getBackground(o) { w.fetch(CH.subdomain.msgbg(o.username, 'xml')); },
  getAnon() { return '!anon1234'; }, path(p, sub) { return 'https://' + (sub ? sub + '.' : '') + 'chatango.com/' + p; },
  subdomain: { mod1: n => 'https://ust.chatango.com/' + n + '/mod1.xml', mod2: n => 'https://ust.chatango.com/' + n + '/mod2.xml', custom_profile: n => 'https://ust.chatango.com/' + n + '/custom_profile.css', msgbg: (n, ext) => 'https://ust.chatango.com/' + n + '/msgbg.' + ext }, error: { creategroup: { groupexists: 'The group name is taken.' } }
};
const SB = { renderGroup(dt) { calls.push(['renderGroup', dt.group]); } };
w.__betterChatangoRefs = { client: C, chatango: CH, sidebar: SB, torch: { environment: 'betterchatangoenv' } };
const fetches = [];
let searchHold = null;
const SEARCH_BODY = 'h=zoe;1;2:yann;3:marjorie;9';
let searchBody = SEARCH_BODY;
// Full profile of the account: a non-XML 200 means a missing file, 500 a transient server error.
let ownMod2Status = 200;
const ABOUT = encodeURIComponent('<b>Bold</b> hi<script>alert(1)</script><img src="x" onerror="alert(2)"><a href="javascript:alert(3)">bad</a> <a href="https://example.com/p">good</a> <font color="#ff0000" size="5">red</font>');
// Chatango age, like BetterChatango: current year minus birth year.
const ZOE_BIRTH = '1995-04-02', ZOE_ASL = (new Date().getFullYear() - +ZOE_BIRTH.slice(0, 4)) + ' · F · Lyon';
const FULL = encodeURIComponent('<h1>Zoe page</h1><script>parent.alert(4)</script><img src="https://img.example/a.png">');
// Premium background in the real custom_profile.css format (goddess account). Without a file, Chatango returns a JPEG image.
const PREMIUM_END = Math.floor(Date.now() / 1000) + 30 * 86400;
const GODDESS_CSS = 'body { background-color: #9e9ffc; background-image: url(https://cdn.donmai.us/a.png); background-repeat: no-repeat; color: #666564; }\n.profile_text { color: #666564; }\na, a:visited, a:active { color: #5c8a8a; text-decoration: none; }\na:hover { color: #5c8a8a; text-decoration: underline; }\n';
// Message background in the msgbg.xml format: attributes of the first element, fields of the BetterChatango background form. A response that is not text/xml means no background.
const MSGBG = {
  rosa: '<?xml version="1.0" ?><bgi bgc="FFCC99" bgalp="100" useimg="1" ialp="40" align="br" tile="0" hasrec="0" isvid="0"/>',
  trap: '<?xml version="1.0" ?><bgi bgc="red;background:url(https://evil.test/a.png)" bgalp="100" useimg="1" ialp="250" align="constructor" tile="1" url="https://evil.test/b.jpg" onload="alert(1)"/>',
  pale: '<?xml version="1.0" ?><bgi bgc="336699" bgalp="0" useimg="1" ialp="-20" align="tl" tile="0" hasrec="0" isvid="0"/>'
};
const RELEASES_LATEST = 'https://api.github.com/repos/marjoriedotdev/nightango/releases/latest';
// vissle linked accounts: response body, null for a network failure, whoHold holds back the response.
let whoBody = '{}', whoHold = null;
w.fetch = (url, opts) => {
  const f = {}; if (opts && opts.body && opts.body.forEach) opts.body.forEach((v, k) => { f[k] = v; });
  fetches.push({ url, f, credentials: opts && opts.credentials });
  let body = '', type = null, status = 200;
  if (/\/search$/.test(url)) body = searchBody;
  else if (/zoe\/mod1\.xml/.test(url)) body = '<?xml version="1.0"?><mod><body>' + ABOUT + '</body><s>F</s><b>' + ZOE_BIRTH + '</b><l c="FR">Lyon</l></mod>';
  else if (/zoe\/mod2\.xml/.test(url)) body = '<?xml version="1.0"?><mod><body>' + FULL + '</body></mod>';
  else if (/marjorie\/mod1\.xml/.test(url)) {
    // Chatango serves the bio from the last save. Premium without custom_profile.css: the response is not CSS.
    const saved = posts.filter(p => /updateprofile/.test(p.url) && 'line' in p.f).pop();
    body = '<?xml version="1.0"?><mod><body>' + encodeURIComponent(saved ? saved.f.line : 'Old bio') + '</body><s>M</s><b>1990-01-01</b><l>Rouen</l><d>' + PREMIUM_END + '</d></mod>';
  }
  else if (/marjorie\/mod2\.xml/.test(url)) status = ownMod2Status;
  else if (/\/(goddess|expired|sith|lost)\/mod1\.xml/.test(url)) {
    const end = /expired/.test(url) ? PREMIUM_END - 60 * 86400 : PREMIUM_END;
    body = '<?xml version="1.0"?><mod><body>' + encodeURIComponent('Hi <a href="https://example.com/g">my page</a>') + '</body><s>F</s><b>1990-01-01</b><l>Paris</l><d>' + end + '</d></mod>';
  }
  else if (/goddess\/custom_profile\.css/.test(url)) { body = GODDESS_CSS; type = 'text/css'; }
  else if (/sith\/custom_profile\.css/.test(url)) { body = 'body { background-color: #123456; }'; type = 'image/jpeg'; }
  else if (/lost\/custom_profile\.css/.test(url)) { body = 'body { background-color: #123456; }'; type = 'text/css'; status = 404; }
  else if (/\/msgbg\.xml$/.test(url)) { const n = url.split('/').slice(-2)[0]; body = MSGBG[n] || 'JFIF'; type = MSGBG[n] ? 'text/xml' : 'image/jpeg'; }
  else if (url === RELEASES_LATEST) { body = '{"tag_name":"v99.0.0"}'; type = 'application/json'; }
  else if (/^https:\/\/api\.vissle\.me\/v1\/pmr\//.test(url)) { body = '{"pmr":true}'; type = 'application/json'; }
  else if (/^https:\/\/vissle\.me\/api\/v1\/who\//.test(url)) { if (whoBody === null) return Promise.reject(new w.TypeError('Failed to fetch')); body = whoBody; type = 'application/json'; }
  const res = { ok: status === 200, status, headers: { get: k => k.toLowerCase() === 'content-type' ? type : null }, text: () => Promise.resolve(body), json: () => Promise.resolve(body).then(JSON.parse) };
  if (whoHold && /\/who\//.test(url)) return whoHold.then(() => res);
  return searchHold && /\/search$/.test(url) ? searchHold.then(() => res) : Promise.resolve(res);
};

// vissle bridge of the simulated userscript: the response comes back by event, as from the sandbox.
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

/* ---------- Helpers ---------- */
const wait = ms => new Promise(r => setTimeout(r, ms));
// At the limit, returns without an error: the next step judges and gives its detail.
const until = async (cond, ms = 5000) => { for (const end = Date.now() + ms; !cond() && Date.now() < end;) await wait(10); };
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
  /* Sign-in and group */
  C.user.name = 'marjorie'; C.user.full = 'Marjorie';
  C.groups.test = fakeGroup();
  C.emit('clientLogin', C);
  await wait(100);
  step('overlay shown after login', shown === 1);
  const fetchesAtLogin = fetches.length;
  C.renderYouTube('https://youtu.be/dQw4w9WgXcQ', 'dQw4w9WgXcQ', d.createElement('div'));
  CH.getBackground({ username: 'alice', node: d.createElement('div') });
  await until(() => !!byText('.toast', 'Nightango 99.0.0 is available.'));
  const releaseAsks = fetches.filter(x => x.url === RELEASES_LATEST);
  step('newer release announced once at sign-in, without credentials', !!byText('.toast', 'Nightango 99.0.0 is available.') && releaseAsks.length === 1 && !releaseAsks[0].credentials, releaseAsks);
  step("BetterChatango's own oEmbed and message background requests muted", fetches.length === fetchesAtLogin, fetches.slice(fetchesAtLogin).map(x => x.url));
  SB.renderGroup({ group: 'test', header: 'Test' });
  g('ok', 'test', ['marjorie', '', '', '', '1700000000', '', 'alice,' + MOD + ';bob,' + (MOD | 2 | 16), String(64)]);
  await until(() => !!$('.log .tc-skeleton'));
  const groupSkeleton = { beforeInit: !!$('.log .tc-skeleton') };
  g('inited', 'test', []);
  g('g_participants', 'test', ['S1:1700:U1:Alice:None;S2:1700:U2:Bob:None;S3:1700:U3:None:None']);
  await until(() => !$('.log .tc-skeleton'));
  groupSkeleton.afterInit = !!$('.log .tc-skeleton');
  step('group opens', !!byText('h1', 'test'));
  step('announcement requested after init', frame('getannouncement').length >= 1);
  step('owner shown in staff', !!$$('.members .mrow').find(x => x.textContent.includes('marjorie') && x.textContent.includes('Owner')));
  step('admin derived from flags', !!$$('.members .mrow').find(x => x.textContent.includes('bob') && x.textContent.includes('Admin')));

  /* Guests: named by their name, anons counted, tracked by session timestamp */
  const guestView = () => ({
    label: ($$('.members .mlabel').find(x => x.textContent.indexOf('Guests') === 0) || {}).textContent || null,
    rows: $$('.members .mrow .grow').map(x => x.textContent).filter(t => t[0] === '#'),
    anon: ($$('.members .muted').find(x => /anonymous$/.test(x.textContent)) || {}).textContent || null
  });
  g('g_participants', 'test', ['S4:1701:U4:None:Dana;S5:1702:U5:None:None']); await wait(80);
  const guests1 = guestView();
  g('participant', 'test', ['2', 'S5', 'U5', 'None', 'Carl', '', '1702']); await wait(80);
  const guests2 = guestView();
  g('participant', 'test', ['0', 'S4', 'U4', 'None', 'Dana', '', '1701']); await wait(80);
  const guests3 = guestView();
  step('named guests listed by name, anonymous guests counted',
    guests1.label === 'Guests · 2' && JSON.stringify(guests1.rows) === '["#dana"]' && guests1.anon === '1 anonymous'
      && JSON.stringify(guests2.rows) === '["#carl","#dana"]' && !guests2.anon
      && JSON.stringify(guests3.rows) === '["#carl"]' && !guests3.anon,
    { guests1, guests2, guests3 });

  /* Sign-in, sign-out and account switch without leaving the group (participant, action 2), several sessions of one account */
  const sessionView = () => ({ members: $$('.members .mrow .grow').map(x => x.textContent).filter(t => t[0] !== '#'), anon: guestView().anon });
  const switches = [];
  g('g_participants', 'test', ['S6:1801:U6:None:None;S7:1802:U7:Dan:None;S8:1803:U8:Dan:None']); await wait(80);
  switches.push(sessionView());
  for (const data of [
    ['2', 'S6', 'U6', 'Eve', 'None', '', '1801'], ['2', 'S6', 'U6', 'None', 'None', '', '1801'], ['2', 'S6', 'U6', 'Finn', 'None', '', '1801'],
    ['2', 'S6', 'U6', 'Gus', 'None', '', '1801'], ['0', 'S7', 'U7', 'Dan', 'None', '', '1802'], ['0', 'S8', 'U8', 'Dan', 'None', '', '1803']
  ]) { g('participant', 'test', data); await wait(80); switches.push(sessionView()); }
  const has = (i, n) => switches[i].members.indexOf(n) >= 0;
  step('account sign in, sign out and switch keep the member list',
    has(0, 'dan') && !has(0, 'eve') && switches[0].anon === '1 anonymous'
      && has(1, 'eve') && !switches[1].anon
      && !has(2, 'eve') && switches[2].anon === '1 anonymous'
      && has(3, 'finn') && !has(4, 'finn') && has(4, 'gus')
      && has(5, 'dan') && !has(6, 'dan') && has(6, 'marjorie'),
    switches);
  g('g_participants', 'test', ['S1:1700:U1:Alice:None;S2:1700:U2:Bob:None;S3:1700:U3:None:None']); await wait(80);

  /* Messages, replies, edits */
  g('b', 'test', ['1700000200.1', 'Alice', '', 'u1', 'UNID1', 'tmp1', '1.2.3.4', '0', '', '<n000/><f x11000="0">Hi all']);
  g('u', 'test', ['tmp1', 'A-B_C=']);
  g('b', 'test', ['1700000210.1', 'Bob', '', 'u2', 'UNID2', 'tmp2', '5.6.7.8', '2048', '', '<n000/><f x11000="0"><rAhypheNBunderSC/>Welcome back']);
  g('u', 'test', ['tmp2', 'BOB1=']);
  await until(() => d.body.textContent.includes('Welcome back'));
  step('reply resolves original', !!$$('.tc-msg-reply').find(x => x.textContent.includes('alice') && x.textContent.includes('Hi all')));
  g('b', 'test', ['1700000220.1', 'Alice', '', 'u1', 'UNID1', 'tmp3', '1.2.3.4', '0', '', '<n000/><f x11000="0"><eAhypheNBunderSC/>Hi everyone']);
  await until(() => d.body.textContent.includes('Hi everyone'));
  step('edit replaces original text', d.body.textContent.includes('Hi everyone') && !d.body.textContent.includes('Hi all') && d.body.textContent.includes('(edited)'));

  /* Member style: the one from their latest message, whatever the arrival order (face 4 = Impact) */
  const logFont = txt => { const p = $$('.log .tc-msg-text').find(x => x.textContent === txt); return p ? p.style.fontFamily : null; };
  g('b', 'test', ['1700000280.1', 'Hana', '', 'u8', 'UNID8', 'tmp20', '2.2.2.2', '0', '', '<n000/><f x11000="4">Hana new']);
  g('i', 'test', ['1700000150.1', 'Hana', '', 'u8', 'UNID8', 'H1=', '2.2.2.2', '0', '', '<n000/><f x11000="1">Hana old']);
  await until(() => logFont('Hana new') !== null);
  step('group history keeps newest style', /Impact/.test(logFont('Hana new') || ''), logFont('Hana new'));
  g('i', 'test', ['1700000190.1', 'Ivy', '', 'u9', 'UNID9', 'H2=', '3.3.3.3', '0', '', '<n000/><f x11000="4">Ivy newer']);
  g('i', 'test', ['1700000180.1', 'Ivy', '', 'u9', 'UNID9', 'H3=', '3.3.3.3', '0', '', '<n000/><f x11000="1">Ivy older']);
  await until(() => logFont('Ivy newer') !== null);
  step('group history batch keeps its newest style', /Impact/.test(logFont('Ivy newer') || ''), logFont('Ivy newer'));

  /* Sending: escaping, reply, quote, channel */
  const ta = $('.tc-composer textarea');
  type(ta, 'a < b & c'); key(ta, 'Enter'); await wait(30);
  const plain = frame('bm:').pop() || '';
  step('message escaped for Chatango', /^bm:[a-z0-9]+:0:<n000\/><f x11000="0">a &lt; b &amp; c$/.test(plain), plain);
  const aliceMsg = $$('.tc-msg').find(x => x.textContent.includes('Hi everyone'));
  click(aliceMsg.querySelector('button[aria-label="Reply"]')); await wait(30);
  type($('.tc-composer textarea'), 'yes'); key($('.tc-composer textarea'), 'Enter'); await wait(30);
  const reply = frame('bm:').pop() || '';
  step('reply frame carries <r> after the style', /^bm:[a-z0-9]+:0:<n000\/><f x11000="0"><rAhypheNBunderSC\/>yes$/.test(reply), reply);
  click(aliceMsg.querySelector('button[aria-label="More actions"]')); await wait(30);
  click(menuItem('Quote message')); await wait(30);
  type($('.tc-composer textarea'), 'yes'); key($('.tc-composer textarea'), 'Enter'); await wait(30);
  const quote = frame('bm:').pop() || '';
  step('quote frame puts the BetterChatango quote before the text', /^bm:[a-z0-9]+:0:<n000\/><f x11000="0">@alice: `Hi everyone` yes$/.test(quote), quote);

  /* Moderation from a message */
  click(aliceMsg.querySelector('button[aria-label="More actions"]')); await wait(30);
  const floating = $('#layer .menu.floating');
  step('menus float in the layer with a fixed position', !!floating && floating.style.position === 'fixed' && !$('#app .menu'));
  click(menuItem('Delete message')); await wait(30);
  const delBeforeConfirm = frame('delmsg:').length;
  click(byText('.dialog-foot button', 'Delete')); await wait(30);
  step('delete frame', delBeforeConfirm === 0 && frame('delmsg:').pop() === 'delmsg:A-B_C=', { delBeforeConfirm, frames: frame('delmsg:') });
  click(aliceMsg.querySelector('button[aria-label="More actions"]')); await wait(30);
  click(menuItem('Ban from #test')); await wait(50);
  step('dialogs render in the overlay layer, outside the layout', !!$('#layer .overlay .dialog') && !$('#app .overlay'));
  click(byText('.tc-checkline', 'Also delete their recent messages').querySelector('input')); await wait(20);
  click(byText('.dialog-foot button', 'Ban')); await wait(30);
  step('ban frame', frame('block:').pop() === 'block:UNID1:1.2.3.4:alice', frame('block:'));
  step('delete-all frame with ban', frame('delallmsg:').pop() === 'delallmsg:UNID1:1.2.3.4:alice', frame('delallmsg:'));
  g('blocked', 'test', ['UNID1', '1.2.3.4', 'alice', 'marjorie']); await until(() => d.body.textContent.includes('alice was banned'));
  step('ban event shown', d.body.textContent.includes('alice was banned'));
  g('delete', 'test', ['BOB1=']); await until(() => d.body.textContent.includes('Message deleted by staff'));
  step('server delete marks message', d.body.textContent.includes('Message deleted by staff'));

  /* Regressions found in review */
  g('u', 'test', ['tmp9', 'REAL9=']);
  g('b', 'test', ['1700000230.1', 'Carol', '', 'u3', 'UNID3', 'tmp9', '3.3.3.3', '0', '', '<n000/><f x11000="0">Early id']);
  await until(() => d.body.textContent.includes('Early id'));
  const early = $$('.tc-msg').find(x => x.textContent.includes('Early id'));
  click(early.querySelector('button[aria-label="More actions"]')); await wait(30);
  click(menuItem('Delete message')); await wait(30);
  click(byText('.dialog-foot button', 'Delete')); await wait(30);
  step('u before b keeps the real id', frame('delmsg:').pop() === 'delmsg:REAL9=', frame('delmsg:'));
  g('b', 'test', ['1700000240.1', '', 'foo', 'u4', 'GUEST1', 'tmp10', '7.7.7.7', '0', '', '<n000/><f x11000="0">First guest']);
  g('u', 'test', ['tmp10', 'G1=']);
  g('b', 'test', ['1700000250.1', '', 'foo', 'u5', 'GUEST2', 'tmp11', '8.8.8.8', '0', '', '<n000/><f x11000="0">Second guest']);
  g('u', 'test', ['tmp11', 'G2=']);
  await until(() => d.body.textContent.includes('Second guest'));
  const guest = $$('.tc-msg').find(x => x.textContent.includes('First guest'));
  click(guest.querySelector('button[aria-label="More actions"]')); await wait(30);
  click(menuItem('Ban from #test')); await wait(50);
  click(byText('.dialog-foot button', 'Ban')); await wait(30);
  step('ban targets the clicked message, not the latest same name', frame('block:').pop() === 'block:GUEST1:7.7.7.7:', frame('block:'));
  g('ok', 'betterchatangoenv', ['betterchatangobot', '', '', '', '1700000000', '', '', '0']);
  g('b', 'betterchatangoenv', ['1700000260.1', 'Bot', '', 'u6', 'X', 'tmp12', '1.1.1.1', '0', '', 'env']);
  await wait(60);
  step("BetterChatango's environment room stays hidden", !byText('.tc-nav', 'betterchatangoenv'));

  /* Linked accounts: one call per click, without credential, names as text, five levels only, nothing kept */
  const whoAsked = () => fetches.filter(x => /vissle\.me\/api\/v1\/who\//.test(x.url));
  const whoDialog = () => $$('#layer .dialog').find(x => /^Who is /.test(x.getAttribute('aria-label') || ''));
  const askWho = async txt => {
    const more = () => $$('.tc-msg').find(x => x.textContent.includes(txt)).querySelector('button[aria-label="More actions"]');
    click(more()); await wait(30);
    const it = menuItem('Who is this');
    click(it || more()); await wait(30);
    return !!it;
  };
  const whoAnswer = async body => {
    whoBody = body;
    await askWho('Hi everyone'); await until(() => !!whoDialog() && !whoDialog().querySelector('.tc-spinner'));
    const text = whoDialog() ? whoDialog().textContent : null;
    if (whoDialog()) click(byText('#layer .dialog-foot button', 'Close'));
    await wait(30);
    return text;
  };
  const guestOffers = await askWho('First guest');
  let releaseWho; whoHold = new Promise(r => { releaseWho = r; });
  whoBody = JSON.stringify({ target: 'alice', definite: ['alice2', '<img src="x" onerror="alert(5)">'], linked: [], strong: ['Zoe', 42, { name: 'evil' }], medium: 'carl', weak: ['dave'], extra: ['zed'] });
  const accountOffers = await askWho('Hi everyone');
  const pendingWho = { title: whoDialog() && whoDialog().getAttribute('aria-label'), spinner: !!(whoDialog() && whoDialog().querySelector('.tc-spinner')) };
  releaseWho(); whoHold = null;
  await until(() => !!whoDialog() && !whoDialog().querySelector('.tc-spinner'));
  await until(() => !!whoDialog() && !whoDialog().querySelector('.tc-skeleton'));
  const whoCard = n => whoDialog() && [...whoDialog().querySelectorAll('.conv.person')].find(x => x.querySelector('.conv-name').textContent === n);
  const whoShown = whoDialog() ? {
    text: whoDialog().textContent, levels: [...whoDialog().querySelectorAll('h3')].map(x => x.textContent), injected: !!whoDialog().querySelector('img[onerror]'),
    cards: [...whoDialog().querySelectorAll('.conv.person .conv-name')].map(x => x.textContent), texts: [...whoDialog().querySelectorAll('.who-text')].map(x => x.textContent),
    zoe: whoCard('zoe') && whoCard('zoe').querySelector('.conv-meta').textContent
  } : null;
  if (whoCard('zoe')) { click(whoCard('zoe')); await wait(50); }
  const dialogsOpen = () => $$('#layer .dialog').map(x => x.getAttribute('aria-label'));
  const onTop = dialogsOpen();
  key(d, 'Escape'); await wait(30);
  const backToList = dialogsOpen();
  const firstCall = whoAsked()[0] || {};
  if (whoDialog()) { click(byText('#layer .dialog-foot button', 'Close')); await wait(30); }
  const stored = Array.from({ length: w.localStorage.length }, (_, i) => w.localStorage.getItem(w.localStorage.key(i))).join('\n');
  step('who is this asks vissle once per click, for accounts only, without credentials',
    !guestOffers && accountOffers && whoAsked().length === 1 && firstCall.url === 'https://vissle.me/api/v1/who/alice' && (!firstCall.credentials || firstCall.credentials === 'omit'),
    { guestOffers, accountOffers, calls: whoAsked() });
  step('who is this shows the five levels as text and keeps nothing',
    pendingWho.title === 'Who is alice' && pendingWho.spinner && !!whoShown && JSON.stringify(whoShown.levels) === '["Definite · 2","Strong · 1","Weak · 1"]'
      && whoShown.text.includes('4 linked accounts for alice.') && JSON.stringify(whoShown.cards) === '["alice2","zoe","dave"]'
      && JSON.stringify(whoShown.texts) === '["<img src=\\"x\\" onerror=\\"alert(5)\\">"]' && !whoShown.injected
      && !/42|evil|object|carl|zed/.test(whoShown.text) && /vissle's estimate/.test(whoShown.text)
      && !whoDialog() && !/alice2|dave/.test(stored),
    { pendingWho, whoShown, open: !!whoDialog() });
  step("who is this shows each account's mini profile and opens its profile over the list",
    !!whoShown && whoShown.zoe === ZOE_ASL && onTop[onTop.length - 1] === 'Profile of zoe' && backToList[backToList.length - 1] === 'Who is alice' && whoAsked().length === 1,
    { zoe: whoShown && whoShown.zoe, onTop, backToList, calls: whoAsked().length });
  const whoReplies = [await whoAnswer(JSON.stringify({ target: 'alice', definite: [], weak: [7] })), await whoAnswer('{"definite":["x"]}'), await whoAnswer('<html>'), await whoAnswer(null)];
  step('who is this says when vissle has nothing, an unreadable answer or no answer',
    /vissle has no linked accounts for alice\./.test(whoReplies[0]) && /vissle sent an answer Nightango can't read\./.test(whoReplies[1]) && /can't read/.test(whoReplies[2])
      && /vissle could not be reached\. Try again later\./.test(whoReplies[3]) && whoAsked().length === 5,
    { whoReplies, calls: whoAsked().length });

  /* Message edit, like BetterChatango: <e…/> frame, history merge, deletion of edits */
  C.groups.edits = fakeGroup();
  SB.renderGroup({ group: 'edits', header: 'Edits' });
  g('ok', 'edits', ['marjorie', '', '', '', '1700000000', '', '', '0']);
  g('inited', 'edits', []);
  await wait(50);
  click(byText('.tc-nav', 'edits')); await wait(50);
  g('b', 'edits', ['1700000300.1', 'Marjorie', '', 'u0', 'UNID0', 'tmp30', '9.9.9.9', '0', '', '<n000/><f x11000="0">Mine typo']);
  g('u', 'edits', ['tmp30', 'A-B_C=']);
  await wait(50);
  const editBox = () => $('.tc-composer textarea');
  const openMenu = async txt => { click($$('.tc-msg').find(x => x.textContent.includes(txt)).querySelector('button[aria-label="More actions"]')); await wait(30); };
  type(editBox(), 'my draft');
  await openMenu('Mine typo'); click(menuItem('Edit message')); await wait(30);
  const editing = { value: editBox().value, focused: d.activeElement === editBox(), caret: editBox().selectionStart, context: !!byText('.tc-composer', 'Editing') };
  const bmBefore = frame('bm:').length;
  key(editBox(), 'Enter'); await wait(30);
  const unchanged = { sent: frame('bm:').length - bmBefore, draft: editBox().value };
  await openMenu('Mine typo'); click(menuItem('Edit message')); await wait(30);
  type(editBox(), 'Mine fixed'); key(editBox(), 'Enter'); await wait(30);
  const editFrame = frame('bm:').pop() || '';
  step('edit frame carries <e> after the style, unchanged text sends nothing',
    editing.value === 'Mine typo' && editing.focused && editing.caret === 9 && editing.context && unchanged.sent === 0 && unchanged.draft === 'my draft'
      && /^bm:[a-z0-9]+:0:<n000\/><f x11000="0"><eAhypheNBunderSC\/>Mine fixed$/.test(editFrame) && frame('bm:').length === bmBefore + 1 && editBox().value === 'my draft',
    { editing, unchanged, editFrame, draft: editBox().value });
  g('i', 'edits', ['1700000290.1', 'Dana', '', 'u7', 'UNID7', 'E-1=', '4.4.4.4', '0', '', '<n000/><f x11000="0"><eHhypheN1/>Dana fixed']);
  g('i', 'edits', ['1700000280.1', 'Dana', '', 'u7', 'UNID7', 'H-1=', '4.4.4.4', '0', '', '<n000/><f x11000="0">Dana typo']);
  await wait(50);
  const danaRows = $$('.log .tc-msg').filter(x => /Dana (fixed|typo)/.test(x.textContent)).map(x => x.textContent);
  step('history edit before its original gives one edited message', danaRows.length === 1 && danaRows[0].includes('Dana fixed') && danaRows[0].includes('(edited)'), danaRows);
  const delBefore = frame('delmsg:').length;
  await openMenu('Dana fixed'); click(menuItem('Delete message')); await wait(30);
  click(byText('.dialog-foot button', 'Delete')); await wait(30);
  step('delete also deletes the edits, like BetterChatango', JSON.stringify(frame('delmsg:').slice(delBefore)) === JSON.stringify(['delmsg:H-1=', 'delmsg:E-1=']), frame('delmsg:').slice(delBefore));

  /* File upload through vissle: Nightango posts the link in the chosen group, never in client.focus */
  // Returns the confirmation text. Without a button or a picker, the step fails without stopping the suite.
  const pickFile = async name => {
    const btn = $('button[aria-label="Attach media"]'), input = $('.composer-wrap input[type="file"]');
    if (!btn || !input) return null;
    click(btn);
    Object.defineProperty(input, 'files', { configurable: true, value: [new w.File(['x'], name, { type: 'image/png' })] });
    input.dispatchEvent(new w.Event('change', { bubbles: true })); await wait(30);
    const ask = $('#layer .dialog'), ok = byText('.dialog-foot button', 'Upload'), text = ask && ask.textContent;
    if (ok) click(ok);
    await wait(30);
    return text;
  };
  const linkFrames = from => sent.slice(from).filter(x => /^bm:/.test(x[1]));
  let releaseUpload = null;
  uploadReply = () => new Promise(resolve => { releaseUpload = () => resolve('data:abc/f.png'); });
  const uploadFrom = { focus: C.focus, sent: sent.length, posts: posts.length };
  const uploadAsk = await pickFile('f.png') || '';
  const uploadPost = posts[uploadFrom.posts] || {};
  const uploading = !!byText('.tc-composer', 'Uploading f.png');
  click(byText('.tc-nav', 'test')); await wait(50);
  if (releaseUpload) releaseUpload();
  await until(() => !!byText('.toast', 'File sent.'));
  const uploadLinks = linkFrames(uploadFrom.sent);
  step('uploaded file link sent to the group it was picked in, not client.focus',
    uploadFrom.focus === 'test' && uploadAsk.includes('Upload f.png?') && uploadAsk.includes('vissle.me stores the file and Nightango posts its link in #edits. Anyone with the link can open it.') && posts.length === uploadFrom.posts + 1 && uploadPost.url === 'https://vissle.me/chatango/upload'
      && JSON.stringify(uploadPost.item) === '{"key":true}' && JSON.stringify(Object.keys(uploadPost.f || {})) === '["filedata"]' && uploadPost.f.filedata.name === 'f.png' && uploading
      && uploadLinks.length === 1 && uploadLinks[0][0] === 'edits' && /^bm:[a-z0-9]+:0:<n000\/><f x11000="0">https:\/\/vissle\.me\/abc\/f\.png$/.test(uploadLinks[0][1]) && !!byText('.toast', 'File sent.'),
    { uploadFrom, uploadAsk, uploadPost: { url: uploadPost.url, item: uploadPost.item, fields: Object.keys(uploadPost.f || {}) }, uploading, uploadLinks });
  uploadReply = () => Promise.resolve('error:x');
  const failFrom = sent.length;
  await pickFile('g.png');
  await until(() => !!byText('.toast', 'The file could not be uploaded. Try again.'));
  step('rejected upload sends nothing', !!byText('.toast', 'The file could not be uploaded. Try again.') && !linkFrames(failFrom).length, linkFrames(failFrom));

  /* Warnings and connection */
  C.systemMessage({ content: 'Your message exceeded the character limit.', group: 'test' }); await until(() => !!byText('.toast', 'exceeded the character limit'));
  step('BetterChatango notice shown as a toast, not in the thread', !!byText('.toast', 'exceeded the character limit') && !$$('.log .ev').some(x => x.textContent.includes('exceeded the character limit')));
  let reloads = 0;
  C.setNotice({ icon: 'warning', content: 'Relogin required.', button: 'Reload', action: () => { reloads++; } }); await until(() => !!byText('.toast', 'Relogin required.'));
  const t = byText('.toast', 'Relogin required.');
  step('BetterChatango warning becomes a toast with its action', !!t && !!byText('.toast button', 'Reload'));
  click(byText('.toast button', 'Reload'));
  step('toast action calls BetterChatango', reloads === 1);
  C.groups.test.socket.readyState = 3; await wait(2300);
  step('disconnect banner', !!byText('.banner-wrap', 'Disconnected from #test'));
  click(byText('.banner-wrap button', 'Reconnect')); await wait(30);
  C.groups.test.socket.readyState = 1; await wait(2300);
  step('banner clears once connected', !byText('.banner-wrap', 'Disconnected'));
  C.groups.test.socket.readyState = 3; await wait(2300);
  click(byText('.banner-wrap button', 'Reconnect')); await wait(30);
  const testConnects = calls.filter(c => c[0] === 'connect' && c[1] === 'test').length;
  step('reconnect twice', testConnects === 2 && !C.cache.connect.includes('test'), { testConnects, cache: C.cache.connect });
  C.groups.test.socket.readyState = 1;

  /* History */
  const historyWatcher = () => observers.find(x => x.targets.some(t => t.closest('.log')));
  await until(historyWatcher);
  const historyTop = historyWatcher();
  if (historyTop) historyTop.cb(historyTop.targets.map(target => ({ isIntersecting: true, target })), historyTop);
  await wait(30);
  step('get_more uses BetterChatango counter', frame('get_more:').pop() === 'get_more:20:5', { observed: !!historyTop, frames: frame('get_more:') });
  g('nomore', 'test', []); await until(() => d.body.textContent.includes('beginning of the history'));
  step('history end shown', d.body.textContent.includes('beginning of the history'));

  /* Group settings */
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
  g('groupflagsupdate', 'test', ['0']); await until(() => !byText('.tc-banner', 'Waiting for Chatango'));
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
  step('announcement keeps style, escapes, keeps line breaks', frame('updateannouncement:').pop() === 'updateannouncement:1:900:<nF00/><f x12F00="1">Be kind &lt;3\rThanks', frame('updateannouncement:'));
  g('getannc', 'test', ['1', 'test', '5', '900', '<nF00/><f x12F00="1">Be kind &lt;3\rThanks']); await wait(80);
  g('getannc', 'test', ['3', 'test', '5', '900', '<nF00/><f x12F00="1"><b><i>Be kind</i></b>']); await until(() => $('#ann-text').value === 'Be kind' && !byText('.tc-banner', 'Waiting for Chatango'));
  type($('#ann-int'), '30'); await wait(20);
  click($('.tc-savebar .tc-btn-primary')); await wait(30);
  step('announcement keeps background mode and emphasis', frame('updateannouncement:').pop() === 'updateannouncement:3:1800:<nF00/><f x12F00="1"><b><i>Be kind</i></b>', frame('updateannouncement:'));
  g('getannc', 'test', ['3', 'test', '5', '1800', '<nF00/><f x12F00="1"><b><i>Be kind</i></b>']); await wait(80);

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
  step('ban list requested', frame('blocklist:block:0:next:50:anons:1').length >= 1, frame('blocklist:'));
  /* Bans in pages of 50 like BetterChatango: the next page starts from the timestamp of the last row */
  const banTitle = () => ($$('.tc-section-title').find(x => x.textContent.indexOf('Banned') === 0) || {}).textContent || null;
  const banObserver = () => observers.find(x => x.targets.some(t => t.closest('.spage')));
  g('blocklist', 'test', [Array.from({ length: 50 }, (_, i) => 'PB' + i + ':10.0.0.' + i + ':user' + i + ':' + (1700001000 - i) + ':marjorie').join(';')]);
  await until(() => banTitle() === 'Banned · 50+' && banObserver());
  const banFirst = { title: banTitle(), observer: banObserver() };
  if (banFirst.observer) banFirst.observer.cb(banFirst.observer.targets.map(target => ({ isIntersecting: true, target })), banFirst.observer);
  await until(() => !!$('.spage [aria-label="Loading more bans"]'));
  const banNext = { frame: frame('blocklist:block:').pop(), rows: $$('.spage .lrow').length, spinner: !!$('.spage [aria-label="Loading more bans"]'), root: banFirst.observer && banFirst.observer.opts.root && banFirst.observer.opts.root.className };
  g('blocklist', 'test', ['PB49:10.0.0.49:user49:1700000951:marjorie;PB50:10.0.0.50:user50:1700000950:marjorie;PB51:10.0.0.51::1700000949:bob']);
  await until(() => banTitle() === 'Banned · 52');
  const banEnd = { title: banTitle(), rows: $$('.spage .lrow').length, observer: !!banObserver(), spinner: !!$('.spage [aria-label="Loading more bans"]') };
  step('ban list loads the next page from its last row and ends on a short page',
    banFirst.title === 'Banned · 50+' && banNext.frame === 'blocklist:block:1700000951:next:50:anons:1' && banNext.rows === 50 && banNext.spinner && banNext.root === 'spage'
      && banEnd.title === 'Banned · 52' && banEnd.rows === 52 && !banEnd.observer && !banEnd.spinner,
    { title: banFirst.title, banNext, banEnd });
  g('blocklist', 'test', ['UNID1:1.2.3.4:alice:1700000300:marjorie;UNID9:9.9.9.9::1700000000:bob']);
  await until(() => banTitle() === 'Banned · 2');
  step('unrequested ban list replaces the loaded pages', banTitle() === 'Banned · 2' && !byText('.lrow', 'user0'), banTitle());
  step('ban list shown', !!byText('.lrow', 'alice') && !!byText('.lrow', '!anon'));
  click(byText('.lrow', 'alice').querySelector('.tc-btn')); await wait(20);
  step('unban frame', frame('removeblock:').pop() === 'removeblock:UNID1:1.2.3.4');
  /* Ban search like BetterChatango: searchban, then bansearchresult (date in Pacific time, with its colons) or badbansearchstring */
  type($('#ban-search'), ' spamking '); key($('#ban-search'), 'Enter'); await wait(30);
  const banSearch = { frame: frame('searchban:').pop() };
  g('bansearchresult', 'test', ['alt1;alt2', 'spamking', '1.2.3.4', 'UNID7', 'marjorie', 'Oct 20 2026 10', '00', '00']);
  await until(() => !!byText('.lrow', 'spamking'));
  const banFound = byText('.lrow', 'spamking');
  banSearch.found = banFound ? banFound.textContent : null;
  banSearch.list = !!byText('.lrow', '!anon');
  if (banFound) click(banFound.querySelector('.tc-btn'));
  await wait(20);
  banSearch.unban = frame('removeblock:').pop();
  type($('#ban-search'), 'nobody'); click(byText('.spage button', 'Search')); await wait(30);
  g('bansearchresult', 'test', ['', '', '', '', '', '']);
  await until(() => d.body.textContent.includes('No ban found for nobody.'));
  banSearch.none = d.body.textContent.includes('No ban found for nobody.');
  click(byText('.spage button', 'Clear search')); await wait(30);
  banSearch.cleared = !!byText('.lrow', '!anon') && !byText('.spage button', 'Clear search');
  type($('#ban-search'), 'bad name'); key($('#ban-search'), 'Enter'); await wait(30);
  g('badbansearchstring', 'test', ['2']);
  await until(() => ($('#ban-search-hint') || {}).textContent === "That's not a valid username.");
  banSearch.error = ($('#ban-search-hint') || {}).textContent || null;
  step('ban search frame, result, unban and refusals',
    banSearch.frame === 'searchban:spamking' && /spamking/.test(banSearch.found) && /by marjorie/.test(banSearch.found) && /Includes alt1, alt2\./.test(banSearch.found) && !banSearch.list
      && banSearch.unban === 'removeblock:UNID7:1.2.3.4' && banSearch.none && banSearch.cleared && banSearch.error === "That's not a valid username.",
    banSearch);
  /* Unbans: Unbanned tab loaded in pages like BetterChatango, kept up to date by unblocked (author in the second-to-last field) */
  const unbanTab = { before: frame('blocklist:unblock:').length };
  click(byText('.spage .tc-seg button', 'Unbanned'));
  await until(() => frame('blocklist:unblock:').length > unbanTab.before);
  unbanTab.frame = frame('blocklist:unblock:').pop();
  g('unblocklist', 'test', ['UNID2:5.6.7.8:carl:1700000200:marjorie']);
  await until(() => !!byText('.spage .lrow', 'carl'));
  unbanTab.carl = (byText('.spage .lrow', 'carl') || {}).textContent || null;
  g('unblocked', 'test', ['UNID1', '1.2.3.4', 'alice', 'marjorie', '1700000400']);
  await until(() => $$('.spage .lrow').length === 2);
  unbanTab.rows = $$('.spage .lrow').map(x => x.textContent);
  unbanTab.buttons = $$('.spage .lrow .tc-btn').length;
  click(byText('.spage .tc-seg button', 'Banned')); await wait(30);
  unbanTab.aliceBanned = !!byText('.spage .lrow', 'alice');
  step('unbanned tab loads from BetterChatango and follows unblocked',
    unbanTab.frame === 'blocklist:unblock:0:next:50:anons:1' && /by marjorie/.test(unbanTab.carl) && unbanTab.rows.length === 2 && /alice/.test(unbanTab.rows[0]) && /by marjorie/.test(unbanTab.rows[0])
      && /carl/.test(unbanTab.rows[1]) && unbanTab.buttons === 0 && !unbanTab.aliceBanned,
    unbanTab);

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

  /* Favorite written to the BetterChatango settings */
  click($('button[aria-label="Group options"]')); await wait(30);
  click(menuItem('Add to favorites')); await wait(50);
  const betterChatangoSettings = JSON.parse(w.localStorage.getItem('settings') || '{}');
  step('favorite persisted in BetterChatango settings', C.settings.privacy.groups.favorite.indexOf('test') >= 0 && betterChatangoSettings.privacy.groups.favorite.indexOf('test') >= 0, betterChatangoSettings);

  /* Unread migration: the database opened at startup becomes read before the private connection, the flag follows the end of the transaction */
  const pmConnectAt = calls.findIndex(c => c[0] === 'connect' && c[1] === 'private_message'), migratedAt = calls.findIndex(c => c[0] === 'written');
  step('old history unread cleared once before the private connection', migratedAt >= 0 && migratedAt < pmConnectAt && calls[migratedAt][1] === false && migrationFlag() && pmRecords.every(r => !r.unread),
    { pmConnectAt, migratedAt, written: calls[migratedAt], flag: migrationFlag(), unread: pmRecords.filter(r => r.unread) });

  /* PM restriction of one's own account: requested before the private connection, read from vissle only once after it */
  C.settings.privacy.private_messages = { check_pmr: true };
  const pmrRow = () => $$('section[aria-label="Private messages"] .tc-row').find(x => x.querySelector('.tc-row-title').textContent === 'Check my private message status');
  const pmrView = () => { const r = pmrRow(); return r && { on: r.querySelector('[role=switch]').checked, status: (r.querySelector('.tc-row-desc') || {}).textContent || null, asked: fetches.filter(x => /api\.vissle\.me/.test(x.url)).map(x => x.url) }; };
  click($('button[aria-label="Settings"]')); await until(() => !!byText('.tc-nav', 'Privacy'));
  click(byText('.tc-nav', 'Privacy')); await until(() => !!pmrRow()); await wait(50);
  const pmrSeen = [pmrView()];
  click(byText('.tc-nav', 'Back to chat')); await until(() => !!$('.log'));

  /* Private messages: BetterChatango history database opened by the bridge, with its schema */
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
  pm('OK', []); await until(() => !$('.convs .tc-skeleton'));
  pmSkeleton.afterHistory = !!$('.convs .tc-skeleton');
  step('loading skeletons', groupSkeleton.beforeInit && !groupSkeleton.afterInit && pmSkeleton.beforeReady && !pmSkeleton.afterHistory, { groupSkeleton, pmSkeleton });
  step("BetterChatango's history base opened with its exact schema", JSON.stringify(schema) === JSON.stringify([['open', 'marjorie_history', 1], ['store', 'messages', 'ts'], ['index', 'target_idx', '"target"'], ['index', 'target_read_idx', '["target","unread"]'], ['index', 'target_ts_idx', '["target","ts"]']]), schema);
  step('base handed to BetterChatango for archiving', C.database.pm === fakeDb);
  click(byText('.tc-nav', 'Private messages')); await wait(50);
  step('pm history loaded from BetterChatango', !!byText('.conv', 'dave'));
  click(byText('.conv', 'dave')); await wait(50);
  step('history text decoded', d.body.textContent.includes('Hello & welcome'));
  step('BetterChatango pm focus follows the open conversation', C.private.focus === 'dave');
  type($('.thread .tc-composer textarea'), 'x < y'); key($('.thread .tc-composer textarea'), 'Enter'); await wait(30);
  const escapedPm = frame('msg:dave:').pop() || '';
  step('pm escaped and sent as BetterChatango built it', /^msg:dave:<n3366FF\/><ipm\d{5}\/><m v="1"><g x12s9900cc="4">x &lt; y<\/g><\/m>$/.test(escapedPm) && !calls.some(c => c[0] === 'pm'), escapedPm);
  click(byText('.profile .mrow', 'Add friend')); await wait(30);
  step('add friend frame', frame('wladd:dave').length === 1);
  pm('wladd', ['nobody', 'invalid']); await until(() => !!byText('.toast', 'No Chatango user named nobody.'));
  step('unknown friend reported', !!byText('.toast', 'No Chatango user named nobody.'));
  click(byText('.profile .mrow', 'Block')); await wait(30);
  click(byText('.dialog-foot button', 'Block')); await wait(30);
  step('pm block frame', frame('block:dave:dave:S').length === 1);
  const presenceBeforeFriends = frame('getpresence:').length;
  pm('wl', ['erin', '0', 'off', '0']); await wait(30);
  step('presence of the listed correspondents asked once the history and the friends are loaded, except the shown one', presenceBeforeFriends === 0 && JSON.stringify(frame('getpresence:')) === JSON.stringify(['getpresence:fay']), frame('getpresence:'));
  pm('wlonline', ['erin']); await until(() => !!byText('.toast', 'erin is online.'));
  step('friend online notification', !!byText('.toast', 'erin is online.'));

  /* Chatango styles and media, with the settings turned on as in Appearance */
  click($('button[aria-label="Settings"]')); await wait(50);
  click(byText('.pick', 'Light')); await wait(30);
  click(byText('.tc-nav', 'Back to chat')); await wait(50);
  const styled = txt => { const p = $$('.thread .tc-msg-text').find(x => x.textContent === txt); const a = p && p.closest('.tc-msg'); return { p, name: a && a.querySelector('.tc-msg-author') }; };
  const styleOk = r => !!r.p && r.p.style.fontFamily.includes('Impact') && r.p.style.color === 'rgb(153, 0, 204)' && !!r.name && r.name.style.color === 'rgb(51, 102, 255)';
  pm('msg', ['dave', 'marjorie', 'unknown', '1700000300.5', '0', '<n3366FF/><m v="1"><g x12s9900cc="4">Hi</g></m>']); await until(() => !!styled('Hi').p);
  const live = styled('Hi');
  step('pm style rendered', styleOk(live), live.p && [live.p.style.cssText, live.name && live.name.style.cssText]);
  const hiRecord = pmRecords.find(r => r.target === 'dave' && r.ts === 1700000300.5);
  step('pm received in the open conversation marked read after BetterChatango archives it', !!hiRecord && hiRecord.unread === 0, hiRecord);
  const sentBeforeFay = sent.length;
  click(byText('.conv', 'fay')); await wait(50);
  const fayFrames = sent.slice(sentBeforeFay);
  pm('connect', ['fay', '1700000000', 'offline']);
  await until(() => !!$('.thread .topbar .tc-presence-offline'));
  const fayHead = { topic: ($('.thread .topbar .topic') || {}).textContent || '', offline: !!$('.thread .topbar .tc-presence-offline') };
  const fayDays = +((/^Last online (\d+) days ago$/.exec(fayHead.topic) || [])[1]);
  step('opening a pm asks Chatango for the presence', JSON.stringify(fayFrames) === JSON.stringify([['private_message', 'connect:fay']]) && fayHead.offline
    && Math.abs(fayDays - (Date.now() - 1700000000000) / 86400000) <= 1 && !calls.some(c => c[0] === 'betterChatangoPmScreen'), { fayFrames, fayHead, betterChatango: calls.filter(c => c[0] === 'betterChatangoPmScreen').length });
  // Private connection back: BetterChatango builds a new client.private after its OK handler, and Chatango forgets the previous connect.
  const sentBeforeOk = sent.length;
  pm('OK', []); C.private.focus = false;
  await until(() => C.private.focus === 'fay' && frame('getpresence:').length > 1);
  const okFrames = sent.slice(sentBeforeOk).map(x => x[1]);
  step('reconnection follows the shown conversation again', C.private.focus === 'fay' && okFrames.includes('connect:fay') && okFrames.includes('getpresence:dave'), { focus: C.private.focus, okFrames });
  const realNow = w.Date.now, presenceAsks = () => frame('getpresence:').length, askedBefore = presenceAsks();
  d.dispatchEvent(new w.Event('visibilitychange'));
  const askedRecent = presenceAsks() - askedBefore;
  w.Date.now = () => realNow.call(w.Date) + 6 * 60000;
  try { d.dispatchEvent(new w.Event('visibilitychange')); } finally { w.Date.now = realNow; }
  step('presence asked again when the page comes back after five minutes', askedRecent === 0 && presenceAsks() - askedBefore === 1, { askedRecent, asked: presenceAsks() - askedBefore });
  const old = styled('Old styled');
  step('pm history keeps style', styleOk(old), old.p && [old.p.style.cssText, old.name && old.name.style.cssText]);
  type($('.thread .tc-composer textarea'), 'Mine'); key($('.thread .tc-composer textarea'), 'Enter'); await wait(50);
  const mine = styled('Mine');
  const minePms = frame('msg:fay:').filter(f => f.endsWith('>Mine</g></m>')).length;
  step('own pm carries own style', styleOk(mine) && minePms === 1, { minePms, style: mine.p && [mine.p.style.cssText, mine.name && mine.name.style.cssText] });

  click(byText('.tc-nav', 'test')); await wait(50);
  g('b', 'test', ['1700000270.1', 'Eve', '', 'u7', 'UNID7', 'tmp13', '9.9.9.9', '0', '', '<n000/><f x11000="2">Look at this']);
  g('b', 'test', ['1700000271.1', 'Eve', '', 'u7', 'UNID7', 'tmp14', '9.9.9.9', '0', '', '<n000/><f x11000="0"><i s="vid://yt:PLe_UgXBBCU" w="126" h="93"/>']);
  await until(() => !!$('.log .embed-video'));
  const yt = $('.log .embed-video'), eveText = $$('.log .tc-msg-text').find(x => x.textContent === 'Look at this');
  const ytBefore = { raw: d.body.textContent.includes('vid://'), card: !!yt, media: !!yt && !!yt.querySelector('iframe, img'), font: eveText && eveText.style.fontFamily };
  if (yt) { click(yt); await wait(30); }
  const ytFrame = $('.log iframe');
  step('youtube embed loads on click', !ytBefore.raw && ytBefore.card && !ytBefore.media && !!ytFrame && ytFrame.getAttribute('src').indexOf('https://www.youtube-nocookie.com/embed/PLe_UgXBBCU') === 0 && ytBefore.font === '', [ytBefore, ytFrame && ytFrame.getAttribute('src')]);

  /* Premium message background: msgbg.xml read once per member under "Message backgrounds", filtered values, image only when external media are not blocked */
  const BG_PREMIUM = String(4 | 8), BG_TEXTS = ['Rosa first', 'Rosa again', 'Trap says hi', 'Pale says hi', 'Plain says hi', 'Nobg says hi', 'Guest says hi'];
  [['Rosa', BG_PREMIUM], ['Rosa', BG_PREMIUM], ['Trap', BG_PREMIUM], ['Pale', BG_PREMIUM], ['Plain', BG_PREMIUM], ['Nobg', '8'], ['', BG_PREMIUM]].forEach((x, i) =>
    g('b', 'test', [String(1700000290.1 + i), x[0], x[0] ? '' : 'visitor', 'u2' + i, 'UNIDBG' + i, 'tmpbg' + i, '4.4.4.' + i, x[1], '', '<n000/><f x11000="0">' + BG_TEXTS[i]]));
  await until(() => d.body.textContent.includes('Guest says hi'));
  const bgAsked = n => fetches.filter(x => x.url === 'https://ust.chatango.com/' + n + '/msgbg.xml').length;
  const toggle = async (page, title) => {
    click($('button[aria-label="Settings"]')); await until(() => !!byText('.tc-nav', page));
    click(byText('.tc-nav', page)); await until(() => !!row(title));
    const was = row(title).checked;
    click(row(title)); await until(() => row(title).checked !== was);
    click(byText('.tc-nav', 'Back to chat')); await until(() => !!$('.log'));
  };
  const bgLook = txt => {
    const p = $$('.log .tc-msg-text').find(x => x.textContent === txt), r = p && p.closest('article'), img = r && r.querySelector('img[src*="msgbg"]');
    return r ? [r.style.backgroundColor, img ? [img.getAttribute('src'), img.style.opacity, img.style.objectPosition, img.getAttribute('referrerpolicy'), img.getAttribute('alt'), img.getAttribute('loading')] : null] : null;
  };
  const askedOff = ['rosa', 'trap', 'pale', 'plain'].map(bgAsked), ROSA = 'rgb(253, 243, 233)';
  await toggle('Appearance', 'Message backgrounds');
  await until(() => (bgLook('Rosa first') || [])[0] === ROSA);
  const blockedBg = BG_TEXTS.slice(0, 4).map(bgLook);
  await toggle('Safety', 'Block external media until I click');
  await until(() => !!(bgLook('Pale says hi') || [])[1]);
  const shownBg = BG_TEXTS.map(bgLook), askedBg = ['rosa', 'trap', 'pale', 'plain', 'nobg'].map(bgAsked).concat(fetches.filter(x => /visitor\/msgbg/.test(x.url)).length), leaked = /evil\.test|onload/.test($('.log').innerHTML);
  await toggle('Safety', 'Block external media until I click');
  await toggle('Appearance', 'Message backgrounds');
  const bgImg = (n, opacity, position) => ['https://ust.chatango.com/' + n + '/msgbg.jpg', opacity, position, 'no-referrer', '', 'lazy'];
  step('premium message backgrounds', JSON.stringify(askedOff) === '[0,0,0,0]'
    && JSON.stringify(blockedBg) === JSON.stringify([[ROSA, null], [ROSA, null], ['', null], ['', null]])
    && JSON.stringify(shownBg) === JSON.stringify([[ROSA, bgImg('rosa', '0.4', 'right bottom')], [ROSA, bgImg('rosa', '0.4', 'right bottom')], ['', bgImg('trap', '1', 'left top')], ['', bgImg('pale', '0', 'left top')], ['', null], ['', null], ['', null]])
    && JSON.stringify(askedBg) === '[1,1,1,1,0,0]' && !leaked, { askedOff, blockedBg, shownBg, askedBg, leaked });

  /* Media typed as text: YouTube without a duplicate of its tag, video and audio created only on click, http loaded as https, other extensions as links, failed player turned back into a link */
  const MEDIA_LINKS = ['https://youtu.be/dQw4w9WgXcQ', 'https://x.test/clip.MP4?t=3', 'https://x.test/song.mp3#end', 'http://x.test/old.webm', 'https://x.test/old.wmv', 'https://www.youtube.com/watch?v=jNQXAC9IVRw'];
  g('b', 'test', ['1700000300.1', 'Eve', '', 'u7', 'UNID7', 'tmpmedia', '9.9.9.9', '0', '', '<n000/><f x11000="0">Media ' + MEDIA_LINKS.join(' ') + ' <i s="vid://yt:dQw4w9WgXcQ" w="126" h="93"/>']);
  const mediaRow = () => { const p = $$('.log .tc-msg-text').find(x => x.textContent.indexOf('Media ') === 0); return p && p.closest('article'); };
  await until(() => !!mediaRow());
  const mediaLook = () => { const r = mediaRow(); return r && { links: [...r.querySelectorAll('.tc-msg-text a')].map(a => a.getAttribute('href')), embeds: [...r.querySelectorAll('.embeds > *')].map(x => x.className + ':' + x.textContent), players: r.querySelectorAll('video, audio, iframe').length }; };
  const mediaBlocked = mediaLook();
  await toggle('Safety', 'Block external media until I click');
  const mediaOpen = mediaLook();
  await toggle('Safety', 'Block external media until I click');
  [...mediaRow().querySelectorAll('.embed-video, .embed-reveal')].forEach(click);
  await until(() => mediaRow().querySelectorAll('video, audio, iframe').length === 5);
  const player = el => [el.getAttribute('src'), el.hasAttribute('controls'), el.hasAttribute('autoplay')];
  const played = { frames: [...mediaRow().querySelectorAll('iframe')].map(x => x.getAttribute('src')), files: [...mediaRow().querySelectorAll('video, audio')].map(x => [x.tagName].concat(player(x))) };
  if (mediaRow().querySelector('audio')) mediaRow().querySelector('audio').dispatchEvent(new w.Event('error'));
  await until(() => !mediaRow().querySelector('audio'));
  const failed = { audio: !!mediaRow().querySelector('audio'), link: !!mediaRow().querySelector('.embeds a.msg-link[href="https://x.test/song.mp3#end"]') };
  const MEDIA_EMBEDS = ['embed-video:', 'embed-reveal:Play videox.test', 'embed-reveal:Play audiox.test', 'embed-reveal:Play videox.test', 'embed-video:'];
  step('media links in text embed and load only on click', !!mediaBlocked && JSON.stringify(mediaBlocked) === JSON.stringify({ links: MEDIA_LINKS, embeds: MEDIA_EMBEDS, players: 0 })
    && !!mediaOpen && JSON.stringify(mediaOpen) === JSON.stringify({ links: MEDIA_LINKS, embeds: MEDIA_EMBEDS, players: 0 })
    && JSON.stringify(played.frames) === JSON.stringify(['dQw4w9WgXcQ', 'jNQXAC9IVRw'].map(id => 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1'))
    && JSON.stringify(played.files) === JSON.stringify([['VIDEO', 'https://x.test/clip.MP4?t=3', true, true], ['AUDIO', 'https://x.test/song.mp3#end', true, true], ['VIDEO', 'https://x.test/old.webm', true, true]])
    && !failed.audio && failed.link, { mediaBlocked, mediaOpen, played, failed });

  /* Trusted host (BetterChatango list): under proxyMedia, only its image shows without a click, the host parsed like the browser does */
  const TRUST_LINKS = ['https://i.imgur.com/a.png', 'https://evil.example/b.png', 'https://i.imgur.com@evil.example/c.png'];
  g('b', 'test', ['1700000301.1', 'Eve', '', 'u7', 'UNID7', 'tmptrust', '9.9.9.9', '0', '', '<n000/><f x11000="0">Trusted ' + TRUST_LINKS.join(' ')]);
  const trustRow = () => { const p = $$('.log .tc-msg-text').find(x => x.textContent.indexOf('Trusted ') === 0); return p && p.closest('article'); };
  await until(() => !!trustRow() && trustRow().querySelectorAll('.embeds > *').length === 3);
  const trustImgs = [...trustRow().querySelectorAll('.embeds img')].map(x => x.getAttribute('src'));
  step('trusted host images load without a click', JSON.stringify(trustImgs) === JSON.stringify(['https://i.imgur.com/a.png']), trustImgs);

  /* Received emphasis: BetterChatango allowlist rebuilt as elements, neither media nor PM id in italics, tags outside the list without an element */
  const EMPH = '<b>Bold @alice</b> <I>Ital</I> <u>Under</u> <s>Gone</s> \u2593Struck\u2592 <iabc1234/>plain <i s="https://x.test/e.png"/>tail<script>alert(1)</script><img src="x" onerror="alert(2)">';
  const emphOf = scope => {
    const p = $$(scope + ' .tc-msg-text').find(x => x.textContent.includes('Struck'));
    return p && { els: [...p.querySelectorAll('*')].map(x => x.tagName.toLowerCase() + ':' + x.textContent), text: p.textContent, unsafe: !!p.closest('article').querySelector('script, [onerror]') };
  };
  const emphOk = r => !!r && JSON.stringify(r.els) === JSON.stringify(['b:Bold @alice', 'button:@alice', 'i:Ital', 'u:Under', 's:Gone', 's:Struck']) && !/[\u2592\u2593]/.test(r.text) && r.text.includes('plain') && r.text.includes('tail') && !r.unsafe;
  g('b', 'test', ['1700000272.1', 'Eve', '', 'u7', 'UNID7', 'tmp15', '9.9.9.9', '0', '', '<n000/><f x11000="0">' + EMPH]); await until(() => !!emphOf('.log'));
  const groupEmph = emphOf('.log');
  click(byText('.tc-nav', 'Private messages')); await wait(50);
  pm('msg', ['nell', 'marjorie', 'unknown', '1700000350.5', '0', '<n000/><iabc1234/><m v="1"><g x12s000="0">' + EMPH + '</g></m>']); await until(() => !!byText('.conv', 'nell'));
  click(byText('.conv', 'nell')); await wait(50);
  const pmEmph = emphOf('.thread');
  step('received emphasis rebuilt from the whitelist', emphOk(groupEmph) && emphOk(pmEmph), { groupEmph, pmEmph });

  click(byText('.tc-nav', 'Private messages')); await wait(50);
  const convPrev = n => { const c = $$('.conv').find(x => x.querySelector('.conv-name') && x.querySelector('.conv-name').textContent === n); return c ? c.querySelector('.conv-prev').textContent : null; };
  pm('msg', ['gus', 'marjorie', 'unknown', '1700000400.5', '0', '<n000/><m v="1"><g x12s000="0"><i s="https://x.test/a.png"/></g></m>']); await until(() => convPrev('gus') !== null);
  const prevImage = convPrev('gus');
  pm('msg', ['gus', 'marjorie', 'unknown', '1700000401.5', '0', '<n000/><m v="1"><g x12s000="0"><i s="img://cam:abc123"/></g></m>']); await until(() => convPrev('gus') !== prevImage);
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

  /* Received emoticons: emoji from the table, shortcut of a Premium one without the flag, bare name of an unknown one, typed shortcut kept as text */
  const EMO = 'Emo <i s="sm://smile" w="16" h="16"/> <i w="16" h="16" s="sm://cat"/> <i s="sm://stripes" w="16" h="16"/> <i s="sm://inconnu" w="16" h="16"/> :)';
  const EMO_PLAIN = 'Emo \u{1F642} *cat* *stripes* inconnu :)', EMO_PREMIUM = 'Emo \u{1F642} \u{1F431} *stripes* inconnu :)';
  const emoShown = scope => { const p = $$(scope + ' .tc-msg-text').find(x => x.textContent.indexOf('Emo ') === 0); return p ? p.textContent : null; };
  click(byText('.tc-nav', 'test')); await wait(50);
  g('b', 'test', ['1700000273.1', 'Eve', '', 'u7', 'UNID7', 'tmp16', '9.9.9.9', '0', '', '<n000/><f x11000="0">' + EMO]);
  g('u', 'test', ['tmp16', 'EMO1=']);
  g('b', 'test', ['1700000274.1', 'Alice', '', 'u1', 'UNID1', 'tmp17', '1.2.3.4', '0', '', '<n000/><f x11000="0"><rEMO1/>So cute']); await wait(60);
  const emoQuote = $$('.log .tc-msg-reply-text').find(x => x.textContent.indexOf('Emo ') === 0);
  const groupEmo = { shown: emoShown('.log'), text: emoQuote ? emoQuote.textContent : null };
  click(byText('.tc-nav', 'Private messages')); await wait(50);
  pm('msg', ['quinn', 'marjorie', 'unknown', '1700000402.5', '0', '<n000/><m v="1"><g x12s000="0">' + EMO + '</g></m>']); await wait(50);
  pm('msg', ['pia', 'marjorie', 'unknown', '1700000403.5', '4', '<n000/><m v="1"><g x12s000="0">' + EMO + '</g></m>']); await wait(50);
  click(byText('.conv', 'quinn')); await wait(50);
  const pmEmo = { shown: emoShown('.thread'), text: convPrev('quinn') };
  click(byText('.conv', 'pia')); await wait(50);
  const premiumEmo = { shown: emoShown('.thread'), text: convPrev('pia') };
  const emoOk = (r, want) => r.shown === want && r.text === want;
  step('received emoticons become emojis, never sm://', emoOk(groupEmo, EMO_PLAIN) && emoOk(pmEmo, EMO_PLAIN) && emoOk(premiumEmo, EMO_PREMIUM), { groupEmo, pmEmo, premiumEmo });

  /* Close or delete a conversation */
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
  pm('msg', ['dave', 'marjorie', 'unknown', '1700000500.5', '0', '<n000/>Back again']); await until(() => listed('dave'));
  const back = listed('dave');
  await closeConv('dave');
  click($('.convs button[aria-label="New message"]')); await wait(50);
  type($('#newdm'), 'dave'); click(byText('.dialog-foot button', 'Start conversation')); await wait(50);
  pm('connect', ['dave', '0', 'online']);
  await until(() => !$('.dialog') && !hiddenStored().includes('dave'));
  const reopened = { hidden: hiddenStored().includes('dave'), listed: listed('dave'), history: !!$('.thread') && $('.thread').textContent.includes('Hello & welcome') };
  step('close keeps history and reopens', !closed.listed && !closed.cleared && closed.hidden && back && !reopened.hidden && reopened.listed && reopened.history, { closed, back, reopened });
  click($('.thread button[aria-label="Conversation options"]')); await wait(30);
  click(menuItem('Delete conversation')); await wait(30);
  click(byText('.dialog-foot button', 'Delete')); await wait(50);
  step('delete clears BetterChatango history', calls.some(c => c[0] === 'clearHistory' && c[1] === 'dave') && !listed('dave'), calls.filter(c => c[0] === 'clearHistory'));
  click($('.convs button[aria-label="New message"]')); await wait(50);
  const sentBeforeGhost = sent.length;
  type($('#newdm'), 'ghost'); click(byText('.dialog-foot button', 'Start conversation'));
  await until(() => !!byText('.dialog-foot button', 'Checking'));
  const checking = byText('.dialog-foot button', 'Checking');
  const ghostAsk = { frames: sent.slice(sentBeforeGhost), waiting: !!checking && checking.disabled };
  pm('connect', ['ghost', '0', 'invalid']);
  await until(() => !!$('.dialog') && $('.dialog').textContent.includes('No Chatango user named ghost.'));
  const ghost = { error: !!$('.dialog') && $('.dialog').textContent.includes('No Chatango user named ghost.'), listed: listed('ghost'), head: ($('.thread .topbar h2 .namebtn') || {}).textContent || '' };
  if ($('.dialog')) { click(byText('.dialog-foot button', 'Cancel')); await wait(30); }
  step('new pm checks the name with Chatango', JSON.stringify(ghostAsk.frames) === JSON.stringify([['private_message', 'connect:ghost']]) && ghostAsk.waiting && ghost.error && !ghost.listed && ghost.head !== 'ghost', { ghostAsk, ghost });
  click($('.convs button[aria-label="New message"]')); await wait(50);
  type($('#newdm'), 'hank'); key($('#newdm'), 'Enter'); await wait(50);
  pm('connect', ['hank', '0', 'online']);
  await until(() => !$('.dialog') && !!$('.thread .topbar h2 .namebtn'));
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
  const gusOpened = !!$('.thread .topbar h2 .namebtn') && $('.thread .topbar h2 .namebtn').textContent === 'gus';
  step('chat row actions', hasRowItems(ctxItems) && hasRowItems(moreItems) && asked && hankDeleted && swipeButtons.includes('Close') && swipeButtons.includes('Delete') && !gusOpened, { ctxItems, moreItems, asked, hankDeleted, swipeButtons, gusOpened });

  /* Friends and Meet people */
  click(byText('.tc-nav', 'Friends')); await wait(60);
  const friendRows = $$('.convs .conv').map(x => x.querySelector('.conv-name').textContent);
  step('friends list shown with online first', friendRows[0] === 'erin', friendRows);
  type($('#add-friend'), 'Newbie'); click(byText('.convs button', 'Add')); await wait(30);
  step('add friend from the list', frame('wladd:newbie').length === 1);
  pm('wladd', ['zoe', 'on', '0']);
  pm('msg', ['zoe', 'marjorie', 'unknown', '1700000600.5', '0', '<n000/><m v="1"><g x12s000="0">See you at 8</g></m>']); await until(() => !!convRow('zoe') && !convRow('zoe').querySelector('.tc-skeleton'));
  const zoeRow = $$('.convs .conv').find(x => x.querySelector('.conv-name') && x.querySelector('.conv-name').textContent === 'zoe');
  const zoeText = zoeRow ? zoeRow.textContent : '';
  step('friends rows show ASL and last message', zoeText.includes(ZOE_ASL) && zoeText.includes('See you at 8') && !zoeText.includes('Bold'), zoeText);
  const nowS = Date.now() / 1000;
  pm('wl', ['zoe', String(nowS), 'on', '0', 'erin', String(nowS - 3 * 86400), 'off', '0', 'frank', String(nowS - 600), 'off', '0', 'abe', 'None', 'off', '0']); await until(() => !!convRow('frank') && !!convRow('abe'));
  const friendMeta = () => $$('.convs .conv').map(x => [x.querySelector('.conv-name').textContent, x.querySelector('.conv-meta').textContent, (x.querySelector('.conv-time') || {}).textContent || '']);
  const seen = friendMeta(), metaOf = n => (seen.find(x => x[0] === n) || [])[1] || '', timeOf = n => (seen.find(x => x[0] === n) || [])[2] || '';
  pm('presence', ['frank', '30', 'offline']); await wait(60);
  const frankRow = $$('.convs .conv').find(x => x.querySelector('.conv-name').textContent === 'frank');
  const frankOffline = !!frankRow && !!frankRow.querySelector('.tc-presence-offline');
  step('friends last online and order', JSON.stringify(seen.map(x => x[0])) === JSON.stringify(['zoe', 'frank', 'erin', 'abe']) && timeOf('erin') === '3 d ago' && timeOf('frank') === '10 min ago' && !timeOf('abe') && !timeOf('zoe')
    && seen.every(x => !/\b(Online|Idle|Offline|ago)\b/.test(x[1])) && frankOffline, { seen, frankOffline });
  // Idle shown only after 3 minutes: kim reaches it during the test, through the switch timer.
  pm('wladd', ['ivy', 'on', '5']); pm('wladd', ['jade', 'on', '1']); pm('wladd', ['kim', 'on', '2.999']); pm('idleupdate', ['zoe', '0']); await until(() => !!convRow('kim'));
  const presenceRow = n => { const r = $$('.convs .conv').find(x => x.querySelector('.conv-name').textContent === n); return r ? [(r.querySelector('.tc-presence') || {}).className || '', (r.querySelector('.conv-time') || {}).textContent || ''] : []; };
  const before3 = { ivy: presenceRow('ivy'), jade: presenceRow('jade'), kim: presenceRow('kim'), zoe: presenceRow('zoe') };
  await until(() => /tc-presence-idle/.test(presenceRow('kim')[0]));
  const after3 = presenceRow('kim');
  step('idle shown after three minutes with its duration', /tc-presence-idle/.test(before3.ivy[0]) && before3.ivy[1] === 'Idle 5 min'
    && /tc-presence-online/.test(before3.jade[0]) && !before3.jade[1] && /tc-presence-online/.test(before3.kim[0]) && /tc-presence-online/.test(before3.zoe[0]) && !before3.zoe[1]
    && /tc-presence-idle/.test(after3[0]) && after3[1] === 'Idle 3 min', { before3, after3 });
  click(byText('.tc-nav', 'Meet people')); await wait(120);
  const search = fetches.find(x => /\/search$/.test(x.url));
  step('meet search uses BetterChatango parameters and the browser session', !!search && search.credentials === 'include' && search.f.s === 'B' && String(search.f.o) === '1' && String(search.f.ami) === '13' && String(search.f.ama) === '99' && String(search.f.f) === '0' && String(search.f.t) === '40', search);
  step('presence requested for results', frame('getpresence:').pop() === 'getpresence:zoe;yann;marjorie');
  pm('presence', ['zoe', '0', 'online', 'yann', '5', 'online']); await until(() => !!$('.convs .conv .tc-presence-idle'));
  const meetRows = $$('.convs .conv').map(x => [x.textContent, (x.querySelector('.tc-presence') || {}).className]);
  step('meet results with status', meetRows.length === 3 && meetRows[0][0].includes('zoe') && /tc-presence-online/.test(meetRows[0][1]) && /tc-presence-idle/.test(meetRows[1][1]), meetRows);

  /* Meet people filters in a dialog */
  const searchesBefore = fetches.filter(x => /\/search$/.test(x.url)).length;
  click(byText('.convs button', 'Filters')); await wait(50);
  click(byText('.dialog .tc-seg button', 'Women')); await wait(20);
  click(byText('.dialog-foot button', 'Show results')); await wait(80);
  const fs2 = fetches.filter(x => /\/search$/.test(x.url));
  step('filters dialog applies the search', fs2.length === searchesBefore + 1 && fs2[fs2.length - 1].f.s === 'F', fs2[fs2.length - 1]);
  click(byText('.filter-chip', 'Women').querySelector('button')); await wait(80);
  const fs3 = fetches.filter(x => /\/search$/.test(x.url));
  step('removing the chip searches again without it', fs3[fs3.length - 1].f.s === 'B' && !$('.filter-chip'));
  pm('presence', ['zoe', '0', 'online', 'yann', '5', 'online']); await until(() => $$('.conv.person').some(x => x.textContent.includes('zoe')));
  step('meet cards show the mini profile', !!$$('.conv.person').find(x => x.textContent.includes('zoe') && x.textContent.includes('Lyon') && x.textContent.includes('Bold hi')));

  /* Profiles */
  click(byText('.convs .conv', 'zoe')); await wait(120);
  const card = $('.dialog');
  const rich = card && card.querySelector('.about.rich');
  step('mini profile loaded (age, gender, location)', !!card && card.textContent.includes(ZOE_ASL), card && card.textContent);
  step('mini profile keeps formatting', !!rich && !!rich.querySelector('b') && rich.querySelector('b').textContent === 'Bold' && !!rich.querySelector('span[style*="color"]'));
  step('mini profile drops scripts and handlers', !!rich && !rich.querySelector('script') && !rich.innerHTML.includes('onerror') && !rich.innerHTML.includes('javascript:') && !rich.innerHTML.includes('alert'));
  step('mini profile keeps safe links only', !!rich && $$('.about.rich a').length === 1 && rich.querySelector('a').getAttribute('href') === 'https://example.com/p');
  click(byText('.dialog button', 'Full profile')); await until(() => !!$('iframe.fullprofile'));
  const frameEl = $('iframe.fullprofile');
  const sd = frameEl ? frameEl.getAttribute('srcdoc') : '';
  step('full profile in an isolated frame', !!frameEl && !/allow-scripts|allow-same-origin/.test(frameEl.getAttribute('sandbox')) && sd.includes("default-src 'none'") && sd.includes('Zoe page'));
  const loadImages = byText('.dialog-foot button', 'Load images');
  if (loadImages) { click(loadImages); await wait(30); }
  const sdLoaded = $('iframe.fullprofile') ? $('iframe.fullprofile').getAttribute('srcdoc') : '';
  step('full profile blocks external media until asked', sd.includes('img-src data:;') && !!loadImages && sdLoaded.includes('img-src https:'),
    { blocked: sd.includes('img-src data:;'), button: !!loadImages, loaded: sdLoaded.includes('img-src https:') });
  click(byText('.dialog-foot button', 'Close')); await wait(30);
  key(d, 'Escape'); await wait(30);

  /* Refresh Meet people with the current filters */
  const searches = () => fetches.filter(x => /\/search$/.test(x.url));
  const refreshBtn = () => $('.convs button[aria-label="Refresh"]');
  click(byText('.convs button', 'Filters')); await wait(50);
  click(byText('.dialog .tc-seg button', 'Women')); await wait(20);
  click(byText('.dialog-foot button', 'Show results')); await until(() => !!byText('.filter-chip', 'Women') && !!refreshBtn() && !refreshBtn().disabled);
  const searchesBeforeRefresh = searches().length;
  let releaseSearch;
  searchHold = new Promise(r => { releaseSearch = r; });
  if (refreshBtn()) { click(refreshBtn()); await wait(30); }
  const during = { count: searches().length - searchesBeforeRefresh, disabled: !!refreshBtn() && refreshBtn().disabled };
  releaseSearch(); searchHold = null; await until(() => !!refreshBtn() && !refreshBtn().disabled);
  const lastSearch = searches().pop();
  step('meet refresh', during.count === 1 && during.disabled && lastSearch.f.s === 'F' && String(lastSearch.f.o) === '1' && String(lastSearch.f.f) === '0' && !!refreshBtn() && !refreshBtn().disabled, { during, f: lastSearch.f });

  /* Meet people infinite scroll: two full pages of 40 names, the second repeats a name already shown, the third partial page ends the list, the sentinel enters the visible area twice */
  const meetPage = (start, n) => Array.from({ length: n }, (_, i) => 'p' + (start + i) + ';1').join(':');
  const cardCount = () => $$('.conv.person').length;
  const watcher = () => observers.find(x => x.targets.length);
  const reachBottom = () => {
    const o = watcher();
    if (o) o.cb(o.targets.map(target => ({ isIntersecting: true, target })), o);
    return !!o;
  };
  searchBody = 'h=' + meetPage(0, 40);
  click(refreshBtn());
  await until(() => cardCount() === 40 && !!watcher());
  const searchesBeforeScroll = searches().length;
  searchBody = 'h=p0;1:' + meetPage(40, 39);
  const observed = [reachBottom()];
  await until(() => cardCount() === 79 && !!watcher());
  const cards = cardCount();
  searchBody = 'h=' + meetPage(79, 1);
  observed.push(reachBottom());
  await until(() => searches().length - searchesBeforeScroll === 2 && !watcher() && !refreshBtn().disabled);
  const scrollSearches = searches().slice(searchesBeforeScroll);
  step('meet infinite scroll', scrollSearches.length === 2 && String(scrollSearches[0].f.f) === '40' && String(scrollSearches[0].f.t) === '80' && cards === 79
    && String(scrollSearches[1].f.f) === '80' && String(scrollSearches[1].f.t) === '120' && !byText('.convs button', 'Load more'),
    { observed, cards, requests: scrollSearches.map(x => [x.f.f, x.f.t]), loadMore: !!byText('.convs button', 'Load more') });

  /* Mini profile Premium background: active Premium read from custom_profile.css, expired Premium never requested, JPEG or 404 response without a background */
  searchBody = 'h=goddess;1:expired;1:sith;1:lost;1';
  const personOf = n => $$('.conv.person').find(x => x.querySelector('.conv-name').textContent === n);
  click(refreshBtn()); await until(() => ['goddess', 'expired', 'sith', 'lost'].every(n => !!personOf(n) && !personOf(n).querySelector('.tc-skeleton')));
  const cssAsked = n => fetches.some(x => x.url.indexOf('/' + n + '/custom_profile.css') >= 0);
  const premiumCards = ['goddess', 'expired', 'sith', 'lost'].map(n => [n, personOf(n) ? personOf(n).style.backgroundColor : null]);
  if (personOf('goddess')) { click(personOf('goddess')); await wait(120); }
  const profileDialog = $('.dialog.profile-dialog');
  const aboutLink = profileDialog && profileDialog.querySelector('.about.rich a');
  const premiumAbout = profileDialog ? { bg: profileDialog.style.backgroundColor, text: profileDialog.style.color, link: aboutLink && aboutLink.style.color } : null;
  key(d, 'Escape'); await wait(30);
  step('premium profile background', JSON.stringify(premiumCards) === JSON.stringify([['goddess', 'rgb(158, 159, 252)'], ['expired', ''], ['sith', ''], ['lost', '']])
    && cssAsked('goddess') && !cssAsked('expired') && cssAsked('sith') && cssAsked('lost')
    && !!premiumAbout && premiumAbout.bg === 'rgb(158, 159, 252)' && premiumAbout.text === 'rgb(61, 61, 60)' && premiumAbout.link === 'rgb(41, 62, 62)',
    { premiumCards, css: ['goddess', 'expired', 'sith', 'lost'].map(cssAsked), premiumAbout });
  searchBody = SEARCH_BODY;

  /* Status */
  click($('.me-btn')); await wait(30);
  click(menuItem('Idle')); await wait(30);
  step('idle status frame', frame('idle:0').length === 1);

  /* Profile */
  const NOW = Date.now() / 1000, KINDS = ['log', 'like', 'dislike', 'msg', 'refer'];
  const firstPage = Array.from({ length: 16 }, (_, i) => ({ user: i === 15 ? 'sentinel' : i === 5 ? '!anon5681' : 'visitor' + i, action: KINDS[i % 5], time: NOW - 600 * i - 0.25, msg: i % 5 === 3 ? 'Nice page' : undefined }));
  vissleReply = q => ({ action: 'activity', get: q.page === 1 ? firstPage : firstPage.slice(0, 3).map((x, i) => ({ user: 'older' + i, action: 'log', time: NOW - 86400 - i })) });
  const visitors = () => $('section[aria-label="Visitors"]') || d.createElement('section'), visitorRows = () => [...visitors().querySelectorAll('.lrow')].map(x => x.textContent);
  click($('button[aria-label="Settings"]')); await until(() => !!byText('.tc-nav', 'Profile'));
  click(byText('.tc-nav', 'Profile')); await until(() => visitorRows().length > 0);
  const rows1 = visitorRows();
  step('own visitors list: first page shows 15 rows with vissle labels',
    vissleReqs.length === 1 && vissleReqs[0].page === 1 && vissleReqs[0].get === 'all' && rows1.length === 15 && !visitors().textContent.includes('sentinel')
      && rows1[0].includes('visitor0 visited') && rows1[1].includes('visitor1 liked profile') && rows1[2].includes('visitor2 disliked profile')
      && rows1[3].includes('visitor3 commented on') && rows1[3].includes('Nice page') && rows1[4].includes('visitor4 referred by'), { reqs: vissleReqs, rows1 });
  click(byText('section[aria-label="Visitors"] button', 'Load more')); await until(() => visitorRows().length > 15);
  step('own visitors list: load more sends the time of the 15th row',
    vissleReqs[1].page === firstPage[14].time && vissleReqs[1].get === 'all' && visitorRows().length === 18 && !byText('section[aria-label="Visitors"] button', 'Load more'), { req: vissleReqs[1], rows: visitorRows().length });
  vissleReply = () => ({ action: 'activity', get: [{ user: 'liker', time: NOW - 30 }] });
  click(byText('section[aria-label="Visitors"] button', 'Likes')); await until(() => vissleReqs.length > 2 && visitorRows().length === 1);
  step('own visitors list: likes filter', vissleReqs[2].get === 'like' && vissleReqs[2].page === 1 && visitorRows().length === 1 && visitorRows()[0].includes('liker liked profile'), { req: vissleReqs[2], rows: visitorRows() });
  vissleReply = () => ({ error: 'This profile has tracking turned off.' });
  click(visitors().querySelector('button[aria-label="Refresh"]')); await until(() => visitors().textContent.includes('This profile has tracking turned off.'));
  step('own visitors list: vissle error shown as sent', vissleReqs[3].page === 1 && vissleReqs[3].get === 'like' && visitors().textContent.includes('This profile has tracking turned off.'), visitors().textContent);
  /* Unreadable full profile (server error): saving another field sends nothing, never an empty full profile */
  const betterChatangoFull = d.querySelector('[data-text-field="full"]'), profileUpdates = () => posts.filter(p => /updateprofile/.test(p.url));
  betterChatangoFull.value = ''; ownMod2Status = 500;
  click(byText('.tc-nav', 'Password and email')); await until(() => !$('#pf-loc'));
  click(byText('.tc-nav', 'Profile')); await until(() => !!byText('.tc-hint', 'did not return your full profile'));
  const fullDown = { failed: !!byText('.tc-hint', 'did not return your full profile') };
  type($('#pf-loc'), 'Lille'); await until(() => !!$('.tc-savebar'));
  click($('.tc-savebar .tc-btn-primary')); await until(() => !!byText('.toast', 'Nothing was saved') || profileUpdates().length > 0);
  fullDown.toast = !!byText('.toast', 'could not be read. Nothing was saved'); fullDown.sent = profileUpdates().map(p => p.f.full_profile);
  step('full profile server error: saving another field sends nothing', fullDown.failed && fullDown.toast && fullDown.sent.length === 0, fullDown);
  betterChatangoFull.value = 'FULL PAGE'; ownMod2Status = 200;
  click(byText('.tc-nav', 'Password and email')); await until(() => !$('#pf-loc'));
  click(byText('.tc-nav', 'Profile')); await until(() => !!$('#pf-loc') && $('#pf-loc').value === 'Rouen');
  step('profile read from BetterChatango fields', $('#pf-age').value === '34' && $('#pf-gender').value === 'Male' && $('#pf-loc').value === 'Rouen');
  type($('#pf-loc'), 'Paris'); await wait(20);
  click($('.tc-savebar .tc-btn-primary')); await wait(80);
  const pp = posts.find(p => /updateprofile/.test(p.url));
  step('profile posted through BetterChatango', !!pp && pp.f.location === 'Paris' && pp.f.gender === 'M' && pp.f.full_profile === 'FULL PAGE' && pp.f.dir === 'checked' && pp.f.line === 'Hello there' && !('p' in pp.f), pp);
  /* Full profile: sent as is, empty string included, without reading mod2.xml again */
  const lastFull = () => posts.filter(p => /updateprofile/.test(p.url)).pop().f.full_profile;
  const ownFullReads = () => fetches.filter(x => /\/marjorie\/mod2\.xml/.test(x.url)).length;
  const fullEdit = {};
  if ($('#pf-full')) {
    type($('#pf-full'), '<h1>New page</h1>'); await until(() => !!$('.tc-savebar'));
    fullEdit.bar = !!$('.tc-savebar');
    if (fullEdit.bar) { click($('.tc-savebar .tc-btn-primary')); await until(() => !$('.tc-savebar')); }
    fullEdit.saved = lastFull();
    fullEdit.reads = ownFullReads();
    type($('#pf-full'), ''); await until(() => !!$('.tc-savebar'));
    if ($('.tc-savebar')) { click($('.tc-savebar .tc-btn-primary')); await until(() => !$('.tc-savebar')); }
    fullEdit.cleared = lastFull();
    fullEdit.readsAfter = ownFullReads();
  }
  step('full profile edited then cleared', fullEdit.bar && fullEdit.saved === '<h1>New page</h1>' && fullEdit.cleared === '' && fullEdit.readsAfter === fullEdit.reads, fullEdit);
  step('no password field anywhere in requests', posts.every(p => !('p' in p.f) && !('pwd' in p.f) && !('password' in p.f)));
  click(byText('.tc-nav', 'Password and email')); await wait(50);
  step('account page has no password form', !$('input[type=password]') && !!byText('.tc-banner', 'never handles your password'));
  click(byText('.tc-nav', 'Chatango Premium')); await wait(50);
  step('premium page has no purchase form', !!byText('.tc-banner', 'does not take payments'));
  click(byText('.tc-nav', 'Notifications')); await wait(50);
  const soundRow = title => { const r = $$('section[aria-label="Sounds"] .tc-row').find(x => x.querySelector('.tc-row-title').textContent === title); return r && { on: r.querySelector('[role=switch]').checked, range: r.querySelector('input[type=range]').disabled ? 'off' : r.querySelector('input[type=range]').value, value: r.textContent.match(/\d+%/)[0], play: !r.querySelector('button[aria-label="Play test sound"]').disabled }; };
  const sounds = { mention: soundRow('Mention sound'), online: soundRow('Friend online sound') };
  step('notifications: no sound column', !byText('th', 'Sound') && !byText('.tc-banner', 'BetterChatango plays alert sounds')
    && JSON.stringify(sounds) === JSON.stringify({ mention: { on: true, range: '30', value: '30%', play: true }, online: { on: false, range: 'off', value: '45%', play: false } }), sounds);
  click(byText('.tc-nav', 'Privacy')); await until(() => !!pmrRow() && !!pmrView().status);
  pmrSeen.push(pmrView());
  if (pmrRow()) {
    click(pmrRow().querySelector('[role=switch]')); await until(() => !pmrView().on);
    pmrSeen.push(Object.assign(pmrView(), { betterChatango: C.settings.privacy.private_messages.check_pmr, saved: JSON.parse(w.localStorage.getItem('settings')).privacy.private_messages.check_pmr }));
    click(pmrRow().querySelector('[role=switch]')); await until(() => !!pmrView().status);
    pmrSeen.push(pmrView());
  }
  const PMR_URL = ['https://api.vissle.me/v1/pmr/marjorie'], PMR_TEXT = 'vissle reports that your private messages appear to be restricted.';
  step('own private message restriction read once from vissle after the private connection', JSON.stringify(pmrSeen) === JSON.stringify([
    { on: true, status: null, asked: [] }, { on: true, status: PMR_TEXT, asked: PMR_URL },
    { on: false, status: null, asked: PMR_URL, betterChatango: false, saved: false }, { on: true, status: PMR_TEXT, asked: PMR_URL }
  ]), pmrSeen);
  click(byText('.tc-nav', 'Back to chat')); await wait(50);
  click(byText('.tc-nav', 'Private messages')); await wait(50);
  const pmrBanner = () => { const b = $('.convs .tc-banner'); return b && b.textContent; };
  const pmrBannerSeen = [pmrBanner()];
  if (pmrBanner()) { click($('.convs .tc-banner button[aria-label="Dismiss"]')); await wait(30); }
  pmrBannerSeen.push(pmrBanner());
  step('own private message restriction shown above the private messages until dismissed', JSON.stringify(pmrBannerSeen) === JSON.stringify([
    'Your private messages are restrictedPeople might not receive your messages.', null
  ]) && fetches.filter(x => /api\.vissle\.me/.test(x.url)).length === 1, pmrBannerSeen);

  /* Bio: raw Chatango line in the field, rendered in the preview */
  const ownCard = async () => {
    click(byText('.tc-nav', 'test')); await wait(50);
    click($$('.members .mrow').find(x => [...x.querySelectorAll('.tc-badge')].some(b => b.textContent === 'You'))); await wait(120);
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

  /* Profile picture: BetterChatango avatar form then cropping on full.jpg, square bounded to the image */
  click($('button[aria-label="Settings"]')); await wait(50);
  click(byText('.tc-nav', 'Profile')); await until(() => !!$('#pf-mini-bg'));
  const avatarInput = $('input[type="file"][accept="image/jpeg,image/png,image/gif"]'), avatarFrom = posts.length;
  Object.defineProperty(avatarInput, 'files', { configurable: true, value: [new w.File(['x'], 'me.png', { type: 'image/png' })] });
  avatarInput.dispatchEvent(new w.Event('change', { bubbles: true })); await until(() => !!$('.crop-stage img'));
  // jsdom does not load images: natural size set by hand, then load.
  const loadCrop = (w0, h0) => { const img = $('.crop-stage img'); Object.defineProperty(img, 'naturalWidth', { configurable: true, value: w0 }); Object.defineProperty(img, 'naturalHeight', { configurable: true, value: h0 }); img.dispatchEvent(new w.Event('load')); };
  const cropBox = () => { const b = $('.crop-box'); return b && [b.style.left, b.style.top, b.style.width, b.style.height].join(' '); };
  const avatarPost = posts[avatarFrom] || { f: {} };
  const fresh = { src: $('.crop-stage img').getAttribute('src') };
  loadCrop(400, 300); await until(() => !!$('.crop-box'));
  fresh.box = cropBox();
  click(byText('.dialog-foot button', 'Cancel')); await until(() => !$('.crop-stage'));
  step('profile picture: avatar form sent, then a centered crop on the new full.jpg',
    JSON.stringify(Object.keys(avatarPost.f)) === JSON.stringify(['auth', 'arch', 'src', 'action', 'Filedata']) && avatarPost.f.action === 'fullpic' && avatarPost.f.Filedata.name === 'me.png'
    && JSON.stringify(avatarPost.item) === '{}' && posts.length === avatarFrom + 1
    && /\/m\/a\/marjorie\/full\.jpg\?v=\d+$/.test(fresh.src) && fresh.box === '12.5% 0% 75% 100%', { f: Object.keys(avatarPost.f), item: avatarPost.item, fresh });
  const ownAvatar = $('section[aria-label="Profile picture"] .tc-avatar-img');
  if (ownAvatar) ownAvatar.dispatchEvent(new w.Event('load'));
  await until(() => !!byText('button', 'Adjust crop'));
  click(byText('button', 'Adjust crop')); await until(() => !!$('.crop-stage img'));
  // Cropping known to BetterChatango (client.user.avatar): 50, 50, 50 on a 400 by 300 image.
  loadCrop(400, 300); await until(() => !!$('.crop-box'));
  const cropSteps = [cropBox()];
  key($('.crop-box'), 'ArrowRight'); await wait(10); cropSteps.push(cropBox());
  key($('.crop-box'), '+'); await wait(10); cropSteps.push(cropBox());
  for (let i = 0; i < 8; i++) { $('.crop-box').dispatchEvent(new w.KeyboardEvent('keydown', { key: 'ArrowDown', shiftKey: true, bubbles: true })); await wait(5); }
  cropSteps.push(cropBox());
  const thumbFrom = posts.length;
  click(byText('.dialog-foot button', 'Save crop')); await until(() => !$('.crop-stage'));
  const thumbPost = posts[thumbFrom] || { f: {} };
  step('profile picture: crop moved and resized with the keyboard, kept inside the image, sent as thumb',
    JSON.stringify(cropSteps) === JSON.stringify(['12.5% 16.666666666666664% 12.5% 16.666666666666664%', '13.25% 16.666666666666664% 12.5% 16.666666666666664%', '11.5% 14.333333333333334% 16.25% 21.666666666666668%', '11.5% 78.33333333333333% 16.25% 21.666666666666668%'])
    && JSON.stringify(thumbPost.f) === JSON.stringify({ auth: 'token', arch: 'h5', src: 'group', action: 'thumb', x0: '46', y0: '235', ts: '65' })
    && calls.some(c => c[0] === 'setProfile' && c[1].x0 === '46') && !!byText('.toast', 'Picture crop saved to Chatango.'), { cropSteps, f: thumbPost.f });

  /* Premium background: BetterChatango background form, sent after the profile, image pasted or uploaded to vissle */
  const miniForm = () => ({ bg: $('#pf-mini-bg').value, text: $('#pf-mini-text').value, link: $('#pf-mini-link').value, image: $('#pf-mini-img').value });
  const miniStart = miniForm();
  type($('#pf-mini-bg'), '#112233');
  type($('#pf-mini-img'), 'https://img.example/a b.png'); await wait(20);
  const badLink = { error: !!byText('.tc-error', 'starts with https://'), from: posts.length };
  click($('.tc-savebar .tc-btn-primary')); await wait(50);
  badLink.toast = !!byText('.toast', 'Fix the background image link'); badLink.sent = posts.length - badLink.from;
  uploadReply = () => Promise.resolve('data:abc/banner.png');
  const bannerInput = $('input[type="file"][accept=".png, .apng, .jpg, .jpeg, .gif, .bmp, .webp"]');
  click(byText('button', 'Upload to vissle'));
  Object.defineProperty(bannerInput, 'files', { configurable: true, value: [new w.File(['x'], 'banner.png', { type: 'image/png' })] });
  bannerInput.dispatchEvent(new w.Event('change', { bubbles: true })); await until(() => !!byText('.dialog-foot button', 'Upload'));
  const bannerAsk = $('#layer .dialog').textContent;
  click(byText('.dialog-foot button', 'Upload')); await until(() => $('#pf-mini-img').value === 'https://vissle.me/abc/banner.png');
  const bannerPost = posts[posts.length - 1];
  click(byText('.tc-checkline', 'Tile down').querySelector('input'));
  type($('#pf-loc'), 'Brest'); await wait(20);
  const previewBg = $('aside.side > div').style.background;
  const styleFrom = posts.length;
  click($('.tc-savebar .tc-btn-primary')); await until(() => !$('.tc-savebar'));
  const [profilePost, cssPost] = posts.slice(styleFrom);
  step('premium background: BetterChatango defaults without custom_profile.css, bad link refused, vissle upload fills the link',
    JSON.stringify(miniStart) === JSON.stringify({ bg: '#ffffff', text: '#222222', link: '#0084ef', image: '' }) && badLink.error && badLink.toast && badLink.sent === 0
    && bannerAsk.includes('Upload banner.png?') && bannerPost.url === 'https://vissle.me/chatango/upload' && JSON.stringify(bannerPost.item) === '{"key":true}' && previewBg === 'rgb(17, 34, 51)', { miniStart, badLink, bannerAsk, bannerPost: bannerPost && bannerPost.url, previewBg });
  step('premium background: sent after the profile with the fields of the BetterChatango form',
    posts.length === styleFrom + 2 && profilePost.f.location === 'Brest' && !/\?css$/.test(profilePost.url)
    && cssPost.url === 'https://chatango.com/updateprofile?css' && JSON.stringify(cssPost.item) === '{}'
    && JSON.stringify(cssPost.f) === JSON.stringify({ auth: 'token', arch: 'h5', src: 'group', action: 'update', body_bg_col: '112233', body_col: '222222', body_a_col: '0084ef', body_bg_img: 'https://vissle.me/abc/banner.png', body_tile_d: '1', body_tile_a: '0', dir: 'checked' })
    && !!byText('.toast', 'Profile saved to Chatango.'), { urls: posts.slice(styleFrom).map(p => p.url), f: cssPost && cssPost.f });
  step('no password field in profile picture and background requests', posts.slice(avatarFrom).every(p => !('p' in p.f) && !('pwd' in p.f) && !('password' in p.f)));
  click(byText('.tc-nav', 'Back to chat')); await wait(50);

  /* Group creation */
  click(byText('.tc-nav', 'Discover groups')); await wait(50);
  click(byText('button', 'Create a group')); await wait(50);
  type($('#cg-name'), 'newroom'); type($('#cg-title'), 'New room'); await wait(20);
  click(byText('.dialog-foot button', 'Create group')); await wait(100);
  const cp = posts.find(p => /creategrouploginjs/.test(p.url));
  step('group creation posted through BetterChatango', !!cp && cp.f.u === 'newroom' && cp.f.n === 'New room' && cp.f.owner === 'marjorie' && cp.f.authType === 'cookie', cp);
  step('new group joined', calls.some(c => c[0] === 'connect' && c[1] === 'newroom'));

  /* Own style: BetterChatango fields written before sending, never saved to Chatango */
  const fontsEl = d.querySelector('[data-preload="fonts"]'), emph = cls => fontsEl.querySelector(cls).previousElementSibling;
  let submits = 0;
  fontsEl.querySelector('form').addEventListener('submit', e => { submits++; e.preventDefault(); });
  const betterChatangoStyle = () => JSON.stringify({
    face: d.querySelector('.font-face').firstElementChild.value, size: d.querySelector('.font-size .text-input').value,
    text: fontsEl.querySelector('[data-color="fontColor"]').value, name: fontsEl.querySelector('[data-color="nameColor"]').value,
    bold: emph('.fa-bold').checked, italic: emph('.fa-italic').checked, underline: emph('.fa-underline').checked, strike: emph('.fa-strikethrough').checked, on: fontsEl.querySelector('[name="stylesOn"]').checked, user: C.user.style
  });
  const WANT = JSON.stringify({ face: '4', size: '14', text: '#9900cc', name: '#3366ff', bold: true, italic: false, underline: false, strike: true, on: true, user: true });
  // BetterChatango reloads the account style on reconnection: its fields return to the Chatango values.
  const resetBetterChatangoStyle = () => {
    d.querySelector('.font-face').firstElementChild.value = '0'; d.querySelector('.font-size .text-input').value = '11';
    fontsEl.querySelector('[data-color="fontColor"]').value = '#000000'; fontsEl.querySelector('[data-color="nameColor"]').value = '#000000';
    emph('.fa-bold').checked = false; emph('.fa-strikethrough').checked = false; fontsEl.querySelector('[name="stylesOn"]').checked = false; C.user.style = false;
  };
  const postsBeforeStyle = posts.length;
  styleProbe = betterChatangoStyle;
  click(byText('.tc-nav', 'test')); await wait(50);
  const styleBtn = $('.tc-composer button[aria-label="Message style"]');
  if (styleBtn) {
    click(styleBtn); await wait(50);
    type($('#ms-face'), '4'); type($('#ms-size'), '14'); type($('#ms-text'), '#9900cc'); type($('#ms-name'), '#3366ff');
    click(byText('.dialog .tc-checkline', 'Bold').querySelector('input'));
    const strikeBox = byText('.dialog .tc-checkline', 'Strikethrough');
    if (strikeBox) click(strikeBox.querySelector('input'));
    await wait(20);
    click(byText('.dialog-foot button', 'Save')); await wait(50);
    resetBetterChatangoStyle();
    type($('.tc-composer textarea'), 'Styled'); key($('.tc-composer textarea'), 'Enter'); await wait(30);
  }
  const storedStyle = JSON.stringify(JSON.parse(w.localStorage.getItem('torch-skin:marjorie') || '{}'));
  resetBetterChatangoStyle();
  click(byText('.tc-nav', 'Private messages')); await wait(50);
  click(byText('.conv', 'fay')); await wait(50);
  type($('.thread .tc-composer textarea'), 'Styled pm'); key($('.thread .tc-composer textarea'), 'Enter'); await wait(30);
  styleProbe = null;
  const atGroup = styleAtBuild.filter(x => x.group === 'test').map(x => x.style), atPm = styleAtBuild.filter(x => x.group === 'private_message').map(x => x.style);
  step('own style applied locally', !!styleBtn && atGroup.length >= 1 && atGroup.every(x => x === WANT) && frame('bm:').some(f => /Styled$/.test(f)) && storedStyle.includes('#9900cc') && storedStyle.includes('#3366ff') && atPm.length === 1 && atPm[0] === WANT && posts.length === postsBeforeStyle && submits === 0,
    { button: !!styleBtn, atGroup, storedStyle, atPm, posts: posts.slice(postsBeforeStyle), submits });

  /* PM style: the private history replayed at OK does not overwrite the style of a newer message received live */
  const threadFont = txt => { const p = $$('.thread .tc-msg-text').find(x => x.textContent === txt); return p ? p.style.fontFamily : null; };
  pmRecords.push(pmRecord('kim', 'msg:kim:marjorie:unknown:1700000700.5:0:<n000/><m v="1"><g x12s000="1">Older kim</g></m>', 0));
  pm('msg', ['kim', 'marjorie', 'unknown', '1700000800.5', '0', '<n000/><m v="1"><g x12s000="4">Newer kim</g></m>']); await wait(50);
  pm('OK', []); await wait(150);
  click(byText('.conv', 'kim')); await wait(50);
  step('pm history does not override live style', /Impact/.test(threadFont('Newer kim') || ''), threadFont('Newer kim'));

  /* Media of a sent PM: shown as soon as it is sent, without a duplicate when OK replays the BetterChatango archive */
  type($('.thread .tc-composer textarea'), 'Watch https://youtu.be/PLe_UgXBBCU'); key($('.thread .tc-composer textarea'), 'Enter'); await wait(50);
  const sentVideo = $$('.thread .embed-video').length;
  pmRecords.push(pmRecord('kim', 'msg:marjorie:marjorie:unknown:' + (Date.now() / 1000 + 20).toFixed(1) + ':0:<n3366FF/><m v="1"><g x12s9900cc="4">Watch <i s="vid://yt:PLe_UgXBBCU" w="126" h="93"/></g></m>', 0));
  pm('OK', []); await wait(150);
  const watch = { sentVideo, videos: $$('.thread .embed-video').length, texts: $$('.thread .tc-msg-text').filter(x => x.textContent.indexOf('Watch') === 0).length };
  step('own pm media shows at once and is not duplicated by history', watch.sentVideo === 1 && watch.videos === 1 && watch.texts === 1, watch);

  /* PM edited by its author: the original changes in place, live and then when OK replays the archive that holds both entries */
  const ORIG = '<n000/><iabc1234/><m v="1"><g x12s000="0">First draft</g></m>', EDIT = '<n000/><iedit5678/><m v="1"><g x12s000="0"><eabc1234/>Final text</g></m>';
  pm('msg', ['olga', 'marjorie', 'unknown', '1700000900.5', '0', ORIG]); await wait(50);
  pm('msg', ['olga', 'marjorie', 'unknown', '1700000960.5', '0', EDIT]); await until(() => (convPrev('olga') || '').includes('Final text'));
  click(byText('.conv', 'olga')); await wait(50);
  const olgaThread = () => ({ texts: $$('.thread .tc-msg-text').map(x => x.textContent), edited: $$('.thread .tc-msg').filter(x => x.textContent.includes('(edited)')).length });
  const editLive = olgaThread();
  pm('OK', []); await wait(150);
  const editHist = olgaThread();
  const editOk = r => JSON.stringify(r) === JSON.stringify({ texts: ['Final text'], edited: 1 });
  step('pm edit replaces the original, live and after history', editOk(editLive) && editOk(editHist), { editLive, editHist });

  /* PM reply: <r…/> right after the <g …> head like BetterChatango (inject.js:5253-5258), to a received PM or to one's own PM just sent, resolved live and from the history */
  pmRecords.push(
    pmRecord('rex', 'msg:rex:marjorie:unknown:1700001500.5:0:<n000/><iqst00001/><m v="1"><g x12s000="0">Old question</g></m>', 0),
    pmRecord('rex', 'msg:rex:marjorie:unknown:1700001510.5:0:<n000/><iqst00002/><m v="1"><g x12s000="0"><rqst00001/>Archived reply</g></m>', 0));
  pm('OK', []); await until(() => listed('rex'));
  click($$('.convs .conv-name').find(x => x.textContent === 'rex').closest('.conv')); await wait(50);
  const rexRow = txt => $$('.thread .tc-msg').find(x => { const t = x.querySelector('.tc-msg-text'); return t && t.textContent === txt; });
  const replyLine = txt => { const q = rexRow(txt) && rexRow(txt).querySelector('.tc-msg-reply'); return q ? q.textContent : null; };
  const replyTo = async (orig, txt) => {
    click(rexRow(orig).querySelector('button[aria-label="Reply"]')); await wait(30);
    const context = ($('.thread .tc-composer-context') || {}).textContent || '';
    type($('.thread .tc-composer textarea'), txt); key($('.thread .tc-composer textarea'), 'Enter'); await until(() => !!rexRow(txt));
    return { context, frame: frame('msg:rex:').pop() || '' };
  };
  const fromHistory = replyLine('Archived reply');
  const answer = await replyTo('Old question', 'Answer');
  const answerKey = (/<i(pm\d{5})\/>/.exec(answer.frame) || [])[1];
  const followUp = await replyTo('Answer', 'Follow-up');
  pm('msg', ['rex', 'marjorie', 'unknown', '1700001600.5', '0', '<n000/><iqst00003/><m v="1"><g x12s000="0"><rgone0001/>About something old</g></m>']);
  pm('msg', ['rex', 'marjorie', 'unknown', '1700001610.5', '0', '<n000/>From the official client']);
  await until(() => !!rexRow('From the official client'));
  const rex = {
    fromHistory, answer, answerKey, followUp, answerLine: replyLine('Answer'), followLine: replyLine('Follow-up'), missing: replyLine('About something old'),
    officialReply: !!rexRow('From the official client').querySelector('button[aria-label="Reply"]'), contextLeft: !!$('.thread .tc-composer-context')
  };
  const PM_HEAD = '^msg:rex:<n3366FF\\/><ipm\\d{5}\\/><m v="1"><g x12s9900cc="4">';
  step('pm reply carries <r> after the <g> head, resolves live and from the history, and only targets a PM key',
    (rex.fromHistory || '').includes('Old question') && rex.answer.context.includes('Replying to') && rex.answer.context.includes('Old question')
      && new RegExp(PM_HEAD + '<rqst00001\\/>Answer<\\/g><\\/m>$').test(rex.answer.frame)
      && !!rex.answerKey && new RegExp(PM_HEAD + '<r' + rex.answerKey + '\\/>Follow-up<\\/g><\\/m>$').test(rex.followUp.frame)
      && (rex.answerLine || '').includes('Old question') && (rex.followLine || '').includes('Answer') && rex.missing === 'Original message not loaded'
      && !rex.officialReply && !rex.contextLeft,
    rex);

  /* PMs received offline: database opened before the private connection, msgoff right after OK, two identical "ok" 10 s apart in the history */
  pmRecords.push(
    pmRecord('gus', 'msg:gus:marjorie:unknown:1700000400.5:0:<n000/>ok', 1),
    pmRecord('gus', 'msg:gus:marjorie:unknown:1700000410.5:0:<n000/>ok', 1));
  C.database.pm = false;
  C.private.socket.readyState = 3; await wait(2300);
  w.dispatchEvent(new w.Event('online')); await wait(50);
  pm('OK', []);
  pm('msgoff', ['gus', 'marjorie', 'unknown', '1700000420.5', '0', '<n000/>Missed you']); await wait(150);
  const pmConnect = calls.filter(c => c[0] === 'connect' && c[1] === 'private_message').pop();
  const archived = calls.filter(c => c[0] === 'archive');
  click(byText('.tc-nav', 'Private messages')); await wait(50);

  /* Database unreads: the two "ok" archived unread count, the msgoff shown and archived unread counts only once */
  const gusUnreadRecords = () => pmRecords.filter(r => r.target === 'gus' && r.unread).length;
  const unreadOf = n => { const r = convRow(n), b = r && r.querySelector('.tc-count'); return r ? (b ? +b.textContent : 0) : null; };
  // One migration write without a stored flag: a single one for the whole page, despite Nightango writes to the same storage.
  const kept = gusUnreadRecords(), resumed = unreadOf('gus'), migrations = calls.filter(c => c[0] === 'written' && !c[1]).length;
  pm('OK', []); await wait(150);
  const again = unreadOf('gus');
  step('unread migration not redone once flagged', kept === 3 && migrations === 1, { kept, migrations });
  step('history unread resumed once, not doubled by a second OK', resumed === 3 && again === 3, { resumed, again });
  click(byText('.conv', 'gus')); await until(() => $$('.thread .tc-msg-text').some(x => x.textContent === 'ok') && !gusUnreadRecords());
  step('opening a conversation marks its history read', gusUnreadRecords() === 0, pmRecords.filter(r => r.target === 'gus'));
  const oks = $$('.thread .tc-msg-text').filter(x => x.textContent === 'ok').length;
  step('offline messages archived', !!pmConnect && pmConnect[2] === true && archived.length === 1 && archived[0][1] === true && oks === 2, { pmConnect, archived, oks });
  C.private.socket.readyState = 1; await wait(2300);

  /* Private history in pages: the last 100 entries at OK, the 30 older ones on scroll, then the start of the history */
  for (let i = 1; i <= 130; i++) pmRecords.push(pmRecord('rhea', 'msg:rhea:marjorie:unknown:' + (1700001000 + i * 10) + '.5:0:<n000/>Page ' + i, 0));
  pm('OK', []); await until(() => !!byText('.conv', 'rhea'));
  click(byText('.conv', 'rhea')); await until(() => $$('.thread .tc-msg-text').length >= 100);
  const rheaTexts = () => $$('.thread .tc-msg-text').map(x => x.textContent);
  const pages = n => Array.from({ length: n }, (_, i) => 'Page ' + (131 - n + i));
  const PM_START = 'This is the start of the messages saved in this browser.';
  const rheaFirst = { texts: rheaTexts(), start: d.body.textContent.includes(PM_START) };
  const olderWatcher = () => observers.find(x => x.targets.some(t => t.closest('.thread')));
  await until(olderWatcher);
  const rheaTop = olderWatcher();
  if (rheaTop) rheaTop.cb(rheaTop.targets.map(target => ({ isIntersecting: true, target })), rheaTop);
  await until(() => d.body.textContent.includes(PM_START));
  const rheaAll = { texts: rheaTexts(), start: d.body.textContent.includes(PM_START) };
  step('older private history loads by pages', JSON.stringify(rheaFirst.texts) === JSON.stringify(pages(100)) && !rheaFirst.start && !!rheaTop
    && JSON.stringify(rheaAll.texts) === JSON.stringify(pages(130)) && rheaAll.start, { first: rheaFirst.texts.length, firstStart: rheaFirst.start, observed: !!rheaTop, all: rheaAll.texts.length, head: rheaAll.texts.slice(0, 3), allStart: rheaAll.start });

  /* Private history import: only valid records of this account are written, as read, without overwriting an existing key */
  const chooseFile = (text, sel = 'input[type="file"]') => {
    const input = $(sel);
    if (!input) return;
    Object.defineProperty(input, 'files', { configurable: true, value: [new w.File([text], 'history.json', { type: 'application/json' })] });
    input.dispatchEvent(new w.Event('change', { bubbles: true }));
  };
  const fayBefore = JSON.stringify(pmRecords.filter(r => r.target === 'fay')), countBefore = pmRecords.length;
  click($('button[aria-label="Settings"]')); await until(() => !!byText('.tc-nav', 'Privacy'));
  click(byText('.tc-nav', 'Privacy')); await until(() => !!$('input[type="file"]'));
  chooseFile('{"messages":[]}'); await until(() => !!byText('.toast', 'This file is not a BetterChatango message history.'));
  const notHistory = { toast: !!byText('.toast', 'This file is not a BetterChatango message history.'), written: pmRecords.length - countBefore };
  const RECEIVED = 'msg:ivan:marjorie:unknown:1700003000.5:0:<n000/>Kept from my old browser', SENT = 'msg:marjorie:marjorie:unknown:1700003010.5:0:<n000/>My old reply';
  chooseFile(JSON.stringify([
    { target: 'ivan', ts: 1700003000.5, data: RECEIVED, unread: 1 },
    { target: 'ivan', ts: 1700003010.5, data: SENT, unread: 0 },
    { target: 'ivan', ts: 1700003020.5, data: 'msg:zed:zed:unknown:1700003020.5:0:<n000/>Not my account', unread: 0 },
    { target: 'ivan', ts: 1700003030.5, data: 'wl:ivan:marjorie:unknown:1700003030.5:0:<n000/>Not a message', unread: 0 },
    { target: 'fay', ts: 1700000050.5, data: 'msg:fay:marjorie:unknown:1700000050.5:0:<n000/>Rewritten', unread: 1 }
  ]));
  await until(() => !!byText('.toast .grow', 'Imported'));
  const importToast = (byText('.toast .grow', 'Imported') || {}).textContent || null;
  const imported = pmRecords.slice(countBefore), fayAfter = JSON.stringify(pmRecords.filter(r => r.target === 'fay'));
  // File from another account: its received PM would pass the filter alone, its sent PM gives the account away.
  chooseFile(JSON.stringify([
    { target: 'ivan', ts: 1700003040.5, data: 'msg:ivan:zed:unknown:1700003040.5:0:<n000/>Meant for zed', unread: 1 },
    { target: 'ivan', ts: 1700003050.5, data: 'msg:zed:zed:unknown:1700003050.5:0:<n000/>Sent by zed', unread: 0 }
  ]));
  await until(() => !!byText('.toast .grow', "another account's messages"));
  const foreignFile = { toast: (byText('.toast .grow', "another account's messages") || {}).textContent || null, written: pmRecords.length - countBefore - imported.length };
  click(byText('.tc-nav', 'Back to chat')); await wait(50);
  click(byText('.tc-nav', 'Private messages')); await until(() => listed('ivan'));
  if (listed('ivan')) { click(byText('.conv', 'ivan')); await wait(50); }
  const ivanThread = $$('.thread .tc-msg-text').map(x => x.textContent);
  step('pm history import writes only valid records of this account',
    notHistory.toast && !notHistory.written && importToast === 'Imported 2 messages. 1 already saved, 2 skipped.'
      && JSON.stringify(imported) === JSON.stringify([{ target: 'ivan', ts: 1700003000.5, data: RECEIVED, unread: 0 }, { target: 'ivan', ts: 1700003010.5, data: SENT, unread: 0 }])
      && fayAfter === fayBefore && JSON.stringify(ivanThread) === JSON.stringify(['Kept from my old browser', 'My old reply'])
      && foreignFile.toast === "This file holds another account's messages. Nothing was imported." && !foreignFile.written,
    { notHistory, importToast, imported, fayBefore, fayAfter, foreignFile, ivanThread });

  /* Import of entries older than the last 100: a conversation whose history fit entirely goes back to reading in pages */
  const ivanOlder = Array.from({ length: 120 }, (_, i) => ({ target: 'ivan', ts: 1690000000.5 + i, data: 'msg:ivan:marjorie:unknown:' + (1690000000.5 + i) + ':0:<n000/>Older ivan ' + i, unread: 0 }));
  click($('button[aria-label="Settings"]')); await until(() => !!byText('.tc-nav', 'Privacy'));
  click(byText('.tc-nav', 'Privacy')); await until(() => !!$('input[type="file"]'));
  chooseFile(JSON.stringify(ivanOlder)); await until(() => !!byText('.toast .grow', 'Imported 120'));
  click(byText('.tc-nav', 'Back to chat')); await wait(50);
  click(byText('.tc-nav', 'Private messages')); await until(() => listed('ivan'));
  click(byText('.conv', 'ivan')); await until(() => !!$('.thread .history-more'));
  const ivanSentinel = !!$('.thread .history-more'), ivanStart = d.body.textContent.includes(PM_START);
  const ivanTop = observers.filter(x => x.targets.some(t => t.isConnected && t.closest('.thread'))).pop();
  if (ivanTop) ivanTop.cb(ivanTop.targets.map(target => ({ isIntersecting: true, target })), ivanTop);
  await until(() => $$('.thread .tc-msg-text').some(x => x.textContent === 'Older ivan 0'));
  const ivanTexts = $$('.thread .tc-msg-text').map(x => x.textContent);
  step('pm history import reopens older pages', ivanSentinel && !ivanStart && ivanTexts.length === 122 && ivanTexts[0] === 'Older ivan 0',
    { ivanSentinel, ivanStart, observed: !!ivanTop, count: ivanTexts.length, head: ivanTexts.slice(0, 3) });

  /* Media library import: only entries whose URL is an https image and whose name is text are written to the BetterChatango database */
  C.database.media = { transaction: mediaTransaction };
  const mediaNames = () => $$('.emoji-picker .media-name').map(x => x.textContent);
  const emojiButton = $('.thread .tc-composer button[aria-label="Emoji"]');
  if (emojiButton) { click(emojiButton); await until(() => !!$('.emoji-picker')); }
  const mediaTab = byText('.emoji-picker .tc-seg button', 'Media');
  if (mediaTab) { click(mediaTab); await until(() => mediaNames().includes('old')); }
  const mediaBefore = mediaRecords.length;
  chooseFile(JSON.stringify([
    { url: 'https://x.test/cat.gif', name: 'cat' },
    { url: 'javascript:alert(1)//x.test/a.png', name: 'script' },
    { url: 'http://x.test/dog.png', name: 'dog' },
    { url: 'https://x.test/bird.png', name: 42 }
  ]), '.emoji-picker input[type="file"]');
  await until(() => !!byText('.toast .grow', 'Imported 1 image'));
  const mediaToast = (byText('.toast .grow', 'Imported 1 image') || {}).textContent || null;
  await until(() => mediaNames().includes('cat'));
  const mediaImport = { picker: !!emojiButton, tab: !!mediaTab, toast: mediaToast, written: mediaRecords.slice(mediaBefore), listed: mediaNames() };
  if (d.activeElement) key(d.activeElement, 'Escape');
  await until(() => !$('.emoji-picker'));
  step('media import writes only https images with a text name',
    mediaImport.toast === 'Imported 1 image. 3 skipped.' && JSON.stringify(mediaImport.written) === JSON.stringify([{ url: 'https://x.test/cat.gif', name: 'cat' }])
      && JSON.stringify(mediaImport.listed) === '["cat","old"]', mediaImport);

  /* Removing a PM from the BetterChatango database: the record is read again before deletion, another member's record stays intact */
  const recordAt = ts => pmRecords.find(r => r.ts === ts);
  const pmRow = txt => { const p = $$('.thread .tc-msg-text').find(x => x.textContent === txt); return p && p.closest('.tc-msg'); };
  const removeFromBrowser = async txt => {
    const r = pmRow(txt), more = r && r.querySelector('button[aria-label="More actions"]');
    if (more) { click(more); await wait(30); }
    const item = menuItem('Remove from this browser');
    if (item) { click(item); await wait(30); }
    const dialog = $('.dialog') ? $('.dialog').textContent : '';
    if (dialog) click(byText('.dialog-foot button', 'Remove'));
    return { item: !!item, dialog };
  };
  // Key already taken by a PM from walt: BetterChatango archives the one from vera one second later, the bridge keeps the frame key.
  pmRecords.push(pmRecord('walt', 'msg:walt:marjorie:unknown:1700004000.5:0:<n000/>Not yours', 0));
  pm('msg', ['vera', 'marjorie', 'unknown', '1700003900.5', '0', '<n000/>Remove me']);
  pm('msg', ['vera', 'marjorie', 'unknown', '1700004000.5', '0', '<n000/>Keep me']);
  await until(() => !!byText('.conv', 'vera'));
  click(byText('.conv', 'vera')); await until(() => !!pmRow('Keep me'));
  const removeAsk = await removeFromBrowser('Remove me');
  await until(() => !pmRow('Remove me'));
  const removed = { ask: removeAsk, record: !!recordAt(1700003900.5), shown: !!pmRow('Remove me'), toast: !!byText('.toast', 'Message removed from this browser.') };
  await removeFromBrowser('Keep me');
  await until(() => !!byText('.toast', 'This message could not be removed.'));
  const refused = { walt: (recordAt(1700004000.5) || {}).target, vera: (recordAt(1700004001.5) || {}).target, shown: !!pmRow('Keep me'), toast: !!byText('.toast', 'This message could not be removed. Reload the page and try again.') };
  // Edited original: read again by its key, it goes with its edit, but not the PM from nell that has the same key.
  click(byText('.conv', 'olga')); await until(() => !!pmRow('Final text'));
  await removeFromBrowser('Final text');
  await until(() => !pmRow('Final text'));
  const edited = { original: !!recordAt(1700000900.5), edit: !!recordAt(1700000960.5), nell: !!recordAt(1700000350.5), shown: !!pmRow('Final text') };
  // Edit shown without its original, which is archived outside the message log: the original goes too, otherwise it would come back on reload.
  pmRecords.push(pmRecord('pia', 'msg:pia:marjorie:unknown:1700004100.5:0:<n000/><iorig9876/><m v="1"><g x12s000="0">Old draft</g></m>', 0));
  pm('msg', ['pia', 'marjorie', 'unknown', '1700004200.5', '0', '<n000/><iedit4321/><m v="1"><g x12s000="0"><eorig9876/>Only the edit</g></m>']);
  await until(() => !!byText('.conv', 'pia'));
  click(byText('.conv', 'pia')); await until(() => !!pmRow('Only the edit'));
  await removeFromBrowser('Only the edit');
  await until(() => !pmRow('Only the edit'));
  const editOnly = { original: !!recordAt(1700004100.5), edit: !!recordAt(1700004200.5), shown: !!pmRow('Only the edit') };
  step('remove a private message from this browser',
    removed.ask.item && /Remove this message from this browser\?/.test(removed.ask.dialog) && removed.ask.dialog.includes('Removes the copy BetterChatango keeps in this browser. Chatango does not store private messages, and vera keeps their copy.')
      && !removed.record && !removed.shown && removed.toast
      && refused.walt === 'walt' && refused.vera === 'vera' && refused.shown && refused.toast
      && !edited.original && !edited.edit && edited.nell && !edited.shown
      && !editOnly.original && !editOnly.edit && !editOnly.shown,
    { removed, refused, edited, editOnly });

  /* Automatic reconnection: dropped by the server, page visible, network up, group not shown */
  const connectsOf = gid => calls.filter(c => c[0] === 'connect' && c[1] === gid).length;
  const focusesOf = gid => calls.filter(c => c[0] === 'focus' && c[1] === gid).length;
  click(byText('.tc-nav', 'Private messages')); await wait(50);
  const auto0 = { test: connectsOf('test'), pm: connectsOf('private_message'), focus: focusesOf('test') };
  C.groups.test.socket.readyState = 3; C.private.socket.readyState = 3; await wait(5500);
  const auto1 = { test: connectsOf('test') - auto0.test, pm: connectsOf('private_message') - auto0.pm, focus: focusesOf('test') - auto0.focus };
  C.private.socket.readyState = 1; await wait(13500);
  const auto2 = { test: connectsOf('test') - auto0.test, pm: connectsOf('private_message') - auto0.pm };
  C.groups.test.socket.readyState = 1; await wait(2300);
  step('automatic reconnect after a server drop, then after a failed attempt',
    auto1.test === 1 && auto1.pm === 1 && auto1.focus === 0 && auto2.test === 2 && auto2.pm === 1, { auto1, auto2 });

  /* Session loss: signed in elsewhere, offline, connection lost, session expired */
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
