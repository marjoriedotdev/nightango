/* ---------- Messages privés ---------- */
function DMView(p) {
  var app = useApp(), s = app.state, id = p.id;
  var a1 = useState('all'), tab = a1[0], setTab = a1[1];
  var a2 = useState(''), q = a2[0], setQ = a2[1];
  var column = useRightColumn(function () { app.ui.openProfile(id, null); });
  var convo = id ? s.dms[id] : null;

  var names = listedDms(s);
  useProfiles(names);
  var shown = names.filter(function (n) {
    var c = s.dms[n];
    if (tab === 'unread' && !c.unread) return false;
    return !q || n.indexOf(q.toLowerCase()) >= 0;
  });

  var filters = [['all', 'All'], ['unread', 'Unread']];
  var section = p.tab === 'friends' || p.tab === 'meet' ? p.tab : 'chats';
  var term = section === 'chats' ? q.trim() : '', found = useDmSearch(term);
  var list = h('section', { className: 'convs', 'aria-label': 'Conversations' },
    h('header', { className: 'topbar col-head' }, h(MobileNavButton, null), h('h1', { className: 'grow' }, 'Private messages'),
      h(T.IconButton, { icon: 'edit', label: 'New message', onClick: app.ui.openNewDm })),
    LIVE && s.pmrStatus === 'restricted' && !s.pmrDismissed ? h('div', { style: { padding: '12px 12px 0' } }, h(T.Banner, { tone: 'warning', title: 'Your private messages are restricted', onDismiss: app.actions.dismissPmr },
      'People might not receive your messages.')) : null,
    LIVE && s.pmUnsaved ? h('div', { style: { padding: '12px 12px 0' } }, h(T.Banner, { tone: 'warning', title: "Private messages aren't saved in this browser" }, "They'll be gone after a reload.")) : null,
    convo ? null : pmConnBanner(app, { margin: '12px 12px 0' }),
    h('div', { style: { padding: '12px 12px 0' } }, h(T.SegmentedControl, {
      label: 'Show', block: true, value: section, onChange: function (v) { app.nav({ view: 'dm', id: id, tab: v === 'chats' ? undefined : v }); },
      options: [{ value: 'chats', label: h(Frag, null, 'Chats', h(T.CountBadge, { count: unreadDmCount(s) })) }, { value: 'friends', label: 'Friends' }, { value: 'meet', label: 'Meet people' }]
    })),
    section === 'friends' ? h(FriendsList, { current: id }) : section === 'meet' ? h(MeetPeople, null) : h(Frag, null,
    h('div', { style: { padding: '12px 12px 8px', display: 'flex', flexDirection: 'column', gap: 10 } },
      h('label', { htmlFor: 'pm-search', className: 'tc-sr' }, 'Search conversations'),
      h('input', { id: 'pm-search', className: 'tc-input', type: 'search', placeholder: 'Search conversations', value: q, onChange: function (e) { setQ(e.target.value); } }),
      h('div', { className: 'tabs', role: 'group', 'aria-label': 'Filter conversations' },
        filters.map(function (t) {
          return h('button', { key: t[0], type: 'button', className: 'tab', 'aria-pressed': String(tab === t[0]), onClick: function () { setTab(t[0]); } }, t[1]);
        }))),
    h('div', { className: 'scroll', style: { padding: '0 8px 12px' } },
      LIVE && !s.pmLoaded ? h(SkeletonRows, { count: 5, avatar: 28, twoLines: true, label: 'Loading conversations' }) : h(Frag, null,
        shown.length ? shown.map(function (n) { return h(ChatRow, { key: n, name: n, current: id }); }) : h('p', { className: 'pal-empty' }, tab === 'requests' ? 'No message requests.' : q ? 'No conversation matches.' : 'No conversations yet.'),
        term.length >= DM_SEARCH_MIN ? h(DmSearchHits, { found: found }) : null))));

  var thread = convo ? h(DmThread, { key: id, id: id, tab: p.tab, column: column, seek: p.seek })
    : h('main', { className: 'thread' }, h('div', { className: 'empty' },
      h(T.Icon, { name: 'message', size: 28, strokeWidth: 1.6 }), h('h2', null, 'Select a conversation'),
      h('p', { style: { margin: 0 } }, 'Or start a new one with a friend or someone from a group.'),
      h(T.Button, { variant: 'primary', icon: 'edit', onClick: app.ui.openNewDm }, 'New message')));
  return h('div', { className: 'main', style: { flexDirection: 'row' } },
    h('div', { className: cx('dm-split', id && 'has-thread') }, list, thread),
    convo && column.open ? h(ProfilePanel, { name: id }) : null);
}

