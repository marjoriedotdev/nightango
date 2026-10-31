var EMBED_LABEL = { youtube: 'Video', tiktok: 'Video', x: 'Post', image: 'Image', photo: 'Photo', video: 'Video', audio: 'Audio' };
/**
 * Returns the text segments of a message as shown, without the links it already shows as a media.
 * @param {{text: string, parts: ?Array, embeds: ?Array}} m Message read by parseContent.
 * @returns {Array} Non-empty segments {text, b, i, u, s}.
 */
function shownParts(m) {
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
  shown[shown.length - 1].text = shown[shown.length - 1].text.replace(/\s+$/, '');
  return shown.filter(function (part) { return part.text; });
}
function messagePreview(m) {
  var e = m.embeds && m.embeds[0], text = shownParts(m).map(function (part) { return part.text; }).join('');
  return text || (e ? EMBED_LABEL[e.kind] : '');
}
/**
 * Returns the host of an https URL as the browser will reach it.
 * @param {string} url URL read.
 * @returns {?string} Lowercase host, null for an unreadable URL or one that is not https.
 */
function httpsHost(url) {
  // new URL rather than a regex: the host of https://a.example@b.example/ is b.example.
  try { var u = new URL(url); return u.protocol === 'https:' ? u.host.toLowerCase() : null; } catch (e) { return null; }
}
/**
 * Tells whether an https URL comes from a trusted host by strict equality with no wildcard or subdomain.
 * @param {string} url URL read.
 * @param {?Array<string>} hosts Lowercase trusted hosts, null if the BetterChatango list is unreadable.
 */
function isTrustedUrl(url, hosts) { var host = httpsHost(url); return !!host && !!hosts && hosts.indexOf(host) >= 0; }
/**
 * Tells whether a media item waits for a click before any loading: never for a trusted host.
 * @param {Object} safety Safety settings.
 * @param {string} kind Media type read by parseContent.
 * @param {string} url URL the media would load.
 */
function waitsForClick(safety, kind, url) { return !isTrustedUrl(url, safety.trustedHosts) && (kind === 'video' || kind === 'audio' || safety.proxyMedia); }
function warnOnLink(app, url) {
  return function (e) {
    var safety = app.state.prefs.safety;
    if (safety.warnLinks && !isTrustedUrl(url, safety.trustedHosts)) { e.preventDefault(); app.ui.openLink(url); }
  };
}
var CHATANGO_SERVICE_HOSTS = ['www', 'st', 'ust', 'fp', 'm1', 'client'];
/**
 * Name of the profile a {name}.chatango.com link points to or null.
 * @param {string} url Link URL.
 */
