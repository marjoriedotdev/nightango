/* ---------- Utilities ---------- */
var MIN = 60000;
var CONFIRM_TIMEOUT = 8000;
var REPO_URL = 'https://github.com/marjoriedotdev/nightango';
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
function ago(ts) {
  var m = Math.round((Date.now() - ts) / MIN);
  if (m < 1) return 'just now';
  if (m < 60) return m + ' min ago';
  var hrs = Math.round(m / 60);
  if (hrs < 24) return plural(hrs, 'hour', 'hours') + ' ago';
  var span = daySpan(Math.round(hrs / 24));
  return plural(span.n, span.unit, span.unit + 's') + ' ago';
}
function elapsedShort(ts) {
  var m = Math.floor((Date.now() - ts) / MIN);
  if (m < 60) return Math.max(m, 1) + ' min';
  if (m < 1440) return Math.floor(m / 60) + ' h';
  var span = daySpan(Math.floor(m / 1440));
  return span.n + ' ' + { day: 'd', month: 'mo', year: 'y' }[span.unit];
}
/**
 * Counts a number of days in days, in rounded months from 30 days, then in rounded years from 12 months.
 * @param {number} days Number of days, 1 or more.
 * @returns {{n: number, unit: string}} Count and its unit: day, month or year.
 */
function daySpan(days) {
  if (days < 30) return { n: days, unit: 'day' };
  // Rounded in both formats: the Friends list and the profile agree for the same date.
  var months = Math.round(days / 30.4375);
  if (months < 12) return { n: months, unit: 'month' };
  return { n: Math.round(days / 365.25), unit: 'year' };
}
/**
 * Returns the season of a local date, or null outside every season: Halloween runs from October 24 to November 2.
 * @param {Date} d Date read on the device.
 */
function seasonOf(d) {
  var m = d.getMonth(), day = d.getDate();
  return (m === 9 && day >= 24) || (m === 10 && day <= 2) ? 'halloween' : null;
}
/**
 * Tells whether a version number X.Y.Z comes after another, which may be a beta X.Y.Z-beta.N.
 * @param {string} a Compared version.
 * @param {string} b Reference version.
 */
function isNewerVersion(a, b) {
  var x = a.split('.'), y = b.split('-')[0].split('.');
  for (var i = 0; i < 3; i++) if (+x[i] !== +y[i]) return +x[i] > +y[i];
  // A release comes after its own betas.
  return b.indexOf('-') !== -1;
}
function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }
function unknownUserText(name) { return 'No Chatango user named ' + name + '.'; }
function isGuest(name) { return /^[!#]/.test(name); }
function storageGet(key) { try { var v = window.localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
function storageSet(key, value) { try { window.localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable: preference not kept */ } }
function storageMerge(key, patch) { storageSet(key, Object.assign(storageGet(key) || {}, patch)); }
/**
 * Reads a JSON file chosen by the user.
 * @param {File} file Chosen file.
 * @returns {Promise} Parsed content, rejected if the file is unreadable or is not JSON.
 */
function readJsonFile(file) {
  return new Promise(function (resolve, reject) {
    var reader = new FileReader();
    reader.onload = function () { try { resolve(JSON.parse(reader.result)); } catch (e) { reject(e); } };
    reader.onerror = function () { reject(reader.error); };
    reader.readAsText(file, 'utf-8');
  });
}
/**
 * Reads a BetterChatango export file whose content is an array.
 * @param {File} file Chosen file.
 * @returns {Promise<?Array>} Array read, null if the file is unreadable or holds no array.
 */
function readJsonArray(file) { return readJsonFile(file).then(function (v) { return Array.isArray(v) ? v : null; }, function () { return null; }); }
/**
 * Downloads a text as a file.
 * @param {string} name File name.
 * @param {string} text File content.
 * @param {string} type MIME type of the file.
 */
function downloadFile(name, text, type) {
  var link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([text], { type: type }));
  link.download = name;
  link.click();
  // URL kept for one minute: revoking it right after the click can cancel the download.
  setTimeout(function () { URL.revokeObjectURL(link.href); }, MIN);
}
/**
 * Downloads a value as a JSON file with the text/json type of BetterChatango exports.
 * @param {string} name File name.
 * @param {*} value Value written by JSON.stringify.
 */
function downloadJson(name, value) { downloadFile(name, JSON.stringify(value), 'text/json'); }
function copyText(text, onDone) {
  function fallback() {
    var ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); onDone(true); } catch (e) { onDone(false); }
    document.body.removeChild(ta);
  }
  try { navigator.clipboard.writeText(text).then(function () { onDone(true); }, fallback); } catch (e) { fallback(); }
}
