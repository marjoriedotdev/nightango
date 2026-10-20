function deepMerge(base, over) {
  if (!over || typeof over !== 'object') return base;
  var out = Array.isArray(base) ? base.slice() : Object.assign({}, base);
  Object.keys(over).forEach(function (k) {
    var b = base ? base[k] : undefined, v = over[k];
    out[k] = b && typeof b === 'object' && !Array.isArray(b) && v && typeof v === 'object' && !Array.isArray(v) ? deepMerge(b, v) : v;
  });
  return out;
}
var PREFS_KEY = 'torch-prototype-prefs';
var ROOT_EL = window.__TORCH_ROOT__ || document.documentElement;
var VIEWER_THEME = ROOT_EL.getAttribute('data-theme');
function initialState() { return { auth: { loggedIn: false }, prefs: deepMerge(defaultPrefs(), storageGet(PREFS_KEY)) }; }