/**
 * Permet d'afficher la coupure de la connexion privée, une fois les MP chargés et hors session coupée, qui a sa propre fenêtre.
 * @param {Object} app Contexte de l'application.
 * @param {Object=} style Marge du conteneur.
 */
function pmConnBanner(app, style) {
  var s = app.state;
  if (!LIVE || !s.pmLoaded || !s.pmConn || s.pmConn === 'open' || s.session) return null;
  return h(ConnectionBanner, { name: 'private messages', conn: s.pmConn, style: style, onReconnect: function () { app.actions.reconnect('private_message'); } });
}

var DM_SEARCH_MIN = 2, DM_SEARCH_MAX = 50, DM_SEARCH_DELAY = 300;
/**
 * Permet de chercher un texte dans les messages privés : base d'historique de Torch en live, messages de l'état dans le prototype.
 * @param {Object} s État de l'application.
 * @param {string} query Texte cherché, sans casse.
 * @returns {Promise<{list: Array, more: boolean}>} Résultats du plus récent au plus ancien, et si la limite a coupé la liste.
 */
function searchDms(s, query) {
  if (LIVE) return liveBridge.searchPm(query, DM_SEARCH_MAX);
  var q = query.toLowerCase(), list = [];
  Object.keys(s.dms).forEach(function (t) {
    s.dms[t].messages.forEach(function (m) { if (m.text.toLowerCase().indexOf(q) >= 0) list.push({ target: t, from: m.from, ts: m.ts, id: m.id, text: m.text }); });
  });
  list.sort(function (a, b) { return b.ts - a.ts; });
  return Promise.resolve({ list: list.slice(0, DM_SEARCH_MAX), more: list.length > DM_SEARCH_MAX });
}
/**
 * Permet de chercher dans les messages privés après une pause de saisie.
 * @param {string} term Texte saisi, sans espaces autour.
 * @returns {?Object} Résultats du terme ({query, list, more}) ou échec ({query, failed}), null pendant la lecture.
 */
function useDmSearch(term) {
  var app = useApp();
  var st = useState(null), found = st[0], setFound = st[1];
  useEffect(function () {
    if (term.length < DM_SEARCH_MIN) return;
    var current = true, timer = setTimeout(function () {
      searchDms(app.state, term).then(function (r) { if (current) setFound({ query: term, list: r.list, more: r.more }); }, function (e) {
        warn(e);
        if (current) setFound({ query: term, failed: true });
      });
    }, DM_SEARCH_DELAY);
    return function () { current = false; clearTimeout(timer); };
  }, [term]);
  return found && found.query === term ? found : null;
}
/**
 * Permet de découper le passage d'un texte autour d'un terme, terme mis en évidence.
 * @param {string} text Texte du message.
 * @param {string} term Terme trouvé dans le texte, sans casse.
 */
function hitExcerpt(text, term) {
  var at = text.toLowerCase().indexOf(term.toLowerCase()), end = at + term.length, start = Math.max(0, at - 30), space = text.indexOf(' ', start);
  if (start && space >= 0 && space < at) start = space + 1;
  return h(Frag, null, (start ? '…' : '') + text.slice(start, at), h('mark', null, text.slice(at, end)), text.slice(end));
}
/**
 * Section Messages de la recherche des Chats, sous les conversations. Les onglets ne la filtrent pas.
 * @param {{found: ?Object}} p Recherche lue par useDmSearch, null pendant la lecture.
 */
