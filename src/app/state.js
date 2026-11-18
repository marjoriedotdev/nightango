import { kindOf, storageGet } from '../core/util.js';
import { defaultPrefs } from '../core/prefs.js';
import { mkSettings } from '../core/roles.js';
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
// -- Shapes of the state ------------------------------------------------------
// Live and the prototype build their state from the same shapes: a view reads the same fields in both modes.

/**
 * Creates the world of a signed-in account, over which the given fields apply.
 * @param {string} me Signed-in account.
 * @param {Object=} fields Fields that replace the defaults.
 */
export function newWorld(me, fields) {
  var users = {}; users[me] = newUser({ self: true });
  return Object.assign({
    me: me, users: users, groups: {}, dms: {}, notifyOnline: {}, friendAdds: {}, mentionLog: [], notes: {}, spaces: [], space: null, mediaRev: 0, pmHistoryRev: 0, meStatus: 'online',
    route: { view: 'discover' }, split: null, pip: null, lastChat: { view: 'discover' },
    sections: { favorites: true, groups: true, dms: true },
    groupsSeen: false, pmLoaded: false, friendsLoaded: false, pmChecked: null, pmrStatus: null, pmrDismissed: false, pmSettings: null, pmSettingSave: null, premium: null, retrying: {}
  }, fields);
}
/**
 * Creates a group, titled with its name until Chatango or the sample world gives a title, over which the given fields apply.
 * @param {string} id Group name.
 * @param {Object=} fields Fields that replace the defaults.
 */
export function newGroup(id, fields) {
  return Object.assign({
    id: id, title: id, topic: id, joined: false, owned: false, favorite: false, muted: false, hiddenChannels: [], sendChannel: 'none', accent: null, unread: 0, mentions: 0, lastReadTs: null,
    members: [], guestNames: [], guests: 0, liveCount: 0, messages: [], closed: false, bans: [], audit: [], dismissedAnnouncement: false,
    settings: mkSettings({ overview: { title: id, description: '' }, staff: {} })
  }, fields);
}
/**
 * Creates a member, online until a frame or the sample world says otherwise, over which the given fields apply.
 * @param {Object=} fields Fields that replace the defaults.
 */
export function newUser(fields) { return Object.assign({ status: 'online', about: '', style: {} }, fields); }

export var PREFS_KEY = 'torch-prototype-prefs';
export function initialState() { return { auth: { loggedIn: false }, prefs: loadPrefs(storageGet(PREFS_KEY)) }; }
