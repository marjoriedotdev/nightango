var UNSTYLED = { names: false, fonts: false, backgrounds: false };

/**
 * Computes the Chatango style of a message row, readable on its background.
 * A member with a hidden style renders as if the three settings were off for them alone, and their emphasis drops (plain).
 * @param {{style: ?Object, unstyled: ?boolean}} u Member, with their style and hidden style flag.
 * @param {Object} styles "Chatango styles" settings.
 * @param {string} theme Resolved theme.
 * @param {boolean} highlighted Row highlighted as a mention or a channel message, whose highlight replaces the member background.
 * @param {?Object} [msgBg] Premium message background read by parseMsgBg, in live.
 */
function memberStyles(u, styles, theme, highlighted, msgBg) {
  var style = u.style || {};
  if (u.unstyled) styles = UNSTYLED;
  var surf = SURFACE[theme], bg = surf.bg, out = { name: null, text: null, row: null, image: null, plain: !!u.unstyled };
  var shown = styles.backgrounds && !highlighted, color = msgBg ? msgBg.alpha && msgBg.color : style.bg;
  if (shown && color) {
    bg = rgbToHex(mix(hexToRgb(surf.bg), hexToRgb(color), theme === 'dark' ? 0.6 : 0.18));
    out.row = { background: bg };
    out.text = { color: ensureContrast(surf.body, bg, 4.5) };
    out.name = out.text;
  }
  if (shown && msgBg && msgBg.image) out.image = { src: msgBg.image, opacity: msgBg.imageAlpha / 100, position: MSG_BG_ALIGN[msgBg.align], tile: msgBg.tile };
  if (styles.names && style.nameColor) out.name = { color: ensureContrast(style.nameColor, bg, 4.5) };
  if (styles.fonts) {
    if (style.font) out.text = Object.assign({}, out.text, { fontFamily: FONT_STACKS[style.font] || style.font });
    if (style.textColor) out.text = Object.assign({}, out.text, { color: ensureContrast(style.textColor, bg, 4.5) });
    // A percentage would be computed on the parent: the size multiplies --msg-size, set on the same element.
    if (style.fontSize && !styles.sameSize) out.text = Object.assign({}, out.text, { fontSize: 'calc(var(--msg-size, 14px) * ' + style.fontSize / 100 + ')' });
  }
  return out;
}

/**
 * Group message row with its toolbar and its action menu.
 * It reads the state only through its props: a change that leaves them alone, a presence for example, does not render it again.
 * @param {{m: Object, gid: string, me: string, prefs: Object, theme: string, style: Object, unstyled: boolean, ignored: boolean, msgBg: (Object|null|undefined),
 *   role: ?string, staff: boolean, canBan: boolean, seeIps: boolean, original: ?Object, continued: boolean, highlight: boolean,
 *   onReply: Function, onQuote: Function, onEdit: Function, onMention: Function, onJump: Function}} p Message, group, signed-in user, preferences,
 *   resolved theme, author's style, hidden style, ignore and message background (undefined while unread), author's role, whether the user is staff,
 *   ban right on the author and IP right, loaded original of a reply, follow-up of the previous message from the same author, highlight, and actions.
 */
