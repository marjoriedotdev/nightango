/* ---------- Utilitaires ---------- */
var APP_VERSION = window.__TORCH_SKIN_VERSION__ || '0.1.0-b';
var MIN = 60000;
function cx() { var o = []; for (var i = 0; i < arguments.length; i++) if (arguments[i]) o.push(arguments[i]); return o.join(' '); }
function uid() { return Math.random().toString(36).slice(2, 10); }
function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
function pad(n) { return n < 10 ? '0' + n : String(n); }
function fmtTime(ts, h24) {
  var d = new Date(ts), H = d.getHours(), M = d.getMinutes();
  if (h24) return pad(H) + ':' + pad(M);
  return (H % 12 || 12) + ':' + pad(M) + ' ' + (H >= 12 ? 'PM' : 'AM');
}
function dayKey(ts) { var d = new Date(ts); return d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate(); }
function dayLabel(ts) {
  var d = new Date(ts), n = new Date();
  var a = new Date(d.getFullYear(), d.getMonth(), d.getDate()), b = new Date(n.getFullYear(), n.getMonth(), n.getDate());
  var diff = Math.round((b - a) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}
function shortWhen(ts, h24) {
  var diff = Math.round((new Date().setHours(0, 0, 0, 0) - new Date(ts).setHours(0, 0, 0, 0)) / 86400000);
  if (diff <= 0) return fmtTime(ts, h24);
  if (diff < 7) return new Date(ts).toLocaleDateString('en-GB', { weekday: 'short' });
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
function ago(ts) {
  var m = Math.round((Date.now() - ts) / MIN);
  if (m < 1) return 'just now';
  if (m < 60) return m + ' min ago';
  var hrs = Math.round(m / 60);
  if (hrs < 24) return hrs + (hrs === 1 ? ' hour ago' : ' hours ago');
  var days = Math.round(hrs / 24);
  return days + (days === 1 ? ' day ago' : ' days ago');
}
function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }
function storageGet(key) { try { var v = window.localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
function storageSet(key, value) { try { window.localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* stockage indisponible : préférence non conservée */ } }
function copyText(text, onDone) {
  function fallback() {
    var ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); onDone(true); } catch (e) { onDone(false); }
    document.body.removeChild(ta);
  }
  try { navigator.clipboard.writeText(text).then(function () { onDone(true); }, fallback); } catch (e) { fallback(); }
}