function DmSearchHits(p) {
  var app = useApp(), me = app.state.me, found = p.found, body;
  if (!found) body = h('div', { className: 'list-more' }, h(T.Spinner, { label: 'Searching messages' }));
  else if (found.failed) body = h('p', { className: 'pal-empty' }, 'Messages could not be searched.');
  else if (!found.list.length) body = h('p', { className: 'pal-empty' }, 'No message matches.');
  else body = h(Frag, null, found.list.map(function (hit) {
    return h(MessageEntry, {
      key: hit.id || hit.archiveTs, name: hit.target, ts: hit.ts, text: h(Frag, null, hit.from === me ? 'You: ' : '', hitExcerpt(hit.text, found.query)),
      onClick: function () { app.nav({ view: 'dm', id: hit.target, seek: hit }); }
    });
  }), found.more ? h('p', { className: 'pal-empty' }, 'Showing the ' + DM_SEARCH_MAX + ' most recent matches. Refine your search to see others.') : null);
  return h('section', null, h('h2', { className: 'mlabel' }, 'Messages'), body);
}
/**
 * Permet de retrouver dans une conversation le message d'un résultat de recherche.
 * @param {Object} c Conversation dans l'état.
 * @param {Object} hit Résultat de searchDms.
 * @returns {?Object} Message affiché, null s'il n'est pas chargé.
 */
function dmHitMessage(c, hit) {
  if (!LIVE) return c.messages.find(function (m) { return m.id === hit.id; }) || null;
  // Une modification s'affiche dans son original, et un MP envoyé depuis le dernier OK n'a pas encore de clé d'archive.
  return pmEditTarget(c, hit) || c.messages[pmShownIndex(c.messages, hit)] || null;
}

/**
 * Fil d'une conversation privée, monté à neuf pour chaque correspondant.
 * @param {{id: string, tab: ?string, column: Object, seek: ?Object}} p Correspondant, onglet de la liste, colonne du profil (useRightColumn) et résultat de recherche à montrer.
 */
function DmThread(p) {
  var app = useApp(), s = app.state, me = s.me, id = p.id, convo = s.dms[id];
  var asked = useRef(false);
  var len = convo.messages.length;
  var log = useMessageLog();
  var personActions = useProfileActions(id, null);
  // Résultat de recherche : les pages plus anciennes se chargent une à une jusqu'à lui.
  useEffect(function () {
    var seek = p.seek, failed = asked.current && convo.olderFailed;
    if (!seek) return;
    var m = dmHitMessage(convo, seek);
    if (m) log.jumpTo(m.id);
    else if (convo.loadingOlder) return;
    else if (convo.olderMore && !failed) { asked.current = true; app.actions.loadOlderDm(id); return; }
    // Lecture en échec : loadOlderDm l'a déjà annoncée.
    else if (!failed) app.ui.toast('This message is no longer saved in this browser.');
    asked.current = false;
    app.update(function (d) { delete d.route.seek; });
  }, [p.seek, len, convo.loadingOlder]);

  var u = userOf(s, id);
  var typing = (s.typing['dm:' + id] || []).length > 0;
  var rows = [], prev = null, lastDay = null;
  convo.messages.forEach(function (m) {
    var dk = dayKey(m.ts);
    if (dk !== lastDay) { rows.push(h(T.DayDivider, { key: 'd' + m.id, date: m.ts }, dayLabel(m.ts))); lastDay = dk; prev = null; }
    rows.push(h(DmMessageRow, { key: m.id, m: m, peer: id, continued: !!prev && prev.from === m.from && m.ts - prev.ts < 5 * MIN, highlight: log.targetId === m.id }));
    prev = m;
  });
  var older = !LIVE || !s.pmLoaded ? null
    : !convo.olderMore ? { status: 'start', text: 'This is the start of the messages saved in this browser.' }
    : {
      status: 'more', loading: convo.loadingOlder, ready: !convo.loadingOlder && !convo.olderFailed, load: function () { app.actions.loadOlderDm(id); },
      // Après un échec de lecture, la sentinelle ne relance la lecture qu'au défilement suivant.
      retry: convo.olderFailed ? function () { app.update(function (d) { d.dms[id].olderFailed = false; }); } : null
    };
  var lastMsg = convo.messages[convo.messages.length - 1];
  if (lastMsg && lastMsg.from === me && convo.seenTs && s.prefs.privacy.showIdle) rows.push(h('p', { key: 'seen', className: 'seen' }, 'Seen ' + fmtTime(convo.seenTs, s.prefs.h24)));
  var bottom;
  if (u.blocked) bottom = h('div', { className: 'notice' }, h(T.Icon, { name: 'user-x', size: 16 }), h('span', { className: 'grow' }, 'You blocked ' + id + '. Unblock them to send messages.'), h(T.Button, { size: 'sm', onClick: function () { app.actions.toggleUser(id, 'blocked'); } }, 'Unblock'));
  else bottom = h(DmComposer, { id: id });
  return h('main', { className: 'thread' },
    h('header', { className: 'topbar' },
      h(T.IconButton, { icon: 'arrow-left', label: 'Back to conversations', className: 'only-mobile', onClick: function () { app.nav({ view: 'dm', id: null, tab: p.tab }); } }),
      h('h2', { className: 'dm-title' }, h(Person, { name: id, size: 30, status: u.status, ring: 'var(--bg)' })),
      h('span', { className: 'topic', style: { flex: 1 } }, personStatus(s, id, null)),
      h('span', { className: 'topic dm-meta', style: { flex: 1 } }, [presenceText(u), personAsl(s, id)].filter(Boolean).join(' · ')),
      h(T.IconButton, { icon: 'panel', label: p.column.pressed == null ? 'View profile' : p.column.pressed ? 'Hide profile' : 'Show profile', pressed: p.column.pressed, onClick: p.column.toggle }),
      h(MenuButton, {
        label: 'Conversation options', items: [viewProfileItem(app, id, null)].concat(personActions, [{ divider: true }], convActions(app, id))
      })),
    h(MessageLog, { log: log, label: 'Messages with ' + id, rows: rows, firstTs: len ? convo.messages[0].ts : null, changeKey: len, newBelow: 'follow', older: older }),
    pmConnBanner(app),
    h('div', { className: 'composer-wrap' },
      h('p', { className: 'typing', 'aria-live': 'polite' }, typing ? h(Frag, null, h('span', { className: 'dots', 'aria-hidden': 'true' }, h('i'), h('i'), h('i')), h('b', null, id), ' is typing') : null),
      bottom));
}

