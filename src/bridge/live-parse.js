import { MIN, lower, unquote } from '../core/util.js';
import { cssColor, hexToRgb, rgbToHex } from '../core/colors.js';
import { BACKGROUND_REPEAT } from '../core/rich-text.js';
import { ACCOUNT_NAME } from '../core/chatango.js';
import { parsePm } from '../core/message-content.js';
// -- Text and references ------------------------------------------------------

/**
 * Returns the spelling of a member's name when a frame or BetterChatango carries it with capitals.
 * @param {string} name Member name in lowercase.
 * @param {?string} written Name as carried.
 * @returns {?string} Spelling to show, null without capitals or if written names someone else.
 */
export function spellingOf(name, written) { return written !== name && lower(written) === name ? written : null; }

// -- Private history ----------------------------------------------------------

/**
 * Reads a record of the BetterChatango private history.
 * @param {{ts: number, data: string, unread: number}} v Record (saveMessage), data being the full msg frame.
 * @returns {?Object} Archived message with its archiveTs key, null if the frame lacks some fields.
 */
export function pmRecordEntry(v) {
  var parts = String(v.data || '').split(':').slice(1);
  if (parts.length <= 5) return null;
  return Object.assign(pmFrame(parts), { archiveTs: v.ts, unread: !!v.unread });
}
/**
 * Reads a msg or msgoff frame of the private connection, as received or as kept in the private history.
 * @param {Array<string>} parts Frame split on :, from the author on.
 * @returns {Object} Message: author, spelling, sent time (0 if unreadable), body read by parsePm, PM key and references.
 */
export function pmFrame(parts) {
  var body = parsePm(parts), author = lower(parts[0]);
  return { author: author, spelling: spellingOf(author, body.written), ts: epochMs(parts[3]), text: body.text, parts: body.parts, style: body.style, embeds: body.embeds, key: body.key, editId: body.editId, replyId: body.replyId };
}
/**
 * Screens the records of an imported private history before any write.
 * @param {Array} records File content, untrusted.
 * @param {string} me Signed-in account.
 * @returns {{valid: Array, skipped: number, foreign: boolean}} Records to write, target in lowercase and marked read, the number skipped, and true for another account's file, of which nothing is written.
 */
export function screenPmRecords(records, me) {
  var valid = [], skipped = 0, foreign = 0;
  records.forEach(function (r) {
    var ok = !!r && typeof r.target === 'string' && ACCOUNT_NAME.test(r.target.toLowerCase()) && typeof r.ts === 'number' && isFinite(r.ts) && r.ts > 0
      && typeof r.data === 'string' && r.data.indexOf('msg:') === 0;
    var fields = ok ? r.data.split(':') : [];
    if (fields.length < 7) { skipped++; return; }
    var author = lower(fields[1]);
    if (author !== lower(r.target) && author !== lower(me)) { skipped++; foreign++; return; }
    valid.push({ target: lower(r.target), ts: r.ts, data: r.data, unread: 0 });
  });
  // Another account's file: its received PMs pass the screening one by one, but none is written.
  if (skipped && foreign === skipped) return { valid: [], skipped: skipped, foreign: true };
  return { valid: valid, skipped: skipped, foreign: false };
}

// -- Private settings ---------------------------------------------------------

// Chatango name of each PM setting of the account (chadango GetSettings and SetSettings).
export var PM_SETTING_NAMES = { hideIdle: 'disable_idle_time', allowAnon: 'allow_anon', emailOffline: 'email_offline_msg' };
/**
 * Reads the settings reply of the private connection.
 * @param {Array<string>} data Frame split on :, name and on or off for each setting.
 * @returns {?Object} hideIdle, allowAnon and emailOffline as booleans, null if one of them is missing.
 */
export function parsePmSettings(data) {
  var read = {}, out = {};
  for (var i = 0; i + 1 < data.length; i += 2) read[data[i]] = data[i + 1];
  return Object.keys(PM_SETTING_NAMES).every(function (k) {
    var v = read[PM_SETTING_NAMES[k]];
    out[k] = v === 'on';
    return v === 'on' || v === 'off';
  }) ? out : null;
}

