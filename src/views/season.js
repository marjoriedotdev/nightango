// -- Seasonal decorations ------------------------------------------------------

var BAT_PATH = 'M22 5 21 1.5 23 3.5h2l2-2L26 5c6-3 14-4 22 1-3 .5-6 1-8 4-2-2-6-2-8 1-2-1-5 0-6 3q-2 4-4 0c-1-3-4-4-6-3-2-3-6-3-8-1-2-3-5-3.5-8-4 8-5 16-4 22-1z';
var HEART_PATH = 'M6 10.5C2.5 8 0 5.8 0 3.2 0 1.4 1.4 0 3.1 0 4.3 0 5.4.7 6 1.7 6.6.7 7.7 0 8.9 0 10.6 0 12 1.4 12 3.2c0 2.6-2.5 4.8-6 7.3z';
var SNOWFLAKE_PATH = 'M6 0v12M.8 3l10.4 6M.8 9l10.4-6M4.6 1 6 2.2 7.4 1M4.6 11 6 9.8 7.4 11';
var STAR_PATH = 'M6 0C6.4 3.6 8.4 5.6 12 6 8.4 6.4 6.4 8.4 6 12 5.6 8.4 3.6 6.4 0 6 3.6 5.6 5.6 3.6 6 0z';
var FIR_STEMS_PATH = 'M97 3Q66 5 38 21M71 9.6Q66 20 56 29';
var FIR_NEEDLES_PATH = 'M93.9 3.2l-4.1 -2.4M93.9 3.2l-3.6 3.1M89.6 3.7l-4.3 -2.9M89.6 3.7l-3.5 3.9M85 4.3l-5 -2.5M85 4.3l-4 3.9M80.8 5l-5.1 -3M80.8 5l-3.6 4.6M76.6 5.9l-5.7 -2.4M76.6 5.9l-4.1 4.6M72.1 7l-5.7 -2.8M72.1 7l-3.6 5.2M67.9 8.1l-6 -2.1M67.9 8.1l-3.9 5M63.8 9.4l-5.9 -2.5M63.8 9.4l-3.2 5.5M59.7 10.9l-6 -1.7M59.7 10.9l-3.5 5.2M55.4 12.5l-5.7 -2M55.4 12.5l-2.7 5.4M51.3 14.3l-5.7 -1.2M51.3 14.3l-2.9 5M47.3 16.1l-5.2 -1.5M47.3 16.1l-2.1 5M43.6 17.9l-5 -.7M43.6 17.9l-2.3 4.5M39.7 20.1l-4.6 -1M39.7 20.1l-1.6 4.4M38 21l-4.4 2.5M68.6 14l-4.4 1.9M68.6 14l.4 4.8M66.2 17.7l-5.2 1.2M66.2 17.7l.5 5.3M63.5 21.2l-5.2 1.4M63.5 21.2l-.4 5.3M60.6 24.5l-4.9 .5M60.6 24.5l-.2 4.9M57.5 27.6l-4.1 .6M57.5 27.6l-.8 4.1M56 29l-3.2 2.9';
// Bulbs of the string of lights as [x, y] of their socket on the wire.
var LIGHT_BULBS = [[15, 9.8], [30, 13], [45, 11.8], [75, 11.2], [90, 12.8], [105, 10.7], [135, 9.1], [150, 9.5], [165, 6.1]];
var COSTUMES = { halloween: ['hat', 'ears', 'horns', 'bat', null], winter: ['beanie', 'earmuffs', null], christmas: ['santa', 'antlers', 'elf', null] };

/**
 * Returns the costume a member wears during a season, the same on every screen.
 * @param {string} season Season with costumes.
 * @param {string} name Member.
 */
function costumeOf(season, name) {
  var s = String(name || ''), n = 7, list = COSTUMES[season];
  for (var i = 0; i < s.length; i++) n = (n * 33 + s.charCodeAt(i)) >>> 0;
  return list[n % list.length];
}

/**
 * Costume drawn over an avatar, sized against the avatar box.
 * @param {{season: string, name: string, color: string}} p Season, member and avatar color.
 */
