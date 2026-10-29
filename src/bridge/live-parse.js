// -- Text and references ------------------------------------------------------

function warn(e) { try { console.warn('[torch-skin]', e); } catch (x) { /* console unavailable */ } }
function lower(v) { return String(v == null ? '' : v).toLowerCase(); }
// Like urllib.parse.unquote (chatango-lib) and BetterChatango: "+" stays a "+".
function unquote(v) { try { return decodeURIComponent(String(v || '')); } catch (e) { return String(v || ''); } }
/** Escapes the typed text since client.sendMessage expects HTML like the BetterChatango input field. */
function esc(text) { return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
// Message references in <r…/> and <e…/>: BetterChatango drops the trailing "=" and protects - and _.
function decodeRef(v) { return String(v).replace(/hypheN/g, '-').replace(/underS/g, '_') + '='; }
function encodeRef(id) { var s = String(id); if (s.slice(-1) === '=') s = s.slice(0, -1); return s.replace(/-/g, 'hypheN').replace(/_/g, 'underS'); }

// -- Message content ----------------------------------------------------------

// Face 0: default that BetterChatango sends without a user style - the empty string clears the font merged from a previous message.
var FACES = [''].concat(FONT_FACES.slice(1));
var decoder = document.createElement('textarea');

function decodeHtml(html) { decoder.innerHTML = html; return decoder.value; }
function fileUrlPattern(extensions) { return new RegExp('^https:\\/\\/\\S+\\.(?:' + extensions + ')(?:[?#]\\S*)?$', 'i'); }
var IMAGE_URL = fileUrlPattern('png|apng|jpe?g|gif|bmp|webp'), VIDEO_URL = fileUrlPattern('mp4|webm'), AUDIO_URL = fileUrlPattern('mp3|ogg|wav');
// BetterChatango regex (inject.js:8256) applied to a single link: case-sensitive and open to http, only the id is kept.
var YOUTUBE_LINK = /^https?:\/\/(?:(?:\w+\.)?youtube\.\w{1,3}|youtu\.be)(?:.*v=|\/\w+\/|\/)([\w-]{11})/;
// Like BetterChatango renderMessage: only a ▓…▒ pair becomes a strikethrough, a lone marker stays text.
var STRIKE_PAIR = /\u2593([\s\S]*?)\u2592/g;
// Like BetterChatango crawl (inject.js:1112): an http media loads over https, one on fp.chatango.com loads from ust.chatango.com.
function secureMediaUrl(url) { return url.replace(/^http:\/\//i, 'https://').replace(/^https:\/\/fp\.chatango\.com\//i, 'https://ust.chatango.com/'); }
// BetterChatango opens the l_ full size of an image uploaded to Chatango (inject.js:8317): the t_ thumbnail is sized for Chatango's chat and shows blurry here.
function fullImageUrl(url) { return url.replace(/^(https:\/\/ust\.chatango\.com\/um\/[^\/?#]+\/[^\/?#]+\/[^\/?#]+\/img\/)t_/i, '$1l_'); }
function embedOf(src) {
  var yt = /^vid:\/\/yt:([\w-]{11})/.exec(src), img = /^img:\/\/(?:cam|lib):([^"&?\/\s]+)/.exec(src);
  if (yt) return { kind: 'youtube', id: yt[1] };
  if (img) return { kind: 'photo', url: 'https://chatango.com/pmmessageimg?i=' + encodeURIComponent(img[1]) };
  var url = fullImageUrl(secureMediaUrl(src));
  return IMAGE_URL.test(url) ? { kind: 'image', url: url } : null;
}
/**
 * Recognizes the media of a link typed in the text.
 * @param {string} url Link found in the text: YouTube video, image, video or audio file.
 */
function linkEmbedOf(url) {
  var yt = YOUTUBE_LINK.exec(url);
  if (yt) return { kind: 'youtube', id: yt[1] };
  var file = secureMediaUrl(url);
  return VIDEO_URL.test(file) ? { kind: 'video', url: file } : AUDIO_URL.test(file) ? { kind: 'audio', url: file } : embedOf(url);
}
function textLinks(text) { return text.match(/https?:\/\/\S+/g) || []; }
function sameEmbed(a, b) { return a.kind === b.kind && a.id === b.id && a.url === b.url; }
/**
 * Lists the links of a message text that the message already shows as a media.
 * @param {{text: string, embeds: ?Array}} m Message read by parseContent.
 */
function mediaLinks(m) {
  if (!m.text || !m.embeds || !m.embeds.length) return [];
  return textLinks(m.text).filter(function (url) {
    var e = linkEmbedOf(url);
    return !!e && m.embeds.some(function (x) { return sameEmbed(x, e); });
  });
}
/**
 * Renders an sm:// emoticon as text.
 * @param {string} name Name read in the tag. Gives its emoji, its first shortcut if it is Premium without the flag, or the bare name if the table does not know it and it is made of [a-z0-9_-].
 * @param {boolean} premium The message carries the Premium flag.
 */
function emoticonText(name, premium) {
  var e = EMOTICON_BY_NAME[name];
  if (!e) return /^[a-z0-9_-]{1,32}$/.test(name) ? name : '';
  return e.emoji && (premium || !e.premium) ? e.emoji : e.keys[0].split('?')[0];
}
/**
 * Reads raw Chatango content.
 * @param {string} raw Message body: style tags, replies, edits, media, emoticons, entities.
 * @param {boolean} [keepMedia] Keeps the source of media and emoticons in the text.
 * @param {boolean} [premium] The message carries the Premium flag.
 */
function parseContent(raw, keepMedia, premium) {
  var style = {}, embeds = [], s = String(raw);
  var n = /<n([a-f0-9]{3}|[a-f0-9]{6})\/>/i.exec(s);
  if (n) style.nameColor = '#' + n[1];
  // Font read from <f x…> or <g x…s…> only: the w and h attributes of an <i> tag are not a font.
  var f = /<f x(\d{2})?([a-f0-9]{3}|[a-f0-9]{6})?=["']([^"']*)["']>/i.exec(s) || /<g x(\d{2})?s([a-f0-9]{3}|[a-f0-9]{6})?="([^"]*)">/i.exec(s);
  if (f) {
    if (f[2]) style.textColor = '#' + f[2];
    // Missing size: explicit 100%, otherwise the size merged from a previous message would stay.
    style.fontSize = f[1] ? fontPercent(+f[1]) : 100;
    if (f[3] !== '' && FACES[+f[3]] !== undefined) style.font = FACES[+f[3]];
    else if (f[3] && isNaN(+f[3])) style.font = f[3];
  }
  var r = /<r([^\s<>"\/]+)\/>/.exec(s), e = /<e([^\s<>"\/]+)\/>/.exec(s), k = /<i([a-z0-9]{7,8})\/>/.exec(s);
  var body = s
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<i\s(?:[^>]*?\s)?s=["']?([^"'\s>]+)["']?[^>]*\/?>/gi, function (tag, src) {
      var m = embedOf(decodeHtml(src)), sm = /^sm:\/\/(.*)/i.exec(src);
      if (m) embeds.push(m);
      if (keepMedia) return ' ' + src + ' ';
      return sm ? emoticonText(sm[1], premium) : m ? ' ' : ' ' + src + ' ';
    })
    .replace(STRIKE_PAIR, '<s>$1</s>');
  var text = decodeHtml(body.replace(/<[^>]+>/g, '')).replace(/\r/g, '').trim();
  textLinks(text).forEach(function (url) {
    var m = linkEmbedOf(url);
    if (m && !embeds.some(function (x) { return sameEmbed(x, m); })) embeds.push(m);
  });
  return { text: text, parts: emphasisParts(body), style: style, embeds: embeds, replyId: r ? decodeRef(r[1]) : null, editId: e ? decodeRef(e[1]) : null, key: k ? decodeRef(k[1]) : null };
}
/**
 * Reads the body of a received or archived PM with its Premium flag.
 * @param {Array} data Fields of the msg or msgoff frame, flags at 4 and body from 5.
 */
function parsePm(data) { return parseContent(data.slice(5).join(':'), false, !!(parseInt(data[4], 10) & MSG_FLAG.PREMIUM)); }
/**
 * Reads a record of the BetterChatango private history.
 * @param {{ts: number, data: string, unread: number}} v Record (saveMessage), data being the full msg frame.
 * @returns {?Object} Archived message with its archiveTs key, null if the frame lacks some fields.
 */
function pmRecordEntry(v) {
  var parts = String(v.data || '').split(':').slice(1);
  if (parts.length <= 5) return null;
  var body = parsePm(parts);
  return { from: lower(parts[0]), ts: Math.round(parseFloat(parts[3]) * 1000) || 0, archiveTs: v.ts, text: body.text, parts: body.parts, style: body.style, embeds: body.embeds, key: body.key, editId: body.editId, replyId: body.replyId, unread: !!v.unread };
}
var PM_TARGET = /^[A-Za-z0-9_-]{1,20}$/;
/**
 * Screens the records of an imported private history before any write.
 * @param {Array} records File content, untrusted.
 * @param {string} me Signed-in account.
 * @returns {{valid: Array, skipped: number, foreign: boolean}} Records to write, marked read, the number skipped, and true for another account's file, of which nothing is written.
 */
function screenPmRecords(records, me) {
  var valid = [], skipped = 0, foreign = 0;
  records.forEach(function (r) {
    var ok = !!r && typeof r.target === 'string' && PM_TARGET.test(r.target) && typeof r.ts === 'number' && isFinite(r.ts) && r.ts > 0
      && typeof r.data === 'string' && r.data.indexOf('msg:') === 0;
    var fields = ok ? r.data.split(':') : [];
    if (fields.length < 7) { skipped++; return; }
    var author = lower(fields[1]);
    if (author !== lower(r.target) && author !== lower(me)) { skipped++; foreign++; return; }
    valid.push({ target: r.target, ts: r.ts, data: r.data, unread: 0 });
  });
  // Another account's file: its received PMs pass the screening one by one, but none is written.
  if (skipped && foreign === skipped) return { valid: [], skipped: skipped, foreign: true };
  return { valid: valid, skipped: skipped, foreign: false };
}
/**
 * Splits a message body into emphasis segments.
 * BetterChatango allowlist (renderMessage): b, i without attributes, u, s and strike.
 * @param {string} body Body whose br tags, media and ▓…▒ pairs are already converted.
 * @returns {?Array} Segments {text, b, i, u, s} trimmed like the text, null if none is marked.
 */
function emphasisParts(body) {
  var depth = { b: 0, i: 0, u: 0, s: 0 }, parts = [];
  body.split(/(<[^>]+>)/).forEach(function (t, k) {
    if (k % 2) {
      var tag = /^<(\/?)(b|i|u|s|strike)>$/i.exec(t);
      var mark = tag && lower(tag[2]).charAt(0);
      if (mark && !tag[1]) depth[mark] += 1;
      else if (mark && depth[mark]) depth[mark] -= 1;
      return;
    }
    var part = { text: decodeHtml(t).replace(/\r/g, '') };
    EMPHASIS.forEach(function (m) { if (depth[m]) part[m] = true; });
    if (part.text) parts.push(part);
  });
  while (parts.length && !(parts[0].text = parts[0].text.replace(/^\s+/, ''))) parts.shift();
  while (parts.length && !(parts[parts.length - 1].text = parts[parts.length - 1].text.replace(/\s+$/, ''))) parts.pop();
  return parts.some(function (x) { return EMPHASIS.some(function (m) { return x[m]; }); }) ? parts : null;
}

// -- Group frames -------------------------------------------------------------

function notNone(v) { return !!v && v !== 'None'; }
// Guest named in lowercase, like the author of its messages: the card and the ban find them.
function sessionOf(account, guest) {
  return notNone(account) ? { account: lower(account) } : notNone(guest) ? { guest: '#' + lower(guest) } : { anon: true };
}
function parseParticipants(list) {
  var names = [], sessions = {};
  list.forEach(function (x) {
    var t = x.split(':');
    if (t.length < 4) return;
    var one = sessionOf(t[3], t[4]);
    if (one.account && names.indexOf(one.account) < 0) names.push(one.account);
    sessions[t[1]] = one;
  });
  return { names: names, sessions: sessions };
}
function parseMods(entries) {
  var mods = {};
  entries.forEach(function (x) { var p = String(x).split(','); if (p[0]) mods[lower(p[0])] = parseInt(p[1], 10) || 0; });
  return mods;
}
/**
 * Reads a BetterChatango ban page.
 * @param {Array<string>} data Frame split on :, entries unid:ip:name:timestamp:author separated by semicolons.
 * @returns {Array<Object>} Entries, with the raw timestamp (ts) that serves as the cursor for the next page.
 */
function parseBans(data) {
  var raw = data.join(':');
  if (!raw) return [];
  return raw.split(';').map(function (x) {
    var t = x.split(':');
    // Cursor converted like BetterChatango, which reads the timestamp with + before sending it back.
    return { unid: t[0], ip: t[1], name: lower(t[2]) || '!anon', guest: !t[2], ts: String(+t[3]), at: Math.round(parseFloat(t[3]) * 1000) || Date.now(), by: lower(t[4]) };
  }).filter(function (b) { return b.unid; });
}
/**
 * Reads the unblocked frame like BetterChatango.
 * @param {Array<string>} data Frame split on :, entries unid:ip:name separated by semicolons, author in the second-to-last field.
 * @returns {Array<Object>} Unbans, dated at reception like in BetterChatango.
 */
function parseUnbanned(data) {
  var by = lower(data.slice(-2)[0]), at = Date.now();
  return data.join(':').split(';').map(function (x) {
    var t = x.split(':');
    return { unid: t[0], ip: t[1], name: lower(t[2]) || '!anon', guest: !t[2], by: by, at: at };
  }).filter(function (b) { return b.unid; });
}
/**
 * Reads the BetterChatango bansearchresult reply.
 * @param {Array<string>} data Frame split on :, date included: other names, name, IP, unid, author and date.
 * @returns {?Object} Ban found, null if none.
 */
function parseBanSearch(data) {
  // BetterChatango only looks at the name and would report a guest searched by IP as not found.
  if (!data[1] && !data[3]) return null;
  // Like BetterChatango, the date is read in fixed Pacific time. On its own, GMT-0800 passes for a year: the date is validated without it.
  var date = data.slice(5).join(':'), at = isNaN(new Date(date).getTime()) ? 0 : new Date(date + ' GMT-0800').getTime();
  return { unid: data[3], ip: data[2], name: lower(data[1]) || '!anon', guest: !data[1], by: lower(data[4]), at: at, includes: data[0] ? data[0].split(';').filter(Boolean).map(lower) : [] };
}
function parseModLog(data) {
  var raw = data.join(':');
  if (!raw) return [];
  return raw.split(';').map(function (x) {
    var f = unquote(x).split(',');
    return { id: f[0], type: f[1], actor: lower(f[2]), target: lower(f[4]), at: Math.round(parseFloat(f[5]) * 1000) || 0, extra: f.slice(6).join(',') };
  }).filter(function (x) { return x.type; });
}

// -- Premium background -------------------------------------------------------

/**
 * Converts a CSS background color to hex.
 * @param {string} value CSS color read in custom_profile.css.
 */
function opaqueColor(value) {
  var v = String(value || '').trim(), f = /^(?:rgb|hsl)a?\(([^)]*)\)$/i.exec(v), p = f ? f[1].trim().split(/\s*[,\/]\s*|\s+/) : [];
  return p.length > 3 && parseFloat(p[3]) === 0 ? null : cssColor(v);
}
/**
 * Reads the Premium background of a mini profile without ever injecting its CSS.
 * @param {string} css Content of custom_profile.css.
 */
function parseMiniCss(css) {
  var rules = Object.create(null), re = /([^{}]+)\{([^}]*)\}/g, m, unsafe = /^(?:__proto__|constructor|prototype)$/;
  css = String(css).replace(/\/\*[\s\S]*?\*\//g, '');
  while ((m = re.exec(css))) {
    var decl = Object.create(null);
    m[2].split(';').forEach(function (x) {
      var i = x.indexOf(':'), prop = x.slice(0, i).trim().toLowerCase();
      if (i > 0 && !unsafe.test(prop)) decl[prop] = x.slice(i + 1).replace(/!important/i, '').trim();
    });
    m[1].split(',').forEach(function (sel) {
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
function miniStyleForm(mini) {
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
function miniStyleOfForm(form) {
  var repeat = form.tileDown ? (form.tileAcross ? 'repeat' : 'repeat-y') : form.tileAcross ? 'repeat-x' : 'no-repeat';
  return { bg: form.bg, text: form.text, link: form.link, image: form.image || null, repeat: repeat };
}

// -- Profile ------------------------------------------------------------------

/**
 * Reads the updateprofile reply like BetterChatango (inject.js:1399-1400).
 * @param {string} resp Text returned by Chatango, key=value pairs separated by &.
 * @returns {Object} Values still encoded, error included.
 */
function parseProfileReply(resp) {
  var data = {};
  String(resp).split('&').forEach(function (kv) { var i = kv.indexOf('='); if (i > 0) data[kv.slice(0, i)] = kv.slice(i + 1); });
  return data;
}

// -- Message background -------------------------------------------------------

var MSG_BG_ALIGN = { tl: 'left top', tr: 'right top', bl: 'left bottom', br: 'right bottom' };
/**
 * Reads the Premium message background of a member without taking anything else from msgbg.xml.
 * @param {string} xml Content of msgbg.xml.
 * @param {string} image URL of msgbg.jpg built from the member name, never read from the file.
 */
function parseMsgBg(xml, image) {
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

// -- Linked accounts ----------------------------------------------------------

var WHO_LEVELS = ['definite', 'linked', 'strong', 'medium', 'weak'];
/**
 * Reads the vissle reply on the linked accounts of an account without taking anything but the names of the five levels.
 * @param {*} data JSON reply of /api/v1/who.
 * @returns {?Array<{level: string, names: Array<string>}>} Non-empty levels in BetterChatango order, null without target.
 */
function parseWho(data) {
  if (!data || !data.target) return null;
  return WHO_LEVELS.map(function (level) {
    var list = Array.isArray(data[level]) ? data[level] : [];
    return { level: level, names: list.filter(function (x) { return typeof x === 'string'; }) };
  }).filter(function (x) { return x.names.length; });
}

// -- Presence and connections -------------------------------------------------

function presenceOf(state, idle) { return state === 'on' ? (+idle ? 'idle' : 'online') : state === 'app' ? 'online' : 'offline'; }
// Chatango sends "None" or 0 when it does not know the last online time.
function epochMs(v) { return Math.round(parseFloat(v) * 1000) || 0; }
/**
 * Reads the presence of a correspondent in a wl or wladd or connect frame.
 * @param {string} name Correspondent name.
 * @param {string} state Chatango state on, off or app.
 * @param {string} ts Last online time in seconds.
 * @param {string} minutes Idle minutes.
 */
function friendPresence(name, state, ts, minutes) {
  var status = presenceOf(state, minutes);
  return { name: lower(name), status: status, lastOn: state === 'off' ? epochMs(ts) : 0, idleSince: status === 'idle' ? Date.now() - minutes * MIN : 0 };
}
function stateOf(sock) { return !sock ? 'closed' : sock.readyState === 1 ? 'open' : sock.readyState === 0 ? 'connecting' : 'closed'; }

// -- BetterChatango media library ---------------------------------------------

// Page size of the media library, like BetterChatango viewMedia and loadMedia.
var MEDIA_PAGE = 21;
var PHOTO_URL = /^https:\/\/chatango\.com\/pmmessageimg\?i=[^"&?\/\s]+$/;
/**
 * Tells whether a media library entry can be shown and written.
 * @param {*} e Entry {url, name} read from the BetterChatango database or from a file, untrusted.
 * @returns {boolean} True for an https image or a pmmessageimg with a text name.
 */
function mediaEntryOk(e) { return !!e && typeof e.url === 'string' && (IMAGE_URL.test(e.url) || PHOTO_URL.test(e.url)) && typeof e.name === 'string'; }
/**
 * Keeps an entry read by pages when it comes after the last one of the previous page in index order and its name contains the search.
 * @param {string} index BetterChatango index, url or name, whose order follows the key then the url.
 * @param {{url: string, name: string}} e Entry read.
 * @param {?{url: string, name: string}} after Last entry of the previous page, null for the first page.
 * @param {string} text Search, case-insensitive, empty to keep everything.
 */
function mediaMatch(index, e, after, text) {
  return (!after || e[index] > after[index] || e[index] === after[index] && e.url > after.url) && lower(e.name).indexOf(lower(text)) >= 0;
}
/**
 * Names a media item like BetterChatango (favoriteMedia).
 * @param {string} url Image address, whose last segment becomes the name.
 */
function mediaName(url) { return url.split('/').slice(-1)[0]; }
/**
 * Screens the entries of an imported media library before any write.
 * @param {Array} entries File content, untrusted.
 * @returns {{valid: Array, skipped: number}} Entries {url, name} to write, and the number skipped.
 */
function screenMediaEntries(entries) {
  var valid = entries.filter(mediaEntryOk).map(function (e) { return { url: e.url, name: e.name }; });
  return { valid: valid, skipped: entries.length - valid.length };
}