// -- Group frames -------------------------------------------------------------

export function notNone(v) { return !!v && v !== 'None'; }
// Guest named in lowercase, like the author of its messages: the card and the ban find them.
export function sessionOf(account, guest) {
  if (notNone(account)) return { account: lower(account), spelling: spellingOf(lower(account), account) };
  if (notNone(guest)) return { guest: '#' + lower(guest), spelling: spellingOf('#' + lower(guest), '#' + guest) };
  return { anon: true };
}
export function parseParticipants(list) {
  var names = [], sessions = {}, spellings = {};
  list.forEach(function (x) {
    var t = x.split(':');
    if (t.length < 4) return;
    var one = sessionOf(t[3], t[4]);
    if (one.account && names.indexOf(one.account) < 0) names.push(one.account);
    if (one.spelling) spellings[one.account || one.guest] = one.spelling;
    sessions[t[1]] = one;
  });
  return { names: names, sessions: sessions, spellings: spellings };
}
export function parseMods(entries) {
  var mods = {};
  entries.forEach(function (x) { var p = String(x).split(','); if (p[0]) mods[lower(p[0])] = parseInt(p[1], 10) || 0; });
  return mods;
}
/**
 * Reads a BetterChatango ban page.
 * @param {Array<string>} data Frame split on :, entries unid:ip:name:timestamp:author separated by semicolons.
 * @returns {Array<Object>} Entries, with the raw timestamp (ts) that serves as the cursor for the next page.
 */
export function parseBans(data) {
  var raw = data.join(':');
  if (!raw) return [];
  return raw.split(';').map(function (x) {
    var t = x.split(':');
    // Cursor converted like BetterChatango, which reads the timestamp with + before sending it back.
    return Object.assign(banEntry(t, t[4], epochMs(t[3]) || Date.now()), { ts: String(+t[3]) });
  }).filter(function (b) { return b.unid; });
}
/**
 * Builds a ban from the fields unid:ip:name that every ban frame starts with. A ban without a name bans a guest.
 * @param {Array<string>} t Fields unid, IP and name.
 * @param {string} by Author of the ban.
 * @param {number} at Ban time in ms.
 */
function banEntry(t, by, at) { return { unid: t[0], ip: t[1], name: lower(t[2]) || '!anon', guest: !t[2], by: lower(by), at: at }; }
/**
 * Reads the blocked frame: the ban of a member, dated at reception.
 * @param {Array<string>} data Frame split on :, unid, IP, name and author.
 */
export function parseBlocked(data) { return banEntry(data, data[3], Date.now()); }
/**
 * Reads the unblocked frame like BetterChatango.
 * @param {Array<string>} data Frame split on :, entries unid:ip:name separated by semicolons, author in the second-to-last field.
 * @returns {Array<Object>} Unbans, dated at reception like in BetterChatango.
 */
export function parseUnbanned(data) {
  var by = lower(data.slice(-2)[0]), at = Date.now();
  return data.join(':').split(';').map(function (x) { return banEntry(x.split(':'), by, at); }).filter(function (b) { return b.unid; });
}
/**
 * Reads the BetterChatango bansearchresult reply.
 * @param {Array<string>} data Frame split on :, date included: other names, name, IP, unid, author and date.
 * @returns {?Object} Ban found, null if none.
 */
export function parseBanSearch(data) {
  // BetterChatango only looks at the name and would report a guest searched by IP as not found.
  if (!data[1] && !data[3]) return null;
  // Like BetterChatango, the date is read in fixed Pacific time. On its own, GMT-0800 passes for a year: the date is validated without it.
  var date = data.slice(5).join(':'), at = isNaN(new Date(date).getTime()) ? 0 : new Date(date + ' GMT-0800').getTime();
  return Object.assign(banEntry([data[3], data[2], data[1]], data[4], at), { includes: data[0] ? data[0].split(';').filter(Boolean).map(lower) : [] });
}
export function parseModLog(data) {
  var raw = data.join(':');
  if (!raw) return [];
  return raw.split(';').map(function (x) {
    var f = unquote(x).split(',');
    return { id: f[0], type: f[1], actor: lower(f[2]), target: lower(f[4]), at: Math.round(parseFloat(f[5]) * 1000) || 0, extra: f.slice(6).join(',') };
  }).filter(function (x) { return x.type; });
}