/**
 * Ligne d'un message privé avec son menu d'actions locales, sans Reply faute de trame sourcée.
 * @param {{m: Object, peer: string, continued: boolean, highlight: boolean}} p Message, correspondant de la conversation, suite du message précédent du même auteur et mise en évidence.
 */
function DmMessageRow(p) {
  var app = useApp(), s = app.state, m = p.m;
  var st = useState(false), menuOpen = st[0], setMenuOpen = st[1];
  var ms = memberStyles(userOf(s, m.from), s.prefs.styles, app.theme, false);
  // Un MP envoyé n'a sa clé d'archive qu'au prochain OK : son entrée de retrait n'apparaît qu'ensuite.
  var canRemove = !LIVE || !!m.archiveTs;
  var items = [copyTextItem(app, m), m.from !== s.me ? viewProfileItem(app, m.from, null) : null, whoItem(app, m.from),
    canRemove ? { divider: true } : null,
    canRemove ? { label: 'Remove from this browser…', icon: 'trash', danger: true, onSelect: function () {
      app.ui.confirm({ title: 'Remove this message from this browser?', body: keptCopyText(p.peer, LIVE), confirmLabel: 'Remove', danger: true, onConfirm: function () { app.actions.removeDmMessage(p.peer, m); } });
    } } : null];
  return h(T.Message, {
    compact: s.prefs.density === 'compact', continued: p.continued, time: fmtTime(m.ts, s.prefs.h24),
    avatar: h(Person, { name: m.from, avatarOnly: true }), author: authorName(m.from, ms.name), style: ms.row,
    actions: moreActionsButton(items, setMenuOpen), msgId: m.id, highlight: p.highlight, className: cx(menuOpen && 'menu-open')
  }, h(MessageContent, { m: m, style: ms.text, plain: ms.plain }));
}

/**
 * Composeur d'une conversation privée, avec son brouillon, son sélecteur d'émoticônes et de médias, la complétion :nom et l'envoi de fichier.
 * @param {{id: string}} p Correspondant de la conversation.
 */
function DmComposer(p) {
  var app = useApp(), id = p.id;
  var d = useState(''), draft = d[0], setDraft = d[1];
  var inputRef = useRef(null);
  var emoji = useEmojiPicker(inputRef, setDraft), media = useMediaCompletion(draft, setDraft);
  var attach = useAttachMedia({ kind: 'dm', id: id });
  return h(Frag, null, media.panel, h(T.Composer, {
    placeholder: 'Message ' + id, value: draft, onChange: setDraft, onKeyDown: media.onKeyDown, inputRef: inputRef, onEmoji: emoji.onEmoji, onAttach: attach.onAttach, status: attach.status,
    onSend: function (text) { if (!runCommand(app, text, null)) app.actions.sendDm(id, text); }, beforeSend: h(MessageStyleButton, null)
  }), emoji.picker, attach.input);
}

