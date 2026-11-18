import { FONT_FACES, MSG_FLAG, fontPercent } from './chatango.js';
import { EMOTICON_BY_NAME } from './emoticons.js';
import { lower, trimEnd } from './util.js';
// -- Message content ----------------------------------------------------------
// What a message holds once read: text, emphasis segments, references and media, shared by live and the prototype.

// Message references in <r…/> and <e…/>: BetterChatango drops the trailing "=" and protects - and _.
function decodeRef(v) { return String(v).replace(/hypheN/g, '-').replace(/underS/g, '_') + '='; }
export function encodeRef(id) { var s = String(id); if (s.slice(-1) === '=') s = s.slice(0, -1); return s.replace(/-/g, 'hypheN').replace(/_/g, 'underS'); }
// Face 0: default that BetterChatango sends without a user style - the empty string clears the font merged from a previous message.
var FACES = [''].concat(FONT_FACES.slice(1));
var decoder = null;
function decodeHtml(html) { decoder = decoder || document.createElement('textarea'); decoder.innerHTML = html; return decoder.value; }
function fileUrlPattern(extensions) { return new RegExp('^https:\\/\\/\\S+\\.(?:' + extensions + ')(?:[?#]\\S*)?$', 'i'); }
export var IMAGE_URL = fileUrlPattern('png|apng|jpe?g|gif|bmp|webp'), GIF_URL = fileUrlPattern('gif'), VIDEO_URL = fileUrlPattern('mp4|webm'), AUDIO_URL = fileUrlPattern('mp3|ogg|wav');
// BetterChatango regex (inject.js:8256) applied to a single link: case-sensitive and open to http, only the id is kept.
var YOUTUBE_LINK = /^https?:\/\/(?:(?:\w+\.)?youtube\.\w{1,3}|youtu\.be)(?:.*v=|\/\w+\/|\/)([\w-]{11})/;
// TikTok post or short link: the embed player needs the post id, which only the redirect of a short link gives.
var TIKTOK_POST = /^https?:\/\/(?:www\.|m\.)?tiktok\.com\/@[\w.-]+\/(?:video|photo)\/(\d+)/;
var TIKTOK_SHORT = /^https?:\/\/((?:vm|vt)\.tiktok\.com|(?:www\.)?tiktok\.com\/t)\/([\w-]+)/;
// X post link, on X or a mirror that the loader turns back into an X link.
var X_POST = /^https?:\/\/(?:www\.|mobile\.)?(?:x|twitter|fxtwitter|vxtwitter|fixupx|fixvx)\.com\/\w{1,15}\/status\/(\d{1,20})/;
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
 * @param {string} url Link found in the text: YouTube video, TikTok or X post, image, video or audio file.
 */
function linkEmbedOf(url) {
  var yt = YOUTUBE_LINK.exec(url), tt = TIKTOK_POST.exec(url), short = TIKTOK_SHORT.exec(url), xp = X_POST.exec(url);
  if (yt) return { kind: 'youtube', id: yt[1] };
  if (xp) return { kind: 'x', id: xp[1], url: xp[0] };
  // Like YouTube, the link may run into text without a space ("…/t/ZPLy/....."): only the post or short link part is kept.
  if (tt) return { kind: 'tiktok', id: tt[1], url: tt[0] };
  if (short) return { kind: 'tiktok', url: 'https://' + short[1] + '/' + short[2] + '/' };
  var file = secureMediaUrl(url);
  return VIDEO_URL.test(file) ? { kind: 'video', url: file } : AUDIO_URL.test(file) ? { kind: 'audio', url: file } : embedOf(url);
}
export function textLinks(text) { return text.match(/https?:\/\/\S+/g) || []; }
function sameEmbed(a, b) { return a.kind === b.kind && a.id === b.id && a.url === b.url; }
/**
 * Lists the links of a message text that the message already shows as a media.
 * @param {{text: string, embeds: ?Array}} m Message read by parseContent.
 */
export function mediaLinks(m) {
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
export function parseContent(raw, keepMedia, premium) {
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
  // BetterChatango writes the name as typed at sign-in in its PMs (inject.js:5176), which Chatango delivers under a lowercase name.
  var w = /<u([a-z0-9]{1,20})\/>/i.exec(s);
  var body = s
    .replace(/<br\s*\/?>/gi, '\n')
    // Two steps, the tag then its s attribute: a single pattern for both backtracks for seconds on a body of unclosed tags.
    .replace(/<i\s[^>]*>/gi, function (tag) {
      // An s attribute further in the tag wins over the one right after <i, as the single pattern did.
      var rest = tag.slice(3), at = /\ss=["']?([^"'\s>]+)/i.exec(rest) || /^s=["']?([^"'\s>]+)/i.exec(rest);
      if (!at) return tag;
      var src = at[1], m = embedOf(decodeHtml(src)), sm = /^sm:\/\/(.*)/i.exec(src);
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
  return { text: text, parts: emphasisParts(body), style: style, embeds: embeds, replyId: r ? decodeRef(r[1]) : null, editId: e ? decodeRef(e[1]) : null, key: k ? decodeRef(k[1]) : null, written: w ? w[1] : null };
}
/**
 * Reads the body of a received or archived PM with its Premium flag.
 * @param {Array} data Fields of the msg or msgoff frame, flags at 4 and body from 5.
 */
export function parsePm(data) { return parseContent(data.slice(5).join(':'), false, !!(parseInt(data[4], 10) & MSG_FLAG.PREMIUM)); }
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
  while (parts.length && !(parts[parts.length - 1].text = trimEnd(parts[parts.length - 1].text))) parts.pop();
  return parts.some(function (x) { return EMPHASIS.some(function (m) { return x[m]; }); }) ? parts : null;
}
export var EMPHASIS = ['b', 'i', 'u', 's'];
export var EMBED_LABEL = { youtube: 'Video', tiktok: 'Video', x: 'Post', image: 'Image', photo: 'Photo', video: 'Video', audio: 'Audio' };
/**
 * Returns the text segments of a message as shown, without the links it already shows as a media.
 * @param {{text: string, parts: ?Array, embeds: ?Array}} m Message read by parseContent.
 * @returns {Array} Non-empty segments {text, b, i, u, s}.
 */
export function shownParts(m) {
  var links = mediaLinks(m), parts = m.parts || [{ text: m.text || '' }];
  if (!links.length) return m.text ? parts : [];
  var shown = parts.map(function (part) {
    var chunks = String(part.text).split(/(https?:\/\/\S+)/), text = '';
    for (var i = 0; i < chunks.length; i++) {
      if (i % 2 && links.indexOf(chunks[i]) >= 0) {
        // The space after a hidden link leaves with it: no double space or blank line stays.
        if (i + 1 < chunks.length) chunks[i + 1] = chunks[i + 1].replace(/^\s+/, '');
        continue;
      }
      text += chunks[i];
    }
    return Object.assign({}, part, { text: text });
  });
  shown[0].text = shown[0].text.replace(/^\s+/, '');
  shown[shown.length - 1].text = trimEnd(shown[shown.length - 1].text);
  return shown.filter(function (part) { return part.text; });
}
export function messagePreview(m) {
  var e = m.embeds && m.embeds[0], text = shownParts(m).map(function (part) { return part.text; }).join('');
  return text || (e ? EMBED_LABEL[e.kind] : '');
}
