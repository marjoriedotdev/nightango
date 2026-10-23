/* ---------- Utilitaires ---------- */
var APP_VERSION = window.__TORCH_SKIN_VERSION__ || '0.1.0-b';
var MIN = 60000;
var CONFIRM_TIMEOUT = 8000;
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
  if (hrs < 24) return hrs + (hrs === 1 ? ' hour ago' : ' hours ago');
  var days = Math.round(hrs / 24);
  return days + (days === 1 ? ' day ago' : ' days ago');
}
function elapsedShort(ts) {
  var m = Math.floor((Date.now() - ts) / MIN);
  if (m < 60) return Math.max(m, 1) + ' min';
  if (m < 1440) return Math.floor(m / 60) + ' h';
  return Math.floor(m / 1440) + ' d';
}
function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }
function unknownUserText(name) { return 'No Chatango user named ' + name + '.'; }
function isGuest(name) { return /^[!#]/.test(name); }
function storageGet(key) { try { var v = window.localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
function storageSet(key, value) { try { window.localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* stockage indisponible : préférence non conservée */ } }
function storageMerge(key, patch) { storageSet(key, Object.assign(storageGet(key) || {}, patch)); }
/**
 * Permet de lire un fichier JSON choisi par l'utilisateur.
 * @param {File} file Fichier choisi.
 * @returns {Promise} Contenu analysé, rejetée si le fichier est illisible ou n'est pas du JSON.
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
 * Permet de lire un fichier d'export de Torch, dont le contenu est un tableau.
 * @param {File} file Fichier choisi.
 * @returns {Promise<?Array>} Tableau lu, null si le fichier est illisible ou ne contient pas de tableau.
 */
function readJsonArray(file) { return readJsonFile(file).then(function (v) { return Array.isArray(v) ? v : null; }, function () { return null; }); }
/**
 * Permet de faire télécharger une valeur en fichier JSON, au type text/json des exports de Torch.
 * @param {string} name Nom du fichier.
 * @param {*} value Valeur écrite par JSON.stringify.
 */
function downloadJson(name, value) {
  var link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([JSON.stringify(value)], { type: 'text/json' }));
  link.download = name;
  link.click();
  // Adresse gardée une minute : la révoquer dès le clic peut annuler le téléchargement.
  setTimeout(function () { URL.revokeObjectURL(link.href); }, MIN);
}
function copyText(text, onDone) {
  function fallback() {
    var ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); onDone(true); } catch (e) { onDone(false); }
    document.body.removeChild(ta);
  }
  try { navigator.clipboard.writeText(text).then(function () { onDone(true); }, fallback); } catch (e) { fallback(); }
}
