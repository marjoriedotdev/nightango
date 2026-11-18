const fs = require('fs');
const { JSDOM } = require('jsdom');
const { bundleForTest } = require('../scripts/build.mjs');
const S = process.argv[2];
(async () => {
const dom = new JSDOM('<!doctype html><body><div id="r"></div></body>', { runScripts: 'outside-only', pretendToBeVisual: true });
const w = dom.window;
w.eval(fs.readFileSync('node_modules/react/umd/react.development.js', 'utf8'));
w.eval(fs.readFileSync('node_modules/react-dom/umd/react-dom.development.js', 'utf8'));
w.eval(fs.readFileSync(S + '/torchds/project/components/bundle.js', 'utf8'));
w.__TORCH_LIVE__ = true;
// avatarSrc and the T.Avatar wrapper as assembled in the app, outside every season.
w.eval(await bundleForTest("export { T } from './src/core/globals.js'; export { avatarSrc } from './src/bridge/live-model.js';"));
w.__T = w.__mod.T; w.__src = w.__mod.avatarSrc;
const check = (c, msg) => console.log((c ? 'ok  ' : 'FAIL') + ' ' + msg);
check(w.__src('Marjorie', 36) === 'https://ust.chatango.com/profileimg/m/a/marjorie/thumb_m.jpg', 'url thumb_m');
check(w.__src('x', 22) === 'https://ust.chatango.com/profileimg/x/x/x/thumb.jpg', 'url 1 letter + thumb');
check(w.__src('_foo', 36) === 'https://ust.chatango.com/profileimg/sp/sp_foo/thumb_m.jpg', 'url sp/');
check(w.__src('!anon1234', 36) === null && w.__src('#temp', 36) === null, 'anons excluded');
const root = w.ReactDOM.createRoot(w.document.getElementById('r'));
w.ReactDOM.flushSync(() => root.render(w.React.createElement(w.__T.Avatar, { name: 'marjorie', status: 'online' })));
let img = w.document.querySelector('.tc-avatar-img');
check(img && img.getAttribute('src').endsWith('/m/a/marjorie/thumb_m.jpg'), 'img rendered');
check(w.document.querySelector('.tc-avatar').textContent === 'MA', 'initials kept underneath');
w.ReactDOM.flushSync(() => img.dispatchEvent(new w.Event('error')));
check(!w.document.querySelector('.tc-avatar-img') && w.document.querySelector('.tc-presence'), 'initials fallback after an error, presence intact');
w.ReactDOM.flushSync(() => root.render(w.React.createElement(w.__T.Avatar, { name: 'nightango', square: true })));
check(!w.document.querySelector('.tc-avatar-img') && w.document.querySelector('.tc-avatar').textContent === 'N', 'group avatar: initial, no picture request');
})().catch((e) => console.log('CRASH ' + e.stack));
