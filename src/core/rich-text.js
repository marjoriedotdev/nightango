var EMBED_LABEL = { youtube: 'Video', image: 'Image', photo: 'Photo', video: 'Video', audio: 'Audio' };
function messagePreview(m) { var e = m.embeds && m.embeds[0]; return m.text || (e ? EMBED_LABEL[e.kind] : ''); }
function warnOnLink(app, url) { return function (e) { if (app.state.prefs.safety.warnLinks) { e.preventDefault(); app.ui.openLink(url); } }; }
var CHATANGO_SERVICE_HOSTS = ['www', 'st', 'ust', 'fp', 'm1', 'client'];
/**
 * Nom du profil désigné par un lien {nom}.chatango.com, ou null.
 * @param {string} url Adresse du lien.
 */
function profileOfLink(url) {
  var name = ((/^https?:\/\/([^\/?#]+)\.chatango\.com(?:[\/?#]|$)/i.exec(url) || [])[1] || '').toLowerCase();
  return ACCOUNT_NAME.test(name) && CHATANGO_SERVICE_HOSTS.indexOf(name) < 0 ? name : null;
}
/**
 * Clic sur un lien de profil : propose le profil ou la page, sauf clic modifié ou clic milieu.
 * @param {Object} app Contexte de l'application.
 * @param {string} url Adresse du lien.
 * @param {string} name Nom du profil.
 * @param {?string} gid Groupe du message, null en MP.
 */
function onProfileLink(app, url, name, gid) {
  return function (e) {
    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    app.ui.openProfileLink({ url: url, name: name, gid: gid });
  };
}

var EMPHASIS = ['b', 'i', 'u', 's'];

/* Texte de message : emphase (segments de parseContent, absents sans emphase), mentions et liens */
function MessageText(p) {
  var app = useApp();
  // Style coupé (plain) : comme Torch, gras, italique et souligné retombent mais le barré reste.
  var marks = p.plain ? ['s'] : EMPHASIS;
  return h('p', { className: 'tc-msg-text', style: p.style }, (p.parts || [{ text: p.text }]).map(function (part, k) {
    var nodes = String(part.text).split(/(@[A-Za-z0-9_!-]+|https?:\/\/[^\s]+)/g).map(function (s, i) {
      if (!s) return null;
      if (s.charAt(0) === '@' && s.length > 1) {
        var name = s.slice(1).toLowerCase();
        return ACCOUNT_NAME.test(name)
          ? h('button', { key: i, type: 'button', className: 'tc-mention', title: 'View ' + name + "'s profile", onClick: function () { app.ui.openProfile(name, p.gid || null); } }, s)
          : h('span', { key: i, className: 'tc-mention' }, s);
      }
      if (/^https?:\/\//.test(s)) {
        var profile = profileOfLink(s);
        return h('a', { key: i, href: s, target: '_blank', rel: 'noopener noreferrer', className: 'msg-link', onClick: profile ? onProfileLink(app, s, profile, p.gid || null) : warnOnLink(app, s) }, s);
      }
      return s;
    });
    return marks.reduce(function (node, mark) { return part[mark] ? h(mark, { key: k }, node) : node; }, nodes);
  }));
}

/* ---------- HTML de profil écrit par les membres ----------
   Jamais injecté : le texte est relu par le parseur du navigateur, puis seules quelques balises
   de mise en forme sont reconstruites en éléments React. Scripts, styles libres et attributs disparaissent. */
var RICH_TAGS = { b: 'b', strong: 'b', i: 'i', em: 'i', u: 'u', s: 's', strike: 's', br: 'br', p: 'p', div: 'div', span: 'span', font: 'span', center: 'div', a: 'a', img: 'img' };
var RICH_DROP = { script: 1, style: 1, iframe: 1, object: 1, embed: 1, noscript: 1, template: 1, svg: 1, math: 1, form: 1, input: 1, button: 1, textarea: 1, select: 1, link: 1, meta: 1, title: 1, head: 1 };
var FONT_TAG_SIZES_PX = [0, 10, 12, 13, 15, 18, 22, 28];
function richStyle(el, tag, ctx) {
  var st = {}, css = String(el.getAttribute('style') || '');
  var color = cssColor(el.getAttribute('color') || (/(?:^|;)\s*color\s*:\s*([^;]+)/i.exec(css) || [])[1]);
  if (color) st.color = ensureContrast(color, ctx.bg, 4.5);
  var face = el.getAttribute('face');
  if (face && /^[\w ,'-]{1,40}$/.test(face)) st.fontFamily = face;
  if (!ctx.inline) {
    var size = el.getAttribute('size'), px = (/font-size\s*:\s*(\d+)px/i.exec(css) || [])[1];
    if (size && FONT_TAG_SIZES_PX[+size]) st.fontSize = FONT_TAG_SIZES_PX[+size];
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
    var as = RICH_TAGS[tag];
    if (!as) { out = out.concat(richNodes(c, ctx, k)); return; }
    if (as === 'br') { out.push(ctx.inline ? ' ' : h('br', { key: k })); return; }
    if (as === 'img') {
      if (ctx.inline) return;
      var src = String(c.getAttribute('src') || '');
      if (!/^https?:\/\//i.test(src)) return;
      if (!ctx.images) { out.push(h('a', { key: k, href: src, target: '_blank', rel: 'noopener noreferrer nofollow', className: 'msg-link', onClick: ctx.onLink(src) }, 'Image')); return; }
      if (ctx.blocked) { out.push(h('button', { key: k, type: 'button', className: 'linkbtn', onClick: ctx.reveal }, 'Show image')); return; }
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
 * Texte de profil Chatango rendu sans jamais injecter de HTML.
 * @param {string} p.html HTML écrit par le membre.
 * @param {boolean} [p.inline] Rendu en ligne sans bloc ni lien ni image.
 * @param {string} [p.bg] Fond sur lequel les couleurs du texte restent lisibles.
 * @param {string} [p.link] Couleur des liens.
 */
function RichText(p) {
  var app = useApp(), safety = app.state.prefs.safety;
  var r = useState(false), revealed = r[0], setRevealed = r[1];
  var html = String(p.html || '').replace(/\r\n|\r|\n/g, '<br>');
  var doc;
  try { doc = new DOMParser().parseFromString('<!doctype html><body>' + html, 'text/html'); } catch (e) { return h('p', { className: 'about' }, p.html); }
  var ctx = {
    bg: p.bg || SURFACE[app.theme].bg, inline: p.inline, link: p.link,
    images: safety.embedImages, blocked: safety.proxyMedia && !revealed,
    reveal: function () { setRevealed(true); },
    onLink: function (url) { return function (e) { if (safety.warnLinks) { e.preventDefault(); app.ui.openLink(url); } }; }
  };
  var nodes = richNodes(doc.body, ctx, 'r');
  return p.inline ? h.apply(null, [Frag, null].concat(nodes)) : h.apply(null, ['div', { className: 'about rich' }].concat(nodes));
}
var BACKGROUND_REPEAT = /^(?:no-repeat|repeat-x|repeat-y|repeat)$/;
var HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
/**
 * Permet de construire le document isolé d'un profil complet.
 * @param {string} html HTML écrit par le membre.
 * @param {boolean} allowMedia Autorise les images, dont le fond du membre.
 * @param {?Object} [style] Fond du membre tel que le renvoie miniStyleOf.
 */
function fullProfileDoc(html, allowMedia, style) {
  var csp = allowMedia
    ? "default-src 'none'; img-src https: http: data:; style-src 'unsafe-inline' https: http:; font-src https: http: data:; media-src https:"
    : "default-src 'none'; img-src data:; style-src 'unsafe-inline'; font-src data:";
  var s = style || {}, bg = HEX_COLOR.test(s.bg) ? s.bg : '#fff', text = HEX_COLOR.test(s.text) ? s.text : '#1f2024';
  // Valeurs interpolées dans le <style> : une URL avec < ou une parenthèse pourrait fermer le bloc ou la règle.
  var image = allowMedia && /^https:\/\/[^<>"'\\()\s]+$/.test(s.image || '') ? ' url("' + s.image + '") ' + (BACKGROUND_REPEAT.test(s.repeat) ? s.repeat : '') + ' left 0 / contain' : '';
  return '<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="' + csp + '"><meta name="referrer" content="no-referrer"><base target="_blank">' +
    '<style>body{margin:16px;font:14px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;color:' + text + ';background:' + bg + image + ';overflow-wrap:anywhere}img,video{max-width:100%;height:auto}' +
    (HEX_COLOR.test(s.link) ? 'a{color:' + s.link + '}' : '') + '</style>' +
    '</head><body>' + html + '</body></html>';
}
