import { ACCOUNT_NAME, BADGE_FLAG } from './chatango.js';
import { kindOf, storageGet, storageMerge, storageSet } from './util.js';
import { hexToRgb } from './colors.js';
// -- Account data kept in this browser ----------------------------------------
// Fields of torch-skin:<username>: each one declared with its kind, its blank value and its reading, the only way in and out of the key.

export var NOTE_LABEL_MAX = 24, NOTE_TEXT_MAX = 500;
/**
 * Returns the private notes kept in this browser without the entries of another shape.
 * @param {Object} stored Notes by member name, untrusted.
 */
function storedNotes(stored) {
  var out = {};
  Object.keys(stored).forEach(function (n) {
    var x = stored[n];
    if (ACCOUNT_NAME.test(n) && kindOf(x) === 'object' && typeof x.label === 'string' && typeof x.note === 'string' && (x.label || x.note)) {
      out[n] = { label: x.label.slice(0, NOTE_LABEL_MAX), note: x.note.slice(0, NOTE_TEXT_MAX) };
    }
  });
  return out;
}
export var SPACE_MAX = 12, SPACE_NAME_MAX = 24;
/**
 * Returns the favorite people kept in this browser without the entries that are not an account name.
 * @param {Array} stored Member names, untrusted.
 */
function storedFavoritePeople(stored) {
  return stored.filter(function (n) { return typeof n === 'string' && ACCOUNT_NAME.test(n); });
}
var SPACE_MEMBER = /^(group|dm):[a-z0-9_-]{1,20}$/;
/**
 * Returns the spaces kept in this browser without the entries of another shape.
 * @param {Array} stored Spaces, untrusted.
 */
function storedSpaces(stored) {
  return stored.filter(function (x) {
    return kindOf(x) === 'object' && typeof x.id === 'string' && typeof x.name === 'string' && x.name.trim() && kindOf(x.members) === 'array';
  }).slice(0, SPACE_MAX).map(function (x) {
    return { id: x.id, name: x.name.trim().slice(0, SPACE_NAME_MAX), quiet: x.quiet === true, members: x.members.filter(function (m) { return typeof m === 'string' && SPACE_MEMBER.test(m); }) };
  });
}

/**
 * Keeps the entries of a map that pass a test.
 * @param {Object} map Stored map, untrusted.
 * @param {function(*): boolean} ok Test of a value.
 */
function entriesWhere(map, ok) {
  var out = {};
  Object.keys(map).forEach(function (k) { if (ok(map[k])) out[k] = map[k]; });
  return out;
}
// Fields that mirror the state of the interface, written together by useLocalStore (app/live-state.js).
var MIRRORED = {
  hidden: { kind: 'array', blank: [] },
  channels: { kind: 'object', blank: {} },
  sendChannels: { kind: 'object', blank: {} },
  accents: { kind: 'object', blank: {}, read: function (v) { return entriesWhere(v, function (x) { return !!hexToRgb(x); }); } },
  notes: { kind: 'object', blank: {}, read: storedNotes },
  favoritePeople: { kind: 'array', blank: [], read: storedFavoritePeople },
  spaces: { kind: 'array', blank: [], read: storedSpaces },
  space: { kind: 'string', blank: '' },
  readTs: { kind: 'object', blank: {} },
  badges: { kind: 'object', blank: {} },
  ownBadges: { kind: 'object', blank: {}, read: function (v) { return entriesWhere(v, function (x) { return !!BADGE_FLAG[x]; }); } },
  unstyled: { kind: 'array', blank: [] },
  style: { kind: 'object', blank: null },
  // Lists from before the sync with BetterChatango, kept until it accepts them.
  fav: { kind: 'array' },
  muted: { kind: 'array' },
  ignored: { kind: 'array' }
};
// Fields each written by one feature on its own.
var OWN = {
  recentEmoji: { kind: 'array', blank: [] },
  premiumReminded: { kind: 'string', blank: '' },
  pmReadMigrated: { kind: 'boolean', blank: false }
};
function accountKey(me) { return 'torch-skin:' + me; }
function blankOf(f) { return f.blank === undefined ? undefined : JSON.parse(JSON.stringify(f.blank)); }
function readField(f, v) { return kindOf(v) === f.kind ? (f.read ? f.read(v) : v) : blankOf(f); }

export function blankMirror() {
  var out = {};
  Object.keys(MIRRORED).forEach(function (k) { out[k] = blankOf(MIRRORED[k]); });
  return out;
}
/**
 * Reads the mirrored fields of an account, each one of its kind or blank.
 * @param {string} me Lowercase username.
 */
export function readMirror(me) {
  var stored = storageGet(accountKey(me)) || {}, out = {};
  Object.keys(MIRRORED).forEach(function (k) { out[k] = readField(MIRRORED[k], stored[k]); });
  return out;
}
/**
 * Writes the mirrored fields of an account, the other fields kept.
 * @param {string} me Lowercase username.
 * @param {Object} mirror Mirrored fields.
 * @returns {boolean} False if the storage refused the write.
 */
export function writeMirror(me, mirror) { return storageMerge(accountKey(me), mirror); }
/**
 * Reads a field written by one feature on its own.
 * @param {string} me Lowercase username.
 * @param {string} name Field of OWN.
 */
export function readOwn(me, name) { return readField(OWN[name], (storageGet(accountKey(me)) || {})[name]); }
/**
 * Writes a field written by one feature on its own, the other fields kept.
 * @param {string} me Lowercase username.
 * @param {string} name Field of OWN.
 * @param {*} value Value of the field's kind.
 * @returns {boolean} False if the storage refused the write.
 */
export function writeOwn(me, name, value) { var o = {}; o[name] = value; return storageMerge(accountKey(me), o); }
/**
 * Writes the stored content back without the values of another kind than their field's, left by an older version or corrupted, and without some fields.
 * @param {string} me Lowercase username.
 * @param {Array<string>} drop Fields to remove.
 */
export function cleanAccount(me, drop) {
  var stored = storageGet(accountKey(me)) || {}, raw = JSON.stringify(stored), fields = Object.assign({}, MIRRORED, OWN);
  Object.keys(stored).forEach(function (k) { if (drop.indexOf(k) >= 0 || fields[k] && kindOf(stored[k]) !== fields[k].kind) delete stored[k]; });
  if (JSON.stringify(stored) !== raw) storageSet(accountKey(me), stored);
}