function Costume(p) {
  var kind = costumeOf(p.season, p.name);
  if (kind === 'hat') return h('svg', { className: 'costume costume-hat', viewBox: '0 0 24 20' },
    h('path', { className: 'costume-hat-fill', d: 'M1 16.5c5-2 17-2 22 0-4 2.4-18 2.4-22 0z' }),
    h('path', { className: 'costume-hat-fill', d: 'M6 16c1.6-4.4 3.2-9.6 7-14.4 1 .9 1.1 2.6 1.7 4.8.9 3.2 2.3 6.6 4.1 9.6z' }),
    h('path', { className: 'costume-hat-band', d: 'M6.7 13.9c3.6-.9 7.8-.9 11.2 0l.6 1.7c-4-.9-8.2-.9-12.4 0z' }));
  if (kind === 'ears') return h('svg', { className: 'costume costume-ears', viewBox: '0 0 28 12' },
    h('path', { d: 'M3 12 5 1l7 7zM25 12 23 1l-7 7z', style: { fill: p.color || T.avatarColor(p.name) } }),
    h('path', { className: 'costume-ears-inner', d: 'M5.4 8.4 6 3.8l3 3zM22.6 8.4 22 3.8l-3 3z' }));
  if (kind === 'horns') return h('svg', { className: 'costume costume-horns', viewBox: '0 0 28 12' },
    h('path', { className: 'costume-horns-fill', d: 'M5 11C3 7 4 3 7 0c-.5 3 0 6 3 9zM23 11c2-4 1-8-2-11 .5 3 0 6-3 9z' }));
  if (kind === 'bat') return h('svg', { className: 'costume costume-bat', viewBox: '0 0 48 24' },
    h('path', { className: 'costume-hat-fill', d: BAT_PATH }));
  if (kind === 'beanie') return h('svg', { className: 'costume costume-beanie', viewBox: '0 0 24 17' },
    h('path', { className: 'costume-knit', d: 'M3.5 13.5C3.5 7.6 7.2 4.4 12 4.4s8.5 3.2 8.5 9.1z' }),
    h('path', { className: 'costume-knit-cuff', d: 'M2.6 12.4c6-1.2 12.8-1.2 18.8 0l.2 3.6c-6.4-1.3-12.8-1.3-19.2 0z' }),
    h('circle', { className: 'costume-pompom', cx: 12, cy: 3, r: 2.6 }));
  if (kind === 'earmuffs') return h('svg', { className: 'costume costume-earmuffs', viewBox: '0 0 32 22' },
    h('path', { className: 'costume-muff-band', d: 'M5 13C5 5.5 9.8 1.6 16 1.6S27 5.5 27 13' }),
    h('ellipse', { className: 'costume-muff', cx: 4.6, cy: 15, rx: 3.8, ry: 5 }),
    h('ellipse', { className: 'costume-muff', cx: 27.4, cy: 15, rx: 3.8, ry: 5 }));
  if (kind === 'santa') return h('svg', { className: 'costume costume-santa', viewBox: '0 0 26 20' },
    h('path', { className: 'costume-felt', d: 'M4 14.6C4.2 8 8.6 2.6 14.6 2.4c4-.1 7.6 2.6 9.2 7l-3 1.2c-.8-1.8-2.2-3.2-4-3.8 1.8 2.4 2.8 5 3 7.8z' }),
    h('path', { className: 'costume-fur', d: 'M2.6 13.6c5.6-1.5 12.4-1.5 18.4 0 1 .3 1.3 1 1.3 2s-.6 1.9-1.6 1.7c-5.6-1.3-12-1.3-17.6 0-1 .2-1.7-.6-1.7-1.6s.3-1.8 1.2-2.1z' }),
    h('circle', { className: 'costume-fur', cx: 22.6, cy: 10.6, r: 2.5 }));
  if (kind === 'antlers') return h('svg', { className: 'costume costume-antlers', viewBox: '0 0 32 14' },
    h('path', { d: 'M10.5 13.5C8 10.5 6.6 7 6.6 1.6M7.6 9 3 6.4M6.8 5.4 10 2.6M21.5 13.5C24 10.5 25.4 7 25.4 1.6M24.4 9 29 6.4M25.2 5.4 22 2.6' }));
  if (kind === 'elf') return h('svg', { className: 'costume costume-elf', viewBox: '0 0 24 20' },
    h('path', { className: 'costume-elf-fill', d: 'M4.2 15C5 8.6 8 3.6 4.6 1c5.4.4 11.2 5 15.4 14z' }),
    h('path', { className: 'costume-elf-cuff', d: 'M3.3 13.8c5.4-1.7 12.2-1.7 17.6 0l.5 2.9c-6-1.7-12.6-1.7-18.6 0z' }),
    h('circle', { className: 'costume-elf-bell', cx: 4.2, cy: 1.4, r: 1.5 }));
  return null;
}

