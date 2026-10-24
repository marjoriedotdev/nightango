var UNSTYLED = { names: false, fonts: false, backgrounds: false };

/**
 * Permet de calculer le style Chatango d'une ligne de message, lisible sur son fond.
 * Un membre au style coupé est rendu comme si les trois réglages étaient coupés pour lui seul, et son emphase retombe (plain).
 * @param {{style: ?Object, unstyled: ?boolean}} u Membre, avec son style et son style coupé.
 * @param {Object} styles Réglages « Chatango styles ».
 * @param {string} theme Thème résolu.
 * @param {boolean} mention Ligne qui mentionne l'utilisateur.
 * @param {?Object} [msgBg] Fond de message Premium lu par parseMsgBg, en live.
 */
function memberStyles(u, styles, theme, mention, msgBg) {
  var style = u.style || {};
  if (u.unstyled) styles = UNSTYLED;
  var surf = SURFACE[theme], bg = surf.bg, out = { name: null, text: null, row: null, image: null, plain: !!u.unstyled };
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
  var mention = m.author !== me && mentionsMe(me, m.text);
  var ms = memberStyles(u, prefs.styles, app.theme, mention, m.bg ? u.msgBg : null), nameStyle = ms.name, textStyle = ms.text, rowStyle = ms.row;
  var bgUnknown = u.msgBg === undefined;
  useEffect(function () { if (m.bg && prefs.styles.backgrounds && !u.unstyled && bgUnknown) app.actions.loadMsgBg(m.author); }, [m.bg, prefs.styles.backgrounds, u.unstyled, bgUnknown]);
  var bgImage = ms.image && prefs.safety.embedImages && !prefs.safety.proxyMedia ? h(MessageBgImage, ms.image) : null;
  var role = roleOf(g, m.author), myRole = roleOf(g, me);
  // Chatango ne laisse supprimer et bannir qu'au staff, à partir d'un message reçu du serveur.
  var canDelete = isStaffRole(myRole);
  var canBan = canBanMember(g, me, m.author) && (!LIVE || !!m.unid);
  // Comme la réponse, la modification attend l'identifiant définitif du message.
  var canEdit = m.author === me && (!LIVE || liveBridge.canReply(m.id));
  var handle = m.author !== me ? mentionHandle(m.author) : null;
  var showIp = LIVE && m.ip && groupRights(g, me).seeIps;
  var canQuote = !!m.text && !!mentionHandle(m.author);
  var deleteMessage = function () { app.actions.deleteMessage(g.id, m.id); };
  var menuItems = [
    canEdit ? { label: 'Edit message', icon: 'edit', onSelect: function () { p.onEdit(m); } } : null,
    handle ? { label: 'Mention ' + m.author, icon: 'at-sign', onSelect: function () { p.onMention(handle); } } : null,
    canQuote ? { label: 'Quote message', icon: 'quote', onSelect: function () { p.onQuote(m); } } : null,
    copyTextItem(app, m),
    showIp ? { label: 'Copy IP ' + m.ip, icon: 'copy', onSelect: function () { copyText(m.ip, function (ok) { app.ui.toast(ok ? 'IP address copied.' : 'Copy failed.'); }); } } : null,
    m.author !== me ? viewProfileItem(app, m.author, g.id) : null,
    whoItem(app, m.author),
    m.author !== me ? styleItem(app, m.author, true) : null,
    canDelete || m.author !== me || canBan ? { divider: true } : null,
    canDelete ? { label: LIVE ? 'Delete message…' : 'Delete message', icon: 'trash', danger: true, onSelect: function () { if (LIVE) app.ui.confirm({ title: 'Delete this message?', body: 'Chatango removes it from #' + g.id + " for everyone. You can't undo this.", confirmLabel: 'Delete', danger: true, onConfirm: deleteMessage }); else deleteMessage(); } } : null,
    LIVE && canBan ? { label: 'Delete all from ' + m.author + '…', icon: 'message-square-x', danger: true, onSelect: function () { app.ui.confirm({ title: 'Delete every message from ' + m.author + '?', body: 'Chatango removes their recent messages in #' + g.id + ' for everyone.', confirmLabel: 'Delete all', danger: true, onConfirm: function () { app.actions.deleteAllFrom(g.id, m.author, m); } }); } } : null,
    m.author !== me ? ignoreItem(app, m.author) : null,
    canBan ? banItem(app, m.author, g.id, m) : null
  ];
  var actions = m.deleted ? null : h(Frag, null,
    h(T.IconButton, { icon: 'reply', label: 'Reply', size: 28, iconSize: 16, onClick: function () { p.onReply(m); } }),
    moreActionsButton(menuItems, setMenuOpen));
  var body = m.deleted
    ? h('p', { className: 'tc-msg-text deleted' }, m.deleted.by === m.author ? 'Message deleted' : 'Message deleted by ' + m.deleted.by)
    : h(MessageContent, { m: m, style: textStyle, plain: ms.plain, gid: g.id });
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
 * Permet de proposer la copie du texte d'un message, en groupe comme en MP.
 * @param {Object} app Contexte de l'application.
 * @param {Object} m Message.
 */
function copyTextItem(app, m) {
  return { label: 'Copy text', icon: 'copy', onSelect: function () { copyText(messagePreview(m), function (ok) { app.ui.toast(ok ? 'Message copied.' : 'Copy failed. Select the text and copy it.'); }); } };
}

/**
 * Bouton « More actions » de la barre d'un message.
 * @param {Array} items Entrées du menu.
 * @param {function(boolean)} onOpenChange Suivi de l'ouverture, qui garde la barre affichée.
 */
function moreActionsButton(items, onOpenChange) {
  return h(MenuButton, { label: 'More actions', size: 28, iconSize: 16, items: items, onOpenChange: onOpenChange });
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
 * Permet d'écrire la citation d'un message au format de Torch, en texte brut, à placer avant le texte saisi.
 * @param {Object} m Message cité, avec du texte et un auteur mentionnable.
 */
function quoteOf(m) {
  return '@' + mentionHandle(m.author) + ': `' + m.text.replace(/`/g, '').replace(/\n/g, ' ').trim() + '` ';
}

/**
 * Permet d'obtenir l'identifiant que vise la modification d'un message : celui de l'original pour une modification affichée à part.
 * @param {Object} m Message modifié.
 */
function editedId(m) { return m.editId || m.id; }

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
  return h(Frag, null, m.text ? h(MessageText, { text: m.text, parts: m.parts, style: p.style, plain: p.plain, gid: p.gid }) : null, m.edited ? h('span', { className: 'tc-msg-time' }, '(edited)') : null, m.embeds && m.embeds.length ? h(MessageEmbeds, { embeds: m.embeds }) : null);
}

var FILE_MEDIA = { video: { icon: 'play', label: 'Play video', className: 'embed-frame' }, audio: { icon: 'volume', label: 'Play audio', className: 'embed-audio' } };
function MessageEmbeds(p) {
  return h('div', { className: 'embeds' }, p.embeds.map(function (e, i) {
    if (e.kind === 'youtube') return h(VideoEmbed, { key: i, id: e.id });
    return FILE_MEDIA[e.kind] ? h(FileEmbed, { key: i, kind: e.kind, url: e.url }) : h(ImageEmbed, { key: i, kind: e.kind, url: e.url });
  }));
}

/**
 * Permet de savoir si un média attend un clic avant tout chargement : jamais pour un hôte de confiance.
 * @param {Object} safety Réglages Safety.
 * @param {string} kind Type du média lu par parseContent.
 * @param {string} url Adresse que le média chargerait.
 */
function waitsForClick(safety, kind, url) { return !isTrustedUrl(url, safety.trustedHosts) && (!!FILE_MEDIA[kind] || safety.proxyMedia); }

/**
 * Permet de construire un lien de média qui passe par l'avertissement de lien.
 * @param {Object} app Contexte de l'application.
 * @param {string} url Adresse ouverte.
 * @param {string} className Classe du lien.
 * @param {*} content Contenu du lien.
 */
function mediaLink(app, url, className, content) {
  return h('a', { className: className, href: url, target: '_blank', rel: 'noopener noreferrer', onClick: warnOnLink(app, url) }, content);
}

/**
 * Bouton qui charge un média au clic, suivi de l'hôte qui le sert.
 * @param {string} p.icon Icône du média.
 * @param {string} p.label Action du bouton.
 * @param {string} p.url Adresse du média.
 * @param {Function} p.onClick Chargement du média.
 */
function RevealButton(p) {
  var host = httpsHost(p.url);
  return h('button', { type: 'button', className: 'embed-reveal', onClick: p.onClick }, h(T.Icon, { name: p.icon, size: 16 }), p.label, host ? h('span', null, host) : null);
}

function VideoEmbed(p) {
  var app = useApp(), safety = app.state.prefs.safety;
  var st = useState(false), playing = st[0], setPlaying = st[1];
  var watch = 'https://www.youtube.com/watch?v=' + p.id, thumb = 'https://i.ytimg.com/vi/' + p.id + '/hqdefault.jpg';
  if (!safety.embedVideos) return mediaLink(app, watch, 'msg-link', watch);
  if (playing) {
    return h('iframe', {
      className: 'embed-frame', title: 'YouTube video', src: 'https://www.youtube-nocookie.com/embed/' + p.id + '?autoplay=1',
      allow: 'autoplay; encrypted-media; picture-in-picture; fullscreen', allowFullScreen: true, referrerPolicy: 'strict-origin-when-cross-origin'
    });
  }
  return h('button', { type: 'button', className: 'embed-video', 'aria-label': 'Play video', onClick: function () { setPlaying(true); } },
    waitsForClick(safety, 'youtube', thumb) ? null : h('img', { src: thumb, alt: '', loading: 'lazy', referrerPolicy: 'no-referrer' }),
    h('span', { className: 'embed-play' }, h(T.Icon, { name: 'play', size: 22 })));
}

/**
 * Fichier vidéo ou audio d'un hôte quelconque, dont le lecteur n'existe qu'après le clic, sauf hôte de confiance où il ne démarre pas seul.
 * @param {string} p.kind video ou audio.
 * @param {string} p.url Adresse https du fichier.
 */
function FileEmbed(p) {
  var app = useApp(), safety = app.state.prefs.safety, media = FILE_MEDIA[p.kind];
  var st = useState(false), playing = st[0], setPlaying = st[1];
  var f = useState(false), failed = f[0], setFailed = f[1];
  if (!safety.embedVideos || failed) return mediaLink(app, p.url, 'msg-link', p.url);
  if (!playing && waitsForClick(safety, p.kind, p.url)) return h(RevealButton, { icon: media.icon, label: media.label, url: p.url, onClick: function () { setPlaying(true); } });
  return h(p.kind, { className: media.className, src: p.url, controls: true, autoPlay: playing, onError: function () { setFailed(true); } });
}

function ImageEmbed(p) {
  var app = useApp(), safety = app.state.prefs.safety;
  var st = useState(false), shown = st[0], setShown = st[1];
  if (!safety.embedImages) return mediaLink(app, p.url, 'msg-link', p.url);
  if (!shown && waitsForClick(safety, p.kind, p.url)) return h(RevealButton, { icon: 'image', label: 'Show image', url: p.url, onClick: function () { setShown(true); } });
  return h('span', { className: 'embed-image-wrap' },
    mediaLink(app, p.url, 'embed-image', h('img', { src: p.url, alt: EMBED_LABEL[p.kind], loading: 'lazy', referrerPolicy: 'no-referrer' })),
    h(MediaStar, { url: p.url }));
}
