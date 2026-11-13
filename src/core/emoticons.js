// -- Emoticons ----------------------------------------------------------------

// BetterChatango emoticons in the order of client.html: sm:// tag name and data-entity shortcuts (the first is the one BetterChatango inserts).
var EMOTICONS = [
  { name: 'smile', keys: [':)', ':-)', '=]'], premium: false },
  { name: 'sad', keys: [':('], premium: false },
  { name: 'straight', keys: [':|'], premium: false },
  { name: 'grin', keys: [':D', '=D', '<>'], premium: false },
  { name: 'lol', keys: ['*lol*'], premium: false },
  { name: 'angry', keys: [':@'], premium: false },
  { name: 'tongue', keys: [':P'], premium: false },
  { name: 'kiss', keys: [':x'], premium: false },
  { name: 'surprise', keys: [':o'], premium: false },
  { name: 'cry', keys: [';('], premium: false },
  { name: 'wink', keys: [';)'], premium: false },
  { name: 'cool', keys: ['8)'], premium: false },
  { name: 'wrong', keys: ['(:'], premium: false },
  { name: 'pukes', keys: ['*pukes*'], premium: false },
  { name: 'sleep', keys: ['zzzz'], premium: false },
  { name: 'heart', keys: ['*h*'], premium: false },
  { name: 'heartbreak', keys: ['*hb*'], premium: false },
  { name: 'blush', keys: ['*blush*'], premium: false },
  { name: 'waves', keys: ['*waves*'], premium: false },
  { name: 'peace', keys: ['~V'], premium: false },
  { name: 'cell', keys: ['o_o)'], premium: false },
  { name: 'shhh', keys: ['_shhh'], premium: false },
  { name: 'bored', keys: ['*bored*'], premium: false },
  { name: 'hamburger', keys: ['*burger*'], premium: false },
  { name: 'rolleyes', keys: ['*rolleyes*'], premium: false },
  { name: 'stop', keys: ['*stop*'], premium: false },
  { name: 'star', keys: ['*star*'], premium: false },
  { name: 'gift', keys: ['[~]'], premium: true },
  { name: 'ninja', keys: ['(=)'], premium: true },
  { name: 'pirate', keys: ['{b)'], premium: true },
  { name: 'clapping', keys: ['(~)'], premium: true },
  { name: 'whisper', keys: ['(o_o'], premium: true },
  { name: 'hmmm', keys: ['_hmmm'], premium: true },
  { name: 'thumbsdown', keys: ['~p'], premium: true },
  { name: 'twothumbsup', keys: ['~dd'], premium: true },
  { name: 'thumbsup', keys: ['~d'], premium: true },
  { name: 'nospeak', keys: [':*'], premium: true },
  { name: 'nosee', keys: ['=_='], premium: true },
  { name: 'nohear', keys: ['(o_o)'], premium: true },
  { name: 'nerd', keys: ['-O_O-'], premium: true },
  { name: 'idea', keys: ['*:)'], premium: true },
  { name: 'saint', keys: ['0:)'], premium: true },
  { name: 'evil', keys: [']:)'], premium: true },
  { name: 'dead', keys: ['x_x'], premium: true },
  { name: 'basketball', keys: ['*bball*'], premium: true },
  { name: 'soccer', keys: ['*soccer*'], premium: true },
  { name: 'donut', keys: ['(o)'], premium: true },
  { name: 'chocdonut', keys: ['*chocdonut*'], premium: true },
  { name: 'dollar', keys: ['*$*'], premium: true },
  { name: 'warning', keys: ['*warning*'], premium: true },
  { name: 'cat', keys: ['*cat*'], premium: true },
  { name: 'dog', keys: ['*dog*'], premium: true },
  { name: 'monkey', keys: ['*monkey*'], premium: true },
  { name: 'panda', keys: ['*panda*'], premium: true },
  { name: 'vampire', keys: ['*vampire*'], premium: true },
  { name: 'warewolf', keys: ['*werewolf*'], premium: true },
  { name: 'ghost', keys: ['*ghost*'], premium: true },
  { name: 'skull', keys: ['*skull*'], premium: true },
  { name: 'zombie', keys: ['*zombie*'], premium: true },
  { name: 'mummy', keys: ['*mummy*'], premium: true },
  { name: 'troll', keys: ['*troll*'], premium: true },
  // The first shortcut carries the colors, the angle and the repeat of the stripes after its question mark.
  { name: 'stripes', keys: ['*stripes*?red,orange,yellow,green,blue,indigo,purple:33:1', '*team*'], premium: true },
  { name: 'sun', keys: ['*sun*'], premium: true },
  { name: 'rain', keys: ['*rain*'], premium: true },
  { name: 'poop', keys: ['*poop*'], premium: true },
  { name: 'hic', keys: ['*hic*'], premium: true }
];
// No prototype: the name and the shortcut come from a member, constructor or __proto__ must find nothing.
var EMOTICON_BY_NAME = EMOTICONS.reduce(function (o, e) { o[e.name] = e; return o; }, Object.create(null));
var EMOTICON_BY_KEY = EMOTICONS.reduce(function (o, e) {
  e.keys.forEach(function (k) { o[k.split('?')[0]] = e; });
  return o;
}, Object.create(null));

// -- Drawing ------------------------------------------------------------------

// Every emoticon is drawn in a 36 unit box, a face being a disc of radius 16 at its center.
var EMOTICON_BOX = '0 0 36 36';

function emoPaint(color) { return 'var(--emoticon-' + color + ')'; }
function emoDisc(cx, cy, r, color, opacity) { return h('circle', { cx: cx, cy: cy, r: r, style: { fill: emoPaint(color), opacity: opacity } }); }
function emoOval(cx, cy, rx, ry, color, turn) {
  return h('ellipse', { cx: cx, cy: cy, rx: rx, ry: ry, transform: turn ? 'rotate(' + turn + ' ' + cx + ' ' + cy + ')' : undefined, style: { fill: emoPaint(color) } });
}
function emoShape(d, color, opacity) { return h('path', { d: d, style: { fill: emoPaint(color), fillRule: 'evenodd', opacity: opacity } }); }
function emoLine(d, color, width) {
  return h('path', { d: d, style: { fill: 'none', stroke: emoPaint(color), strokeWidth: width || 2, strokeLinecap: 'round', strokeLinejoin: 'round' } });
}
/**
 * Shape with an outline: a pale shape stays visible on a light surface and teeth on a face.
 * @param {string} d Path.
 * @param {string} [color] Fill, white by default.
 * @param {string} [edge] Outline color, the soft edge by default.
 * @param {number} [width] Outline width.
 */