/**
 * Decorations of the season in the sky band of the navigation.
 * @param {{season: string, south: boolean}} p Season shown and whether the sky is seen from the southern hemisphere.
 */
function SeasonSky(p) {
  if (p.season === 'winter') return h(WinterSky);
  if (p.season === 'christmas') return h(ChristmasSky, { snow: !p.south });
  if (p.season === 'valentine') return h(ValentineSky);
  return h(HalloweenSky);
}

/**
 * Bats and a dead branch in the sky band of the navigation.
 */
function HalloweenSky() {
  return h('span', { className: 'season-sky', 'aria-hidden': 'true' },
    h('svg', { className: 'season-branch', viewBox: '0 0 96 58' },
      h('path', { d: 'M96 5C78 7 66 13 52 11 43 10 37 15 28 14l-2-2c7-1 13-5 21-5 11 0 21-5 49-7zM62 11c-2 7-6 11-12 15l-1-2c5-3 8-7 10-13zM40 12c-4 7-3 13-6 19l-2-1c3-6 2-12 5-18zM80 6c1 5 0 9-2 13l-1-1c2-4 2-8 1-12z' })),
    h('span', { className: 'season-flight season-flight-1' }, h('svg', { className: 'season-bat', viewBox: '0 0 48 24' }, h('path', { d: BAT_PATH }))),
    h('span', { className: 'season-flight season-flight-2' }, h('svg', { className: 'season-bat', viewBox: '0 0 48 24' }, h('path', { d: BAT_PATH }))));
}

/**
 * Returns slow snowflakes above the name.
 * @param {Array<number>} lanes Lanes of the sky band where one falls, among 1 to 5.
 */
function snowflakes(lanes) {
  return lanes.map(function (i) {
    return h('span', { key: i, className: 'season-fall season-fall-' + i }, h('svg', { className: 'season-flake', viewBox: '0 0 12 12' }, h('path', { d: SNOWFLAKE_PATH })));
  });
}

/**
 * Frost in the corner of the sky band and a few slow snowflakes above the name.
 */
function WinterSky() {
  return h('span', { className: 'season-sky', 'aria-hidden': 'true' },
    h('svg', { className: 'season-frost', viewBox: '0 0 96 58' },
      h('path', { d: 'M96 0C86 8 74 12 60 13M84 6l-3-6M84 6l5 5M72 10l-2-7M72 10l3 7M62 12.5l-3-6M62 12.5l1 6M96 0c-4 11-6 22-14 32M92 11l7 2M92 11l-6-4M88 21l6 5M88 21l-8-1M84 29l-6 2M84 29l2 6' })),
    snowflakes([1, 2, 3, 4, 5]));
}

/**
 * A string of lights along the top of the sky band and a fir branch with a bauble in its corner.
 * @param {{snow: boolean}} p Whether snowflakes fall, under the northern sky only.
 */
