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
const ranges = [
  ['halloween', [2026, 10, 24], [2026, 11, 2], 'both'],
  ['winter', [2026, 12, 1], [2027, 1, 6], 'north'],
  ['winter', [2027, 6, 1], [2027, 7, 6], 'south'],
  ['valentine', [2027, 2, 10], [2027, 2, 14], 'both']
];
for (const [season, first, last, where] of ranges) for (const south of [false, true]) {
  const shown = where === 'both' || (where === 'south') === south, at = seasonAt(south);
  const name = season + ' ' + first.join('-') + ' to ' + last.join('-') + ' in the ' + (south ? 'south' : 'north');
  const inside = [[...first, 0, 0, 0], [...last, 23, 59, 59]], outside = [[first[0], first[1], first[2] - 1, 23, 59, 59], [last[0], last[1], last[2] + 1, 0, 0, 0]];
  check(inside.every((t) => at(t) === (shown ? season : null)), name + (shown ? ': shown' : ': not shown') + ' from its first to its last second', inside.map(at));
  check(outside.every((t) => at(t) === null), name + ': no season the second before and after', outside.map(at));
}

/* Sky by the hour: the shares of the early and late skies at each keyframe, between two of them and across midnight */
const sky = (theme, hour) => { const s = util.skyAt(theme, hour); return [s.early, s.late]; };
const same = (a, b) => a.every((v, i) => Math.abs(v - b[i]) < 0.01);
const held = [
  ['dark', 0, [0, 0]], ['dark', 4, [0, 0]], ['dark', 5.5, [100, 0]], ['dark', 7.5, [0, 0]], ['dark', 12, [0, 0]], ['dark', 17, [0, 0]],
  ['dark', 19.5, [0, 100]], ['dark', 22.5, [0, 0]], ['dark', 23.99, [0, 0]],
  ['light', 0, [0, 0]], ['light', 8, [0, 0]], ['light', 12, [100, 0]], ['light', 14, [100, 0]], ['light', 16, [100, 0]],
  ['light', 19, [0, 100]], ['light', 21.5, [0, 0]], ['light', 23.99, [0, 0]]
];
check(held.every(([theme, hour, want]) => same(sky(theme, hour), want)), 'sky: each sky holds at its keyframes, the base sky outside the hours of the theme',
  held.filter(([theme, hour, want]) => !same(sky(theme, hour), want)).map(([theme, hour]) => [theme, hour, sky(theme, hour)]));
// Halfway between two keyframes the blend is at one half, a quarter of the way at 15.625%: smoothstep, not a straight line.
check(same(sky('dark', 4.75), [50, 0]) && same(sky('dark', 4.375), [15.625, 0]) && same(sky('dark', 21), [0, 50]) && same(sky('light', 10), [50, 0]),
  'sky: a sky comes in slowly, is half there midway and settles slowly', [sky('dark', 4.75), sky('dark', 4.375), sky('dark', 21), sky('light', 10)]);
// From full daylight to golden hour no part of the base sky comes back: the early share stays whole under the late one.
check(same(sky('light', 17.5), [100, 50]) && same(sky('light', 20.25), [0, 50]), 'sky: daylight turns to golden hour without passing through the base sky', [sky('light', 17.5), sky('light', 20.25)]);
// The early share counts in what the late sky leaves: what shows of it is that share of the rest.
const shown = ([e, l]) => [e * (100 - l) / 100, l];
const everyMinute = ['dark', 'light'].map((theme) => Array.from({ length: 1440 }, (_, m) => sky(theme, m / 60)));
check(everyMinute.every((day) => day.every((at, m) => at.every((v) => v >= 0 && v <= 100) && shown(at).every((v, i) => Math.abs(v - shown(day[(m + 1) % 1440])[i]) < 2))),
  'sky: no share leaves 0 to 100, and what shows of each sky never jumps from one minute to the next, midnight included');
