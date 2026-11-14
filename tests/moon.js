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

/* Season dates, read on the local date: the first and last second of each season and the seconds around it, in both hemispheres */
const util = {};
vm.runInNewContext(fs.readFileSync(process.argv[2] + '/src/core/util.js', 'utf8'), util);
const seasonAt = (south) => ([y, m, d, hh, mm, ss]) => util.seasonOf(new Date(y, m - 1, d, hh, mm, ss), south);
/* Each range with the season around it: Christmas cuts the northern winter in two and stands alone in the south */
const ranges = [
  ['halloween', [2026, 10, 24], [2026, 11, 2], 'both', null, null],
  ['winter', [2026, 12, 1], [2026, 12, 17], 'north', null, 'christmas'],
  ['christmas', [2026, 12, 18], [2026, 12, 26], 'both', 'winter', 'winter'],
  ['winter', [2026, 12, 27], [2027, 1, 6], 'north', 'christmas', null],
  ['winter', [2027, 6, 1], [2027, 7, 6], 'south', null, null],
  ['valentine', [2027, 2, 10], [2027, 2, 14], 'both', null, null]
];
for (const [season, first, last, where, before, after] of ranges) for (const south of [false, true]) {
  const shown = where === 'both' || (where === 'south') === south, at = seasonAt(south);
  const name = season + ' ' + first.join('-') + ' to ' + last.join('-') + ' in the ' + (south ? 'south' : 'north');
  const inside = [[...first, 0, 0, 0], [...last, 23, 59, 59]], outside = [[first[0], first[1], first[2] - 1, 23, 59, 59], [last[0], last[1], last[2] + 1, 0, 0, 0]];
  // The winter around Christmas is the northern one: the south has no season there.
  const around = [before, after].map((id) => id === 'winter' && south ? null : id);
  check(inside.every((t) => at(t) === (shown ? season : null)), name + (shown ? ': shown' : ': not shown') + ' from its first to its last second', inside.map(at));
  check(outside.every((t, i) => at(t) === around[i]), name + ': ' + around.map((id) => id || 'no season').join(' the second before, ') + ' the second after', outside.map(at));
}