var STATUS_ORDER = { online: 0, idle: 1, offline: 2 };
function statusRank(st) { return st in STATUS_ORDER ? STATUS_ORDER[st] : 2; }
/**
 * Permet d'écrire la présence d'un membre, avec sa dernière connexion quand elle est connue.
 * @param {Object} u Membre dans l'état.
 */
function presenceText(u) { return u.status === 'offline' && u.lastOn ? 'Last online ' + ago(u.lastOn) : statusLabel(u.status); }
/**
 * Permet d'écrire la ligne de statut d'une personne : présence, ami et rôle dans le groupe d'où son profil est ouvert.
 * @param {Object} s État de l'application.
 * @param {string} name Nom du membre.
 * @param {?string} gid Groupe d'où le profil est ouvert.
 */
function personStatus(s, name, gid) {
  var u = userOf(s, name), role = gid ? roleOf(s.groups[gid], name) : null;
  return [name === s.me ? statusLabel(s.meStatus) : presenceText(u), u.friend ? 'Friend' : null, role ? ROLE_LONG[role] + ' in #' + gid : null].filter(Boolean).join(' · ');
}
/**
 * Permet d'écrire l'ASL d'une personne, sans l'âge de son propre compte quand le profil le masque.
 * @param {Object} s État de l'application.
 * @param {string} name Nom du membre.
 */
function personAsl(s, name) {
  var u = userOf(s, name), age = name === s.me && !s.profile.visibility.age ? null : u.age;
  return [age || null, genderShort(u.gender), u.location || null].filter(Boolean).join(' · ');
}
/**
 * Permet de dater l'inactivité ou la dernière connexion d'un ami.
 * @param {Object} u Membre dans l'état.
 */
function presenceSince(u) {
  if (!u.friend) return null;
  if (u.status === 'idle' && u.idleSince) return { ts: u.idleSince, text: 'Idle ' + elapsedShort(u.idleSince), title: 'Idle since ' };
  if (u.status === 'offline' && u.lastOn) return { ts: u.lastOn, text: elapsedShort(u.lastOn) + ' ago', title: 'Last online ' };
  return null;
}
/**
 * Durée d'inactivité ou de déconnexion d'un ami, rafraîchie chaque minute.
 * @param {{user: Object}} p Membre dans l'état.
 */
function PresenceTime(p) {
  var tick = useState(0)[1];
  useEffect(function () {
    var timer = setInterval(function () { tick(function (n) { return n + 1; }); }, MIN);
    return function () { clearInterval(timer); };
  }, []);
  var x = presenceSince(p.user);
  return x ? h('time', { className: 'tc-msg-time conv-time', dateTime: new Date(x.ts).toISOString(), title: x.title + new Date(x.ts).toLocaleString('en-GB') }, x.text) : null;
}
/**
 * Ligne d'informations d'une personne.
 * @param {Object} s État de l'application.
 * @param {string} n Nom du membre.
 */
function personMetaLine(s, n) {
  return h('span', { className: 'conv-meta' }, personAsl(s, n), isProfilePending(n, userOf(s, n)) ? h(T.Skeleton, { width: 72, height: 10 }) : null);
}
function useProfiles(names) {
  var app = useApp();
  useEffect(function () { app.actions.loadProfiles(names); }, [names.join(',')]);
}
function personRow(s, n, onClick, current) {
  var u = userOf(s, n), c = s.dms[n], last = c && c.messages[c.messages.length - 1];
  return h('button', { key: n, type: 'button', className: cx('conv', c && c.unread && 'unread'), 'aria-current': current === n ? 'page' : undefined, onClick: onClick },
    h(T.Avatar, { name: n, size: 28, status: u.status, ring: 'var(--panel)' }),
    h('span', { className: 'conv-main conv-grid' },
      h('span', { className: 'conv-name' }, n), presenceSr(u.status),
      presenceSince(u) ? h(PresenceTime, { user: u }) : null,
      personMetaLine(s, n),
      c ? h('span', { className: 'conv-prev' }, last ? (last.from === s.me ? 'You: ' : '') + messagePreview(last) : 'No messages yet') : null,
      c ? h(T.CountBadge, { count: c.unread }) : null));
}