var MessageRow = React.memo(function MessageRow(p) {
  var app = useAppApi(), prefs = p.prefs, m = p.m, me = p.me, gid = p.gid;
  var st = useState(false), menuOpen = st[0], setMenuOpen = st[1];
  var mention = m.author !== me && mentionsMe(me, m.text);
  var chanColor = m.channel && m.channel !== 'none' && CHANNELS[m.channel] ? CHANNELS[m.channel].color : null;
  var chanRow = !!chanColor && !mention;
  var ms = memberStyles({ style: p.style, unstyled: p.unstyled }, prefs.styles, p.theme, mention || chanRow, m.bg ? p.msgBg : null), nameStyle = ms.name, textStyle = ms.text, rowStyle = ms.row;
  var bgUnknown = p.msgBg === undefined;
  useEffect(function () { if (m.bg && prefs.styles.backgrounds && !p.unstyled && bgUnknown) app.actions.loadMsgBg(m.author); }, [m.bg, prefs.styles.backgrounds, p.unstyled, bgUnknown]);
  var bgImage = ms.image && prefs.safety.embedImages && !prefs.safety.proxyMedia ? h(MessageBgImage, ms.image) : null;
  // Chatango lets only staff delete and ban, from a message received from the server.
  var canDelete = p.staff;
  var canBan = p.canBan && (!LIVE || !!m.unid);
  // Like a reply, an edit waits for the message's final id.
  var canEdit = m.author === me && (!LIVE || liveBridge.delivered(m.id));
  var handle = m.author !== me ? mentionHandle(m.author) : null;
  var showIp = LIVE && m.ip && p.seeIps;
  var canQuote = !!m.text && !!mentionHandle(m.author);
  var deleteMessage = function () { app.actions.deleteMessage(gid, m.id); };
  var menuItems = [
    canEdit ? { label: 'Edit message', icon: 'edit', onSelect: function () { p.onEdit(m); } } : null,
    handle ? { label: 'Mention ' + m.author, icon: 'at-sign', onSelect: function () { p.onMention(handle); } } : null,
    canQuote ? { label: 'Quote message', icon: 'quote', onSelect: function () { p.onQuote(m); } } : null,
    copyTextItem(app, m),
    showIp ? { label: 'Copy IP ' + m.ip, icon: 'copy', onSelect: function () { copyText(m.ip, function (ok) { app.ui.toast(ok ? 'IP address copied.' : 'Copy failed.'); }); } } : null,
    m.author !== me ? viewProfileItem(app, m.author, gid) : null,
    whoItem(app, m.author),
    m.author !== me ? styleItem(app, m.author, p.unstyled, true) : null,
    canDelete || m.author !== me || canBan ? { divider: true } : null,
    canDelete ? { label: LIVE ? 'Delete message…' : 'Delete message', icon: 'trash', danger: true, onSelect: function () { if (LIVE) app.ui.confirm({ title: 'Delete this message?', body: 'Chatango removes it from #' + gid + " for everyone. You can't undo this.", confirmLabel: 'Delete', danger: true, onConfirm: deleteMessage }); else deleteMessage(); } } : null,
    LIVE && canBan ? { label: 'Delete all from ' + m.author + '…', icon: 'message-square-x', danger: true, onSelect: function () { app.ui.confirm({ title: 'Delete every message from ' + m.author + '?', body: 'Chatango removes their recent messages in #' + gid + ' for everyone.', confirmLabel: 'Delete all', danger: true, onConfirm: function () { app.actions.deleteAllFrom(gid, m.author, m); } }); } } : null,
    m.author !== me ? ignoreItem(app, m.author, p.ignored) : null,
    canBan ? banItem(app, m.author, gid, m) : null
  ];
  var actions = m.deleted ? null : h(Frag, null,
    h(T.IconButton, { icon: 'reply', label: 'Reply', size: 28, iconSize: 16, onClick: function () { p.onReply(m); } }),
    moreActionsButton(menuItems, setMenuOpen));
  var body = m.deleted
    ? h('p', { className: 'tc-msg-text deleted' }, m.deleted.by === m.author ? 'Message deleted' : 'Message deleted by ' + m.deleted.by)
    : h(MessageContent, { m: m, style: textStyle, plain: ms.plain, gid: gid });
  var chan = chanColor ? h('span', { className: 'chan' }, h('i', { style: { background: chanColor } }), CHANNELS[m.channel].label + ' channel') : null;
  if (chanRow) rowStyle = Object.assign({ '--chan': chanColor }, rowStyle);
  var original = p.original;
  var reply = original ? { author: h(Person, { name: original.author, gid: gid, size: 16 }), text: messagePreview(original), onJump: function () { p.onJump(original); } }
    : m.replyTo ? { text: 'Original message not loaded' } : null;
  var authorBtn = handle
    ? h('button', { type: 'button', className: 'tc-msg-author namebtn namebtn-mention', title: 'Mention ' + m.author, style: nameStyle, onClick: function () { p.onMention(handle); } }, m.author)
    : authorName(m.author, nameStyle);
  return h(T.Message, {
    compact: prefs.density === 'compact', continued: p.continued, mention: mention, time: fmtTime(m.ts, prefs.h24),
    avatar: h(Person, { name: m.author, gid: gid, avatarOnly: true }), author: authorBtn, meta: h(Frag, null, roleBadge(p.role), developerBadge(m.author), chan), reply: reply, actions: actions,
    msgId: m.id, highlight: p.highlight, className: cx(menuOpen && 'menu-open', chanRow && 'chan-msg'), style: rowStyle, background: bgImage
  }, body);
});

/**
 * Offers to copy a message's text in a group or a PM.
 * @param {Object} app Application context.
 * @param {Object} m Message.
 */
function copyTextItem(app, m) {
  return { label: 'Copy text', icon: 'copy', onSelect: function () { copyText(m.text || messagePreview(m), function (ok) { app.ui.toast(ok ? 'Message copied.' : 'Copy failed. Select the text and copy it.'); }); } };
}

