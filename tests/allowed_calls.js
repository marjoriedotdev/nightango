// Allowed HTTP calls (docs/betterchatango-protocol.md): every call site of src/ is on the closed list, and the post helper refuses the rest.
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');
const { concatSources, layerSources } = require('../scripts/build.mjs');
const S = process.argv[2];
const log = [];
/**
 * Records the result of a check.
 * @param {string} name Check name.
 * @param {boolean} ok Result.
 * @param {*} [detail] Shown on failure.
 */
function step(name, ok, detail) { log.push((ok ? 'ok   ' : 'FAIL ') + name + (ok || detail === undefined ? '' : ' -> ' + JSON.stringify(detail))); }

/* ---------- Call sites of src/ ---------- */
const DOC = fs.readFileSync(path.join(S, 'docs/betterchatango-protocol.md'), 'utf8');
const LIST = (/^## Allowed HTTP calls\n([\s\S]*?)^#/m.exec(DOC) || [])[1] || '';
const SOURCES = fs.readdirSync(path.join(S, 'src'), { recursive: true }).sort()
  .filter(f => fs.statSync(path.join(S, 'src', f)).isFile())
  .map(f => ({ file: 'src/' + f.split(path.sep).join('/'), text: fs.readFileSync(path.join(S, 'src', f), 'utf8') }));
// Every channel the application could reach a server through, the helpers that wrap fetch and client.post included.
const CALL = /((?:[\w$]+\.)*)\b(fetch|post|memberFile|GM_xmlhttpRequest|XMLHttpRequest|sendBeacon)\s*\(/g;
const CLOSE = { '(': ')', '[': ']', '{': '}' };
// Each call site of src/ as signature() writes it, with the text of the allowed list it falls under.
const ALLOWED = [
  { call: "fetch('https://api.github.com/repos/marjoriedotdev/nightango/releases/latest')", doc: '`GET https://api.github.com/repos/marjoriedotdev/nightango/releases/latest` through `fetch`, without cookie or credential' },
  { call: "fetch('https://api.vissle.me/v1/pmr/' + C.user.name)", doc: '`GET https://api.vissle.me/v1/pmr/{name}` through `fetch`, without cookie or credential' },
  { call: "fetch('https://vissle.me/api/v1/who/' + n)", doc: '`GET https://vissle.me/api/v1/who/{name}` through `fetch`, without cookie or credential' },
  { call: "fetch(CH.path('search'), { method: 'POST', body: form, credentials: 'include' })", doc: "The search `chatango.com/search` with `credentials: 'include'`" },
  { call: 'fetch(CH.subdomain.mod1(n))', doc: 'The public GETs on `ust.chatango.com`: `mod1.xml`' },
  { call: 'fetch(CH.subdomain.mod2(n))', doc: '`mod2.xml`' },
  { call: 'memberFile(CH.subdomain.custom_profile(n), …)', doc: '`custom_profile.css`' },
  { call: "memberFile(CH.subdomain.msgbg(n, 'xml'), …)", doc: '`msgbg.xml`' },
  { call: "post(CH.path('updateprofile'), …, {})", doc: '`client.post(url, form, {})`, to `chatango.com` only' },
  { call: "post(CH.path('updateprofile') + '?css', …, {})", doc: '`client.post(url, form, {})`, to `chatango.com` only' },
  { call: "post(CH.path('script/creategrouploginjs', 'st'), …, { cookie: true })", doc: '`client.post(url, form, { cookie: true })`' },
  // VISSLE_UPLOAD: its value is checked below, through the post helper.
  { call: 'post(VISSLE_UPLOAD, …, { key: true })', doc: "`client.post('https://vissle.me/chatango/upload', form, { key: true })`, and this URL only" },
  { call: "GM_xmlhttpRequest({ method: 'POST', url: 'https://vissle.me/track1/activity', anonymous: true, … })", doc: "`POST https://vissle.me/track1/activity`, through the loader's `GM_xmlhttpRequest` bridge, with `anonymous: true`" },
  { call: "GM_xmlhttpRequest({ method: 'GET', url: 'https://' + link[1] + '/' + link[2] + '/', anonymous: true, … })", doc: "`GET https://www.tiktok.com/t/{code}/`, `https://vm.tiktok.com/{code}/` or `https://vt.tiktok.com/{code}/`, through the loader's `GM_xmlhttpRequest` bridge (`@connect tiktok.com`), with `anonymous: true`" },
  // The helpers themselves: their callers are listed above.
  { call: 'fetch(url)', within: 'memberFile' },
  { call: 'C.post(url, form, item)', within: 'post' }
];
// Hosts the userscript manager lets the loader reach, with the text of the allowed list that needs them.
const CONNECT = { 'vissle.me': '`POST https://vissle.me/track1/activity`', 'tiktok.com': '(`@connect tiktok.com`)' };

/**
 * Blanks the comments of a source and keeps its offsets and lines.
 * @param {string} text Source.
 */
function uncomment(text) {
  // A comment starts a line or follows a space: /^https?:\/\// is a regular expression.
  return text.replace(/(?<=^|\s)(?:\/\/[^\n]*|\/\*[\s\S]*?\*\/)|'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"/gm, m => m[0] === '/' ? m.replace(/[^\n]/g, ' ') : m);
}
/**
 * Returns the index after the string or bracket group that starts at i, or i + 1 for any other character.
 * @param {string} code Source without comments.
 * @param {number} i Index.
 */
function skip(code, i) {
  const c = code[i];
  let j = i + 1;
  if (c === "'" || c === '"') { while (j < code.length && code[j] !== c) j += code[j] === '\\' ? 2 : 1; return j + 1; }
  if (CLOSE[c]) { while (j < code.length && code[j] !== CLOSE[c]) j = skip(code, j); return j + 1; }
  return j;
}
/**
 * Splits the content of a bracket group at its top-level commas.
 * @param {string} code Source without comments.
 * @param {number} open Index of the opening bracket.
 */
function items(code, open) {
  const end = skip(code, open) - 1, list = [];
  let from = open + 1;
  for (let i = from; i < end;) {
    if (code[i] === ',') { list.push(code.slice(from, i)); from = ++i; } else i = skip(code, i);
  }
  list.push(code.slice(from, end));
  return list.map(x => x.replace(/\s+/g, ' ').trim()).filter((x, k, all) => x || all.length > 1);
}
/**
 * Writes a call site in the form of the ALLOWED list: the target and the options, never the form sent.
 * @param {string} callee Called name with its object.
 * @param {string[]} a Arguments as written.
 */
function signature(callee, a) {
  if (callee === 'post') return `post(${a[0]}, …, ${a[2]})`;
  if (callee === 'memberFile') return `memberFile(${a[0]}, …)`;
  if (callee === 'GM_xmlhttpRequest') {
    const p = {};
    if (a[0] && a[0][0] === '{') items(a[0], 0).forEach(x => { const k = x.indexOf(':'); p[x.slice(0, k).trim()] = x.slice(k + 1).trim(); });
    return `GM_xmlhttpRequest({ method: ${p.method}, url: ${p.url}, anonymous: ${p.anonymous}, … })`;
  }
  return `${callee}(${a.join(', ')})`;
}
/**
 * Tells whether an index falls in the body of a named function.
 * @param {string} code Source without comments.
 * @param {string} name Function name.
 * @param {number} at Index.
 */
function inside(code, name, at) {
  const m = new RegExp('\\bfunction ' + name + '\\s*\\(').exec(code);
  if (!m) return false;
  const open = code.indexOf('{', skip(code, m.index + m[0].length - 1));
  return at > open && at < skip(code, open);
}

const sites = [];
SOURCES.filter(s => s.file.endsWith('.js')).forEach(({ file, text }) => {
  const code = uncomment(text), lines = text.split('\n');
  for (const m of text.matchAll(CALL)) {
    if (/\bfunction\s+$/.test(text.slice(Math.max(0, m.index - 20), m.index))) continue;
    const line = text.slice(0, m.index).split('\n').length, read = code.startsWith(m[0], m.index);
    // Blanked outside a comment line, the call was misread as a comment: it counts as unlisted.
    if (!read && /^\s*(\/\/|\/?\*)/.test(lines[line - 1])) continue;
    sites.push({ file, code, at: m.index, line, sig: read ? signature(m[1] + m[2], items(code, m.index + m[0].length - 1)) : 'unreadable ' + m[0] });
  }
});
const listed = s => ALLOWED.some(a => a.call === s.sig && (!a.within || inside(s.code, a.within, s.at)));
step('every fetch, post and GM_xmlhttpRequest call site of src/ is in the allowed list (' + sites.length + ' call sites)',
  sites.length && sites.every(listed), sites.filter(s => !listed(s)).map(s => s.file + ':' + s.line + ' ' + s.sig));
step('every entry of the allowed list still has its call site', ALLOWED.every(a => sites.some(s => s.sig === a.call)),
  ALLOWED.filter(a => !sites.some(s => s.sig === a.call)).map(a => a.call));
step('every allowed call is written in docs/betterchatango-protocol.md, Allowed HTTP calls', LIST && ALLOWED.every(a => !a.doc || LIST.includes(a.doc)),
  ALLOWED.filter(a => a.doc && !LIST.includes(a.doc)).map(a => a.doc));
// fetch's credentials option is another one: the search uses it, as listed.
const password = SOURCES.flatMap(({ file, text }) => text.split('\n').map((l, i) => /\bcredential\b/.test(l) ? file + ':' + (i + 1) : null).filter(Boolean));
step('the client.post option that adds the password appears nowhere in src/', !password.length, password);
const header = (/==UserScript==([\s\S]*?)==\/UserScript==/.exec((SOURCES.find(s => s.file === 'src/loader/skin-loader.js') || {}).text || '') || [])[1] || '';
const tags = name => [...header.matchAll(new RegExp('^// @' + name + '\\s+(\\S+)', 'gm'))].map(m => m[1]);
step('the userscript grants GM_xmlhttpRequest only and connects only to the hosts of the allowed list',
  JSON.stringify(tags('grant')) === '["GM_xmlhttpRequest"]' && JSON.stringify(tags('connect').sort()) === JSON.stringify(Object.keys(CONNECT).sort())
    && Object.values(CONNECT).every(t => LIST.includes(t)), { grant: tags('grant'), connect: tags('connect') });

/* ---------- Post helper of the bridge ---------- */
const posts = [], journal = [];
const CH = { path: (p, sub) => 'https://' + (sub ? sub + '.' : '') + 'chatango.com/' + p };
const w = new JSDOM('<!doctype html><body></body>', { runScripts: 'outside-only', virtualConsole: new VirtualConsole() }).window;
w.__TORCH_LIVE__ = true;
w.__TORCH_JOURNAL__ = { add: (kind, text) => { journal.push(text); } };
w.__betterChatangoRefs = {
  chatango: CH,
  client: {
    user: { name: 'marjorie' }, groups: {}, event: { group: {}, private: {} }, on() {}, setProfile() {},
    // Replies of the vissle upload, the group creation and the updateprofile forms.
    post(url, form, item) {
      posts.push([url, JSON.stringify(item)]);
      return Promise.resolve(url === 'https://vissle.me/chatango/upload' ? 'data:abc/f.png' : /creategrouploginjs$/.test(url) ? 'groupcreated'
        : form.get('action') === 'fullpic' ? 'pix:1' : 'x0=1&y0=2&ts=3&age=40&sex=M&loc=Paris');
    }
  }
};
w.eval(concatSources(S, layerSources('bridge')) + '; window.__bridge = liveBridge;');
/**
 * Lists the cases where postRefusal does not give the expected verdict.
 * @param {Array<[string, Object, string]>} cases URL, options and refused or allowed.
 */
function wrongVerdicts(cases) {
  const verdict = (url, item) => { try { return w.postRefusal(url, item) ? 'refused' : 'allowed'; } catch (e) { return 'CRASH ' + e.message; } };
  return cases.filter(([url, item, want]) => verdict(url, item) !== want).map(([url, item]) => [url, item, verdict(url, item)]);
}
const PROFILE = 'https://chatango.com/updateprofile', UPLOAD = 'https://vissle.me/chatango/upload';

(async () => {
  const B = w.__bridge, file = new w.File(['moon'], 'moon.png', { type: 'image/png' });
  const settle = p => p.then(() => 'sent', e => 'refused: ' + e.message);
  const current = [
    await settle(B.saveProfile({ age: 40, gender: 'M', location: 'Paris', about: 'Hi', full: '' })),
    await settle(B.uploadAvatar(file)),
    await settle(B.saveAvatarCrop({ x0: 1, y0: 2, ts: 3 })),
    await settle(B.saveProfileStyle({ bg: '#ffffff', text: '#222222', link: '#0084ef', image: '', tileDown: false, tileAcross: false }, false)),
    await settle(B.uploadFile(file)),
    await settle(B.createGroup({ name: 'moonroom', title: 'Moon', description: 'Night', discovery: false }))
  ];
  step('the six current call sites reach BetterChatango with their target and options', current.every(r => r === 'sent') && JSON.stringify(posts) === JSON.stringify([
    [PROFILE, '{}'], [PROFILE, '{}'], [PROFILE, '{}'], [PROFILE + '?css', '{}'], [UPLOAD, '{"key":true}'], ['https://st.chatango.com/script/creategrouploginjs', '{"cookie":true}']
  ]), { current, posts });

  // A host of BetterChatango's list outside chatango.com: without an option, it would get the Chatango token.
  const before = posts.length;
  CH.path = p => 'https://vissle.me/chatango/' + p;
  const crop = await settle(B.saveAvatarCrop({ x0: 1, y0: 2, ts: 3 }));
  step('a post the helper refuses never reaches BetterChatango and is noted in the journal',
    posts.length === before && crop.startsWith('refused') && journal.some(t => t.startsWith('Refused a request to https://vissle.me/chatango/updateprofile: ')),
    { posts: posts.slice(before), crop, journal });

  const options = wrongVerdicts([
    [PROFILE, { credential: 'u' }, 'refused'], [PROFILE, { cookie: true, credential: 'u' }, 'refused'], [PROFILE, { progress: true }, 'refused'],
    [UPLOAD, { key: true, progress: true }, 'refused'], [PROFILE, { token: 'sid' }, 'refused'], [PROFILE, { cookie: true, key: true }, 'refused']
  ]);
  step('refuses the credential and progress options and any other option outside the list', !options.length, options);
  const noOption = wrongVerdicts([['https://vissle.me/chatango/updateprofile', {}, 'refused'], ['https://chatango.com.vissle.me/updateprofile', {}, 'refused'], [UPLOAD, {}, 'refused']]);
  step('refuses a post without an option to a host other than chatango.com', !noOption.length, noOption);
  const key = wrongVerdicts([[PROFILE, { key: true }, 'refused'], ['https://vissle.me/chatango/updateprofile', { key: true }, 'refused'], [UPLOAD + '?to=moon', { key: true }, 'refused']]);
  step('refuses the key option to any URL other than the vissle upload', !key.length, key);
  const allowed = wrongVerdicts([[PROFILE, {}, 'allowed'], [PROFILE + '?css', {}, 'allowed'], [UPLOAD, { key: true }, 'allowed'], ['https://st.chatango.com/script/creategrouploginjs', { cookie: true }, 'allowed']]);
  step('allows the targets and options of the six current call sites', !allowed.length, allowed);

  const failed = log.filter(l => l.startsWith('FAIL')).length;
  console.log(log.join('\n'));
  console.log('ERRORS: ' + (failed ? failed + ' failed' : 'none'));
  process.exit(failed ? 1 : 0);
})().catch(e => { console.log('CRASH ' + (e && e.stack || e)); process.exit(1); });
