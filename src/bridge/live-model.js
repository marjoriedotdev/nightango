/* ---------- Bridge to the real BetterChatango client (injected mode only) ---------- */
var LIVE = !!window.__TORCH_LIVE__;
// Set by the page code before BetterChatango (loader/skin-journal.js): absent from the prototype and from the suites that only read the bridge.
var JOURNAL = window.__TORCH_JOURNAL__ || null;

// Outside React state: set by the bridge after an upload or a crop, it bypasses the HTTP cache of the pictures.
var AVATAR_VERSION = {};
/**
 * Builds the URL of a Chatango profile picture.
 * @param {string} name Account name.
 * @param {string} file File without extension: thumb, thumb_m or full.
 */
function profileImgSrc(name, file) {
  if (!LIVE) return null;
  var n = String(name || '').toLowerCase();
  if (!/^[a-z0-9_-]+$/.test(n)) return null;
  var path = /^[_-]/.test(n) ? 'sp/sp' + n : n.charAt(0) + '/' + (n.charAt(1) || n.charAt(0)) + '/' + n;
  return 'https://ust.chatango.com/profileimg/' + path + '/' + file + '.jpg' + (AVATAR_VERSION[n] ? '?v=' + AVATAR_VERSION[n] : '');
}
/**
 * Builds the URL of the Chatango profile thumbnail.
 * @param {string} name Account name.
 * @param {number} [size] Display size in pixels.
 */
function avatarSrc(name, size) { return profileImgSrc(name, (size || 36) <= 24 ? 'thumb' : 'thumb_m'); }

/**
 * Names the local storage key for the data of one account.
 * @param {string} me Lowercase username.
 */
function skinKey(me) { return 'torch-skin:' + me; }

var ACCOUNT_NAME = /^[a-z0-9_-]{1,20}$/;
/**
 * Tells whether the mini profile of an account is still pending.
 * @param {string} name Member name.
 * @param {Object} u Member in the state.
 */
function isProfilePending(name, u) { return LIVE && ACCOUNT_NAME.test(name) && !u.profileLoaded && !u.profileFailed; }

var VISIT_LABEL = { log: 'visited', like: 'liked profile', dislike: 'disliked profile', msg: 'commented on', refer: 'referred by' };
var VISIT_PAGE = 16;
/**
 * Splits a page of vissle activity.
 * @param {Array} items Items returned by vissle, the sixteenth signals a next page.
 * @param {string} get Requested filter, used as the action when vissle omits it.
 */
function visitorPage(items, get) {
  var shown = items.slice(0, VISIT_PAGE - 1);
  return {
    rows: shown.map(function (x) {
      var user = String(x.user).toLowerCase(), name = String(x.name || x.user);
      return { key: x.time + ':' + user, user: user, name: name, guest: name.charAt(0) === '!', label: VISIT_LABEL[x.action || get], ts: Math.round(x.time * 1000), msg: x.msg || '' };
    }),
    next: items.length === VISIT_PAGE ? shown[shown.length - 1].time : null
  };
}

/* Chatango bits, read in the BetterChatango client (chatango.flags) and cross-checked with chadango and chatango-lib. */
var GROUP_FLAG = { NOANONS: 4, NOCOUNTER: 16, NOIMAGES: 32, NOLINKS: 64, NOVIDEOS: 128, CHANNELSDISABLED: 8192, NLP_SINGLEMSG: 16384, NLP_MSGQUEUE: 32768, BROADCAST_MODE: 65536, IS_CLOSED: 262144, NLP_NGRAM: 2097152, NO_PROXIES: 4194304 };
var CHANNEL_FLAG = { red: 256, blue: 2048, mod: 32768 };
var MSG_FLAG = { PREMIUM: 4, BG_ON: 8, MOD_ICON: 64, STAFF_ICON: 128 };
// Chatango fonts under their Chatango name, in the order of their number (0 to 8), the one used in the <f x…="n"> and <g x…="n"> tags.
var FONT_FACES = ['Arial', 'Comic', 'Georgia', 'Handwriting', 'Impact', 'Palatino', 'Papyrus', 'Times', 'Typewriter'];

// The owner carries both badges and keeps the owner role read from the ok frame.
function badgeRoleOf(flags) { return flags & MSG_FLAG.STAFF_ICON ? 'admin' : flags & MSG_FLAG.MOD_ICON ? 'mod' : null; }
function channelOf(flags) { return flags & CHANNEL_FLAG.mod ? 'mod' : flags & CHANNEL_FLAG.blue ? 'blue' : flags & CHANNEL_FLAG.red ? 'red' : 'none'; }