function emoEdged(d, color, edge, width) {
  return h('path', { d: d, style: { fill: emoPaint(color || 'white'), stroke: emoPaint(edge || 'edge'), strokeWidth: width || 0.9, strokeLinejoin: 'round', strokeLinecap: 'round' } });
}
function emoPaleDisc(cx, cy, r) { return h('circle', { cx: cx, cy: cy, r: r, style: { fill: emoPaint('white'), stroke: emoPaint('edge'), strokeWidth: 0.9 } }); }
function emoGroup(transform, list) { return h.apply(null, ['g', { transform: transform }].concat(list)); }
function emoPoint(cx, cy, r, deg) {
  var a = deg * Math.PI / 180;
  return (cx + r * Math.cos(a)).toFixed(2) + ' ' + (cy + r * Math.sin(a)).toFixed(2);
}

var EMO_RIM = 'M4.14 26A16 16 0 0 0 31.86 26 22 22 0 0 1 4.14 26z';
var EMO_SMILE = 'M10.8 22.4c1.9 3 4.4 4.4 7.2 4.4s5.3-1.4 7.2-4.4';
var EMO_SMALL_SMILE = 'M12.2 23.4c1.6 2.3 3.6 3.3 5.8 3.3s4.2-1 5.8-3.3';
var EMO_FROWN = 'M11.4 27c1.8-2.7 4-4 6.6-4s4.8 1.3 6.6 4';
var EMO_FLAT = 'M12.2 24.6h11.6';
var EMO_GRIN = 'M9.8 20.8h16.4c0 4.9-3.5 8.3-8.2 8.3s-8.2-3.4-8.2-8.3z';
var EMO_HEART = 'M18 31.6C8.5 24.7 3 19.9 3 13.3 3 8.7 6.6 5.1 11 5.1c2.8 0 5.4 1.4 7 3.7 1.6-2.3 4.2-3.7 7-3.7 4.4 0 8 3.6 8 8.2 0 6.6-5.5 11.4-15 18.3z';
var EMO_HEART_SHINE = 'M8 10.4c1-1.2 2.3-1.8 3.6-1.8';
var EMO_RING = 'M18 3.5a14.5 14.5 0 1 0 0 29 14.5 14.5 0 0 0 0-29zm0 9.7a4.8 4.8 0 1 1 0 9.6 4.8 4.8 0 0 1 0-9.6z';

/**
 * Face disc with the shade of its lower rim.
 * @param {string} [color] Face color, the Chatango yellow by default.
 * @param {string} [shade] Color of the shade. Without it a colored face takes a veil of ink.
 */
function emoFace(color, shade) {
  return [emoDisc(18, 18, 16, color || 'face'), emoShape(EMO_RIM, shade || (color ? 'ink' : 'shade'), color && !shade ? 0.16 : undefined)];
}
/**
 * The tall oval eyes of a Chatango face.
 * @param {number} [y] Height of their center.
 * @param {number} [ry] Half of their height.
 */
function emoEyes(y, ry) { return [emoOval(12.8, y || 15.2, 2.5, ry || 4.8, 'ink'), emoOval(23.2, y || 15.2, 2.5, ry || 4.8, 'ink')]; }
/**
 * Closed eyes.
 * @param {number} y Height of their corners.
 * @param {number} bend Height of the curve, negative for laughing eyes.
 */
function emoShutEyes(y, bend) {
  return [emoLine('M10 ' + y + 'q2.8 ' + bend + ' 5.6 0', 'ink'), emoLine('M20.4 ' + y + 'q2.8 ' + bend + ' 5.6 0', 'ink')];
}

// Glove parts around the palm, fingers up: discs [cx, cy, r] and finger lines.
var EMO_HANDS = {
  open: { discs: [[0, 0.4, 3.7]], lines: ['M-2.7-2 -3.7-6', 'M-.9-2.8 -1.2-7.6', 'M1-2.8 1.3-7.4', 'M2.8-1.9 3.9-5.6', 'M-3.2.6 -5.9-1'], width: 2.2 },
  fist: { discs: [], lines: ['M-1.5 0h3'], width: 6.4 },
  thumb: { discs: [], lines: ['M-1.3.6h3', 'M-2.4-.6 -2.9-5.6'], width: 6 },
  point: { discs: [], lines: ['M0 .4h3', 'M-1.5-1.6 -1.5-8.2'], width: 6 },
  peace: { discs: [], lines: ['M-1.4.4h2.8', 'M-1-2 -2.9-8', 'M1-2 2.9-8'], width: 6 }
};
/**
 * White glove, drawn in two passes so that its parts merge under one outline.
 * @param {string} kind Entry of EMO_HANDS.
 * @param {number} x Palm center.
 * @param {number} y Palm center.
 * @param {number} [turn] Rotation in degrees.
 * @param {boolean} [flip] Mirrors the glove.
 */
function emoHand(kind, x, y, turn, flip) {
  var hand = EMO_HANDS[kind], out = [];
  [['edge', 1.7], ['white', 0]].forEach(function (pass) {
    hand.discs.forEach(function (c) { out.push(emoDisc(c[0], c[1], c[2] + pass[1] / 2, pass[0])); });
    hand.lines.forEach(function (d, i) {
      // A fist is wider than the finger that leaves it.
      var w = hand.width > 3 && i ? 2.6 : hand.width;
      out.push(emoLine(d, pass[0], w + pass[1]));
    });
  });
  return emoGroup('translate(' + x + ' ' + y + ') rotate(' + (turn || 0) + ')' + (flip ? ' scale(-1 1)' : ''), out);
}

/**
 * Bands of a striped disc, computed without a clip path so that no id is needed.
 * @param {string[]} colors CSS colors of one repeat.
 * @param {number} turn Angle of the bands in degrees.
 * @param {number} repeat Number of repeats across the disc.
 */
function emoStripes(colors, turn, repeat) {
  var r = 16, n = colors.length * repeat, step = 2 * r / n, bands = [];
  for (var i = 0; i < n; i++) {
    var y0 = -r + i * step, y1 = y0 + step;
    var x0 = Math.sqrt(Math.max(r * r - y0 * y0, 0)), x1 = Math.sqrt(Math.max(r * r - y1 * y1, 0));
    var d = 'M' + (-x0).toFixed(2) + ' ' + y0.toFixed(2) + 'H' + x0.toFixed(2) + 'A16 16 0 0 1 ' + x1.toFixed(2) + ' ' + y1.toFixed(2) + 'H' + (-x1).toFixed(2) + 'A16 16 0 0 1 ' + (-x0).toFixed(2) + ' ' + y0.toFixed(2) + 'z';
    // The stroke closes the hairline that antialiasing leaves between two bands.
    bands.push(h('path', { d: d, style: { fill: colors[i % colors.length], stroke: colors[i % colors.length], strokeWidth: 0.3 } }));
  }
  // A pale halo keeps the face readable on dark bands.
  var halo = [emoOval(12.8, 15.2, 3.1, 5.4, 'white'), emoOval(23.2, 15.2, 3.1, 5.4, 'white'), emoLine(EMO_SMILE, 'white', 3.2)];
  return [emoGroup('translate(18 18) rotate(' + turn + ')', bands), emoGroup('', halo)].concat(emoEyes(), emoLine(EMO_SMILE, 'ink'));
}
/**
 * Reads the stripes a member asks for like BetterChatango (renderStripes, inject.js:577), red without a request.
 * @param {string} token Shortcut as written, with or without its request after a question mark.
 * @returns {?{colors: string[], turn: number, repeat: number}} Null if the request is not one BetterChatango reads.
 */
