// -- Seasonal decorations ------------------------------------------------------

var BAT_PATH = 'M22 5 21 1.5 23 3.5h2l2-2L26 5c6-3 14-4 22 1-3 .5-6 1-8 4-2-2-6-2-8 1-2-1-5 0-6 3q-2 4-4 0c-1-3-4-4-6-3-2-3-6-3-8-1-2-3-5-3.5-8-4 8-5 16-4 22-1z';
var COSTUMES = ['hat', 'ears', 'horns', 'bat', null];

/**
 * Returns the costume a member wears for Halloween, the same on every screen.
 * @param {string} name Member.
 */
function costumeOf(name) {
  var s = String(name || ''), n = 7;
  for (var i = 0; i < s.length; i++) n = (n * 33 + s.charCodeAt(i)) >>> 0;
  return COSTUMES[n % COSTUMES.length];
}

/**
 * Costume drawn over an avatar, sized against the avatar box.
 * @param {{name: string, color: string}} p Member and avatar color.
 */
function Costume(p) {
  var kind = costumeOf(p.name);
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
  return null;
}

/**
 * Bats and a dead branch in the sky band of the navigation.
 */
function SeasonSky() {
  return h('span', { className: 'season-sky', 'aria-hidden': 'true' },
    h('svg', { className: 'season-branch', viewBox: '0 0 96 58' },
      h('path', { d: 'M96 5C78 7 66 13 52 11 43 10 37 15 28 14l-2-2c7-1 13-5 21-5 11 0 21-5 49-7zM62 11c-2 7-6 11-12 15l-1-2c5-3 8-7 10-13zM40 12c-4 7-3 13-6 19l-2-1c3-6 2-12 5-18zM80 6c1 5 0 9-2 13l-1-1c2-4 2-8 1-12z' })),
    h('span', { className: 'season-flight season-flight-1' }, h('svg', { className: 'season-bat', viewBox: '0 0 48 24' }, h('path', { d: BAT_PATH }))),
    h('span', { className: 'season-flight season-flight-2' }, h('svg', { className: 'season-bat', viewBox: '0 0 48 24' }, h('path', { d: BAT_PATH }))));
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
