function memberStyles(style, styles, theme, mention) {
  var surf = SURFACE[theme], bg = surf.bg, out = { name: null, text: null, row: null };
  if (styles.backgrounds && style.bg && !mention) {
    bg = rgbToHex(mix(hexToRgb(surf.bg), hexToRgb(style.bg), theme === 'dark' ? 0.6 : 0.18));
    out.row = { background: bg };
    out.text = { color: ensureContrast(surf.body, bg, 4.5) };
  }
  if (styles.names && style.nameColor) out.name = { color: ensureContrast(style.nameColor, bg, 4.5) };
  if (styles.fonts) {
    if (style.font) out.text = Object.assign({}, out.text, { fontFamily: FONT_STACKS[style.font] || style.font });
    if (style.textColor) out.text = Object.assign({}, out.text, { color: ensureContrast(style.textColor, bg, 4.5) });
    // Un pourcentage serait calculé sur le parent : la taille multiplie --msg-size, posée sur le même élément.
    if (style.fontSize) out.text = Object.assign({}, out.text, { fontSize: 'calc(var(--msg-size, 14px) * ' + style.fontSize / 100 + ')' });
  }
  return out;
}

function MessageRow(p) {
  var app = useApp(), s = app.state, prefs = s.prefs, m = p.m, me = s.me, g = p.g;
  var st = useState(false), menuOpen = st[0], setMenuOpen = st[1];
  var u = userOf(s, m.author);
  var mention = m.author !== me && new RegExp('@' + me + '(?![A-Za-z0-9_-])', 'i').test(m.text);
  var ms = memberStyles(u.style || {}, prefs.styles, app.theme, mention), nameStyle = ms.name, textStyle = ms.text, rowStyle = ms.row;
  var role = roleOf(g, m.author), myRole = roleOf(g, me);
  // Chatango ne laisse supprimer et bannir qu'au staff, à partir d'un message reçu du serveur.
  var canDelete = LIVE ? isStaffRole(myRole) : (m.author === me || isStaffRole(myRole));
  var canBan = isStaffRole(myRole) && m.author !== me && role !== 'owner' && (!LIVE || !!m.unid);
  var handle = m.author !== me ? mentionHandle(m.author) : null;
  var deleteMessage = function () { app.actions.deleteMessage(g.id, m.id); };
  var menuItems = [
    handle ? { label: 'Mention ' + m.author, icon: 'message', onSelect: function () { p.onMention(handle); } } : null,
    { label: 'Copy text', icon: 'list', onSelect: function () { copyText(messagePreview(m), function (ok) { app.ui.toast(ok ? 'Message copied.' : 'Copy failed.'); }); } },
    m.author !== me ? { label: 'View profile', icon: 'users', onSelect: function () { app.ui.openProfile(m.author, g.id); } } : null,
    canDelete || m.author !== me || canBan ? { divider: true } : null,
    canDelete ? { label: 'Delete message', icon: 'trash', danger: true, onSelect: function () { if (LIVE) app.ui.confirm({ title: 'Delete this message?', body: 'Chatango removes it from #' + g.id + " for everyone. You can't undo this.", confirmLabel: 'Delete', danger: true, onConfirm: deleteMessage }); else deleteMessage(); } } : null,
    LIVE && canBan ? { label: 'Delete all from ' + m.author, icon: 'trash', danger: true, onSelect: function () { app.ui.confirm({ title: 'Delete every message from ' + m.author + '?', body: 'Chatango removes their recent messages in #' + g.id + ' for everyone.', confirmLabel: 'Delete all', danger: true, onConfirm: function () { app.actions.deleteAllFrom(g.id, m.author, m); } }); } } : null,
    m.author !== me ? { label: u.ignored ? 'Stop ignoring ' + m.author : 'Ignore ' + m.author, icon: 'eye-off', onSelect: function () { app.actions.toggleUser(m.author, 'ignored'); } } : null,
    canBan ? { label: 'Ban from #' + g.id, icon: 'ban', danger: true, onSelect: function () { app.ui.ban(m.author, g.id, m); } } : null
  ];
  var actions = m.deleted ? null : h(Frag, null,
    h(T.IconButton, { icon: 'reply', label: 'Reply', size: 28, iconSize: 16, onClick: function () { p.onReply(m); } }),
    h(MenuButton, { label: 'More actions', size: 28, iconSize: 16, items: menuItems, onOpenChange: setMenuOpen }));
  var body = m.deleted
    ? h('p', { className: 'tc-msg-text deleted' }, m.deleted.by === m.author ? 'Message deleted' : 'Message deleted by ' + m.deleted.by)
    : h(MessageContent, { m: m, style: textStyle, gid: g.id }, m.edited ? h('span', { className: 'tc-msg-time' }, '(edited)') : null);
  var chanColor = m.channel && m.channel !== 'none' && CHANNELS[m.channel] ? CHANNELS[m.channel].color : null;
  var chan = chanColor ? h('span', { className: 'chan' }, h('i', { style: { background: chanColor } }), CHANNELS[m.channel].label + ' channel') : null;
  if (chanColor) rowStyle = Object.assign({ '--chan': chanColor }, rowStyle);
  var reply = m.replyTo ? { author: m.replyTo.author ? h(Person, { name: m.replyTo.author, gid: g.id, size: 16 }) : null, text: m.replyTo.text } : null;
  var authorBtn = handle
    ? h('button', { type: 'button', className: 'tc-msg-author namebtn namebtn-mention', title: 'Mention ' + m.author, style: nameStyle, onClick: function () { p.onMention(handle); } }, m.author)
    : authorName(m.author, nameStyle);
  return h(T.Message, {
    compact: prefs.density === 'compact', continued: p.continued, mention: mention, time: fmtTime(m.ts, prefs.h24),
    avatar: h(Person, { name: m.author, gid: g.id, avatarOnly: true }), author: authorBtn, meta: h(Frag, null, roleBadge(role), chan), reply: reply, actions: actions,
    className: cx(menuOpen && 'menu-open', chanColor && 'chan-msg'), style: rowStyle
  }, body);
}

