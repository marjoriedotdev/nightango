/* ---------- Messages privés ---------- */
function DMView(p) {
  var app = useApp(), s = app.state, me = s.me, id = p.id;
  var a1 = useState('all'), tab = a1[0], setTab = a1[1];
  var a2 = useState(''), q = a2[0], setQ = a2[1];
  var a3 = useState(true), showProfile = a3[0], setShowProfile = a3[1];
  var logRef = useRef(null);
  var convo = id ? s.dms[id] : null;
  var len = convo ? convo.messages.length : 0;
  var personActions = useProfileActions(id, null);
  useLayoutEffect(function () { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [id, len]);

  var names = Object.keys(s.dms).filter(function (n) { return !s.dms[n].closed; }).sort(function (a, b) { return lastTs(s.dms[b]) - lastTs(s.dms[a]); });
  useProfiles(names);
  var reqCount = names.filter(function (n) { return s.dms[n].request; }).length;
  var shown = names.filter(function (n) {
    var c = s.dms[n];
    if (tab === 'requests' ? !c.request : c.request) return false;
    if (tab === 'unread' && !c.unread) return false;
    return !q || n.indexOf(q.toLowerCase()) >= 0;
  });

  var filters = [['all', 'All'], ['unread', 'Unread']];
  // Ni Chatango ni Torch ne connaissent de demande de MP
  if (!LIVE) filters.push(['requests', 'Requests' + (reqCount ? ' · ' + reqCount : '')]);
  var section = p.tab === 'friends' || p.tab === 'meet' ? p.tab : 'chats';
  var list = h('section', { className: 'convs', 'aria-label': 'Conversations' },
    h('header', { className: 'topbar col-head' }, h(MobileNavButton, null), h('h1', { className: 'grow' }, 'Private messages'),
      h(T.IconButton, { icon: 'edit', label: 'New message', onClick: app.ui.openNewDm })),
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
      LIVE && !s.pmLoaded ? h(SkeletonRows, { count: 5, avatar: 28, twoLines: true, label: 'Loading conversations' })
      : shown.length ? shown.map(function (n) { return h(ChatRow, { key: n, name: n, current: id }); }) : h('p', { className: 'pal-empty' }, tab === 'requests' ? 'No message requests.' : q ? 'No conversation matches.' : 'No conversations yet.'))));

  var thread;
  if (!convo) {
    thread = h('main', { className: 'thread' }, h('div', { className: 'empty' },
      h(T.Icon, { name: 'message', size: 28, strokeWidth: 1.6 }), h('h2', null, 'Select a conversation'),
      h('p', { style: { margin: 0 } }, 'Or start a new one with a friend or someone from a group.'),
      h(T.Button, { variant: 'primary', icon: 'edit', onClick: app.ui.openNewDm }, 'New message')));
  } else {
    var u = userOf(s, id);
    var typing = (s.typing['dm:' + id] || []).length > 0;
    var rows = [], prev = null, lastDay = null;
    convo.messages.forEach(function (m) {
      var dk = dayKey(m.ts);
      if (dk !== lastDay) { rows.push(h(T.DayDivider, { key: 'd' + m.id }, dayLabel(m.ts))); lastDay = dk; prev = null; }
      rows.push(h(DmMessageRow, { key: m.id, m: m, continued: !!prev && prev.from === m.from && m.ts - prev.ts < 5 * MIN }));
      prev = m;
    });
    var lastMsg = convo.messages[convo.messages.length - 1];
    if (lastMsg && lastMsg.from === me && convo.seenTs && s.prefs.privacy.showIdle) rows.push(h('p', { key: 'seen', className: 'seen' }, 'Seen ' + fmtTime(convo.seenTs, s.prefs.h24)));
    var bottom;
    if (u.blocked) bottom = h('div', { className: 'notice' }, h(T.Icon, { name: 'user-x', size: 16 }), h('span', { className: 'grow' }, 'You blocked ' + id + '. Unblock them to send messages.'), h(T.Button, { size: 'sm', onClick: function () { app.actions.toggleUser(id, 'blocked'); } }, 'Unblock'));
    else if (convo.request) bottom = h('div', { className: 'notice' }, h(T.Icon, { name: 'info', size: 16 }), h('span', { className: 'grow' }, id + " isn't on your friends list. Accept to reply, or decline to remove the conversation."),
      h(T.Button, { size: 'sm', variant: 'ghost', onClick: function () { app.actions.declineRequest(id); } }, 'Decline'),
      h(T.Button, { size: 'sm', variant: 'primary', onClick: function () { app.update(function (d) { d.dms[id].request = false; }); } }, 'Accept'));
    else bottom = h(T.Composer, { key: id, placeholder: 'Message ' + id, onSend: function (text) { if (!runCommand(app, text, null)) app.actions.sendDm(id, text); }, beforeSend: h(MessageStyleButton, null) });
    thread = h('main', { className: 'thread' },
      h('header', { className: 'topbar' },
        h(T.IconButton, { icon: 'arrow-left', label: 'Back to conversations', className: 'only-mobile', onClick: function () { app.nav({ view: 'dm', id: null, tab: p.tab }); } }),
        h(T.Avatar, { name: id, size: 30, status: u.status, ring: 'var(--bg)' }),
        h('h2', null, id),
        h('span', { className: 'topic', style: { flex: 1 } }, personStatus(s, id, null)),
        h('span', { className: 'topic dm-meta', style: { flex: 1 } }, [presenceText(u), personAsl(s, id)].filter(Boolean).join(' · ')),
        h(T.IconButton, { icon: 'panel', label: showProfile ? 'Hide profile' : 'Show profile', pressed: showProfile, className: 'hide-mobile', onClick: function () { setShowProfile(!showProfile); } }),
        h(MenuButton, {
          label: 'Conversation options', items: [viewProfileItem(app, id, null)].concat(personActions, [{ divider: true }], convActions(app, id))
        })),
      h('div', { className: 'log', role: 'log', 'aria-label': 'Messages with ' + id, ref: logRef }, h('div', { className: 'log-inner' }, rows)),
      h('div', { className: 'composer-wrap' },
        h('p', { className: 'typing', 'aria-live': 'polite' }, typing ? h(Frag, null, h('span', { className: 'dots', 'aria-hidden': 'true' }, h('i'), h('i'), h('i')), h('b', null, id), ' is typing') : null),
        bottom));
  }
  return h('div', { className: 'main', style: { flexDirection: 'row' } },
    h('div', { className: cx('dm-split', id && 'has-thread') }, list, thread),
    convo && showProfile ? h(ProfilePanel, { name: id }) : null);
}