function ChristmasSky(p) {
  return h('span', { className: 'season-sky', 'aria-hidden': 'true' },
    h('svg', { className: 'season-lights', viewBox: '0 0 180 30' },
      h('path', { className: 'season-lights-wire', d: 'M0 2Q30 22 60 6Q90 20 120 5Q150 17 180-1' }),
      LIGHT_BULBS.map(function (b, i) {
        return h('g', { key: i, className: 'season-bulb season-bulb-' + (i % 4 + 1) },
          h('circle', { className: 'season-bulb-halo', cx: b[0], cy: b[1] + 4.2, r: 5.5 }),
          h('path', { className: 'season-bulb-cap', d: 'M' + (b[0] - 1.1) + ' ' + b[1] + 'h2.2v1.6h-2.2z' }),
          h('ellipse', { cx: b[0], cy: b[1] + 4.4, rx: 2.3, ry: 3 }));
      })),
    h('svg', { className: 'season-fir', viewBox: '0 0 96 58' },
      h('path', { className: 'season-fir-stem', d: FIR_STEMS_PATH }),
      h('path', { d: FIR_NEEDLES_PATH }),
      h('path', { className: 'season-bauble-thread', d: 'M61 23v7' }),
      h('circle', { className: 'season-bauble', cx: 61, cy: 34.6, r: 4.6 }),
      h('path', { className: 'season-bauble-cap', d: 'M59.6 29.4h2.8v1.6h-2.8z' }),
      h('path', { className: 'season-bauble-shine', d: 'M58.6 33.2a3 3 0 0 1 2-1.6' })),
    p.snow ? snowflakes([2, 3, 4]) : null);
}

/**
 * Star beside the moon of the brand at Christmas.
 */
function SeasonStar() {
  return h('svg', { className: 'season-star', viewBox: '0 0 12 12', 'aria-hidden': 'true' }, h('path', { d: STAR_PATH }));
}

/**
 * A garland of small hearts in the corner of the sky band and a few hearts rising above the name.
 */
function ValentineSky() {
  return h('span', { className: 'season-sky', 'aria-hidden': 'true' },
    h('svg', { className: 'season-garland', viewBox: '0 0 96 40' },
      h('path', { className: 'season-garland-thread', d: 'M30 0Q50 18 70 10T96 4M44 9v8M62 12v12M82 7v6' }),
      h('path', { transform: 'translate(40.4 16) scale(.6)', d: HEART_PATH }),
      h('path', { transform: 'translate(57.8 23) scale(.7)', d: HEART_PATH }),
      h('path', { transform: 'translate(78.7 12) scale(.55)', d: HEART_PATH })),
    [1, 2, 3].map(function (i) {
      return h('span', { key: i, className: 'season-rise season-rise-' + i }, h('svg', { className: 'season-heart', viewBox: '0 0 12 11' }, h('path', { d: HEART_PATH })));
    }));
}

/**
 * Cobweb in the top corner of a column, with a spider on its thread.
 */
function SeasonWeb() {
  return h('span', { className: 'season-web', 'aria-hidden': 'true' },
    h('svg', { className: 'season-web-threads', viewBox: '0 0 120 120' },
      h('path', { d: 'M120 0H0M120 0 12 48M120 0 40 88M120 0 80 112M120 0v120M84 0q8 6 3.6 14.4 9.4 4.6 8.4 12 9 1.6 12 7.2 7-.6 12 2.4M54 0q12 12 6.6 26.4 12.4 8.6 15.4 22 14 3.6 22 13.2 12-.6 22 4.4M24 0q17 17 9.6 38.4 17.4 12.6 22.4 32 20 6.6 32 19.2 17 .4 32 6.4' })),
    h('span', { className: 'season-spider' },
      h('span', { className: 'season-spider-thread' }),
      h('svg', { viewBox: '0 0 20 20' },
        h('path', { className: 'season-spider-legs', d: 'M7 9 2 6 1 3M7 11H1.5L.5 8M7 13l-5 3-1 3M13 9l5-3 1-3M13 11h5.5l1-3M13 13l5 3 1 3' }),
        h('ellipse', { cx: 10, cy: 12, rx: 3.6, ry: 4.2 }),
        h('circle', { cx: 10, cy: 6.8, r: 2.3 }))));
}

// -- New Year -----------------------------------------------------------------

// Bursts as [left, top, radius in px, delay in s]: in the sky, on the gutters around the panels, on the band, above the name.
var SKY_BURSTS = [
  ['calc(var(--size-sidebar) + 15px)', '6%', 46, 0], ['calc(100% - var(--size-members) - 15px)', '12%', 52, -1.1],
  ['4px', '30%', 40, -1.8], ['calc(100% - 4px)', '22%', 44, -0.5], ['calc(var(--size-sidebar) + 15px)', '58%', 50, -2.2],
  ['calc(100% - var(--size-members) - 15px)', '72%', 42, -1.5], ['38%', '4px', 46, -0.8], ['66%', 'calc(100% - 4px)', 40, -2.6]
];
var BAND_BURSTS = [['66px', '-24px', 16, 0], ['142px', '-34px', 20, -1.2], ['212px', '-22px', 15, -2.1]];
var FIREWORK_RAYS = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

