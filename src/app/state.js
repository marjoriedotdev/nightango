/**
 * Merges stored values into the defaults: a value of another kind than its default is dropped, a key without a default is kept.
 * @param {Object} base Defaults.
 * @param {*} over Stored values.
 */
function typedMerge(base, over) {
  var out = Object.assign({}, base);
  if (kindOf(over) !== 'object') return out;
  Object.keys(over).forEach(function (k) {
    var b = base[k], v = over[k];
    if (!base.hasOwnProperty(k)) out[k] = v;
    else if (kindOf(b) === 'object' && kindOf(v) === 'object') out[k] = typedMerge(b, v);
    else if (kindOf(v) === kindOf(b)) out[k] = v;
  });
  return out;
}
/**
 * Returns the preferences stored in this browser over the defaults, without the values of another type left by an older version or corrupted.
 * @param {*} stored Content of PREFS_KEY, null if absent.
 */
function loadPrefs(stored) {
  var prefs = typedMerge(defaultPrefs(), stored);
  // The only preference with two types: 'auto' or the index of a moon phase.
  if (stored && stored.sky && typeof stored.sky.moon === 'number') prefs.sky.moon = stored.sky.moon;
  return prefs;
}
var PREFS_KEY = 'torch-prototype-prefs';
var ROOT_EL = window.__TORCH_ROOT__ || document.documentElement;
var VIEWER_THEME = ROOT_EL.getAttribute('data-theme');
function initialState() { return { auth: { loggedIn: false }, prefs: loadPrefs(storageGet(PREFS_KEY)) }; }
