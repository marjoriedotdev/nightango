/* ---------- Couleurs ---------- */
function hexToRgb(hex) {
  var m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(hex || '').trim());
  if (!m) return null;
  var s = m[1].length === 3 ? m[1].split('').map(function (c) { return c + c; }).join('') : m[1];
  var n = parseInt(s, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex(c) { return '#' + c.map(function (v) { return ('0' + Math.max(0, Math.min(255, Math.round(v))).toString(16)).slice(-2); }).join(''); }
function lum(c) {
  var a = c.map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}
function contrast(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
function mix(a, b, t) { return [0, 1, 2].map(function (i) { return a[i] + (b[i] - a[i]) * t; }); }
function ensureContrast(hex, bgHex, min) {
  var c = hexToRgb(hex), bg = hexToRgb(bgHex);
  if (!c || !bg) return undefined;
  var target = lum(bg) > 0.4 ? [0, 0, 0] : [255, 255, 255], t = 0, cur = c;
  while (contrast(cur, bg) < min && t < 1) { t += 0.05; cur = mix(c, target, t); }
  return rgbToHex(cur);
}
function rgba(hex, a) { var c = hexToRgb(hex) || [242, 122, 63]; return 'rgba(' + c[0] + ', ' + c[1] + ', ' + c[2] + ', ' + a + ')'; }
function darken(hex, f) { var c = hexToRgb(hex) || [242, 122, 63]; return rgbToHex(c.map(function (v) { return v * f; })); }

var SURFACE = { dark: { bg: '#16171a', body: '#d6d8dc' }, light: { bg: '#ffffff', body: '#2a2c31' } };
var FONT_STACKS = { 'Arial': 'Arial, sans-serif', 'Georgia': 'Georgia, serif', 'Courier New': 'Typewriter, "Courier New", monospace', 'Comic Sans MS': '"Comic Sans MS", "Comic Sans", cursive', 'Lucida Handwriting': '"Lucida Handwriting", Zapfino, Chalkduster, cursive', 'Palatino': 'Palatino, serif', 'Impact': 'Impact, sans-serif', 'Papyrus': 'Papyrus, cursive', 'Times New Roman': 'Times, serif' };
var CHANNELS = { none: { label: 'No channel', color: null }, red: { label: 'Red', color: '#e5484d' }, blue: { label: 'Blue', color: '#3e8bd8' }, mod: { label: 'Staff', color: '#8a8e96' } };