/**
 * "More actions" button of a message toolbar.
 * @param {Array} items Menu entries.
 * @param {function(boolean)} onOpenChange Open state tracking, which keeps the toolbar shown.
 */
function moreActionsButton(items, onOpenChange) {
  return h(MenuButton, { label: 'More actions', size: 28, iconSize: 16, items: items, onOpenChange: onOpenChange });
}

/**
 * Image of a member's Premium message background behind the row text.
 * @param {string} p.src Address of msgbg.jpg.
 * @param {number} p.opacity Opacity chosen by the member, never raised.
 * @param {string} p.position Image corner as a CSS position.
 * @param {boolean} p.tile Repeats the image on both axes, as BetterChatango does.
 */
function MessageBgImage(p) {
  // CSS background and not a no-referrer <img>, which cannot tile: the URL is always on ust.chatango.com (ADR-0004).
  return h('div', { style: { backgroundImage: 'url("' + p.src + '")', backgroundPosition: p.position, backgroundRepeat: p.tile ? 'repeat' : 'no-repeat', opacity: p.opacity } });
}

/**
 * Returns the name to write after @ to mention a member, or null for an anon.
 * @param {string} name Shown member name.
 */
function mentionHandle(name) {
  // Like BetterChatango: a temporary name "#name" is mentioned without its #.
  if (name.charAt(0) === '#') return name.slice(1);
  return name.charAt(0) === '!' ? null : name;
}

/**
 * Writes a message quote in BetterChatango's plain text format, to place before the typed text.
 * @param {string} author Mentionable author of the quoted message.
 * @param {string} text Quoted text.
 */
