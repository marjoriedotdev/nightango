/**
 * Permet de calculer le style Chatango d'une ligne de message, lisible sur son fond.
 * @param {Object} style Style du membre.
 * @param {Object} styles Réglages « Chatango styles ».
 * @param {string} theme Thème résolu.
 * @param {boolean} mention Ligne qui mentionne l'utilisateur.
 * @param {?Object} [msgBg] Fond de message Premium lu par parseMsgBg, en live.
 */
function memberStyles(style, styles, theme, mention, msgBg) {
  var surf = SURFACE[theme], bg = surf.bg, out = { name: null, text: null, row: null, image: null };
  var shown = styles.backgrounds && !mention, color = msgBg ? msgBg.alpha && msgBg.color : style.bg;
  if (shown && color) {
    bg = rgbToHex(mix(hexToRgb(surf.bg), hexToRgb(color), theme === 'dark' ? 0.6 : 0.18));
    out.row = { background: bg };
    out.text = { color: ensureContrast(surf.body, bg, 4.5) };
    out.name = out.text;
  }
  if (shown && msgBg && msgBg.image) out.image = { src: msgBg.image, opacity: msgBg.imageAlpha / 100, position: MSG_BG_ALIGN[msgBg.align] };
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
  var ms = memberStyles(u.style || {}, prefs.styles, app.theme, mention, m.bg ? u.msgBg : null), nameStyle = ms.name, textStyle = ms.text, rowStyle = ms.row;
  var bgUnknown = u.msgBg === undefined;
  useEffect(function () { if (m.bg && prefs.styles.backgrounds && bgUnknown) app.actions.loadMsgBg(m.author); }, [m.bg, prefs.styles.backgrounds, bgUnknown]);
  var bgImage = ms.image && prefs.safety.embedImages && !prefs.safety.proxyMedia ? h(MessageBgImage, ms.image) : null;
  var role = roleOf(g, m.author), myRole = roleOf(g, me);
  // Chatango ne laisse supprimer et bannir qu'au staff, à partir d'un message reçu du serveur.
  var canDelete = LIVE ? isStaffRole(myRole) : (m.author === me || isStaffRole(myRole));
  var canBan = isStaffRole(myRole) && m.author !== me && role !== 'owner' && (!LIVE || !!m.unid);
  // Comme la réponse, la modification attend l'identifiant définitif du message.
  var canEdit = m.author === me && (!LIVE || liveBridge.canReply(m.id));
  var handle = m.author !== me ? mentionHandle(m.author) : null;
  var deleteMessage = function () { app.actions.deleteMessage(g.id, m.id); };
  var menuItems = [
    canEdit ? { label: 'Edit message', icon: 'edit', onSelect: function () { p.onEdit(m); } } : null,
    handle ? { label: 'Mention ' + m.author, icon: 'at-sign', onSelect: function () { p.onMention(handle); } } : null,
    { label: 'Copy text', icon: 'copy', onSelect: function () { copyText(messagePreview(m), function (ok) { app.ui.toast(ok ? 'Message copied.' : 'Copy failed. Select the text and copy it.'); }); } },
    m.author !== me ? viewProfileItem(app, m.author, g.id) : null,
    canDelete || m.author !== me || canBan ? { divider: true } : null,
    canDelete ? { label: LIVE ? 'Delete message…' : 'Delete message', icon: 'trash', danger: true, onSelect: function () { if (LIVE) app.ui.confirm({ title: 'Delete this message?', body: 'Chatango removes it from #' + g.id + " for everyone. You can't undo this.", confirmLabel: 'Delete', danger: true, onConfirm: deleteMessage }); else deleteMessage(); } } : null,
    LIVE && canBan ? { label: 'Delete all from ' + m.author + '…', icon: 'message-square-x', danger: true, onSelect: function () { app.ui.confirm({ title: 'Delete every message from ' + m.author + '?', body: 'Chatango removes their recent messages in #' + g.id + ' for everyone.', confirmLabel: 'Delete all', danger: true, onConfirm: function () { app.actions.deleteAllFrom(g.id, m.author, m); } }); } } : null,
    m.author !== me ? ignoreItem(app, m.author) : null,
    canBan ? banItem(app, m.author, g.id, m) : null
  ];
  var actions = m.deleted ? null : h(Frag, null,
    h(T.IconButton, { icon: 'reply', label: 'Reply', size: 28, iconSize: 16, onClick: function () { p.onReply(m); } }),
    h(MenuButton, { label: 'More actions', size: 28, iconSize: 16, items: menuItems, onOpenChange: setMenuOpen }));
  var body = m.deleted
    ? h('p', { className: 'tc-msg-text deleted' }, m.deleted.by === m.author ? 'Message deleted' : 'Message deleted by ' + m.deleted.by)
    : h(MessageContent, { m: m, style: textStyle, gid: g.id });
  var chanColor = m.channel && m.channel !== 'none' && CHANNELS[m.channel] ? CHANNELS[m.channel].color : null;
  var chan = chanColor ? h('span', { className: 'chan' }, h('i', { style: { background: chanColor } }), CHANNELS[m.channel].label + ' channel') : null;
  if (chanColor) rowStyle = Object.assign({ '--chan': chanColor }, rowStyle);
  var original = m.replyTo && findMsg(g, m.replyTo.id);
  var reply = original ? { author: h(Person, { name: original.author, gid: g.id, size: 16 }), text: messagePreview(original), onJump: function () { p.onJump(original); } }
    : m.replyTo ? { text: 'Original message not loaded' } : null;
  var authorBtn = handle
    ? h('button', { type: 'button', className: 'tc-msg-author namebtn namebtn-mention', title: 'Mention ' + m.author, style: nameStyle, onClick: function () { p.onMention(handle); } }, m.author)
    : authorName(m.author, nameStyle);
  return h(T.Message, {
    compact: prefs.density === 'compact', continued: p.continued, mention: mention, time: fmtTime(m.ts, prefs.h24),
    avatar: h(Person, { name: m.author, gid: g.id, avatarOnly: true }), author: authorBtn, meta: h(Frag, null, roleBadge(role), chan), reply: reply, actions: actions,
    msgId: m.id, highlight: p.highlight, className: cx(menuOpen && 'menu-open', chanColor && 'chan-msg'), style: rowStyle, background: bgImage
  }, body);
}

/**
 * Image du fond de message Premium d'un membre, derrière le texte de la ligne.
 * @param {string} p.src Adresse de msgbg.jpg.
 * @param {number} p.opacity Opacité choisie par le membre, jamais augmentée.
 * @param {string} p.position Coin de l'image en position CSS.
 */
function MessageBgImage(p) {
  var st = useState(false), broken = st[0], setBroken = st[1];
  if (broken) return null;
  return h('img', { src: p.src, alt: '', loading: 'lazy', referrerPolicy: 'no-referrer', style: { opacity: p.opacity, objectPosition: p.position }, onError: function () { setBroken(true); } });
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
  return h(Frag, null, m.text ? h(MessageText, { text: m.text, parts: m.parts, style: p.style, gid: p.gid }) : null, m.edited ? h('span', { className: 'tc-msg-time' }, '(edited)') : null, m.embeds && m.embeds.length ? h(MessageEmbeds, { embeds: m.embeds }) : null);
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
