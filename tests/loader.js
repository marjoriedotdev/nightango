// Test of the full userscripts, readable and minified: BetterChatango startup, wait, interface mounting, pages to ignore.
const fs = require('fs');
const vm = require('vm');
const { JSDOM, VirtualConsole } = require('jsdom');
const S = process.argv[2];
const USERSCRIPTS = ['nightango.user.js', 'nightango.min.user.js'];
const react = fs.readFileSync('node_modules/react/umd/react.development.js', 'utf8');
const rdom = fs.readFileSync('node_modules/react-dom/umd/react-dom.development.js', 'utf8');
const START = 'https://vissle.me/client/start';
const wait = ms => new Promise(r => setTimeout(r, ms));
const log = [];
function step(name, ok, detail) { log.push((ok ? 'ok   ' : 'FAIL ') + name + (ok || detail === undefined ? '' : ' -> ' + JSON.stringify(detail))); }

function page(userscript, url, before) {
  const vc = new VirtualConsole(); const errors = [], reloads = [];
  vc.on('error', e => errors.push(String(e && e.message || e)));
  // jsdom does not navigate: a reload only reports itself as not implemented.
  vc.on('jsdomError', e => { if (/^Not implemented: navigation/.test(e.message)) reloads.push(e.message); });
  const dom = new JSDOM('<!doctype html><html><head></head><body><h1>Chatango</h1><div class="login"></div></body></html>', { url, runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc });
  const w = dom.window;
  w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  // jsdom has no fetch: the update check meets an unreachable GitHub.
  w.fetch = () => Promise.reject(new w.TypeError('Failed to fetch'));
  if (before) before(w);
  const injected = [], gm = [];
  new w.MutationObserver(rs => rs.forEach(r => r.addedNodes.forEach(n => { if (n.tagName === 'SCRIPT' && !n.src) injected.push(n.textContent); })))
    .observe(w.document, { childList: true, subtree: true });
  // Userscript manager sandbox: own globals, shared DOM, no unsafeWindow, which Userscripts (Safari) lacks.
  const sandbox = vm.createContext({
    document: w.document, location: w.location, CustomEvent: w.CustomEvent, DOMParser: w.DOMParser, console, setTimeout, clearTimeout,
    GM_xmlhttpRequest: details => { gm.push(details); }
  });
  sandbox.window = sandbox.top = sandbox.self = sandbox;
  vm.runInContext(userscript, sandbox);
  return { w, d: w.document, errors, reloads, injected, gm };
}
function fakeBetterChatango(w) {
  w.eval(`window.client = {
    event: { group: {}, private: {} }, user: { name: '' }, groups: {},
    on(ev, cb) { document.addEventListener('chatango_' + ev, cb); },
    emit(ev, data) { document.dispatchEvent(new CustomEvent('chatango_' + ev, { detail: data })); },
    connect() { return Promise.resolve(); }, socket() {}, systemMessage() {}, setNotice() {}
  }; window.chatango = { getAnon() { return '!anon'; } };`);
}
// Fake socket: jsdom would open a real connection.
function fakeSocket(w) {
  w.eval(`window.WebSocket = function (url) { this.url = url; this.on = {}; };
    WebSocket.prototype.addEventListener = function (type, fn) { (this.on[type] = this.on[type] || []).push(fn); };
    WebSocket.prototype.fire = function (type, e) { (this.on[type] || []).forEach(function (fn) { fn(e || {}); }); };
    WebSocket.OPEN = 1;`);
}
// jsdom does not download scripts: the test runs React by hand and then fires the load event.
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
  /* Home page, BetterChatango absent: the script starts it */
  // A page script can define the hosted prototype hook, which hands the interface a state and reads it back.
  let hookReads = 0;
  const a = page(userscript, 'https://st.chatango.com/', w => Object.defineProperty(w, 'claude', { get() { hookReads++; return { hot: {} }; } }));
  const starts = a.d.querySelectorAll('script[src="' + START + '"]');
  step('starts BetterChatango once on the home page', starts.length === 1);
  step('shows the BetterChatango loading text', a.d.querySelector('h1').textContent === 'Loading...');
  step('no overlay before BetterChatango is ready', !a.d.getElementById('torch-skin'));
  step('React loaded with integrity check', [...a.d.querySelectorAll('script[src*="cdnjs"]')].every(s => s.integrity.indexOf('sha384-') === 0 && s.crossOrigin === 'anonymous'));
  await deliverReact(a.w);
  // BetterChatango replaces the whole document with its client, sign-in screen and PM tab included.
  a.d.documentElement.innerHTML = '<head></head><body><div class="login"><div class="login-wrapper"></div></div><span data-sidebar="private"></span></body>';
  await wait(20);
  const skin = a.d.getElementById('torch-skin-login');
  step('sign-in screen skinned in the new document, without loading anything',
    !!skin && skin.parentNode === a.d.head && /\.login/.test(skin.textContent) && !/url\(|@import/.test(skin.textContent) && !!a.d.getElementById('torch-skin-fonts'));
  fakeBetterChatango(a.w);
  await wait(700);
  const host = a.d.getElementById('torch-skin');
  step('overlay mounted once BetterChatango is ready, still hidden', !!host && host.style.display === 'none');
  a.d.body.removeChild(host);
  a.w.client.user.name = 'Marjorie';
  a.w.client.emit('clientLogin', a.w.client);
  await wait(150);
  const host2 = a.d.getElementById('torch-skin');
  step('overlay shown after sign-in, re-attached if BetterChatango removed it', !!host2 && host2.style.display === 'block' && !!host2.shadowRoot.querySelector('#app').children.length);
  step('app runs in the page world',
    a.injected.some(t => t.indexOf('__TORCH_SKIN__') >= 0) && a.w.__TORCH_SKIN__ === true && a.w.__TORCH_LIVE__ === true
      && typeof a.w.client.event.group.getratelimit === 'function' && !!host2 && !!host2.shadowRoot.querySelector('#app').children.length,
    { injected: a.injected.length, skin: a.w.__TORCH_SKIN__, live: a.w.__TORCH_LIVE__ });
  step('userscript leaves the prototype hook out', !/\bwindow\.claude\b|\bclaude\.hot\b/.test(userscript) && hookReads === 0, hookReads);

  /* vissle bridge: only the signed-in profile is queried, without cookies */
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

  /* TikTok bridge: short links only, rebuilt by the sandbox, without cookies, only the post id comes back */
  const tiktok = [], sent = a.gm.length;
  a.d.addEventListener('torch-skin:tiktok-response', e => tiktok.push(JSON.parse(e.detail)));
  const askTikTok = (id, url) => a.d.dispatchEvent(new a.w.CustomEvent('torch-skin:tiktok-request', { detail: JSON.stringify({ id, url }) }));
  // Page of a post as TikTok serves it: the cover sits in its JSON with escaped slashes.
  const PAGE = '<html><script id="__UNIVERSAL_DATA_FOR_REHYDRATION__">{"video":{"cover":"https:\\u002F\\u002Fp16-common-sign.tiktokcdn-us.com\\u002Fobj\\u002Fa~tplv.image?dr=1\\u0026x-expires=1"}}</script></html>';
  askTikTok('t1', 'https://example.com/t/ZPLyE4syb/');
  askTikTok('t2', 'https://www.tiktok.com/t/ZPLyE4syb/');
  askTikTok('t3', 'https://vm.tiktok.com/ZMabc123/');
  askTikTok('t4', 'https://example.com/@clown/video/7429876543210987654');
  askTikTok('t5', 'http://m.tiktok.com/@clown.cat/video/7429876543210987654?lang=en');
  askTikTok('t6', 'https://www.tiktok.com/@clown/photo/7400000000000000000');
  await wait(20);
  const [t2call, t3call, t5call, t6call] = a.gm.slice(sent);
  if (t2call) t2call.onload({ status: 200, finalUrl: 'https://www.tiktok.com/@clown.cat/video/7429876543210987654?_t=8q&_r=1', responseText: PAGE });
  // Userscripts (Safari) names the final URL responseURL.
  if (t3call) t3call.onload({ status: 200, responseURL: 'https://www.tiktok.com/login?redirect_url=x', responseText: PAGE });
  if (t5call) t5call.onload({ status: 200, finalUrl: 'https://www.tiktok.com/@clown.cat/video/7429876543210987654', responseText: '<html>{"cover":"javascript:alert(1)"}</html>' });
  if (t6call) t6call.onload({ status: 403, finalUrl: 'https://www.tiktok.com/@clown/photo/7400000000000000000', responseText: PAGE });
  await wait(20);
  const tReply = id => tiktok.find(r => r.id === id) || {};
  const keys = id => Object.keys(tReply(id)).sort().join();
  const COVER = 'https://p16-common-sign.tiktokcdn-us.com/obj/a~tplv.image?dr=1&x-expires=1';
  step('TikTok bridge reads a rebuilt short or post link and returns its post link and cover only',
    a.gm.length === sent + 4 && a.gm.slice(sent).every(c => c.method === 'GET' && c.anonymous === true)
      && t2call.url === 'https://www.tiktok.com/t/ZPLyE4syb/' && t3call.url === 'https://vm.tiktok.com/ZMabc123/'
      && t5call.url === 'https://www.tiktok.com/@clown.cat/video/7429876543210987654' && t6call.url === 'https://www.tiktok.com/@clown/photo/7400000000000000000'
      && !!tReply('t1').error && !!tReply('t3').error && !!tReply('t4').error
      && keys('t2') === 'id,link,post,thumb' && tReply('t2').post === '7429876543210987654' && tReply('t2').link === 'https://www.tiktok.com/@clown.cat/video/7429876543210987654' && tReply('t2').thumb === COVER
      && keys('t5') === 'id,link,post' && tReply('t5').post === '7429876543210987654'
      && keys('t6') === 'id,link,post' && tReply('t6').post === '7400000000000000000',
    { calls: a.gm.slice(sent).map(c => ({ method: c.method, url: c.url, anonymous: c.anonymous })), tiktok });

  /* X bridge: post links on X or a mirror only, rebuilt on X by the sandbox, without cookies, only the card fields come back */
  const xs = [], xSent = a.gm.length;
  a.d.addEventListener('torch-skin:x-response', e => xs.push(JSON.parse(e.detail)));
  const askX = (id, url) => a.d.dispatchEvent(new a.w.CustomEvent('torch-skin:x-request', { detail: JSON.stringify({ id, url }) }));
  // oEmbed reply as X serves it, with markup that must not survive and a pic.twitter.com link that stands for the media.
  const oembed = handle => JSON.stringify({ author_name: 'U.S. Interior', author_url: 'https://x.com/' + handle, html: '<blockquote class="twitter-tweet" data-dnt="true"><p lang="en" dir="ltr">Sunsets don&#39;t get<br>better <a href="https://x.com/GrandTetonNPS">@GrandTetonNPS</a> <img src="x" onerror="window.xss=1"> <a href="http://t.co/Yu">pic.twitter.com/YuKy2rcjyU</a></p>&mdash; U.S. Interior (@' + handle + ') <a href="https://x.com/' + handle + '/status/1?ref_src=twsrc%5Etfw">May 5, 2014</a></blockquote>\n<script src="https://platform.twitter.com/widgets.js"></script>' });
  const mp4 = (bitrate, url) => ({ bitrate, content_type: 'video/mp4', url });
  const USER = { name: 'U.S. Interior', screen_name: 'Interior', profile_image_url_https: 'https://pbs.twimg.com/profile_images/432081479/DOI_LOGO_normal.jpg' };
  const VIDEO = { created_at: '2014-05-05T22:09:42.000Z', user: USER, possibly_sensitive: false, mediaDetails: [{ type: 'video', media_url_https: 'https://pbs.twimg.com/ext_tw_video_thumb/1/pu/img/a.jpg', original_info: { width: 1920, height: 1080 }, video_info: { variants: [
    { content_type: 'application/x-mpegURL', url: 'https://video.twimg.com/ext_tw_video/1/pu/pl/a.m3u8' }, mp4(256000, 'https://video.twimg.com/v/480.mp4'), mp4(2176000, 'https://video.twimg.com/v/720.mp4'),
    mp4(10368000, 'https://video.twimg.com/v/1080.mp4'), mp4(2000000, 'https://evil.example/v.mp4')] } }] };
  const PHOTO = { created_at: 'not a date', user: { profile_image_url_https: 'https://evil.example/a_normal.jpg' }, possibly_sensitive: true, mediaDetails: [{ type: 'photo', media_url_https: 'https://pbs.twimg.com/media/b.jpg', original_info: { width: 800, height: 600 } }] };
  askX('x1', 'https://example.com/Interior/status/463440424141459456');
  askX('x2', 'https://twitter.com/Interior/status/463440424141459456?s=20');
  askX('x3', 'https://mobile.twitter.com/clown/status/1700000000000000003');
  askX('x4', 'https://x.com/clown/status/1700000000000000004');
  askX('x5', 'https://fxtwitter.com/clown/status/1700000000000000005?a=lAo9&s=19');
  await wait(20);
  const xCalls = a.gm.slice(xSent), xCall = (host, id) => xCalls.find(c => c.url.indexOf(host) === 8 && c.url.indexOf(id) > 0);
  const answer = (host, id, status, body) => { const c = xCall(host, id); if (c) c.onload({ status, responseText: body }); };
  answer('publish.x.com', '463440424141459456', 200, oembed('Interior'));
  answer('cdn.syndication', '463440424141459456', 200, JSON.stringify(VIDEO));
  answer('publish.x.com', '1700000000000000003', 200, oembed('clown'));
  answer('cdn.syndication', '1700000000000000003', 200, JSON.stringify({ mediaDetails: [{ type: 'photo', media_url_https: 'javascript:alert(1)' }] }));
  answer('publish.x.com', '1700000000000000004', 404, '<html></html>');
  answer('cdn.syndication', '1700000000000000004', 200, JSON.stringify(PHOTO));
  answer('publish.x.com', '1700000000000000005', 200, oembed('clown'));
  answer('cdn.syndication', '1700000000000000005', 200, JSON.stringify(PHOTO));
  await wait(20);
  const xReply = id => xs.find(r => r.id === id) || {};
  const xKeys = id => Object.keys(xReply(id)).sort().join();
  const OEMBED_URL = 'https://publish.x.com/oembed?url=' + encodeURIComponent('https://x.com/Interior/status/463440424141459456') + '&omit_script=true&dnt=true&hide_thread=true';
  step('X bridge reads the oEmbed, the author picture, time and first media of a post link rebuilt on X and returns the card fields only',
    xCalls.length === 8 && xCalls.every(c => c.method === 'GET' && c.anonymous === true)
      && xCall('publish.x.com', '463440424141459456').url === OEMBED_URL
      && /^https:\/\/cdn\.syndication\.twimg\.com\/tweet-result\?id=463440424141459456&lang=en&token=[0-9a-z]+$/.test(xCall('cdn.syndication', '463440424141459456').url)
      && !!xReply('x1').error && !!xReply('x4').error && a.w.xss === undefined
      && xKeys('x2') === 'author,avatar,date,handle,id,link,media,text,time' && xReply('x2').author === 'U.S. Interior' && xReply('x2').handle === 'Interior'
      && xReply('x2').avatar === 'https://pbs.twimg.com/profile_images/432081479/DOI_LOGO_bigger.jpg' && xReply('x2').time === Date.UTC(2014, 4, 5, 22, 9, 42)
      && xReply('x2').text === "Sunsets don't get\nbetter @GrandTetonNPS" && xReply('x2').date === 'May 5, 2014' && xReply('x2').link === 'https://x.com/Interior/status/463440424141459456'
      && JSON.stringify(xReply('x2').media) === JSON.stringify({ kind: 'video', thumb: 'https://pbs.twimg.com/ext_tw_video_thumb/1/pu/img/a.jpg', sensitive: false, width: 1920, height: 1080, video: 'https://video.twimg.com/v/720.mp4' })
      && xKeys('x3') === 'author,date,handle,id,link,text' && xReply('x3').link === 'https://x.com/clown/status/1700000000000000003'
      && xCall('publish.x.com', '1700000000000000005').url.indexOf(encodeURIComponent('https://x.com/clown/status/1700000000000000005') + '&') > 0
      && xKeys('x5') === 'author,date,handle,id,link,media,text' && xReply('x5').link === 'https://x.com/clown/status/1700000000000000005'
      && JSON.stringify(xReply('x5').media) === JSON.stringify({ kind: 'photo', thumb: 'https://pbs.twimg.com/media/b.jpg', sensitive: true, width: 800, height: 600 }),
    { calls: xCalls.map(c => c.url), xs });

  /* Bridges: a request the interface does not make gets an error reply, and no call leaves the sandbox */
  const askedBefore = a.gm.length, vissleFrom = replies.length, tiktokFrom = tiktok.length, xFrom = xs.length;
  const askVissle = detail => a.d.dispatchEvent(new a.w.CustomEvent('torch-skin:vissle-request', { detail }));
  const visit = fields => askVissle(JSON.stringify(Object.assign({ page: 1, order: 'desc', get: 'all' }, fields)));
  askVissle('{"id":"m0",');
  askVissle('null');
  visit({ id: 'm1', get: 'everything' });
  visit({ id: 'm2', order: 1 });
  visit({ id: 'm3', page: '1' });
  visit({ id: 'm4', page: -1 });
  visit({ id: 'm5', page: { next: 1 } });
  visit({ id: 7 });
  a.d.dispatchEvent(new a.w.CustomEvent('torch-skin:tiktok-request', { detail: 'https://vm.tiktok.com/ZMabc123/' }));
  askTikTok('t4', ['https://vm.tiktok.com/ZMabc123/']);
  a.d.dispatchEvent(new a.w.CustomEvent('torch-skin:x-request', { detail: 'https://x.com/clown/status/1700000000000000006' }));
  askX('x6', { href: 'https://x.com/clown/status/1700000000000000006' });
  await wait(20);
  const vissleRefused = replies.slice(vissleFrom), tiktokRefused = tiktok.slice(tiktokFrom), xRefused = xs.slice(xFrom);
  step('bridges answer a malformed request with an error and make no call',
    a.gm.length === askedBefore
      && vissleRefused.length === 8 && vissleRefused.every(r => typeof r.error === 'string' && !('data' in r)) && ['m1', 'm2', 'm3', 'm4', 'm5'].every(id => vissleRefused.some(r => r.id === id))
      && tiktokRefused.length === 2 && tiktokRefused.every(r => typeof r.error === 'string' && !('post' in r)) && tiktokRefused.some(r => r.id === 't4')
      && xRefused.length === 2 && xRefused.every(r => typeof r.error === 'string' && !('text' in r)) && xRefused.some(r => r.id === 'x6'),
    { calls: a.gm.slice(askedBefore).map(c => c.url), vissleRefused, tiktokRefused, xRefused });
  step('no page errors', a.errors.length === 0, a.errors);
  a.w.close();

  /* Chat window embedded elsewhere: nothing happens */
  const b = page(userscript, 'https://st.chatango.com/h5/gz/r1013231200/id.html');
  step('ignores Chatango embeds', !b.d.querySelector('script[src="' + START + '"]') && !b.d.querySelector('script[src*="cdnjs"]') && !b.w.__TORCH_SKIN__);
  b.w.close();

  /* BetterChatango already started (old bookmark): no second start */
  const c = page(userscript, 'https://st.chatango.com/', fakeBetterChatango);
  step('does not start BetterChatango twice', !c.d.querySelector('script[src="' + START + '"]'));
  c.w.close();

  /* BetterChatango unreachable: message, no reload loop */
  const e = page(userscript, 'https://st.chatango.com/');
  const s = e.d.querySelector('script[src="' + START + '"]');
  s.dispatchEvent(new e.w.Event('error'));
  await wait(20);
  step('explains when BetterChatango cannot be reached', /could not be reached/.test(e.d.querySelector('h1').textContent));
  e.w.close();

  /* React unreachable: the sign-in screen gets its BetterChatango look back */
  const f = page(userscript, 'https://st.chatango.com/');
  const reactScript = f.d.querySelector('script[src*="cdnjs"]');
  f.d.documentElement.innerHTML = '<head></head><body><div class="login"></div></body>';
  await wait(20);
  const skinned = !!f.d.getElementById('torch-skin-login');
  reactScript.dispatchEvent(new f.w.Event('error'));
  await wait(20);
  step('sign-in screen unskinned when Nightango cannot start', skinned && !f.d.getElementById('torch-skin-login'));
  f.w.close();

  /* Diagnostic journal: socket lifecycle, never the frame content */
  const j = page(userscript, 'https://st.chatango.com/', fakeSocket);
  const journal = j.w.__TORCH_JOURNAL__;
  // The bridge does it on sign-in: from then on the log is saved for this account.
  if (journal) journal.signIn('marjorie');
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
  step('journal keeps BetterChatango connection lines and errors only',
    texts.includes('BetterChatango: conn closed: mygroup') && texts.includes('BetterChatango: unhandled frame weird') && texts.includes('TypeError: boom'), texts);
  step('journal keeps no frame or message text', journal && !texts.some(m => /secret/.test(m)), texts);
  j.w.dispatchEvent(new j.w.Event('pagehide'));
  const stored = JSON.parse(j.w.localStorage.getItem('torch-skin:journal:marjorie') || '[]');
  step('journal saved when the page is hidden', !!journal && stored.length === journal.entries().length);
  for (let i = 0; i < 1100; i++) if (journal) journal.add('test', 'event ' + i);
  const kept = journal ? journal.entries() : [];
  step('journal keeps the latest 1000 events', kept.length === 1000 && kept[999].m === 'event 1099', kept.length);
  j.w.close();

  /* Interface error: recovery screen instead of a blank page, BetterChatango back on request */
  const r = page(userscript, 'https://st.chatango.com/');
  await deliverReact(r.w);
  // BetterChatango's client document holds its PM tab, whose click method the bridge disables at sign-in.
  r.d.body.insertAdjacentHTML('beforeend', '<span data-sidebar="private"></span>');
  fakeBetterChatango(r.w);
  // BetterChatango's PM handlers: connect opens its PM screen, DENIED shows its alert.
  const bcPrivate = [];
  r.w.client.event.private.connect = () => { bcPrivate.push('connect'); };
  r.w.client.event.private.DENIED = () => { bcPrivate.push('DENIED'); };
  await wait(700);
  // A view that fails to render: the sidebar draws the avatar of the signed-in account.
  r.w.Torch.Avatar = () => { throw new r.w.TypeError('view failed'); };
  r.w.client.user.name = 'Marjorie';
  r.w.client.emit('clientLogin', r.w.client);
  await wait(150);
  const rHost = r.d.getElementById('torch-skin');
  const screen = rHost ? rHost.shadowRoot.querySelector('.recovery') : null;
  const action = label => screen ? [...screen.querySelectorAll('button')].find(b => b.textContent === label) : null;
  step('render error shows the recovery screen', !!screen && rHost.style.display === 'block' && !!action('Reload') && !!action('Show BetterChatango'),
    rHost ? rHost.shadowRoot.querySelector('#app').innerHTML.slice(0, 200) : null);
  const rTexts = r.w.__TORCH_JOURNAL__.entries().map(x => x.m);
  step('render error journaled by its name and message only',
    rTexts.includes('[torch-skin] interface stopped by an error, recovery screen shown: TypeError: view failed') && !rTexts.some(m => /\bmarjorie\b/i.test(m)), rTexts.slice(-8));
  if (action('Reload')) action('Reload').click();
  step('Reload reloads the page', r.reloads.length === 1, r.reloads);
  const hiddenBefore = !!r.d.getElementById('torch-skin-hide');
  const said = screen ? screen.textContent : '';
  if (action('Show BetterChatango')) action('Show BetterChatango').click();
  step('Show BetterChatango removes the overlay and the hiding stylesheet', hiddenBefore && !r.d.getElementById('torch-skin') && !r.d.getElementById('torch-skin-hide'));
  // The bridge keeps BetterChatango's PM handlers, so a conversation opened there stays closed until a reload.
  r.w.client.event.private.connect(r.w.client, null, 'private_message', ['bob', '0', 'online']);
  r.w.client.event.private.DENIED(r.w.client, null, 'private_message', []);
  step('recovery screen says private messages need a reload in BetterChatango',
    /private messages/i.test(said) && /reload/i.test(said) && bcPrivate.length === 0, { said, bcPrivate });
  r.w.close();
}

(async () => {
  for (const name of USERSCRIPTS) {
    log.push('-- dist/' + name);
    await suite(fs.readFileSync(S + '/dist/' + name, 'utf8'));
  }
  console.log(log.join('\n'));
  process.exit(log.some(l => l.indexOf('FAIL') === 0) ? 1 : 0);
})().catch(err => { console.log(log.join('\n')); console.error('CRASH', err); process.exit(2); });
