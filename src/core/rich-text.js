var EMBED_LABEL = { youtube: 'Video', image: 'Image', photo: 'Photo' };
function messagePreview(m) { var e = m.embeds && m.embeds[0]; return m.text || (e ? EMBED_LABEL[e.kind] : ''); }
function warnOnLink(app, url) { return function (e) { if (app.state.prefs.safety.warnLinks) { e.preventDefault(); app.ui.openLink(url); } }; }

/* Texte de message : mentions et liens */
function MessageText(p) {
  var app = useApp();
  var parts = String(p.text).split(/(@[A-Za-z0-9_!-]+|https?:\/\/[^\s]+)/g);
  return h('p', { className: 'tc-msg-text', style: p.style }, parts.map(function (s, i) {
    if (!s) return null;
    if (s.charAt(0) === '@' && s.length > 1) return h('span', { key: i, className: 'tc-mention' }, s);
    if (/^https?:\/\//.test(s)) return h('a', { key: i, href: s, target: '_blank', rel: 'noopener noreferrer', className: 'msg-link', onClick: warnOnLink(app, s) }, s);
    return s;
  }));
}

/* ---------- HTML de profil écrit par les membres ----------
   Jamais injecté : le texte est relu par le parseur du navigateur, puis seules quelques balises
   de mise en forme sont reconstruites en éléments React. Scripts, styles libres et attributs disparaissent. */
var RICH_TAGS = { b: 'b', strong: 'b', i: 'i', em: 'i', u: 'u', s: 's', strike: 's', br: 'br', p: 'p', div: 'div', span: 'span', font: 'span', center: 'div', a: 'a', img: 'img' };
var RICH_DROP = { script: 1, style: 1, iframe: 1, object: 1, embed: 1, noscript: 1, template: 1, svg: 1, math: 1, form: 1, input: 1, button: 1, textarea: 1, select: 1, link: 1, meta: 1, title: 1, head: 1 };
var FONT_SIZES = [0, 10, 12, 13, 15, 18, 22, 28];
function richStyle(el, tag, ctx) {
  var st = {}, css = String(el.getAttribute('style') || '');
  var color = el.getAttribute('color') || (/(?:^|;)\s*color\s*:\s*([^;]+)/i.exec(css) || [])[1];
  if (color && /^#?[0-9a-f]{3}([0-9a-f]{3})?$/i.test(color.trim())) {
    var hex = color.trim().charAt(0) === '#' ? color.trim() : '#' + color.trim();
    st.color = ctx.bg ? ensureContrast(hex, ctx.bg, 4.5) : hex;
  }
  var size = el.getAttribute('size'), px = (/font-size\s*:\s*(\d+)px/i.exec(css) || [])[1];
  if (size && FONT_SIZES[+size]) st.fontSize = FONT_SIZES[+size];
  else if (px) st.fontSize = Math.max(10, Math.min(30, +px));
  var face = el.getAttribute('face');
  if (face && /^[\w ,'-]{1,40}$/.test(face)) st.fontFamily = face;
  var align = el.getAttribute('align') || (/text-align\s*:\s*(\w+)/i.exec(css) || [])[1];
  if (tag === 'center') st.textAlign = 'center';
  else if (align && /^(left|right|center|justify)$/i.test(align)) st.textAlign = align.toLowerCase();
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
    if (as === 'br') { out.push(h('br', { key: k })); return; }
    if (as === 'img') {
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
      if (!/^https?:\/\//i.test(href)) { out = out.concat(children); return; }
      out.push(h('a', { key: k, href: href, target: '_blank', rel: 'noopener noreferrer nofollow', className: 'msg-link', onClick: ctx.onLink(href) }, children.length ? children : href));
      return;
    }
    out.push(h.apply(null, [as, { key: k, style: richStyle(c, tag, ctx) }].concat(children)));
  });
  return out;
}
/** Texte de profil Chatango (mini profil) rendu sans jamais injecter de HTML. */
function RichText(p) {
  var app = useApp(), safety = app.state.prefs.safety;
  var r = useState(false), revealed = r[0], setRevealed = r[1];
  var html = String(p.html || '').replace(/\r\n|\r|\n/g, '<br>');
  var doc;
  try { doc = new DOMParser().parseFromString('<!doctype html><body>' + html, 'text/html'); } catch (e) { return h('p', { className: 'about' }, p.html); }
  var ctx = {
    bg: SURFACE[app.theme] ? SURFACE[app.theme].bg : null,
    images: safety.embedImages, blocked: safety.proxyMedia && !revealed,
    reveal: function () { setRevealed(true); },
    onLink: function (url) { return function (e) { if (safety.warnLinks) { e.preventDefault(); app.ui.openLink(url); } }; }
  };
  return h.apply(null, ['div', { className: 'about rich' }].concat(richNodes(doc.body, ctx, 'r')));
}
/** Document isolé pour un profil complet : pas de script, pas de formulaire, médias seulement si autorisés. */
function fullProfileDoc(html, allowMedia) {
  var csp = allowMedia
    ? "default-src 'none'; img-src https: http: data:; style-src 'unsafe-inline' https: http:; font-src https: http: data:; media-src https:"
    : "default-src 'none'; img-src data:; style-src 'unsafe-inline'; font-src data:";
  return '<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="' + csp + '"><base target="_blank">' +
    '<style>body{margin:16px;font:14px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;color:#1f2024;background:#fff;overflow-wrap:anywhere}img,video{max-width:100%;height:auto}</style>' +
    '</head><body>' + html + '</body></html>';
}