function quoteOf(author, text) {
  return '@' + mentionHandle(author) + ': `' + text.replace(/`/g, '').replace(/\n/g, ' ').trim() + '` ';
}

/**
 * Returns the id an edit of a message targets.
 * For an edit shown separately, it is the id of the original.
 * @param {Object} m Edited message.
 */
function editedId(m) { return m.editId || m.id; }

/**
 * Author name of a message, without action.
 * @param {string} name Member name.
 * @param {?Object} style Name color chosen by the member.
 */
function authorName(name, style) {
  return h('span', { className: 'tc-msg-author', style: style }, name);
}

function MessageContent(p) {
  var m = p.m, parts = shownParts(m);
  return h(Frag, null, parts.length ? h(MessageText, { text: m.text, parts: parts, style: p.style, plain: p.plain, gid: p.gid }) : null, m.edited ? h('span', { className: 'tc-msg-time' }, '(edited)') : null, m.embeds && m.embeds.length ? h(MessageEmbeds, { embeds: m.embeds }) : null);
}

var FILE_MEDIA = { video: { icon: 'play', label: 'Play video', className: 'embed-frame' }, audio: { icon: 'volume', label: 'Play audio', className: 'embed-audio' } };
function MessageEmbeds(p) {
  return h('div', { className: 'embeds' }, p.embeds.map(function (e, i) {
    if (e.kind === 'youtube') return h(VideoEmbed, { key: i, id: e.id });
    if (e.kind === 'tiktok') return h(TikTokEmbed, { key: i, id: e.id, url: e.url });
    if (e.kind === 'x') return h(XPostEmbed, { key: i, id: e.id, url: e.url });
    return FILE_MEDIA[e.kind] ? h(FileEmbed, { key: i, kind: e.kind, url: e.url }) : h(ImageEmbed, { key: i, kind: e.kind, url: e.url });
  }));
}

/**
 * Builds a media link that goes through the link warning.
 * @param {Object} app Application context.
 * @param {string} url Opened address.
 * @param {string} className Link class.
 * @param {*} content Link content.
 */
function mediaLink(app, url, className, content) {
  return h('a', { className: className, href: url, target: '_blank', rel: 'noopener noreferrer', onClick: warnOnLink(app, url) }, content);
}

/**
 * Button that loads a media on click, followed by the host that serves it.
 * @param {string} p.icon Media icon.
 * @param {string} p.label Button action.
 * @param {string} p.url Media address.
 * @param {Function} p.onClick Loads the media.
 */
function RevealButton(p) {
  var host = httpsHost(p.url);
  return h('button', { type: 'button', className: 'embed-reveal', onClick: p.onClick }, h(T.Icon, { name: p.icon, size: 16 }), p.label, host ? h('span', null, host) : null);
}

function safetyPrefs(s) { return s.prefs.safety; }
function clockPref(s) { return s.prefs.h24; }

function VideoEmbed(p) {
  var app = useAppApi(), safety = useStatePart(safetyPrefs);
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
 * TikTok post in TikTok's embed player, which exists only after the click.
 * Its post page, which gives the post id of a short link and the cover, is read when shown only under the rules of the YouTube thumbnail, otherwise at the click.
 * The vertical card shows only once the cover has loaded: until then, and without one, a compact button.
 * @param {?string} p.id Post id, absent for a short link.
 * @param {string} p.url Post or short link of the message.
 */
function TikTokEmbed(p) {
  var app = useAppApi(), safety = useStatePart(safetyPrefs);
  var a = useState(p.id || null), post = a[0], setPost = a[1];
  var b = useState('idle'), phase = b[0], setPhase = b[1];
  var c = useState(null), thumb = c[0], setThumb = c[1];
  var d = useState(false), loaded = d[0], setLoaded = d[1];
  var preview = safety.embedVideos && !waitsForClick(safety, 'tiktok', p.url);
  useEffect(function () {
    if (!preview) return;
    var current = true;
    app.actions.tiktokPost({ id: p.id, url: p.url }).then(function (r) { if (current) { setPost(r.post); setThumb(r.thumb); } }, function () { /* without the post page, the link stays a button */ });
    return function () { current = false; };
  }, [preview, p.url]);
  if (!safety.embedVideos || phase === 'failed') return mediaLink(app, p.url, 'msg-link', p.url);
  if (phase === 'playing') {
    return h('iframe', {
      className: 'embed-frame embed-tiktok', title: 'TikTok video', src: 'https://www.tiktok.com/player/v1/' + post + '?autoplay=1&rel=0',
      allow: 'autoplay; encrypted-media; picture-in-picture; fullscreen', allowFullScreen: true, referrerPolicy: 'strict-origin-when-cross-origin'
    });
  }
  function play() {
    if (post) { setPhase('playing'); return; }
    setPhase('loading');
    app.actions.tiktokPost({ id: p.id, url: p.url }, true).then(function (r) { setPost(r.post); setPhase('playing'); }, function (e) { app.ui.toast(e.message); setPhase('failed'); });
  }
  var loading = phase === 'loading', card = preview && thumb && loaded;
  // Loaded hidden behind the button first: an empty vertical card would take the height of a video for nothing.
  var img = preview && thumb ? h('img', {
    src: thumb, alt: '', referrerPolicy: 'no-referrer', style: card ? null : { display: 'none' },
    onLoad: function () { setLoaded(true); }, onError: function () { setThumb(null); setLoaded(false); }
  }) : null;
  if (!card) return h(Frag, null, h(RevealButton, { icon: 'play', label: loading ? 'Loading video' : 'Play video', url: p.url, onClick: loading ? null : play }), img);
  return h('button', { type: 'button', className: 'embed-video embed-tiktok', 'aria-label': 'Play video', 'aria-busy': loading ? 'true' : undefined, onClick: loading ? null : play },
    img, h('span', { className: 'embed-play' }, loading ? h(T.Spinner, { size: 22, label: 'Loading video' }) : h(T.Icon, { name: 'play', size: 22 })));
}

/**
 * X post as a card: its text from X's oEmbed, its first photo or video from its syndication when X gives one.
 * Read when shown only under the rules of the YouTube thumbnail, otherwise at the click.
 * @param {string} p.id Post id.
 * @param {string} p.url Post link of the message.
 */
function XPostEmbed(p) {
  var app = useAppApi(), safety = useStatePart(safetyPrefs);
  var a = useState(null), post = a[0], setPost = a[1];
  var b = useState('idle'), phase = b[0], setPhase = b[1];
  var preview = safety.embedX && !waitsForClick(safety, 'x', p.url);
  useEffect(function () {
    if (!preview) return;
    var current = true;
    app.actions.xPost({ id: p.id, url: p.url }).then(function (r) { if (current) setPost(r); }, function () { /* without the post, the link stays a button */ });
    return function () { current = false; };
  }, [preview, p.id]);
  if (!safety.embedX || phase === 'failed') return mediaLink(app, p.url, 'msg-link', p.url);
  if (post && (preview || phase === 'shown')) return h(XPostCard, { post: post });
  function show() {
    setPhase('loading');
    app.actions.xPost({ id: p.id, url: p.url }, true).then(function (r) { setPost(r); setPhase('shown'); }, function (e) { app.ui.toast(e.message); setPhase('failed'); });
  }
  var loading = phase === 'loading';
  return h(RevealButton, { icon: 'quote', label: loading ? 'Loading post' : 'Show post', url: p.url, onClick: loading ? null : show });
}

/**
 * X post laid out like X shows it: author, logo, text, first media, then the time of the post.
 * Without the time from X's syndication, the date of the oEmbed shows instead.
 * @param {Object} p.post Post read by the loader.
 */
function XPostCard(p) {
  var app = useAppApi(), h24 = useStatePart(clockPref), post = p.post;
  var when = post.time ? fmtTime(post.time, h24) + ' \u00b7 ' + new Date(post.time).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : post.date;
  return h('div', { className: 'embed-x' },
    h('div', { className: 'embed-x-head' },
      h(T.Avatar, { name: post.handle, src: post.avatar, size: 40, referrerPolicy: 'no-referrer' }),
      h('div', { className: 'embed-x-who' }, h('span', { className: 'embed-x-author' }, post.author), h('span', { className: 'embed-x-handle' }, '@' + post.handle)),
      mediaLink(app, post.link, 'embed-x-logo', h(T.Icon, { name: 'x-logo', size: 18, label: 'Open on X' }))),
    post.text ? h('p', { className: 'embed-x-text' }, post.text) : null,
    post.media ? h(XPostMedia, { media: post.media, link: post.link }) : null,
    mediaLink(app, post.link, 'embed-x-date', post.time ? h('time', { dateTime: new Date(post.time).toISOString() }, when) : when));
}

/**
 * First photo or video of an X post. The video loads only after the click, a media X flags as sensitive waits for a click.
 * @param {Object} p.media Media read by the loader: kind, thumb, video, width, height, sensitive.
 * @param {string} p.link Post link, opened by the photo.
 */
function XPostMedia(p) {
  var app = useAppApi(), m = p.media;
  var a = useState(!m.sensitive), revealed = a[0], setRevealed = a[1];
  var b = useState(false), playing = b[0], setPlaying = b[1];
  var c = useState(false), failed = c[0], setFailed = c[1];
  function fail() { setFailed(true); }
  if (failed) return null;
  if (!revealed) return h(RevealButton, { icon: 'eye-off', label: 'Show sensitive media', url: m.thumb, onClick: function () { setRevealed(true); } });
  var size = m.width && m.height ? { aspectRatio: m.width + ' / ' + m.height } : null;
  if (m.kind === 'photo') return mediaLink(app, p.link, 'embed-x-media', h('img', { src: m.thumb, alt: 'Photo', referrerPolicy: 'no-referrer', style: size, onError: fail }));
  if (playing) return h('video', { className: 'embed-x-media embed-x-video', src: m.video, poster: m.thumb, controls: true, autoPlay: true, playsInline: true, style: size, onError: fail });
  return h('button', { type: 'button', className: 'embed-x-media embed-x-poster', 'aria-label': 'Play video', style: size, onClick: function () { setPlaying(true); } },
    h('img', { src: m.thumb, alt: '', referrerPolicy: 'no-referrer', onError: fail }),
    h('span', { className: 'embed-play' }, h(T.Icon, { name: 'play', size: 22 })));
}

/**
 * Video or audio file from any host, whose player exists only after the click.
 * On a trusted host the player exists right away but does not start on its own.
 * @param {string} p.kind video or audio.
 * @param {string} p.url https address of the file.
 */
function FileEmbed(p) {
  var app = useAppApi(), safety = useStatePart(safetyPrefs), media = FILE_MEDIA[p.kind];
  var st = useState(false), playing = st[0], setPlaying = st[1];
  var f = useState(false), failed = f[0], setFailed = f[1];
  if (!safety.embedVideos || failed) return mediaLink(app, p.url, 'msg-link', p.url);
  if (!playing && waitsForClick(safety, p.kind, p.url)) return h(RevealButton, { icon: media.icon, label: media.label, url: p.url, onClick: function () { setPlaying(true); } });
  return h(p.kind, { className: media.className, src: p.url, controls: true, autoPlay: playing, onError: function () { setFailed(true); } });
}

function ImageEmbed(p) {
  var app = useAppApi(), safety = useStatePart(safetyPrefs);
  var st = useState(false), shown = st[0], setShown = st[1];
  if (!safety.embedImages) return mediaLink(app, p.url, 'msg-link', p.url);
  if (!shown && waitsForClick(safety, p.kind, p.url)) return h(RevealButton, { icon: 'image', label: 'Show image', url: p.url, onClick: function () { setShown(true); } });
  return h('span', { className: 'embed-image-wrap' },
    mediaLink(app, p.url, 'embed-image', h('img', { src: p.url, alt: EMBED_LABEL[p.kind], loading: 'lazy', referrerPolicy: 'no-referrer' })),
    h(MediaStar, { url: p.url }));
}
