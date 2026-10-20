const fs = require('fs'), path = require('path'), vm = require('vm');
const React = require('react'), Server = require('react-dom/server');
const root = process.argv[2] + '/torchds/project/components';
const ctx = { window: {}, React, console };
ctx.window.React = React;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(root + '/bundle.js', 'utf8'), ctx);
const T = ctx.window.Torch;
let bad = 0;
for (const dir of fs.readdirSync(root)) {
  const p = path.join(root, dir, 'preview.html');
  if (dir === 'Cover' || !fs.existsSync(p)) continue;
  const html = fs.readFileSync(p, 'utf8');
  const m = html.match(/function Demo\(\) \{([\s\S]*?)\n\}\nReactDOM/);
  try {
    const Demo = new Function('T', 'h', 'React', 'return function Demo(){' + m[1] + '}')(T, React.createElement, React);
    const out = Server.renderToString(React.createElement(Demo));
    console.log(dir.padEnd(18), out.length);
  } catch (e) { bad++; console.log(dir, 'ERROR', e.message); }
}
process.exit(bad);