/**
 * Permet d'obtenir le nom à écrire après @ pour mentionner un membre, ou null pour un anonyme.
 * @param {string} name Nom affiché du membre.
 */
function mentionHandle(name) {
  // Comme Torch : un nom temporaire « #nom » se mentionne sans son #.
  if (name.charAt(0) === '#') return name.slice(1);
  return name.charAt(0) === '!' ? null : name;
}

/**
 * Nom de l'auteur d'un message, sans action.
 * @param {string} name Nom du membre.
 * @param {?Object} style Couleur du nom choisie par le membre.
 */
function authorName(name, style) {
  return h('span', { className: 'tc-msg-author', style: style }, name);
}

function MessageContent(p) {
  var m = p.m;
  return h(Frag, null, m.text ? h(MessageText, { text: m.text, parts: m.parts, style: p.style, gid: p.gid }) : null, p.children, m.embeds && m.embeds.length ? h(MessageEmbeds, { embeds: m.embeds }) : null);
}

function MessageEmbeds(p) {
  return h('div', { className: 'embeds' }, p.embeds.map(function (e, i) {
    return e.kind === 'youtube' ? h(VideoEmbed, { key: i, id: e.id }) : h(ImageEmbed, { key: i, url: e.url, label: EMBED_LABEL[e.kind] });
  }));
}

function VideoEmbed(p) {
  var app = useApp(), safety = app.state.prefs.safety;
  var st = useState(false), playing = st[0], setPlaying = st[1];
  var watch = 'https://www.youtube.com/watch?v=' + p.id;
  if (!safety.embedVideos) return h('a', { className: 'msg-link', href: watch, target: '_blank', rel: 'noopener noreferrer', onClick: warnOnLink(app, watch) }, watch);
  if (playing) {
    return h('iframe', {
      className: 'embed-frame', title: 'YouTube video', src: 'https://www.youtube-nocookie.com/embed/' + p.id + '?autoplay=1',
      allow: 'autoplay; encrypted-media; picture-in-picture; fullscreen', allowFullScreen: true, referrerPolicy: 'strict-origin-when-cross-origin'
    });
  }
  return h('button', { type: 'button', className: 'embed-video', 'aria-label': 'Play video', onClick: function () { setPlaying(true); } },
    safety.proxyMedia ? null : h('img', { src: 'https://i.ytimg.com/vi/' + p.id + '/hqdefault.jpg', alt: '', loading: 'lazy', referrerPolicy: 'no-referrer' }),
    h('span', { className: 'embed-play' }, h(T.Icon, { name: 'play', size: 22 })));
}

function ImageEmbed(p) {
  var app = useApp(), safety = app.state.prefs.safety;
  var st = useState(false), shown = st[0], setShown = st[1];
  var link = { href: p.url, target: '_blank', rel: 'noopener noreferrer', onClick: warnOnLink(app, p.url) };
  var host = (/^https:\/\/([^\/?#]+)/.exec(p.url) || [])[1];
  if (!safety.embedImages) return h('a', Object.assign({ className: 'msg-link' }, link), p.url);
  if (safety.proxyMedia && !shown) {
    return h('button', { type: 'button', className: 'embed-reveal', onClick: function () { setShown(true); } },
      h(T.Icon, { name: 'image', size: 16 }), 'Show image', host ? h('span', null, host) : null);
  }
  return h('a', Object.assign({ className: 'embed-image' }, link), h('img', { src: p.url, alt: p.label, loading: 'lazy', referrerPolicy: 'no-referrer' }));
}
