import { COLOR } from 'build:tokens';
// -- Colors -------------------------------------------------------------------
export function hexToRgb(hex) {
  var m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(hex || '').trim());
  if (!m) return null;
  var s = m[1].length === 3 ? m[1].split('').map(function (c) { return c + c; }).join('') : m[1];
  var n = parseInt(s, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function rgbToHex(c) { return '#' + c.map(function (v) { return ('0' + Math.max(0, Math.min(255, Math.round(v))).toString(16)).slice(-2); }).join(''); }
function lum(c) {
  var a = c.map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}
function contrast(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
export function mix(a, b, t) { return [0, 1, 2].map(function (i) { return a[i] + (b[i] - a[i]) * t; }); }
export function ensureContrast(hex, bgHex, min) {
  var c = hexToRgb(hex), bg = hexToRgb(bgHex);
  if (!c || !bg) return undefined;
  var target = contrast([0, 0, 0], bg) >= contrast([255, 255, 255], bg) ? [0, 0, 0] : [255, 255, 255], t = 0, cur = c;
  while (contrast(cur, bg) < min && t < 1) { t += 0.05; cur = mix(c, target, t); }
  return rgbToHex(cur);
}
var CSS_COLOR_NAMES = Object.create(null);
('aliceblue f0f8ff antiquewhite faebd7 aqua 00ffff aquamarine 7fffd4 azure f0ffff beige f5f5dc bisque ffe4c4 black 000000 blanchedalmond ffebcd blue 0000ff ' +
  'blueviolet 8a2be2 brown a52a2a burlywood deb887 cadetblue 5f9ea0 chartreuse 7fff00 chocolate d2691e coral ff7f50 cornflowerblue 6495ed cornsilk fff8dc ' +
  'crimson dc143c cyan 00ffff darkblue 00008b darkcyan 008b8b darkgoldenrod b8860b darkgray a9a9a9 darkgreen 006400 darkgrey a9a9a9 darkkhaki bdb76b ' +
  'darkmagenta 8b008b darkolivegreen 556b2f darkorange ff8c00 darkorchid 9932cc darkred 8b0000 darksalmon e9967a darkseagreen 8fbc8f darkslateblue 483d8b ' +
  'darkslategray 2f4f4f darkslategrey 2f4f4f darkturquoise 00ced1 darkviolet 9400d3 deeppink ff1493 deepskyblue 00bfff dimgray 696969 dimgrey 696969 ' +
  'dodgerblue 1e90ff firebrick b22222 floralwhite fffaf0 forestgreen 228b22 fuchsia ff00ff gainsboro dcdcdc ghostwhite f8f8ff gold ffd700 goldenrod daa520 ' +
  'gray 808080 green 008000 greenyellow adff2f grey 808080 honeydew f0fff0 hotpink ff69b4 indianred cd5c5c indigo 4b0082 ivory fffff0 khaki f0e68c ' +
  'lavender e6e6fa lavenderblush fff0f5 lawngreen 7cfc00 lemonchiffon fffacd lightblue add8e6 lightcoral f08080 lightcyan e0ffff lightgoldenrodyellow fafad2 ' +
  'lightgray d3d3d3 lightgreen 90ee90 lightgrey d3d3d3 lightpink ffb6c1 lightsalmon ffa07a lightseagreen 20b2aa lightskyblue 87cefa lightslategray 778899 ' +
  'lightslategrey 778899 lightsteelblue b0c4de lightyellow ffffe0 lime 00ff00 limegreen 32cd32 linen faf0e6 magenta ff00ff maroon 800000 ' +
  'mediumaquamarine 66cdaa mediumblue 0000cd mediumorchid ba55d3 mediumpurple 9370db mediumseagreen 3cb371 mediumslateblue 7b68ee mediumspringgreen 00fa9a ' +
  'mediumturquoise 48d1cc mediumvioletred c71585 midnightblue 191970 mintcream f5fffa mistyrose ffe4e1 moccasin ffe4b5 navajowhite ffdead navy 000080 ' +
  'oldlace fdf5e6 olive 808000 olivedrab 6b8e23 orange ffa500 orangered ff4500 orchid da70d6 palegoldenrod eee8aa palegreen 98fb98 paleturquoise afeeee ' +
  'palevioletred db7093 papayawhip ffefd5 peachpuff ffdab9 peru cd853f pink ffc0cb plum dda0dd powderblue b0e0e6 purple 800080 rebeccapurple 663399 ' +
  'red ff0000 rosybrown bc8f8f royalblue 4169e1 saddlebrown 8b4513 salmon fa8072 sandybrown f4a460 seagreen 2e8b57 seashell fff5ee sienna a0522d ' +
  'silver c0c0c0 skyblue 87ceeb slateblue 6a5acd slategray 708090 slategrey 708090 snow fffafa springgreen 00ff7f steelblue 4682b4 tan d2b48c teal 008080 ' +
  'thistle d8bfd8 tomato ff6347 turquoise 40e0d0 violet ee82ee wheat f5deb3 white ffffff whitesmoke f5f5f5 yellow ffff00 yellowgreen 9acd32')
  .split(' ').forEach(function (x, i, all) { if (i % 2 === 0) CSS_COLOR_NAMES[x] = '#' + all[i + 1]; });
/**
 * Converts a CSS color to hex.
 * @param {string} value Hex color with or without a hash, named color, rgb() or rgba().
 */
export function cssColor(value) {
  var v = String(value || '').trim().toLowerCase();
  if (hexToRgb(v)) return v.charAt(0) === '#' ? v : '#' + v;
  if (CSS_COLOR_NAMES[v]) return CSS_COLOR_NAMES[v];
  var m = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/.exec(v);
  return m ? rgbToHex([+m[1], +m[2], +m[3]]) : null;
}
export function rgba(hex, a) { var c = hexToRgb(hex) || hexToRgb(EMBER); return 'rgba(' + c[0] + ', ' + c[1] + ', ' + c[2] + ', ' + a + ')'; }

// Surfaces of the design system: selected is the surface where the accent as text has the lowest contrast.
export var SURFACE = {
  dark: { bg: COLOR.dark.bg, body: COLOR.dark['text-body'], selected: COLOR.dark.selected },
  light: { bg: COLOR.light.bg, body: COLOR.light['text-body'], selected: COLOR.light.selected }
};
var MOONLIGHT = COLOR.dark.accent, EMBER = COLOR.light.accent;
export var ACCENTS = [['Moonlight', MOONLIGHT], ['Ember', EMBER], ['Blue', '#5b8def'], ['Green', '#3fb27f'], ['Violet', '#c084fc'], ['Pink', '#f472b6'], ['Slate', '#94a3b8']];
// Not one default for both themes: a Moonlight fill disappears on the light surfaces, where it holds 1.06:1.
var DEFAULT_ACCENTS = { dark: MOONLIGHT, light: EMBER };
/**
 * Returns the accent of the interface: the chosen color, or the default of the theme until one is chosen.
 * @param {Object} prefs Preferences, whose accent is a hex color or 'auto'.
 * @param {string} theme Resolved theme, dark or light.
 */
export function accentOf(prefs, theme) { return hexToRgb(prefs.accent) ? prefs.accent : DEFAULT_ACCENTS[theme]; }
/**
 * Returns the text color that holds 4.5:1 on an accent fill.
 * @param {string} hex Accent color.
 */
export function onAccentOf(hex) { var ink = COLOR.dark['on-accent']; return contrast(hexToRgb(hex), hexToRgb(ink)) >= 4.5 ? ink : '#ffffff'; }
function alphaOf(rgbaText) { return parseFloat(/([\d.]+)\)$/.exec(rgbaText)[1]); }
/**
 * Returns the accent tokens of a color, with the accent as text corrected for contrast in each theme.
 * @param {string} hex Accent color, Ember if it is not a hex color.
 * @returns {{accent: string, onAccent: string, text: {dark: string, light: string}, soft: {dark: string, light: string}}} Fill, text on the fill, accent as text and soft fill by theme.
 */
export function accentTokens(hex) {
  var acc = hexToRgb(hex) ? hex : EMBER;
  return {
    accent: acc, onAccent: onAccentOf(acc),
    text: { dark: ensureContrast(acc, SURFACE.dark.selected, 4.5), light: ensureContrast(acc, SURFACE.light.selected, 4.5) },
    soft: { dark: rgba(acc, alphaOf(COLOR.dark['accent-soft'])), light: rgba(acc, alphaOf(COLOR.light['accent-soft'])) }
  };
}
/**
 * Returns the inline style that gives an element and its content an accent of its own.
 * @param {string} hex Accent color.
 * @param {string} theme Resolved theme, dark or light.
 */
export function accentScope(hex, theme) {
  // The root declares --accent-text as var(--accent-text-d|l), resolved there: a scope sets the final tokens.
  var t = accentTokens(hex);
  return { '--accent': t.accent, '--on-accent': t.onAccent, '--accent-text': t.text[theme], '--accent-soft': t.soft[theme], '--focus-ring': t.text[theme] };
}
