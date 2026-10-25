const fs = require('fs'), path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');
const S = process.argv[2];
let html = fs.readFileSync(S + '/dist/torch-client.html', 'utf8');
const react = fs.readFileSync('node_modules/react/umd/react.development.js', 'utf8');
const rdom = fs.readFileSync('node_modules/react-dom/umd/react-dom.development.js', 'utf8');
html = html.replace(/<script src="[^"]*react\.production\.min\.js"[^>]*><\/script>/, () => '<script>' + react + '</script>')
           .replace(/<script src="[^"]*react-dom\.production\.min\.js"[^>]*><\/script>/, () => '<script>' + rdom + '</script>');
const errors = [];
const vc = new VirtualConsole();
vc.on('error', e => errors.push(String(e && e.message || e)));
vc.on('jsdomError', e => errors.push('jsdom: ' + e.message));
vc.on('warn', e => { if (!/act\(|ReactDOM.render|useLayoutEffect/.test(String(e))) errors.push('warn: ' + String(e).slice(0, 300)); });
const dom = new JSDOM('<!doctype html><html><head></head><body>' + html + '</body></html>', { runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc, url: 'https://example.test/' });
const w = dom.window, d = w.document;
w.matchMedia = w.matchMedia || (() => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
// jsdom n'a ni CSS.supports ni ResizeObserver : le fil prend le chemin sans ancrage natif, sans mesure.
w.CSS = { supports: () => false };
w.ResizeObserver = function () { return { observe() {}, disconnect() {} }; };
w.HTMLElement.prototype.scrollIntoView = function () {};
const wait = ms => new Promise(r => setTimeout(r, ms));
const $ = s => d.querySelector(s), $$ = s => [...d.querySelectorAll(s)];
function click(el) { if (!el) throw new Error('missing element'); el.dispatchEvent(new w.MouseEvent('click', { bubbles: true })); }
function byText(sel, txt) { return $$(sel).find(e => e.textContent.trim() === txt) || $$(sel).find(e => e.textContent.includes(txt)); }
function type(el, v) { const setter = Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, 'value').set; const tsetter = Object.getOwnPropertyDescriptor(w.HTMLTextAreaElement.prototype, 'value').set; (el.tagName === 'TEXTAREA' ? tsetter : setter).call(el, v); el.dispatchEvent(new w.Event('input', { bubbles: true })); }
function key(el, k, extra) { el.dispatchEvent(new w.KeyboardEvent('keydown', Object.assign({ key: k, bubbles: true }, extra || {}))); }
const log = [];
function step(name, ok) { log.push((ok ? 'ok   ' : 'FAIL ') + name); }
(async () => {
  await wait(300);
  step('login renders', !!byText('h2', 'Welcome back'));
  type($('#lg-pass'), 'x'); click(byText('button', 'Log in') && $$('button[type=submit]')[0]);
  await wait(800);
  step('chat renders', !!$('.log') && !!byText('h1', 'community'));
  step('messages', $$('.tc-msg').length >= 5);
  const ta = $('.tc-composer textarea'); type(ta, 'Hello from the smoke test @sable'); key(ta, 'Enter');
  await wait(100);
  step('sent message', d.body.textContent.includes('Hello from the smoke test'));
  click($('button[aria-label="Reply"]')); await wait(50);
  step('reply context', !!$('.tc-composer-context'));
  click($('button[aria-label="Cancel reply"]'));
  click($('button[aria-label="More actions"]')); await wait(50);
  step('message menu', !!$('.menu'));
  key(d, 'Escape'); await wait(20);
  const shownBefore = $$('.tc-msg').length;
  click($('button[aria-label="Search in this group"]')); await wait(50);
  type($('#gsearch'), 'reconnect'); await wait(50);
  const hits = $$('.tc-msg .tc-msg-text').map(x => x.textContent.toLowerCase());
  step('search filters', hits.length >= 1 && hits.length < shownBefore && hits.every(t => t.includes('reconnect')));
  click($('button[aria-label="Search in this group"]'));
  click($$('.mrow')[0]); await wait(50);
  step('profile dialog', !!$('.profile-card'));
  key(d, 'Escape'); await wait(30);
  click(byText('.tc-nav', 'torchdev')); await wait(80);
  step('switch group + new marker', !!byText('h1', 'torchdev') && !!$('.newmark'));
  click(byText('.tc-nav', 'Private messages')); await wait(80);
  step('dm list', $$('.conv').length >= 3);
  click($$('.conv')[0]); await wait(80);
  const ta2 = $('.thread .tc-composer textarea'); if (ta2) { type(ta2, 'ping'); key(ta2, 'Enter'); }
  await wait(50);
  step('dm send', $$('.thread .tc-msg-text').some(x => x.textContent === 'ping'));
  click(byText('.tc-nav', 'Discover groups')); await wait(80);
  step('discover', !!byText('h2', 'Popular right now'));
  type($('#join'), 'https://nihongo.chatango.com/'); click(byText('button[type=submit]', 'Join')); await wait(100);
  step('join by link', !!byText('h1', 'nihongo'));
  click(byText('.tc-nav', 'Discover groups')); await wait(50);
  type($('#join'), 'nosuchgroup'); click(byText('button[type=submit]', 'Join')); await wait(50);
  step('join error + create offer', !!byText('button', 'Create nosuchgroup'));
  click(byText('button', 'Create nosuchgroup')); await wait(50);
  click(byText('.dialog button', 'Create group')); await wait(100);
  step('create group', !!byText('h1', 'nosuchgroup'));
  key(d, 'k', { ctrlKey: true }); await wait(50);
  step('palette', !!$('.pal-input'));
  type($('.pal-input'), 'appear'); await wait(30); key($('.pal-input'), 'Enter'); await wait(80);
  step('palette to appearance', !!byText('h1', 'Appearance'));
  for (const pg of ['Profile', 'Privacy', 'Safety', 'Password and email', 'Chatango Premium', 'Notifications', 'Language', 'Accessibility', "What's new", 'About Nightango', 'Appearance']) {
    click(byText('.snav .tc-nav', pg)); await wait(40);
    step('settings ' + pg, !!byText('h1', pg));
  }
  click(byText('.snav .tc-nav', 'Back to chat')); await wait(80);
  click(byText('.tc-nav', 'community')); await wait(80);
  click($('button[aria-label="Group options"]')); await wait(30); click(byText('.menu button', 'Group settings')); await wait(80);
  step('group settings', !!byText('h1', 'Overview'));
  for (const pg of ['Announcement', 'AutoMod', 'Media and links', 'Bans', 'Audit log', 'Staff and roles', 'Members', 'Invites']) {
    click(byText('.snav .tc-nav', pg)); await wait(40);
    step('gsettings ' + pg, !!byText('h1', pg));
  }
  click(byText('.snav .tc-nav', 'Back to chat')); await wait(80);
  step('back from gsettings', !!$('.log'));
  click(byText('.tc-nav', 'Friends')); await wait(80);
  step('friends tab', $$('.convs .conv').length >= 1);
  click(byText('.tc-nav', 'Meet people')); await wait(80);
  if ($$('.convs .conv')[0]) { click($$('.convs .conv')[0]); await wait(80); click(byText('.dialog button', 'Full profile')); await wait(80); }
  step('full profile dialog (prototype)', !!$('iframe.fullprofile'));
  console.log(log.join('\n'));
  console.log('ERRORS:', errors.length ? '\n' + [...new Set(errors)].slice(0, 15).join('\n---\n') : 'none');
  process.exit(0);
})().catch(e => { console.log(log.join('\n')); console.log('CRASH', e.stack); console.log('ERRORS:', [...new Set(errors)].slice(0, 10).join('\n---\n')); process.exit(1); });