/**
 * Permet de dire qui garde les MP retirés de ce navigateur.
 * @param {string} name Correspondant.
 * @param {boolean} betterChatango Vrai pour dire d'abord que seule la copie de Torch part.
 */
function keptCopyText(name, betterChatango) {
  return (betterChatango ? 'Removes the copy Torch keeps in this browser. ' : '') + 'Chatango does not store private messages, and ' + name + ' keeps their copy.';
}

/**
 * Permet de lister les actions de fermeture et de suppression d'une conversation.
 * @param {Object} app Contexte de l'application.
 * @param {string} name Membre de la conversation.
 */
function convActions(app, name) {
  return [
    { label: 'Close conversation', short: 'Close', icon: 'x', onSelect: function () { app.actions.closeDm(name); } },
    { label: 'Delete conversation…', short: 'Delete', icon: 'trash', danger: true, onSelect: function () {
      app.ui.confirm({ title: 'Delete this conversation?', body: LIVE ? keptCopyText(name, true) : 'Messages with ' + name + ' are removed from your account. ' + name + ' keeps their copy.', confirmLabel: 'Delete', danger: true, onConfirm: function () { app.actions.deleteDm(name); } });
    } }
  ];
}

/**
 * Permet de lister les actions d'une ligne de la liste d'amis.
 * @param {Object} app Contexte de l'application.
 * @param {string} name Ami de la ligne.
 */
function friendActions(app, name) {
  return [
    notifyOnlineItem(app, name),
    { label: 'Remove friend…', short: 'Remove', icon: 'user-minus', danger: true, onSelect: function () { confirmRemoveFriend(app, name); } }
  ];
}

var SWIPE_REVEAL = 144;
/**
 * Ligne de liste avec ses actions par balayage et son menu, qui ouvre aussi le profil.
 * @param {{name: string, actions: Array, children: *}} p Membre de la ligne, actions de la ligne et bouton principal.
 */
function SwipeRow(p) {
  var app = useApp(), n = p.name, actions = p.actions;
  var m = useState(null), menu = m[0], setMenu = m[1];
  var w = useState(null), swipe = w[0], setSwipe = w[1];
  var rowRef = useRef(null), drag = useRef(null), swallow = useRef(false);
  // Le décalage suit le doigt hors de React : un rendu par pointermove serait trop coûteux.
  function settle(open) { rowRef.current.style.setProperty('--swipe', (open ? -SWIPE_REVEAL : 0) + 'px'); setSwipe(open ? 'open' : null); }
  useOutside(rowRef, swipe === 'open', function () { settle(false); });
  function onPointerDown(e) {
    swallow.current = false;
    if (e.pointerType === 'mouse') return;
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, from: swipe === 'open' ? -SWIPE_REVEAL : 0, axis: null, dx: 0 };
  }
  function onPointerMove(e) {
    var d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    var mx = e.clientX - d.x, my = e.clientY - d.y;
    if (!d.axis) {
      if (Math.abs(mx) < 8 && Math.abs(my) < 8) return;
      d.axis = Math.abs(mx) > Math.abs(my) ? 'x' : 'y';
      if (d.axis === 'x') { rowRef.current.setPointerCapture(e.pointerId); setSwipe('drag'); }
    }
    if (d.axis !== 'x') return;
    d.dx = Math.min(0, Math.max(-SWIPE_REVEAL, d.from + mx));
    rowRef.current.style.setProperty('--swipe', d.dx + 'px');
  }
  function onPointerUp(e) {
    var d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    if (d.axis !== 'x') return;
    swallow.current = true;
    settle(d.dx < -SWIPE_REVEAL / 2);
  }
  function onPointerCancel() {
    var d = drag.current;
    drag.current = null;
    if (d && d.axis === 'x') settle(false);
  }
  // Le click qui suit un glissement n'ouvre pas la conversation : un toucher sur une ligne ouverte la referme.
  function onClickCapture(e) {
    if (swallow.current) swallow.current = false;
    else if (swipe === 'open' && e.target.closest('.conv')) settle(false);
    else return;
    e.preventDefault();
    e.stopPropagation();
  }
  return h('div', {
    ref: rowRef, className: cx('conv-row', menu && 'menu-open', swipe === 'drag' && 'dragging', swipe === 'open' && 'swiped'),
    onContextMenu: function (e) { e.preventDefault(); setMenu({ at: { x: e.clientX, y: e.clientY } }); },
    onPointerDown: onPointerDown, onPointerMove: onPointerMove, onPointerUp: onPointerUp, onPointerCancel: onPointerCancel, onClickCapture: onClickCapture
  },
    swipe ? h('div', { className: 'conv-swipe', style: { width: SWIPE_REVEAL } }, actions.map(function (a) {
      return h('button', { key: a.short, type: 'button', className: a.danger ? 'danger' : undefined, 'aria-label': a.label, onClick: function () { settle(false); a.onSelect(); } }, h(T.Icon, { name: a.icon, size: 16 }), a.short);
    })) : null,
    p.children,
    h('div', { className: 'conv-more' }, h(MenuButton, {
      label: 'Options for ' + n, size: 26, iconSize: 16, items: [viewProfileItem(app, n, null)].concat(actions), open: !!menu, at: menu && menu.at, align: menu && menu.at ? 'left' : undefined,
      onOpenChange: function (o) { setMenu(o ? { at: null } : null); }
    })));
}