// -- Premium background -------------------------------------------------------

/**
 * Converts a CSS background color to hex, null for a fully transparent one.
 * @param {string} value CSS color read in custom_profile.css.
 */
function opaqueColor(value) {
  var v = String(value || '').trim(), f = /^(?:rgb|hsl)a?\(([^)]*)\)$/i.exec(v), p = f ? f[1].trim().split(/\s*[,\/]\s*|\s+/) : [];
  return p.length > 3 && parseFloat(p[3]) === 0 ? null : cssColor(v);
}
// The BetterChatango background form writes well under 1 KB: a larger custom_profile.css is read as absent.
export var MINI_CSS_MAX_LENGTH = 4096;
/**
 * Removes the comments of a style sheet and keeps an unclosed one as text.
 * @param {string} css Style sheet.
 */
function cssWithoutComments(css) {
  var out = '', at = 0, open, close;
  while ((open = css.indexOf('/*', at)) >= 0 && (close = css.indexOf('*/', open + 2)) >= 0) {
    out += css.slice(at, open);
    at = close + 2;
  }
  return out + css.slice(at);
}
/**
 * Reads the Premium background of a mini profile without ever injecting its CSS.
 * @param {string} css Content of custom_profile.css.
 */
export function parseMiniCss(css) {
  var rules = Object.create(null), unsafe = /^(?:__proto__|constructor|prototype)$/, at = 0;
  // Scanned with indexOf, not a pattern: the cost stays linear in the size of the file, braces and comments closed or not.
  css = cssWithoutComments(String(css));
  for (;;) {
    var open = css.indexOf('{', at), start = open;
    if (open < 0) break;
    while (start > at && css.charAt(start - 1) !== '}') start--;
    // A brace with no selector before it starts no rule: the next selector can begin right after it.
    if (start === open) { at = open + 1; continue; }
    var close = css.indexOf('}', open + 1);
    if (close < 0) break;
    at = close + 1;
    var decl = Object.create(null);
    css.slice(open + 1, close).split(';').forEach(function (x) {
      var i = x.indexOf(':'), prop = x.slice(0, i).trim().toLowerCase();
      if (i > 0 && !unsafe.test(prop)) decl[prop] = x.slice(i + 1).replace(/!important/i, '').trim();
    });
    css.slice(start, open).split(',').forEach(function (sel) {
      sel = sel.trim().toLowerCase();
      if (!unsafe.test(sel)) rules[sel] = Object.assign(rules[sel] || Object.create(null), decl);
    });
  }
  var body = rules.body || {}, short = body.background || '';
  var image = 'background-image' in body ? /^url\(\s*['"]?(https?:\/\/[^'")\s]+)['"]?\s*\)$/i.exec(body['background-image']) : /url\(\s*['"]?(https?:\/\/[^'")\s]+)['"]?\s*\)/i.exec(short);
  var bg = 'background-color' in body ? body['background-color'] : (short.match(/[a-z-]+\([^)]*\)|[^\s()]+/gi) || []).find(cssColor);
  var repeat = lower('background-repeat' in body ? body['background-repeat'] : (/\b(?:no-repeat|repeat-x|repeat-y|repeat)\b/i.exec(short.replace(/url\([^)]*\)/gi, '')) || [''])[0]);
  return {
    bg: opaqueColor(bg),
    text: cssColor(body.color || (rules['.profile_text'] || {}).color),
    link: cssColor((rules.a || {}).color),
    image: image ? image[1].replace(/^http:/i, 'https:') : null,
    repeat: BACKGROUND_REPEAT.test(repeat) ? repeat : null
  };
}
// Values of the BetterChatango background form when the account has no custom_profile.css yet (client.html:2296-2324).
var MINI_STYLE_DEFAULT = { bg: '#ffffff', text: '#222222', link: '#0084ef' };
/**
 * Prepares the Premium background form from the background read by parseMiniCss.
 * @param {?Object} mini Background read, null without custom_profile.css.
 * @returns {{bg: string, text: string, link: string, image: string, tileDown: boolean, tileAcross: boolean}} Colors as #rrggbb, empty image when there is none.
 */