function newYearNow() { return Date.now(); }
/*PROTOTYPE*/
// Review of the hosted prototype: plays the last ten seconds of the year, then the fireworks, whatever the date.
window.showNewYear = function () {
  var shift = new Date(new Date().getFullYear() + 1, 0, 1).getTime() - 10000 - Date.now();
  newYearNow = function () { return Date.now() + shift; };
  window.dispatchEvent(new Event('torch-new-year'));
};
/*END PROTOTYPE*/

/**
 * Returns where the device time stands around New Year's midnight (newYearAt), rendered again each time it changes.
 */
function useNewYear() {
  var s = useState(newYearNow), now = s[0], setNow = s[1];
  var at = newYearAt(now);
  useEffect(function () {
    // An hour at most: a timer runs late after the device sleeps, and setTimeout fires at once past 24 days.
    var timer = setTimeout(function () { setNow(newYearNow()); }, Math.min(at.next, 60 * MIN));
    return function () { clearTimeout(timer); };
  }, [now]);
  /*PROTOTYPE*/
  useEffect(function () {
    function show() { setNow(newYearNow()); }
    window.addEventListener('torch-new-year', show);
    return function () { window.removeEventListener('torch-new-year', show); };
  }, []);
  /*END PROTOTYPE*/
  return at;
}

/**
 * Tells whether the sky may move: neither Calm sky nor reduced motion, in Nightango or on the device.
 * @param {Object} prefs Preferences.
 */
function skyMoves(prefs) {
  return !prefs.sky.calm && !prefs.a11y.reduceMotion && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Fireworks bursting behind what follows them, colored by the New Year tokens.
 * @param {{bursts: Array}} p Bursts: left, top, radius in px and delay in s.
 */
function Fireworks(p) {
  return h('span', { className: 'fw', 'aria-hidden': 'true' }, p.bursts.map(function (b, i) {
    return h('span', { key: i, className: 'fw-burst fw-c' + (i % 3 + 1), style: { left: b[0], top: b[1], '--fw-r': b[2] + 'px', '--fw-delay': b[3] + 's' } },
      FIREWORK_RAYS.map(function (a) { return h('span', { key: a, className: 'fw-ray', style: { transform: 'rotate(' + a + 'deg)' } }, h('span', { className: 'fw-spark' })); }));
  }));
}

/**
 * Fireworks in the sky behind the panels during the first minute of the year. Puts the class of their colors on the root.
 */
function NewYearSky() {
  var prefs = useApp().state.prefs, at = useNewYear();
  var on = prefs.sky.season && at.phase === 'fireworks' && skyMoves(prefs);
  useEffect(function () {
    if (!on) return;
    ROOT_EL.classList.add('season-new-year');
    return function () { ROOT_EL.classList.remove('season-new-year'); };
  }, [on]);
  return on ? h(Fireworks, { bursts: SKY_BURSTS }) : null;
}

/**
 * Countdown under the moon in the last minute of the year, then the greeting and fireworks on the sky band in the first minute.
 */
function NewYearMark() {
  var prefs = useApp().state.prefs, at = useNewYear();
  if (!prefs.sky.season || !at.phase) return null;
  var midnight = at.phase === 'fireworks';
  // The live region exists from the countdown on: only the greeting is announced, once, at midnight.
  return h(Frag, null,
    midnight && skyMoves(prefs) ? h(Fireworks, { bursts: BAND_BURSTS }) : null,
    h('span', { className: cx('newyear-count tnum', midnight && 'newyear-greeting'), 'aria-hidden': 'true' }, midnight ? 'Happy New Year' : String(at.seconds)),
    h('span', { className: 'tc-sr', 'aria-live': 'polite' }, midnight ? 'Happy New Year' : ''));
}