function emoStripesOf(token) {
  var at = token.indexOf('?');
  if (at < 0) return { colors: ['#ff0000'], turn: 0, repeat: 1 };
  var m = /^([#0-9a-z,]+)(?::(\d+)(?::(\d+))?)?$/i.exec(token.slice(at + 1));
  var colors = m ? m[1].split(',').map(cssColor) : [];
  if (!colors.length || colors.length > 12 || colors.indexOf(null) >= 0) return null;
  return { colors: colors, turn: Math.min(+m[2] || 0, 360), repeat: Math.max(1, Math.min(+m[3] || 1, 10)) };
}

function emoSoccer() {
  var out = [emoPaleDisc(18, 18, 15.5)], center = [];
  for (var k = 0; k < 5; k++) {
    var a = -90 + k * 72;
    center.push(emoPoint(18, 18, 5.4, a));
    out.push(emoLine('M' + emoPoint(18, 18, 5.4, a) + 'L' + emoPoint(18, 18, 10.4, a), 'ink', 1.2));
    out.push(emoShape('M' + emoPoint(18, 18, 15.5, a - 19) + 'A15.5 15.5 0 0 1 ' + emoPoint(18, 18, 15.5, a + 19) + 'L' + emoPoint(18, 18, 10.4, a) + 'z', 'ink'));
  }
  out.push(emoShape('M' + center.join('L') + 'z', 'ink'));
  return out;
}
function emoDonut(icing, sprinkles) {
  var d = '';
  for (var k = 0; k < 16; k++) d += (k ? 'Q' + emoPoint(18, 18, k % 2 ? 13.6 : 11, k * 22.5 - 11.25) + ' ' : 'M') + emoPoint(18, 18, 12.3, k * 22.5);
  d += 'Q' + emoPoint(18, 18, 11, -11.25) + ' ' + emoPoint(18, 18, 12.3, 0) + 'zM18 12a6 6 0 1 1 0 12 6 6 0 0 1 0-12z';
  return [emoShape(EMO_RING, 'tan'), emoShape(d, icing)].concat(sprinkles.map(function (s) { return emoLine(s[0], s[1], 1.4); }));
}

var EMOTICON_ART = {
  smile: function () { return emoFace().concat(emoEyes(), emoLine(EMO_SMILE, 'ink')); },
  sad: function () { return emoFace().concat(emoEyes(), emoLine(EMO_FROWN, 'ink')); },
  straight: function () { return emoFace().concat(emoEyes(), emoLine(EMO_FLAT, 'ink')); },
  grin: function () { return emoFace().concat(emoEyes(13.4, 4.2), emoEdged(EMO_GRIN, 'white', 'ink', 1.5)); },
  lol: function () {
    return emoFace().concat(emoShutEyes(14.6, -4.2), emoShape('M9.6 19.4h16.8c0 5.6-3.6 9.7-8.4 9.7s-8.4-4.1-8.4-9.7z', 'ink'),
      emoShape('M11 19.4h14v1.7a1 1 0 0 1-1 1H12a1 1 0 0 1-1-1z', 'white'), emoOval(18, 26.6, 4, 2.1, 'rose'));
  },
  angry: function () {
    return emoFace('ember', 'red').concat(emoLine('M9.4 10.6l6.4 3', 'ink', 2.2), emoLine('M26.6 10.6l-6.4 3', 'ink', 2.2), emoEyes(17.4, 3.2),
      emoLine('M12.8 27.6c1.3-2.2 3-3.3 5.2-3.3s3.9 1.1 5.2 3.3', 'ink'));
  },
  tongue: function () {
    return emoFace().concat(emoEyes(), emoShape('M16.6 26.4c2.2.2 4.9-.6 6.9-2.2 1.2 2.9.5 6.3-2.4 7-2.7.6-4.6-1.8-4.5-4.8z', 'rose'), emoLine('M20 27.2l.6 2.2', 'red', 1), emoLine(EMO_SMILE, 'ink'));
  },
  kiss: function () {
    return emoFace().concat(emoShutEyes(14.2, 3.6), emoOval(18, 23, 2.9, 1.8, 'red'), emoOval(18, 25.9, 2.4, 1.7, 'red'));
  },
  surprise: function () { return emoFace().concat(emoEyes(14.4), emoOval(18, 25.2, 3, 3.9, 'ink')); },
  cry: function () {
    return emoFace().concat(emoEyes(), emoLine(EMO_FROWN, 'ink'), emoShape('M10.6 20.6c1.7 2.4 2.5 4 2.5 5.2a2.5 2.5 0 0 1-5 0c0-1.2.8-2.8 2.5-5.2z', 'blue'));
  },
  wink: function () { return emoFace().concat(emoOval(12.8, 15.2, 2.5, 4.8, 'ink'), emoLine('M20.2 16.6q3-3.4 6 0', 'ink'), emoLine(EMO_SMILE, 'ink')); },
  cool: function () {
    return emoFace().concat(emoShape('M2.9 11.9h30.2v2h-1.6c-.2 3.7-2.6 6.3-6.1 6.3-3.3 0-5.7-2.4-6.2-5.8h-2.4c-.5 3.4-2.9 5.8-6.2 5.8-3.5 0-5.9-2.6-6.1-6.3H2.9z', 'ink'),
      emoLine('M7.4 14.8l2.2-1.2', 'white', 1), emoLine('M21.8 14.8l2.2-1.2', 'white', 1), emoLine(EMO_SMALL_SMILE, 'ink'));
  },
  wrong: function () { return emoFace().concat(emoGroup('rotate(180 18 18)', emoEyes().concat(emoLine(EMO_SMILE, 'ink')))); },
  pukes: function () {
    return emoFace('green').concat(emoLine('M10.2 12.4l4.8 2.4-4.8 2.4', 'ink', 1.9), emoLine('M25.8 12.4l-4.8 2.4 4.8 2.4', 'ink', 1.9), emoOval(18, 24.4, 4.6, 3.4, 'ink'),
      emoShape('M14.6 25c0-1.7 1.5-2.7 3.4-2.7s3.4 1 3.4 2.7v7.2c0 1.9-1.5 3.3-3.4 3.3s-3.4-1.4-3.4-3.3z', 'shade'), emoDisc(17, 27.6, 0.9, 'face'), emoDisc(19.2, 31, 0.9, 'face'));
  },
  sleep: function () {
    return emoFace().concat(emoShutEyes(15, 3.4), emoOval(18, 25, 2.1, 2.5, 'ink'), emoLine('M23.6 3h5.8l-5.8 6.2h5.8', 'blue', 1.8), emoLine('M30.2 12h3.3l-3.3 3.6h3.3', 'blue', 1.5));
  },
  heart: function () { return [emoShape(EMO_HEART, 'red'), emoLine(EMO_HEART_SHINE, 'white', 1.6)]; },
  heartbreak: function () {
    var crack = 'l-2.8 5.2 4.4 3.8-3.8 4.6 2.2 5z';
    return [emoGroup('rotate(-8 18 31.6)', [emoShape('M18 31.6C8.5 24.7 3 19.9 3 13.3 3 8.7 6.6 5.1 11 5.1c2.8 0 5.4 1.4 7 3.7' + crack, 'red'), emoLine(EMO_HEART_SHINE, 'white', 1.6)]),
      emoGroup('rotate(8 18 31.6)', [emoShape('M18 31.6c9.5-6.9 15-11.7 15-18.3 0-4.6-3.6-8.2-8-8.2-2.8 0-5.4 1.4-7 3.7' + crack, 'red')])];
  },
  blush: function () { return emoFace().concat(emoOval(8.6, 21.6, 3.2, 2.1, 'rose'), emoOval(27.4, 21.6, 3.2, 2.1, 'rose'), emoEyes(), emoLine(EMO_SMILE, 'ink')); },
  waves: function () { return emoFace().concat(emoEyes(), emoLine(EMO_SMILE, 'ink'), emoHand('open', 7, 27.6, -24)); },
  peace: function () { return emoFace().concat(emoEyes(), emoLine(EMO_SMILE, 'ink'), emoHand('peace', 7.4, 29.4, -12)); },
  cell: function () {
    return emoFace().concat(emoEyes(), emoLine('M11.6 23.6c1.5 2 3.3 2.9 5.4 2.9', 'ink'),
      emoGroup('rotate(14 28 19)', [h('rect', { x: 24.6, y: 11.8, width: 7, height: 13.4, rx: 1.6, style: { fill: emoPaint('night'), stroke: emoPaint('edge'), strokeWidth: 0.7 } }), h('rect', { x: 25.9, y: 13.6, width: 4.4, height: 7.4, rx: 0.5, style: { fill: emoPaint('blue') } })]),
      emoHand('fist', 27.4, 27.4, -70));
  },
  shhh: function () { return emoFace().concat(emoEyes(), emoOval(18, 24.6, 2.4, 1.7, 'ink'), emoHand('point', 19.5, 30.2, 0)); },
  bored: function () {
    return emoFace().concat(emoShape('M10.3 15.2h5a2.5 4.2 0 0 1-5 0z', 'ink'), emoShape('M20.7 15.2h5a2.5 4.2 0 0 1-5 0z', 'ink'), emoLine('M9.4 15.2h6.8', 'ink', 1.6), emoLine('M19.8 15.2h6.8', 'ink', 1.6),
      emoLine('M15 25.2q4-1.4 8.4.2', 'ink'), emoHand('fist', 8, 27.6, -30));
  },
  hamburger: function () {
    return [emoShape('M5 27.6h26v1c0 2.1-1.7 3.7-3.8 3.7H8.8c-2.1 0-3.8-1.6-3.8-3.7z', 'tan'), h('rect', { x: 3.8, y: 21.8, width: 28.4, height: 5.4, rx: 2.5, style: { fill: emoPaint('brown') } }),
      emoShape('M4.6 19.6h26.8l-5 4.4-4.6-2.6H4.6z', 'face'), h('rect', { x: 4.8, y: 17.6, width: 26.4, height: 2.8, rx: 1.2, style: { fill: emoPaint('red') } }),
      emoShape('M3.2 16.4c1.8-1.5 3.6-1.5 5.3 0s3.6 1.5 5.3 0 3.6-1.5 5.3 0 3.6 1.5 5.3 0 3.6-1.5 5.3 0c1 .9 2.2 1.2 3.1.8v1.9H3.2z', 'green'),
      emoShape('M4.4 15.6C4.4 9 10.4 4.4 18 4.4S31.6 9 31.6 15.6c0 .7-.6 1.2-1.3 1.2H5.7c-.7 0-1.3-.5-1.3-1.2z', 'tan'),
      emoOval(12, 9.6, 1.3, 0.7, 'white', -24), emoOval(18.4, 7.8, 1.3, 0.7, 'white', 8), emoOval(24.4, 10.4, 1.3, 0.7, 'white', 28), emoOval(15.6, 12.4, 1.3, 0.7, 'white', 14), emoOval(21.4, 13, 1.3, 0.7, 'white', -12)];
  },
  rolleyes: function () {
    return emoFace().concat(emoOval(12.6, 15, 3.3, 4.9, 'white'), emoOval(23.4, 15, 3.3, 4.9, 'white'), emoDisc(13.4, 12.4, 1.9, 'ink'), emoDisc(24.2, 12.4, 1.9, 'ink'), emoLine('M12.6 25.8q5.4-2.6 10.8-.8', 'ink'));
  },
  stop: function () {
    return [emoShape('M11.88 2.6h12.24l8.66 8.66v13.48l-8.66 8.66H11.88l-8.66-8.66V11.26z', 'red'), emoLine('M12.7 4.9h10.6l7.5 7.5v11.2l-7.5 7.5H12.7l-7.5-7.5V12.4z', 'white', 0.9),
      emoLine('M11.3 15.7c-.7-1.3-3.6-1.5-3.6.5 0 2.2 3.8 1.3 3.8 3.6 0 2-3.1 2.2-4 .6', 'white', 1.3), emoLine('M13.1 14.7h4.2M15.2 14.7v6.8', 'white', 1.3),
      h('ellipse', { cx: 20.9, cy: 18.1, rx: 1.9, ry: 3.4, style: { fill: 'none', stroke: emoPaint('white'), strokeWidth: 1.3 } }), emoLine('M24.8 21.5v-6.8h1.7a2 2 0 0 1 0 4h-1.7', 'white', 1.3)];
  },
  star: function () {
    return [emoEdged('M18 4 21.94 13.6 32.26 14.36 24.36 21.06 26.82 31.14 18 25.68 9.18 31.14 11.64 21.06 3.74 14.36 14.06 13.6z', 'face', 'face', 2.4),
      emoShape('M18 25.68 26.82 31.14 24.36 21.06 32.26 14.36 27 14 21.4 20.2 22.6 26.4 18 23.4z', 'shade', 0.9)];
  },
  gift: function () {
    return [h('rect', { x: 6, y: 15, width: 24, height: 17, rx: 2, style: { fill: emoPaint('blue') } }), emoShape('M6 15h24v3.4H6z', 'ink', 0.18), h('rect', { x: 4.2, y: 10.4, width: 27.6, height: 5.6, rx: 1.6, style: { fill: emoPaint('blue') } }),
      h('rect', { x: 15.8, y: 10.4, width: 4.4, height: 21.6, style: { fill: emoPaint('face') } }),
      emoLine('M17.6 10c-2.4-.2-6.4-1.4-6.6-4.2-.2-2.6 3-3.2 4.6-1.4 1.2 1.4 1.9 3.6 2.4 5.6zM18.4 10c2.4-.2 6.4-1.4 6.6-4.2.2-2.6-3-3.2-4.6-1.4-1.2 1.4-1.9 3.6-2.4 5.6z', 'shade', 2)];
  },
  ninja: function () {
    return [emoDisc(18, 18, 16, 'night'), emoShape('M28.6 8.8l5.2-4.4.8 5.4zM30.4 11.4l5 .6-2.8 3.8z', 'night'), emoShape('M3.2 12.4h29.6c.9 2.4 1.3 5 .9 7.8H2.3c-.4-2.8 0-5.4.9-7.8z', 'face')].concat(emoEyes(16.2, 3.1));
  },
  pirate: function () {
    return emoFace().concat(emoLine('M3.6 11.6 31.4 21', 'ink', 1.3), emoOval(12.8, 16.4, 2.5, 4.2, 'ink'), emoDisc(23.2, 17, 4.4, 'ink'), emoLine(EMO_SMALL_SMILE, 'ink'),
      emoEdged('M1.4 12.6C3 5.6 9.6 1.2 18 1.2s15 4.4 16.6 11.4c-5.2-2-10.8-2.8-16.6-2.8S6.6 10.6 1.4 12.6z', 'night', 'edge', 0.7),
      emoDisc(18, 5.4, 1.7, 'white'), emoLine('M15.4 3.6l5.2 4.6M20.6 3.6l-5.2 4.6', 'white', 1));
  },
  clapping: function () { return emoFace().concat(emoEyes(), emoLine(EMO_SMILE, 'ink'), emoHand('open', 11.6, 30, 24), emoHand('open', 24.4, 30, -24, true)); },
  whisper: function () { return emoFace().concat(emoEyes(), emoOval(19.4, 24.6, 2.2, 2.6, 'ink'), emoHand('open', 10, 27.6, 18, true)); },
  hmmm: function () {
    return emoFace().concat(emoEyes(15.8, 4.2), emoLine('M9.8 8.8q3-1.8 6 .2', 'ink', 1.7), emoLine('M20.2 10.2h6', 'ink', 1.7), emoLine('M14 24.4q4.6-1.2 8.6 1', 'ink'), emoHand('point', 13.4, 31, 14));
  },
  thumbsdown: function () { return emoFace().concat(emoEyes(), emoLine(EMO_FROWN, 'ink'), emoHand('thumb', 28, 26.4, 180, true)); },
  twothumbsup: function () { return emoFace().concat(emoEyes(13.4, 4.2), emoEdged(EMO_GRIN, 'white', 'ink', 1.5), emoHand('thumb', 6.8, 29.4, 0, true), emoHand('thumb', 29.2, 29.4, 0)); },
  thumbsup: function () { return emoFace().concat(emoEyes(), emoLine(EMO_SMILE, 'ink'), emoHand('thumb', 28.6, 29.4, 0)); },
  nospeak: function () { return emoFace().concat(emoEyes(13.6), emoHand('open', 13, 27.4, 62), emoHand('open', 23, 27.4, -62, true)); },
  nosee: function () { return emoFace().concat(emoLine(EMO_SMILE, 'ink'), emoHand('open', 11.4, 17.6, 40), emoHand('open', 24.6, 17.6, -40, true)); },
  nohear: function () { return emoFace().concat(emoEyes(), emoLine(EMO_FLAT, 'ink'), emoHand('open', 4.4, 20.6, 0), emoHand('open', 31.6, 20.6, 0, true)); },
  nerd: function () {
    return emoFace().concat(emoEyes(14.8, 3.2), h('circle', { cx: 11.6, cy: 14.8, r: 5.2, style: { fill: emoPaint('white'), fillOpacity: 0.35, stroke: emoPaint('ink'), strokeWidth: 1.5 } }),
      h('circle', { cx: 24.4, cy: 14.8, r: 5.2, style: { fill: emoPaint('white'), fillOpacity: 0.35, stroke: emoPaint('ink'), strokeWidth: 1.5 } }), emoLine('M16.8 14.2h2.4M6.4 14l-3.6-1.2M29.6 14l3.6-1.2', 'ink', 1.5),
      emoLine('M11.4 23.6c1.8 2.4 4 3.4 6.6 3.4s4.8-1 6.6-3.4', 'ink'), emoEdged('M15.8 26.4h4.4v2.4a.8.8 0 0 1-.8.8h-2.8a.8.8 0 0 1-.8-.8z', 'white', 'ink', 0.9), emoLine('M18 26.6v2.8', 'ink', 0.8));
  },
  idea: function () {
    return [emoGroup('translate(-1.4 5.2) scale(.84)', emoFace().concat(emoEyes(), emoLine(EMO_SMILE, 'ink'))),
      emoLine('M27.6 1v1.6M21.4 3.4l1.2 1.2M33.8 3.4l-1.2 1.2M19.4 9.4h1.6M34.2 9.4h1.4', 'shade', 1.3),
      emoEdged('M27.6 4.6a4.9 4.9 0 0 0-2.8 8.9c.5.4.8 1 .8 1.6h4c0-.6.3-1.2.8-1.6a4.9 4.9 0 0 0-2.8-8.9z', 'face', 'shade', 0.9), h('rect', { x: 25.7, y: 15.4, width: 3.8, height: 2.8, rx: 0.8, style: { fill: emoPaint('grey') } })];
  },
  saint: function () {
    return [emoGroup('translate(1.8 5) scale(.9)', emoFace().concat(emoEyes(), emoLine(EMO_SMILE, 'ink'))),
      h('ellipse', { cx: 18, cy: 4.4, rx: 9.4, ry: 2.9, style: { fill: 'none', stroke: emoPaint('shade'), strokeWidth: 2 } })];
  },
  evil: function () {
    var horns = 'M6.6 12.4C3.4 9.6 2.4 5.8 3.6 1.6c1.8 3 4.6 4.8 8.2 5.4zM29.4 12.4c3.2-2.8 4.2-6.6 3-10.8-1.8 3-4.6 4.8-8.2 5.4z';
    return [emoShape(horns, 'red'), emoShape(horns, 'ink', 0.2)]
      .concat(emoFace('red'), emoLine('M9.2 9.8l6.6 3.2', 'ink', 2.2), emoLine('M26.8 9.8l-6.6 3.2', 'ink', 2.2), emoEyes(17, 3.2), emoLine(EMO_SMILE, 'ink'));
  },
  dead: function () {
    return emoFace().concat(emoLine('M10.2 12.4l5.2 5.6M15.4 12.4l-5.2 5.6M20.6 12.4l5.2 5.6M25.8 12.4l-5.2 5.6', 'ink'), emoLine(EMO_FLAT, 'ink'));
  },
  basketball: function () {
    return [emoDisc(18, 18, 16, 'ember'), emoShape(EMO_RIM, 'red', 0.5), emoLine('M18 2v32M2 18h32M6.7 6.7c5.2 5.6 5.2 17 0 22.6M29.3 6.7c-5.2 5.6-5.2 17 0 22.6', 'ink', 1.3)];
  },
  soccer: emoSoccer,
  donut: function () { return emoDonut('rose', [['M10.4 12.6l1.6-1.2', 'white'], ['M24 9.4l1.4 1.4', 'blue'], ['M26.4 19.6l1.9-.5', 'white'], ['M21.6 26.4l.6 1.8', 'face'], ['M11.4 24.4l1.5 1.3', 'blue'], ['M16.6 7.6h2', 'face'], ['M8.2 18.4l1.9.5', 'face']]); },
  chocdonut: function () { return emoDonut('brown', [['M10.4 12.6l1.6-1.2', 'white'], ['M24 9.4l1.4 1.4', 'rose'], ['M26.4 19.6l1.9-.5', 'white'], ['M21.6 26.4l.6 1.8', 'face'], ['M11.4 24.4l1.5 1.3', 'rose'], ['M16.6 7.6h2', 'face'], ['M8.2 18.4l1.9.5', 'white']]); },
  dollar: function () {
    return [emoDisc(18, 18, 16, 'shade'), h('circle', { cx: 18, cy: 18, r: 12.8, style: { fill: 'none', stroke: emoPaint('face'), strokeWidth: 1.4 } }),
      emoLine('M22.4 13.4c-1-1.6-2.6-2.4-4.6-2.4-2.6 0-4.4 1.4-4.4 3.4 0 4.6 9.4 2.2 9.4 7 0 2.2-2 3.6-4.8 3.6-2.2 0-4-.9-5-2.6M18 8.4v19.2', 'white', 2)];
  },
  warning: function () {
    return [emoEdged('M18 5.4 32 29.6H4z', 'ember', 'ember', 4.4), emoLine('M18 13v8.4', 'white', 2.8), emoDisc(18, 26, 1.7, 'white')];
  },
  cat: function () {
    return [emoShape('M4.2 15.6 5 2.6l9.6 5.6zM31.8 15.6 31 2.6l-9.6 5.6z', 'grey'), emoShape('M6.6 11.4 7 5.8l4.4 2.6zM29.4 11.4 29 5.8l-4.4 2.6z', 'rose')]
      .concat([emoDisc(18, 19.4, 14.6, 'grey'), emoShape('M5.4 26.6a14.6 14.6 0 0 0 25.2 0 20 20 0 0 1-25.2 0z', 'ink', 0.16)], emoEyes(17, 4.2),
        emoShape('M16.2 22.6h3.6L18 24.8z', 'rose'), emoLine('M18 24.8c-.6 1.6-2 2.2-3.4 1.6M18 24.8c.6 1.6 2 2.2 3.4 1.6', 'ink', 1.3), emoLine('M9.8 23.4l-6.4-1.2M9.8 25.6l-6 1.6M26.2 23.4l6.4-1.2M26.2 25.6l6 1.6', 'white', 0.9));
  },
  dog: function () {
    return [emoDisc(18, 18.6, 14.6, 'tan'), emoShape('M5.6 26.2a14.6 14.6 0 0 0 24.8 0 20 20 0 0 1-24.8 0z', 'ink', 0.14),
      emoShape('M8.6 6.6C4.2 6.2 1 9.8 1.4 15.4c.3 4.4 1.6 8.4 4 10.4 1.6-5.6 2.4-12 3.2-19.2zM27.4 6.6c4.4-.4 7.6 3.2 7.2 8.8-.3 4.4-1.6 8.4-4 10.4-1.6-5.6-2.4-12-3.2-19.2z', 'brown')]
      .concat(emoEyes(15.2, 4), [emoOval(18, 23.4, 6.2, 4.6, 'white'), emoOval(18, 20.8, 2.5, 1.8, 'ink'), emoLine('M18 22.4v2.2M14.8 24.2c.8 1.4 2.2 1.6 3.2.4 1 1.2 2.4 1 3.2-.4', 'ink', 1.2), emoShape('M16.2 25.6h3.6v2.6a1.8 1.8 0 0 1-3.6 0z', 'rose')]);
  },
  monkey: function () {
    return [emoDisc(4.8, 17, 4.4, 'brown'), emoDisc(31.2, 17, 4.4, 'brown'), emoDisc(4.8, 17, 2.3, 'tan'), emoDisc(31.2, 17, 2.3, 'tan'), emoDisc(18, 18, 14.2, 'brown'),
      emoShape('M18 11.6c1.6-2.2 4-3.2 6.2-2.6 3 .8 4.4 4.2 3.4 7.4 2 2 2.6 4.6 1.8 7.4-1.2 4.4-5.8 7-11.4 7s-10.2-2.6-11.4-7c-.8-2.8-.2-5.4 1.8-7.4-1-3.2.4-6.6 3.4-7.4 2.2-.6 4.6.4 6.2 2.6z', 'tan')]
      .concat(emoEyes(16, 3.6), [emoLine('M16.6 21.4v.2M19.4 21.4v.2', 'ink', 1.3), emoLine('M13 24.6c1.4 1.8 3 2.6 5 2.6s3.6-.8 5-2.6', 'ink', 1.6)]);
  },
  panda: function () {
    return [emoDisc(6.6, 7, 4.8, 'night'), emoDisc(29.4, 7, 4.8, 'night'), emoPaleDisc(18, 19, 14.6),
      emoOval(11.6, 17, 4, 5.2, 'night', 24), emoOval(24.4, 17, 4, 5.2, 'night', -24), emoDisc(12.2, 16.6, 1.5, 'white'), emoDisc(23.8, 16.6, 1.5, 'white'),
      emoOval(18, 22.8, 2.2, 1.5, 'ink'), emoLine('M18 24v1.6M15 26.2c.9 1 2.1 1 3-.4.9 1.4 2.1 1.4 3 .4', 'ink', 1.2)];
  },
  vampire: function () {
    return [emoPaleDisc(18, 18, 15.6), emoShape(EMO_RIM, 'grey', 0.5),
      emoShape('M2.6 14.4C3.8 7 10.2 2 18 2s14.2 5 15.4 12.4c-3-3.6-6.8-5.4-10.6-5.4-1.6 0-3.2 1.6-4.8 4.6-1.6-3-3.2-4.6-4.8-4.6-3.8 0-7.6 1.8-10.6 5.4z', 'night')]
      .concat(emoEyes(17.4, 3.6), [emoDisc(12.8, 17.4, 0.9, 'red'), emoDisc(23.2, 17.4, 0.9, 'red'), emoLine('M12 24.4c1.8 1.6 3.8 2.3 6 2.3s4.2-.7 6-2.3', 'ink', 1.6),
        emoEdged('M13.6 25.4l1.2 3.6 1.2-2.8zM22.4 25.4l-1.2 3.6-1.2-2.8z', 'white', 'edge', 0.6), emoShape('M21.2 29.4c.8 1.1 1.2 1.8 1.2 2.4a1.2 1.2 0 0 1-2.4 0c0-.6.4-1.3 1.2-2.4z', 'red')]);
  },
  warewolf: function () {
    return [emoShape('M5.4 13.6 4.6 1.8l8.8 5.4zM30.6 13.6l.8-11.8-8.8 5.4z', 'brown'),
      emoShape('M18 4.4c7.6 0 13.6 5.6 13.6 12.8 0 1.4.9 2.5 2.6 3.4l-3 1.4 2 3-3.6.4.6 3.6-3.6-1.2-1 3.6-2.9-2.4-2.3 3-2.4-2.8-2.4 2.8-2.3-3-2.9 2.4-1-3.6-3.6 1.2.6-3.6-3.6-.4 2-3-3-1.4c1.7-.9 2.6-2 2.6-3.4C4.4 10 10.4 4.4 18 4.4z', 'brown'),
      emoOval(12.6, 15.6, 3, 3.6, 'face', 18), emoOval(23.4, 15.6, 3, 3.6, 'face', -18), emoOval(12.6, 15.6, 1, 2.8, 'ink'), emoOval(23.4, 15.6, 1, 2.8, 'ink'),
      emoLine('M8.6 10.6l5.4 2.2M27.4 10.6l-5.4 2.2', 'ink', 1.6), emoOval(18, 24, 5.6, 4.2, 'tan'), emoOval(18, 21.6, 2.4, 1.6, 'ink'),
      emoLine('M14.4 25c1.2 1 2.4 1.4 3.6 1.4s2.4-.4 3.6-1.4', 'ink', 1.2), emoEdged('M15 25.8l.8 2.4.9-2zM21 25.8l-.8 2.4-.9-2z', 'white', 'edge', 0.5)];
  },
  ghost: function () {
    return [emoEdged('M18 2.6c-7.4 0-12.6 5.6-12.6 13.2v15.4c0 1.4 1.5 2.1 2.6 1.2l2.2-1.9 2.6 2.2c.7.6 1.7.6 2.4 0l2.8-2.4 2.8 2.4c.7.6 1.7.6 2.4 0l2.6-2.2 2.2 1.9c1.1.9 2.6.2 2.6-1.2V15.8C30.6 8.2 25.4 2.6 18 2.6z'),
      emoOval(13.4, 14.6, 2.4, 4.2, 'ink'), emoOval(22.6, 14.6, 2.4, 4.2, 'ink'), emoOval(18, 23, 2.6, 3.2, 'ink')];
  },
  skull: function () {
    return [emoLine('M4.4 22.6 31.6 33M31.6 22.6 4.4 33', 'edge', 5.2), emoLine('M4.4 22.6 31.6 33M31.6 22.6 4.4 33', 'white', 3.6),
      emoEdged('M18 2.4C9.8 2.4 4.4 8 4.4 15c0 3.8 1.6 6.8 4.2 8.8v3.4c0 1.4 1.1 2.4 2.5 2.4h13.8c1.4 0 2.5-1 2.5-2.4v-3.4c2.6-2 4.2-5 4.2-8.8 0-7-5.4-12.6-13.6-12.6z'),
      emoOval(12.4, 15.4, 3.6, 4.2, 'ink'), emoOval(23.6, 15.4, 3.6, 4.2, 'ink'), emoShape('M18 19.8l1.8 3.4h-3.6z', 'ink'), emoLine('M13.6 25.8v3.6M18 25.8v3.6M22.4 25.8v3.6', 'edge', 1.1)];
  },
  zombie: function () {
    return emoFace('green').concat(emoDisc(12.4, 15, 4.2, 'white'), emoDisc(13, 15.4, 1.8, 'red'), emoLine('M20.8 12.6l5 5M25.8 12.6l-5 5', 'ink'),
      emoLine('M20.6 5.6l5.6 2.2M22 4.4l-.8 2.6M24.6 5.4l-.8 2.6', 'ink', 1), emoLine('M11 25.4l2.4-1.6 2.3 1.8 2.3-1.8 2.3 1.8 2.3-1.8 2.4 1.6', 'ink', 1.7),
      emoShape('M24.2 25.6c1.3 1.8 1.9 3 1.9 3.9a1.9 1.9 0 0 1-3.8 0c0-.9.6-2.1 1.9-3.9z', 'red'));
  },
  mummy: function () {
    return [emoPaleDisc(18, 18, 15.6), emoShape('M3.4 12.6h29.2c.7 2 1 4.2.8 6.6H2.6c-.2-2.4.1-4.6.8-6.6z', 'night'),
      emoOval(12.4, 15.9, 2.6, 1.9, 'face'), emoOval(23.6, 15.9, 2.6, 1.9, 'face'), emoDisc(12.4, 15.9, 0.9, 'ink'), emoDisc(23.6, 15.9, 0.9, 'ink'),
      emoLine('M5.4 8.6c8-2.4 16.4-2.2 25 .4M3.6 23.4c9.4 2.4 19.2 2.2 28.8-.6M6.6 28.6c7.4 2 15.2 1.8 22.8-.4M12 3.6c3 3 7.2 4.4 12.6 4.2M9.4 30.8c2.6-2.4 3.8-5 3.8-7.8', 'edge', 1)];
  },
  troll: function () {
    var ears = 'M5.6 13.4.6 8.8l1.6 9.6 3 3.4zM30.4 13.4l5-4.6-1.6 9.6-3 3.4z';
    return [emoShape(ears, 'green'), emoShape(ears, 'ink', 0.18)]
      .concat(emoFace('green'), emoLine('M8.6 10.4c2.4.2 4.8 1.2 7.2 3M27.4 10.4c-2.4.2-4.8 1.2-7.2 3', 'ink', 2.4), emoEyes(17.6, 3),
        [emoDisc(25.6, 22.6, 1.1, 'ink', 0.3), emoLine('M11.8 27.4c1.8-2 3.8-3 6.2-3s4.4 1 6.2 3', 'ink'), emoEdged('M13.6 26.4l1.2-3.4 1.2 2.2zM22.4 26.4l-1.2-3.4-1.2 2.2z', 'white', 'ink', 0.6)]);
  },
  sun: function () {
    var rays = '';
    for (var k = 0; k < 8; k++) rays += 'M' + emoPoint(18, 18, 12.4, k * 45) + 'L' + emoPoint(18, 18, 15.8, k * 45);
    return [emoLine(rays, 'shade', 2.8), emoDisc(18, 18, 8.8, 'face'), emoShape('M10.4 22.4a8.8 8.8 0 0 0 15.2 0 12 12 0 0 1-15.2 0z', 'shade')];
  },
  rain: function () {
    return [emoLine('M10.6 24.6l-2 5.4M16.8 24.6l-2 5.4M23 24.6l-2 5.4M29.2 24.6l-2 5.4', 'blue', 2.2),
      emoShape('M9.6 21.4a6.4 6.4 0 0 1-.9-12.7A8.4 8.4 0 0 1 24.6 7a6.9 6.9 0 0 1 2.2 14.4z', 'grey'), emoShape('M9.6 21.4a6.4 6.4 0 0 1-4.6-2.4c7.6 1.2 17.2 1 27.2-1.6a6.9 6.9 0 0 1-5.4 4z', 'ink', 0.16)];
  },
  poop: function () {
    return [emoShape('M18.6 2.6c2.2 1.6 3.2 3.6 2.8 5.8 3 .4 5 2.2 5 4.8 0 .9-.3 1.8-.8 2.5 2.8.8 4.6 2.8 4.6 5.4 0 .9-.2 1.7-.6 2.4 2 1 3.2 2.6 3.2 4.6 0 2.8-2.4 4.6-5.6 4.6H8.8c-3.2 0-5.6-1.8-5.6-4.6 0-2 1.2-3.6 3.2-4.6-.4-.7-.6-1.5-.6-2.4 0-2.6 1.8-4.6 4.6-5.4-.5-.7-.8-1.6-.8-2.5 0-2.8 2.2-4.6 5.4-4.8 2-.2 3.4-2.2 3.6-5.8z', 'brown'),
      emoShape('M3.6 26.4c.6 1 1.6 1.8 3 2.2 7.6 1.6 15.2 1.6 22.8 0 1.4-.4 2.4-1.2 3-2.2.3.5.4 1.1.4 1.7 0 2.8-2.4 4.6-5.6 4.6H8.8c-3.2 0-5.6-1.8-5.6-4.6 0-.6.1-1.2.4-1.7z', 'ink', 0.2),
      emoOval(13.4, 19, 2.9, 3.6, 'white'), emoOval(22.6, 19, 2.9, 3.6, 'white'), emoDisc(13.8, 19.6, 1.5, 'ink'), emoDisc(22.2, 19.6, 1.5, 'ink'), emoLine('M12.6 26c1.6 1.8 3.4 2.6 5.4 2.6s3.8-.8 5.4-2.6', 'ink', 1.7)];
  },
  hic: function () {
    return emoFace().concat(emoOval(8.4, 21.8, 3.2, 2.1, 'rose'), emoOval(27.6, 21.8, 3.2, 2.1, 'rose'), emoOval(12.6, 15.6, 2.5, 4.4, 'ink'), emoLine('M20.4 16q2.8-2.2 5.6.6', 'ink'),
      emoLine('M11 25c1.4-1.8 2.8-1.8 4.2 0s2.8 1.8 4.2 0 2.8-1.8 4.2 0', 'ink', 1.8),
      h('circle', { cx: 29.6, cy: 6.4, r: 2.4, style: { fill: 'none', stroke: emoPaint('blue'), strokeWidth: 1.2 } }), h('circle', { cx: 33.4, cy: 1.8, r: 1.3, style: { fill: 'none', stroke: emoPaint('blue'), strokeWidth: 1 } }));
  }
};

// -- Components ---------------------------------------------------------------

var emoticonDrawn = Object.create(null);

/**
 * Drawing of an emoticon, hidden from assistive technology: its container names it.
 * @param {{name: string, token: ?string}} p Emoticon name and, for stripes, the shortcut that carries the request.
 */
function EmoticonArt(p) {
  var stripes = p.name === 'stripes' ? emoStripesOf(p.token || '') : null;
  var art = stripes ? emoStripes(stripes.colors, stripes.turn, stripes.repeat) : emoticonDrawn[p.name] || (emoticonDrawn[p.name] = EMOTICON_ART[p.name]());
  return h.apply(null, ['svg', { className: 'emoticon-art', viewBox: EMOTICON_BOX, 'aria-hidden': true }].concat(art));
}

/**
 * Emoticon inside a text. Its shortcut stays in the text for selection and copy.
 * @param {{name: string, token: string}} p Emoticon name and shortcut as written.
 */
function Emoticon(p) {
  return h('span', { className: 'emoticon', role: 'img', 'aria-label': p.name, title: p.token }, h(EmoticonArt, { name: p.name, token: p.token }), h('span', { className: 'tc-sr' }, p.token));
}

/**
 * Returns the emoticon a word of a message stands for, like BetterChatango (renderEmoji, inject.js:6920).
 * @param {string} word Word between two spaces.
 * @param {boolean} premium The message carries the Premium flag.
 * @returns {?Object} Entry of EMOTICONS, null for plain text and for a Premium emoticon without the flag.
 */
function emoticonOf(word, premium) {
  var at = word.indexOf('?'), e = EMOTICON_BY_KEY[at < 0 ? word : word.slice(0, at)];
  if (!e || (e.premium && !premium)) return null;
  if (at >= 0 && (e.name !== 'stripes' || !emoStripesOf(word))) return null;
  return e;
}

/**
 * Splits a text into strings and emoticons.
 * @param {string} text Plain text.
 * @param {boolean} premium The message carries the Premium flag.
 * @returns {string|Array} The text itself when it holds no emoticon.
 */
function emoticonNodes(text, premium) {
  var out = [], run = '';
  String(text).split(/(\s+)/).forEach(function (word, i) {
    var e = i % 2 || !word ? null : emoticonOf(word, premium);
    if (!e) { run += word; return; }
    if (run) out.push(run);
    run = '';
    out.push(h(Emoticon, { key: i, name: e.name, token: word }));
  });
  if (!out.length) return text;
  if (run) out.push(run);
  return out;
}