export function miniStyleForm(mini) {
  var m = mini || {}, repeat = m.repeat || '';
  function hex(v, fallback) { var c = hexToRgb(v); return c ? rgbToHex(c) : fallback; }
  return {
    bg: hex(m.bg, MINI_STYLE_DEFAULT.bg), text: hex(m.text, MINI_STYLE_DEFAULT.text), link: hex(m.link, MINI_STYLE_DEFAULT.link), image: m.image || '',
    // Mapping of the BetterChatango switch (inject.js:4939-4950), even though its condition limits it to repeat.
    tileDown: repeat === 'repeat' || repeat === 'repeat-y', tileAcross: repeat === 'repeat' || repeat === 'repeat-x'
  };
}
/**
 * Rebuilds the background as parseMiniCss would read it after a form is saved.
 * @param {Object} form Form as returned by miniStyleForm.
 */
export function miniStyleOfForm(form) {
  var repeat = form.tileDown ? (form.tileAcross ? 'repeat' : 'repeat-y') : form.tileAcross ? 'repeat-x' : 'no-repeat';
  return { bg: form.bg, text: form.text, link: form.link, image: form.image || null, repeat: repeat };
}

// -- Allowed requests ---------------------------------------------------------

var CHATANGO_POST = /^https:\/\/chatango\.com\//;
export var VISSLE_UPLOAD = 'https://vissle.me/chatango/upload';
/**
 * Checks a client.post call against the allowed HTTP calls (docs/betterchatango-protocol.md).
 * @param {string} url Target URL.
 * @param {Object} item client.post options.
 * @returns {string} Why the call is refused, empty if it is allowed.
 */
export function postRefusal(url, item) {
  var keys = Object.keys(item);
  // Without an option, BetterChatango adds the Chatango token for every host of its list, vissle included.
  if (!keys.length) return CHATANGO_POST.test(url) ? '' : 'a request without an option goes to chatango.com only';
  if (keys.length === 1 && item.cookie === true) return '';
  if (keys.length === 1 && item.key === true) return url === VISSLE_UPLOAD ? '' : 'the key option goes to the vissle upload only';
  return 'options not allowed: ' + keys.join(', ');
}

// -- Profile ------------------------------------------------------------------

/**
 * Reads the updateprofile reply like BetterChatango (inject.js:1399-1400).
 * @param {string} resp Text returned by Chatango, key=value pairs separated by &.
 * @returns {Object} Values still encoded, error included.
 */
export function parseProfileReply(resp) {
  var data = {};
  String(resp).split('&').forEach(function (kv) { var i = kv.indexOf('='); if (i > 0) data[kv.slice(0, i)] = kv.slice(i + 1); });
  return data;
}

// -- Message background -------------------------------------------------------

export var MSG_BG_ALIGN = { tl: 'left top', tr: 'right top', bl: 'left bottom', br: 'right bottom' };
/**
 * Reads the Premium message background of a member without taking anything else from msgbg.xml.
 * @param {string} xml Content of msgbg.xml.
 * @param {string} image URL of msgbg.jpg built from the member name, never read from the file.
 */
