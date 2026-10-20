/* ---------- Messages privés ---------- */
function DMView(p) {
  var app = useApp(), s = app.state, me = s.me, id = p.id;
  var a1 = useState('all'), tab = a1[0], setTab = a1[1];
  var a2 = useState(''), q = a2[0], setQ = a2[1];
  var a3 = useState(true), showProfile = a3[0], setShowProfile = a3[1];
  var logRef = useRef(null);
  var convo = id ? s.dms[id] : null;
  var len = convo ? convo.messages.length : 0;
  useLayoutEffect(function () { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [id, len]);

  var names = Object.keys(s.dms).filter(function (n) { return !s.dms[n].closed; }).sort(function (a, b) { return lastTs(s.dms[b]) - lastTs(s.dms[a]); });
  useProfiles(names);
  var reqCount = names.filter(function (n) { return s.dms[n].request; }).length;
  var unreadCount = names.filter(function (n) { return !s.dms[n].request && s.dms[n].unread; }).length;
  var shown = names.filter(function (n) {
    var c = s.dms[n];
    if (tab === 'requests' ? !c.request : c.request) return false;
    if (tab === 'unread' && !c.unread) return false;
    return !q || n.indexOf(q.toLowerCase()) >= 0;
  });

  var section = p.tab === 'friends' || p.tab === 'meet' ? p.tab : 'chats';
  var list = h('section', { className: 'convs', 'aria-label': 'Conversations' },
    h('div', { className: 'topbar', style: { padding: '0 12px 0 16px' } }, h(MobileNavButton, null), h('h1', { className: 'grow' }, 'Private messages'),
      h(T.IconButton, { icon: 'edit', label: 'New message', onClick: app.ui.openNewDm })),
    h('div', { style: { padding: '12px 12px 0' } }, h(T.SegmentedControl, {
      label: 'Show', block: true, value: section, onChange: function (v) { app.nav({ view: 'dm', id: id, tab: v === 'chats' ? undefined : v }); },
      options: [{ value: 'chats', label: 'Chats' }, { value: 'friends', label: 'Friends' }, { value: 'meet', label: 'Meet people' }]
    })),
    section === 'friends' ? h(FriendsList, { current: id }) : section === 'meet' ? h(MeetPeople, null) : h(Frag, null,
    h('div', { style: { padding: '12px 12px 8px', display: 'flex', flexDirection: 'column', gap: 10 } },
      h('label', { htmlFor: 'pm-search', className: 'tc-sr' }, 'Search conversations'),
      h('input', { id: 'pm-search', className: 'tc-input', style: { height: 34 }, type: 'search', placeholder: 'Search conversations', value: q, onChange: function (e) { setQ(e.target.value); } }),
      h('div', { className: 'tabs', role: 'group', 'aria-label': 'Filter conversations' },
        [['all', 'All'], ['unread', 'Unread' + (unreadCount ? ' · ' + unreadCount : '')], ['requests', 'Requests' + (reqCount ? ' · ' + reqCount : '')]].map(function (t) {
          return h('button', { key: t[0], type: 'button', className: 'tab', 'aria-pressed': String(tab === t[0]), onClick: function () { setTab(t[0]); } }, t[1]);
        }))),
    h('div', { className: 'scroll', style: { padding: '0 8px 12px' } },
      shown.length ? shown.map(function (n) {
        return h('div', { key: n, className: 'conv-row' },
          personRow(s, n, function () { app.nav({ view: 'dm', id: n }); }, id),
          h(T.IconButton, { icon: 'x', label: 'Close conversation', size: 26, iconSize: 14, className: 'conv-close', onClick: function () { app.actions.closeDm(n); } }));
      }) : h('p', { className: 'pal-empty' }, tab === 'requests' ? 'No message requests.' : q ? 'No conversation matches.' : 'No conversations yet.'))));

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
      var cont = prev && prev.from === m.from && m.ts - prev.ts < 5 * MIN;
      var time = fmtTime(m.ts, s.prefs.h24);
      var ms = memberStyles(userOf(s, m.from).style || {}, s.prefs.styles, app.theme, false);
      var content = h(MessageContent, { m: m, style: ms.text });
      rows.push(cont
        ? h('article', { key: m.id, className: 'tc-msg tc-msg-cont', style: ms.row }, h('span', { className: 'tc-msg-gutter' }, time), h('div', { className: 'tc-msg-body' }, content))
        : h('article', { key: m.id, className: 'tc-msg', style: Object.assign({ marginTop: 6 }, ms.row) },
          h(T.Avatar, { name: m.from }),
          h('div', { className: 'tc-msg-body' }, h('div', { className: 'tc-msg-head' }, h('span', { className: 'tc-msg-author', style: ms.name }, m.from), h('time', { className: 'tc-msg-time' }, time)), content)));
      prev = m;
    });
    var lastMsg = convo.messages[convo.messages.length - 1];
    if (lastMsg && lastMsg.from === me && convo.seenTs && s.prefs.privacy.showIdle) rows.push(h('p', { key: 'seen', className: 'seen' }, 'Seen ' + fmtTime(convo.seenTs, s.prefs.h24)));
    var bottom;
    if (u.blocked) bottom = h('div', { className: 'notice' }, h(T.Icon, { name: 'ban', size: 16 }), h('span', { className: 'grow' }, 'You blocked ' + id + '. Unblock them to send messages.'), h(T.Button, { size: 'sm', onClick: function () { app.actions.toggleUser(id, 'blocked'); } }, 'Unblock'));
    else if (convo.request) bottom = h('div', { className: 'notice' }, h(T.Icon, { name: 'info', size: 16 }), h('span', { className: 'grow' }, id + " isn't on your friends list. Accept to reply, or decline to remove the conversation."),
      h(T.Button, { size: 'sm', variant: 'ghost', onClick: function () { app.actions.declineRequest(id); } }, 'Decline'),
      h(T.Button, { size: 'sm', variant: 'primary', onClick: function () { app.update(function (d) { d.dms[id].request = false; }); app.ui.toast('Request accepted.'); } }, 'Accept'));
    else bottom = h(T.Composer, { key: id, placeholder: 'Message ' + id, onSend: function (text) { app.actions.sendDm(id, text); }, tools: false });
    thread = h('main', { className: 'thread' },
      h('header', { className: 'topbar' },
        h(T.IconButton, { icon: 'arrow-left', label: 'Back to conversations', className: 'only-mobile', onClick: function () { app.nav({ view: 'dm', id: null, tab: p.tab }); } }),
        h(T.Avatar, { name: id, size: 30, status: u.status, ring: 'var(--bg)' }),
        h('h2', null, id),
        h('span', { className: 'topic', style: { flex: 1 } }, [statusLabel(u.status), u.friend ? 'Friend' : null].filter(Boolean).join(' · ')),
        h('span', { className: 'topic dm-meta', style: { flex: 1 } }, personMeta(u)),
        h(T.IconButton, { icon: 'panel', label: showProfile ? 'Hide profile' : 'Show profile', pressed: showProfile, className: 'hide-mobile', onClick: function () { setShowProfile(!showProfile); } }),
        h(MenuButton, {
          label: 'Conversation options', items: [
            { label: 'View profile', icon: 'users', onSelect: function () { app.ui.openProfile(id, null); } },
            { label: u.friend ? 'Remove friend' : 'Add friend', icon: u.friend ? 'user-minus' : 'user-plus', onSelect: function () { app.actions.toggleUser(id, 'friend'); } },
            { divider: true },
            { label: 'Close conversation', icon: 'x', onSelect: function () { app.actions.closeDm(id); } },
            { label: 'Delete conversation…', icon: 'trash', danger: true, onSelect: function () { app.ui.confirm({ title: 'Delete this conversation?', body: LIVE ? 'Removes the copy Torch keeps in this browser. Chatango does not store private messages, and ' + id + ' keeps their copy.' : 'Messages with ' + id + ' are removed from your account. ' + id + ' keeps their copy.', confirmLabel: 'Delete', danger: true, onConfirm: function () { app.actions.deleteDm(id); } }); } }
          ]
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

var STATUS_ORDER = { online: 0, idle: 1, offline: 2 };
function statusRank(st) { return st in STATUS_ORDER ? STATUS_ORDER[st] : 2; }
function personMeta(u) {
  return [statusLabel(u.status), u.age || null, u.gender && u.gender !== 'Not specified' ? u.gender : null, u.location || null].filter(Boolean).join(' · ');
}
function useProfiles(names) {
  var app = useApp();
  useEffect(function () { app.actions.loadProfiles(names); }, [names.join(',')]);
}
function personRow(s, n, onClick, current) {
  var u = userOf(s, n), c = s.dms[n], last = c && c.messages[c.messages.length - 1];
  return h('button', { key: n, type: 'button', className: cx('conv', c && c.unread && 'unread'), 'aria-current': current === n ? 'page' : undefined, onClick: onClick },
    h(T.Avatar, { name: n, size: 36, status: u.status, ring: 'var(--panel)' }),
    h('span', { className: 'conv-main' },
      h('span', { className: 'conv-top' }, h('span', { className: 'conv-name' }, n), last ? h('time', { className: 'tc-msg-time' }, shortWhen(last.ts, s.prefs.h24)) : null),
      h('span', { className: 'conv-meta' }, personMeta(u)),
      c ? h('span', { style: { display: 'flex', alignItems: 'center', gap: 8 } },
        h('span', { className: 'conv-prev grow' }, last ? (last.from === s.me ? 'You: ' : '') + messagePreview(last) : 'No messages yet'),
        c.unread ? h('span', { className: 'udot', 'aria-label': 'Unread' }) : null) : null));
}

function FriendsList(p) {
  var app = useApp(), s = app.state;
  var a = useState(''), name = a[0], setName = a[1];
  var b = useState(''), err = b[0], setErr = b[1];
  var friends = Object.keys(s.users).filter(function (n) { return n !== s.me && s.users[n].friend; }).sort(function (x, y) {
    return statusRank(s.users[x].status) - statusRank(s.users[y].status) || x.localeCompare(y);
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
    app.actions.toggleUser(n, 'friend');
  }
  return h(Frag, null,
    h('form', { onSubmit: add, noValidate: true, style: { padding: '12px 12px 4px', display: 'flex', alignItems: 'flex-end', gap: 8 } },
      h('div', { style: { flex: 1 } }, h(T.TextField, { id: 'add-friend', label: 'Add a friend', placeholder: 'Username', value: name, error: err || undefined, autoComplete: 'off', onChange: function (e) { setName(e.target.value); setErr(''); } })),
      h(T.Button, { type: 'submit', style: { height: 38 } }, 'Add')),
    h('p', { className: 'mlabel', style: { margin: '8px 16px 4px' } }, online + ' online · ' + plural(friends.length, 'friend', 'friends')),
    h('div', { className: 'scroll', style: { padding: '0 8px 12px' } }, friends.length
      ? friends.map(function (n) { return personRow(s, n, function () { app.actions.openDm(n, 'friends'); }, p.current); })
      : h('p', { className: 'pal-empty' }, 'No friends yet. Add someone by username, or from their profile.')));
}
