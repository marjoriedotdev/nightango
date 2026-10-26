const fs = require('fs'), vm = require('vm');
const React = require('react'), Server = require('react-dom/server');
const ctx = { window: { React }, React, console };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(process.argv[2] + '/torchds/project/components/bundle.js', 'utf8'), ctx);
const T = ctx.window.Torch;
const check = (c, msg, detail) => console.log((c ? 'ok  ' : 'FAIL') + ' ' + msg + (c || !detail ? '' : ' ' + JSON.stringify(detail)));

/* April 2024 phases, UTC times from the Perth Observatory table: the mean synodic month must land within a few hours */
const near = (a, b) => Math.min(Math.abs(a - b), 1 - Math.abs(a - b)) < 0.02;
const cases = [
  ['2024-04-08T18:21Z', 0, 'New moon'],
  ['2024-04-15T19:13Z', 0.25, 'First quarter'],
  ['2024-04-23T23:49Z', 0.5, 'Full moon'],
  ['2024-05-01T11:27Z', 0.75, 'Last quarter']
];
for (const [iso, phase, name] of cases) {
  const m = T.moonPhase(Date.parse(iso));
  check(near(m.phase, phase) && m.name === name, name + ' on ' + iso.slice(0, 10), m);
}
check(T.moonPhase(Date.parse('2024-04-08T18:21Z')).lit < 0.01 && T.moonPhase(Date.parse('2024-04-23T23:49Z')).lit > 0.99, 'lit part at new and full moon');

/* Drawing: lit side on the right while the moon waxes, on the left while it wanes (northern hemisphere) */
const svg = (iso) => Server.renderToStaticMarkup(React.createElement(T.Moon, { date: Date.parse(iso), size: 20, label: true }));
const limb = (markup) => /d="M10 0A10 10 0 0 (\d)/.exec(markup)[1];
check(limb(svg('2024-04-15T19:13Z')) === '1' && limb(svg('2024-05-01T11:27Z')) === '0', 'lit limb on the right while waxing, on the left while waning');
check(svg('2024-04-23T23:49Z').includes('aria-label="Full moon, 100% lit"') && !Server.renderToStaticMarkup(React.createElement(T.Moon, null)).includes('aria-label'), 'named only when asked');