function profileOfLink(url) {
  var name = ((/^https?:\/\/([^\/?#]+)\.chatango\.com(?:[\/?#]|$)/i.exec(url) || [])[1] || '').toLowerCase();
  return ACCOUNT_NAME.test(name) && CHATANGO_SERVICE_HOSTS.indexOf(name) < 0 ? name : null;
}
/**
 * Click on a profile link: offers the profile or the page except on a modified click, a middle click or a trusted host.
 * @param {Object} app Application context.
 * @param {string} url Link URL.
 * @param {string} name Profile name.
 * @param {?string} gid Group of the message, null in a PM.
 */
function onProfileLink(app, url, name, gid) {
  return function (e) {
    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || isTrustedUrl(url, app.state.prefs.safety.trustedHosts)) return;
    e.preventDefault();
    app.ui.openProfileLink({ url: url, name: name, gid: gid });
  };
}

var EMPHASIS = ['b', 'i', 'u', 's'];

// Like BetterChatango's rendering: "@name: `text`" is a quote and does not cross a line break.
var QUOTE = /@([A-Za-z0-9]{1,20}): `(.*?)`/;

/* Message text: emphasis (parseContent segments, absent without emphasis), quotes, mentions and links */
function MessageText(p) {
  var app = useApp();
  // Hidden style (plain): like BetterChatango, bold, italic and underline drop but strikethrough stays.
  var marks = p.plain ? ['s'] : EMPHASIS;
  function mention(s, key) {
    var name = s.slice(1).toLowerCase();
    return ACCOUNT_NAME.test(name)
      ? h('button', { key: key, type: 'button', className: 'tc-mention', title: 'View ' + name + "'s profile", onClick: function () { app.ui.openProfile(name, p.gid || null); } }, s)
      : h('span', { key: key, className: 'tc-mention' }, s);
  }
  function inline(text) {
    return text.split(/(@[A-Za-z0-9_!-]+|https?:\/\/[^\s]+)/g).map(function (s, i) {
      if (!s) return null;
      if (s.charAt(0) === '@' && s.length > 1) return mention(s, i);
      if (/^https?:\/\//.test(s)) {
        var profile = profileOfLink(s);
        return h('a', { key: i, href: s, target: '_blank', rel: 'noopener noreferrer', className: 'msg-link', onClick: profile ? onProfileLink(app, s, profile, p.gid || null) : warnOnLink(app, s) }, s);
      }
      return s;
    });
  }
  return h('p', { className: 'tc-msg-text', style: p.style }, (p.parts || [{ text: p.text }]).map(function (part, k) {
    var chunks = String(part.text).split(QUOTE);
    var nodes = chunks.map(function (s, i) {
      if (i % 3 === 0) return inline(s);
      if (i % 3 === 2) return null;
      return h('span', { key: i, className: 'msg-quote' }, mention('@' + s), ': ', h('span', { className: 'msg-quote-text' }, inline(chunks[i + 1])));
    });
    return marks.reduce(function (node, mark) { return part[mark] ? h(mark, { key: k }, node) : node; }, nodes);
  }));
}

/* ---------- Profile HTML written by members ----------
   Never injected: the text is parsed again by the browser parser, then only a few formatting
   tags are rebuilt as React elements. Scripts, free styles and attributes are dropped. */
var RICH_TAGS = { b: 'b', strong: 'b', i: 'i', em: 'i', u: 'u', s: 's', strike: 's', br: 'br', p: 'p', div: 'div', span: 'span', font: 'span', center: 'div', a: 'a', img: 'img' };
var RICH_DROP = { script: 1, style: 1, iframe: 1, object: 1, embed: 1, noscript: 1, template: 1, svg: 1, math: 1, form: 1, input: 1, button: 1, select: 1, link: 1, meta: 1, head: 1 };
// The parser keeps the content of these tags as raw text. BetterChatango only strips the tags, so the text is parsed again as HTML.
var RICH_RCDATA = { title: 1, textarea: 1 };
function richBody(html) { return new DOMParser().parseFromString('<!doctype html><body>' + html, 'text/html').body; }
function richStyle(el, tag, ctx) {
  var st = {}, css = String(el.getAttribute('style') || '');
  var color = cssColor(el.getAttribute('color') || (/(?:^|;)\s*color\s*:\s*([^;]+)/i.exec(css) || [])[1]);
  if (color) st.color = ensureContrast(color, ctx.bg, 4.5);
  var face = el.getAttribute('face');
  if (face && /^[\w ,'-]{1,40}$/.test(face)) st.fontFamily = face;
  if (!ctx.inline) {
    var size = el.getAttribute('size'), px = (/font-size\s*:\s*(\d+)px/i.exec(css) || [])[1];
    // Like BetterChatango (inject.js:656): size is in pixels, clamped from 10 to 30, not the HTML scale from 1 to 7.
    if (/^\d+$/.test(size || '')) st.fontSize = Math.max(10, Math.min(30, +size));
    else if (px) st.fontSize = Math.max(10, Math.min(30, +px));
    var align = el.getAttribute('align') || (/text-align\s*:\s*(\w+)/i.exec(css) || [])[1];
    if (tag === 'center') st.textAlign = 'center';
    else if (align && /^(left|right|center|justify)$/i.test(align)) st.textAlign = align.toLowerCase();
  }
  return Object.keys(st).length ? st : null;
}
function richNodes(node, ctx, key) {
  var out = [];
  Array.prototype.forEach.call(node.childNodes, function (c, i) {
    var k = key + '.' + i;
    if (c.nodeType === 3) { if (c.nodeValue) out.push(c.nodeValue); return; }
    if (c.nodeType !== 1) return;
    var tag = c.tagName.toLowerCase();
    if (RICH_DROP[tag]) return;
    if (RICH_RCDATA[tag]) { out = out.concat(richNodes(richBody(c.textContent), ctx, k)); return; }
    var as = RICH_TAGS[tag];
    if (!as) { out = out.concat(richNodes(c, ctx, k)); return; }
    if (as === 'br') { out.push(ctx.inline ? ' ' : h('br', { key: k })); return; }
    if (as === 'img') {
      if (ctx.inline) return;
      var src = String(c.getAttribute('src') || '');
      if (!/^https?:\/\//i.test(src)) return;
      if (!ctx.images) { out.push(h('a', { key: k, href: src, target: '_blank', rel: 'noopener noreferrer nofollow', className: 'msg-link', onClick: ctx.onLink(src) }, 'Image')); return; }
      if (ctx.blocked(src)) { out.push(h('button', { key: k, type: 'button', className: 'linkbtn', onClick: ctx.reveal }, 'Show image')); return; }
      out.push(h('img', { key: k, src: src, alt: '', loading: 'lazy', referrerPolicy: 'no-referrer', style: { maxWidth: '100%', height: 'auto', verticalAlign: 'middle' } }));
      return;
    }
    var children = richNodes(c, ctx, k);
    if (as === 'a') {
      var href = String(c.getAttribute('href') || '');
      if (ctx.inline || !/^https?:\/\//i.test(href)) { out = out.concat(children); return; }
      out.push(h('a', { key: k, href: href, target: '_blank', rel: 'noopener noreferrer nofollow', className: 'msg-link', style: ctx.link ? { color: ctx.link } : null, onClick: ctx.onLink(href) }, children.length ? children : href));
      return;
    }
    var block = ctx.inline && (as === 'p' || as === 'div');
    out.push(h.apply(null, [block ? 'span' : as, { key: k, style: richStyle(c, tag, ctx) }].concat(children)));
    if (block) out.push(' ');
  });
  return out;
}
/**
 * Chatango profile text rendered without ever injecting HTML.
 * @param {string} p.html HTML written by the member.
 * @param {boolean} [p.inline] Inline rendering with no block, link or image.
 * @param {string} [p.bg] Background on which the text colors stay readable.
 * @param {string} [p.link] Link color.
 */
function RichText(p) {
  var app = useApp(), safety = app.state.prefs.safety;
  var r = useState(false), revealed = r[0], setRevealed = r[1];
  var html = String(p.html || '').replace(/\r\n|\r|\n/g, '<br>');
  var body;
  try { body = richBody(html); } catch (e) { return h('p', { className: 'about' }, p.html); }
  var ctx = {
    bg: p.bg || SURFACE[app.theme].bg, inline: p.inline, link: p.link,
    images: safety.embedImages, blocked: function (src) { return !revealed && waitsForClick(safety, 'image', src); },
    reveal: function () { setRevealed(true); },
    onLink: function (url) { return warnOnLink(app, url); }
  };
  var nodes = richNodes(body, ctx, 'r');
  return p.inline ? h.apply(null, [Frag, null].concat(nodes)) : h.apply(null, ['div', { className: 'about rich' }].concat(nodes));
}
var BACKGROUND_REPEAT = /^(?:no-repeat|repeat-x|repeat-y|repeat)$/;
var HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
// No < and no parenthesis: the URL ends up in a CSS background, in the full profile as in custom_profile.css.
var SAFE_IMAGE_URL = /^https:\/\/[^<>"'\\()\s]+$/;
/**
 * Builds the isolated document of a full profile.
 * @param {string} html HTML written by the member.
 * @param {boolean} allowMedia Allows images, the member background included.
 * @param {?Object} [style] Member background as returned by miniStyleOf.
 */
function fullProfileDoc(html, allowMedia, style) {
  var csp = allowMedia
    ? "default-src 'none'; img-src https: http: data:; style-src 'unsafe-inline' https: http:; font-src https: http: data:; media-src https:"
    : "default-src 'none'; img-src data:; style-src 'unsafe-inline'; font-src data:";
  var s = style || {}, bg = HEX_COLOR.test(s.bg) ? s.bg : '#fff', text = HEX_COLOR.test(s.text) ? s.text : '#1f2024';
  // Values interpolated in the <style>: a URL with < or a parenthesis could close the block or the rule.
  var image = allowMedia && SAFE_IMAGE_URL.test(s.image || '') ? ' url("' + s.image + '") ' + (BACKGROUND_REPEAT.test(s.repeat) ? s.repeat : '') + ' left 0 / contain' : '';
  return '<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="' + csp + '"><meta name="referrer" content="no-referrer"><base target="_blank">' +
    '<style>body{margin:16px;font:14px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;color:' + text + ';background:' + bg + image + ';overflow-wrap:anywhere}img,video{max-width:100%;height:auto}' +
    (HEX_COLOR.test(s.link) ? 'a{color:' + s.link + '}' : '') + '</style>' +
    '</head><body>' + html + '</body></html>';
}