/**
 * Ligne d'un message privé avec son menu d'actions locales, sans Reply faute de trame sourcée.
 * @param {{m: Object, continued: boolean}} p Message et suite du message précédent du même auteur.
 */
function DmMessageRow(p) {
  var app = useApp(), s = app.state, m = p.m;
  var st = useState(false), menuOpen = st[0], setMenuOpen = st[1];
  var ms = memberStyles(userOf(s, m.from), s.prefs.styles, app.theme, false);
  var items = [copyTextItem(app, m), m.from !== s.me ? viewProfileItem(app, m.from, null) : null];
  return h(T.Message, {
    compact: s.prefs.density === 'compact', continued: p.continued, time: fmtTime(m.ts, s.prefs.h24),
    avatar: h(Person, { name: m.from, avatarOnly: true }), author: authorName(m.from, ms.name), style: ms.row,
    actions: moreActionsButton(items, setMenuOpen), className: cx(menuOpen && 'menu-open')
  }, h(MessageContent, { m: m, style: ms.text, plain: ms.plain }));
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
 * Permet de lister les actions de fermeture et de suppression d'une conversation.
 * @param {Object} app Contexte de l'application.
 * @param {string} name Membre de la conversation.
 */
function convActions(app, name) {
  return [
    { label: 'Close conversation', short: 'Close', icon: 'x', onSelect: function () { app.actions.closeDm(name); } },
    { label: 'Delete conversation…', short: 'Delete', icon: 'trash', danger: true, onSelect: function () {
      app.ui.confirm({ title: 'Delete this conversation?', body: LIVE ? 'Removes the copy Torch keeps in this browser. Chatango does not store private messages, and ' + name + ' keeps their copy.' : 'Messages with ' + name + ' are removed from your account. ' + name + ' keeps their copy.', confirmLabel: 'Delete', danger: true, onConfirm: function () { app.actions.deleteDm(name); } });
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
 * Ligne de liste avec ses actions par balayage et son menu.
 * @param {{name: string, actions: Array, children: *}} p Membre de la ligne, actions de la ligne et bouton principal.
 */
function SwipeRow(p) {
  var n = p.name, actions = p.actions;
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
      label: 'Options for ' + n, size: 26, iconSize: 16, items: actions, open: !!menu, at: menu && menu.at, align: menu && menu.at ? 'left' : undefined,
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
  var online = friends.filter(function (n) { return s.users[n].status !== 'offline'; }).length;
  useProfiles(friends);
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
    LIVE && !s.friendsLoaded ? null : h('p', { className: 'mlabel', style: { margin: '8px 16px 4px' } }, online + ' online · ' + plural(friends.length, 'friend', 'friends')),
    h('div', { className: 'scroll', style: { padding: '0 8px 12px' } }, LIVE && !s.friendsLoaded ? h(SkeletonRows, { count: 5, avatar: 28, twoLines: true, label: 'Loading friends' })
      : friends.length
      ? friends.map(function (n) { return h(SwipeRow, { key: n, name: n, actions: friendActions(app, n) }, personRow(s, n, function () { app.actions.openDm(n, 'friends'); }, p.current)); })
      : h('p', { className: 'pal-empty' }, 'No friends yet. Add someone by username, or from their profile.')));
}