/**
 * Ligne de la liste Chats avec ses actions de conversation.
 * @param {{name: string, current: string}} p Membre de la conversation et conversation ouverte.
 */
function ChatRow(p) {
  var app = useApp(), n = p.name;
  return h(SwipeRow, { name: n, actions: convActions(app, n) }, personRow(app.state, n, function () { app.nav({ view: 'dm', id: n }); }, p.current));
}

function FriendsList(p) {
  var app = useApp(), s = app.state;
  var a = useState(''), name = a[0], setName = a[1];
  var b = useState(''), err = b[0], setErr = b[1];
  var request = useFriendRequest();
  var friends = Object.keys(s.users).filter(function (n) { return n !== s.me && s.users[n].friend; }).sort(function (x, y) {
    var a = s.users[x], b = s.users[y], rank = statusRank(a.status);
    return rank - statusRank(b.status) || (rank === STATUS_ORDER.offline ? (b.lastOn || 0) - (a.lastOn || 0) : 0) || x.localeCompare(y);
  });
  var on = friends.filter(function (n) { return s.users[n].status !== 'offline'; });
  var off = friends.filter(function (n) { return s.users[n].status === 'offline'; });
  useProfiles(friends);
  function section(label, names) {
    return names.length ? h(Frag, null, h('h3', { className: 'mlabel' }, label + ' · ' + names.length),
      names.map(function (n) { return h(SwipeRow, { key: n, name: n, actions: friendActions(app, n) }, personRow(s, n, function () { app.actions.openDm(n, 'friends'); }, p.current)); })) : null;
  }
  function add(e) {
    e.preventDefault();
    var n = name.trim().toLowerCase();
    if (!/^[a-z0-9_-]{1,20}$/.test(n)) { setErr('Enter a Chatango username.'); return; }
    if (n === s.me) { setErr("You can't add yourself."); return; }
    if (s.users[n] && s.users[n].friend) { setErr(n + ' is already a friend.'); return; }
    setErr(''); setName('');
    request.add(n);
  }
  return h(Frag, null,
    h('form', { onSubmit: add, noValidate: true, style: { padding: '12px 12px 4px' } },
      h(T.TextField, {
        id: 'add-friend', label: 'Add a friend', placeholder: 'Username', value: name, error: err || undefined, autoComplete: 'off', onChange: function (e) { setName(e.target.value); setErr(''); },
        action: h(T.Button, { type: 'submit', disabled: !!request.pending }, request.pending ? 'Adding' : 'Add')
      })),
    h('div', { className: 'scroll', style: { padding: '0 8px 12px' } }, LIVE && !s.friendsLoaded ? h(SkeletonRows, { count: 5, avatar: 28, twoLines: true, label: 'Loading friends' })
      : friends.length
      ? h(Frag, null, section('Online', on), section('Offline', off))
      : h('p', { className: 'pal-empty' }, 'No friends yet. Add someone by username, or from their profile.')));
}