export function parseMsgBg(xml, image) {
  var doc = new DOMParser().parseFromString(String(xml), 'text/xml'), root = doc.documentElement;
  if (doc.querySelector('parsererror')) return null;
  function percent(name) { var v = root.getAttribute(name); return v === null ? 100 : Math.min(100, Math.max(0, parseFloat(v) || 0)); }
  var bgc = root.getAttribute('bgc') || '', align = root.getAttribute('align');
  return {
    color: /^(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(bgc) ? '#' + bgc.toLowerCase() : null,
    alpha: percent('bgalp'),
    image: root.getAttribute('useimg') === '1' ? image : null,
    // Unknown alignment: top left corner, the default position of the BetterChatango CSS background.
    align: Object.prototype.hasOwnProperty.call(MSG_BG_ALIGN, align) ? align : 'tl',
    imageAlpha: percent('ialp'),
    tile: root.getAttribute('tile') === '1'
  };
}

// -- Profile activity ---------------------------------------------------------

/**
 * Reads the items of a vissle activity reply in the shape visitorPage expects.
 * @param {*} data JSON reply of track1/activity, forwarded by the loader.
 * @returns {?Array} Items, null if the reply or one of its items has another shape.
 */
export function parseVisits(data) {
  var items = data && data.get;
  if (!Array.isArray(items)) return null;
  return items.every(function (x) {
    return !!x && typeof x.user === 'string' && typeof x.time === 'number' && isFinite(x.time)
      && [x.name, x.action, x.msg].every(function (v) { return v == null || typeof v === 'string'; });
  }) ? items : null;
}

// -- Linked accounts ----------------------------------------------------------

var WHO_LEVELS = ['definite', 'linked', 'strong', 'medium', 'weak'];
/**
 * Reads the vissle reply on the linked accounts of an account without taking anything but the names of the five levels.
 * @param {*} data JSON reply of /api/v1/who.
 * @returns {?Array<{level: string, names: Array<string>}>} Non-empty levels in BetterChatango order, null without target.
 */
export function parseWho(data) {
  if (!data || !data.target) return null;
  return WHO_LEVELS.map(function (level) {
    var list = Array.isArray(data[level]) ? data[level] : [];
    return { level: level, names: list.filter(function (x) { return typeof x === 'string'; }) };
  }).filter(function (x) { return x.names.length; });
}

// -- Presence and connections -------------------------------------------------

function presenceOf(state, idle) { return state === 'on' ? (+idle ? 'idle' : 'online') : state === 'app' ? 'online' : 'offline'; }
// Chatango sends "None" or 0 when it does not know the last online time.
export function epochMs(v) { return Math.round(parseFloat(v) * 1000) || 0; }
/**
 * Reads the presence of a correspondent in a wl or wladd or connect frame.
 * @param {string} name Correspondent name.
 * @param {string} state Chatango state on, off or app.
 * @param {string} ts Last online time in seconds.
 * @param {string} minutes Idle minutes.
 */
export function friendPresence(name, state, ts, minutes) {
  var status = presenceOf(state, minutes);
  return { name: lower(name), status: status, lastOn: state === 'off' ? epochMs(ts) : 0, idleSince: status === 'idle' ? Date.now() - minutes * MIN : 0 };
}
/**
 * Reads the title and description of a group, Chatango's No description placeholder read as no description.
 * @param {string} title Title.
 * @param {string} description Description.
 */
export function groupInfo(title, description) { return { title: title, description: description === 'No description' ? '' : description }; }
/**
 * Reads the presence frame: name, minutes and state of each person.
 * When offline, the minutes are not idle time: they serve as an approximate last online time.
 * @param {Array<string>} data Frame split on :, three fields per person.
 */
export function parsePresence(data) {
  var people = [], now = Date.now();
  for (var j = 0; j + 2 < data.length; j += 3) if (data[j]) {
    var on = data[j + 2] === 'online' || data[j + 2] === 'app', idle = on && +data[j + 1] > 0, since = now - data[j + 1] * MIN;
    people.push({ name: lower(data[j]), status: idle ? 'idle' : on ? 'online' : 'offline', lastOn: !on && +data[j + 1] ? since : 0, idleSince: idle ? since : 0 });
  }
  return people;
}
export function stateOf(sock) { return !sock ? 'closed' : sock.readyState === 1 ? 'open' : sock.readyState === 0 ? 'connecting' : 'closed'; }
