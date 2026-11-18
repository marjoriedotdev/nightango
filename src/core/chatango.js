import { LIVE } from './env.js';
// -- Chatango -----------------------------------------------------------------
// Facts of Chatango and BetterChatango that live and the prototype share: names, pictures, group addresses, bits, fonts, channels, badges, genders.

export var ACCOUNT_NAME = /^[a-z0-9_-]{1,20}$/;
export function isGuest(name) { return /^[!#]/.test(name); }
// Room of the private connection in BetterChatango's client: the gid of its socket and of its handlers.
export var PM_CONNECTION = 'private_message';
// Results per page of the Chatango people search, BetterChatango's Meet people.
export var MEET_PAGE = 40;

// A message shown before its final id keeps the temporary id k:{key}, which Chatango refers to by the key alone.
export function tempMsgId(key) { return 'k:' + key; }
export function isTempMsgId(id) { return String(id).indexOf('k:') === 0; }
export function plainMsgId(id) { return String(id).replace(/^k:/, ''); }

// Outside React state: set by the bridge after an upload or a crop, it bypasses the HTTP cache of the pictures.
export var AVATAR_VERSION = {};
/**
 * Builds the URL of a Chatango profile picture.
 * @param {string} name Account name.
 * @param {string} file File without extension: thumb, thumb_m or full.
 */
export function profileImgSrc(name, file) {
  if (!LIVE) return null;
  var n = String(name || '').toLowerCase();
  if (!ACCOUNT_NAME.test(n)) return null;
  var path = /^[_-]/.test(n) ? 'sp/sp' + n : n.charAt(0) + '/' + (n.charAt(1) || n.charAt(0)) + '/' + n;
  return 'https://ust.chatango.com/profileimg/' + path + '/' + file + '.jpg' + (AVATAR_VERSION[n] ? '?v=' + AVATAR_VERSION[n] : '');
}
/**
 * Builds the URL of the Chatango profile thumbnail.
 * @param {string} name Account name.
 * @param {number} [size] Display size in pixels.
 */
export function avatarSrc(name, size) { return profileImgSrc(name, (size || 36) <= 24 ? 'thumb' : 'thumb_m'); }

/**
 * Builds the address of a Chatango group or profile.
 * @param {string} name Group or account name.
 */
export function chatangoPageUrl(name) { return 'https://' + name + '.chatango.com'; }
/**
 * Reads a group name from a name or a link, the inverse of chatangoPageUrl.
 * @param {string} v Typed text.
 */
export function parseGroupName(v) {
  return String(v || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^client\.chatango\.com\/q\?/, '').replace(/\.chatango\.com.*$/, '').replace(/\/.*$/, '').replace(/^#/, '');
}

/* Chatango bits, read in the BetterChatango client (chatango.flags) and cross-checked with chadango and chatango-lib. */
export var GROUP_FLAG = { NOANONS: 4, NOCOUNTER: 16, NOIMAGES: 32, NOLINKS: 64, NOVIDEOS: 128, CHANNELSDISABLED: 8192, NLP_SINGLEMSG: 16384, NLP_MSGQUEUE: 32768, BROADCAST_MODE: 65536, IS_CLOSED: 262144, MODS_CHOOSE_VISIBILITY: 1048576, NLP_NGRAM: 2097152, NO_PROXIES: 4194304 };
export var MSG_FLAG = { PREMIUM: 4, BG_ON: 8, MOD_ICON: 64, STAFF_ICON: 128 };
// Badges of the BetterChatango picker, sent in the flag of each group message (client.html:261-272).
export var BADGE_FLAG = { mod: MSG_FLAG.MOD_ICON, admin: MSG_FLAG.STAFF_ICON, owner: MSG_FLAG.MOD_ICON | MSG_FLAG.STAFF_ICON };
// Chatango fonts under their Chatango name, in the order of their number (0 to 8), the one used in the <f x…="n"> and <g x…="n"> tags.
export var FONT_STACKS = { 'Arial': 'Arial, sans-serif', 'Comic': '"Comic Sans MS", "Comic Sans", "Chalkboard SE", sans-serif', 'Georgia': 'Georgia, serif', 'Handwriting': '"Lucida Handwriting", Zapfino, Chalkduster, cursive', 'Impact': 'Impact, sans-serif', 'Palatino': 'Palatino, serif', 'Papyrus': 'Papyrus, cursive', 'Times': 'Times, serif', 'Typewriter': 'Typewriter, "Courier New", monospace' };
export var FONT_FACES = Object.keys(FONT_STACKS);
/**
 * Converts a Chatango font size to a percentage.
 * @param {number} size Chatango size, 11 equals 100 %.
 */
export function fontPercent(size) { return Math.round(Math.min(200, Math.max(82, size * 100 / 11))); }
// Channel bits of a group message, from the least to the most specific.
export var CHANNELS = { none: { label: 'No channel', color: null, flag: 0 }, red: { label: 'Red', color: '#e5484d', flag: 256 }, blue: { label: 'Blue', color: '#3e8bd8', flag: 2048 }, mod: { label: 'Staff', color: '#8a8e96', flag: 32768 } };
/**
 * Names a channel like the send entry of the channel menu.
 * @param {string} k Key in CHANNELS.
 */
export function channelLabel(k) { return k === 'none' ? CHANNELS.none.label : CHANNELS[k].label + ' channel'; }

// Both badges are the owner badge of BetterChatango (data-flag 192), shown as such on the owner's messages only (inject.js:8006-8012).
export function badgeRoleOf(flags) {
  var mod = flags & MSG_FLAG.MOD_ICON, staff = flags & MSG_FLAG.STAFF_ICON;
  return mod && staff ? 'owner' : staff ? 'admin' : mod ? 'mod' : null;
}
export function channelOf(flags) { return flags & CHANNELS.mod.flag ? 'mod' : flags & CHANNELS.blue.flag ? 'blue' : flags & CHANNELS.red.flag ? 'red' : 'none'; }

export var GENDER_LABEL = { M: 'Male', F: 'Female' };
/**
 * Abbreviates the gender of a profile.
 * @param {string} g Gender in full.
 */
export function genderCode(g) { return g === GENDER_LABEL.M ? 'M' : g === GENDER_LABEL.F ? 'F' : null; }
