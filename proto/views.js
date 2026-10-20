/* ---------- Connexion ---------- */
function Login() {
  var app = useApp();
  var s1 = useState('login'), mode = s1[0], setMode = s1[1];
  var s2 = useState('orrin'), user = s2[0], setUser = s2[1];
  var s3 = useState(''), pass = s3[0], setPass = s3[1];
  var s4 = useState(''), email = s4[0], setEmail = s4[1];
  var s5 = useState(false), agree = s5[0], setAgree = s5[1];
  var s6 = useState({}), errors = s6[0], setErrors = s6[1];
  var s7 = useState(false), sent = s7[0], setSent = s7[1];
  var s8 = useState(false), busy = s8[0], setBusy = s8[1];

  function switchMode(m) { setMode(m); setErrors({}); setSent(false); }
  function submit(e) {
    e.preventDefault();
    var err = {};
    if (mode === 'forgot') {
      if (!/^\S+@\S+\.\S+$/.test(email)) err.email = 'Enter the email on your Chatango account.';
      setErrors(err);
      if (!err.email) setSent(true);
      return;
    }
    if (!/^[a-z0-9]{3,20}$/i.test(user)) err.user = 'Use 3 to 20 letters or numbers.';
    if (mode === 'login' && !pass) err.pass = 'Enter your password.';
    if (mode === 'signup') {
      if (pass.length < 8) err.pass = 'Use at least 8 characters.';
      if (!/^\S+@\S+\.\S+$/.test(email)) err.email = 'Enter a valid email address.';
      if (!agree) err.agree = 'Agree to the terms to create an account.';
    }
    setErrors(err);
    if (Object.keys(err).length) return;
    setBusy(true);
    setTimeout(function () { app.actions.login(user.toLowerCase(), pass); }, 450);
  }
  var tabs = mode === 'forgot' ? null : h(T.SegmentedControl, {
    label: 'Account', block: true, value: mode, onChange: switchMode,
    options: [{ value: 'login', label: 'Log in' }, { value: 'signup', label: 'Sign up' }]
  });
  var form;
  if (mode === 'forgot') {
    form = sent
      ? h(Frag, null,
        h('div', null, h('h2', null, 'Check your inbox'), h('p', { className: 'muted' }, 'If ' + email + ' matches a Chatango account, Chatango sends a reset link to it. In this prototype no email is sent.')),
        h(T.Button, { variant: 'primary', size: 'lg', block: true, onClick: function () { switchMode('login'); } }, 'Back to log in'))
      : h(Frag, null,
        h(T.Button, { variant: 'ghost', size: 'sm', icon: 'arrow-left', onClick: function () { switchMode('login'); }, style: { alignSelf: 'flex-start', paddingLeft: 4 } }, 'Back to log in'),
        h('div', null, h('h2', null, 'Reset your password'), h('p', { className: 'muted' }, 'Enter the email on your Chatango account. Chatango will send you a reset link.')),
        h(T.TextField, { id: 'fg-email', label: 'Email', type: 'email', autoComplete: 'email', value: email, error: errors.email, onChange: function (e) { setEmail(e.target.value); } }),
        h(T.Button, { type: 'submit', variant: 'primary', size: 'lg', block: true }, 'Send reset link'));
  } else {
    form = h(Frag, null,
      h('div', null,
        h('h2', null, mode === 'login' ? 'Welcome back' : 'Create a Chatango account'),
        h('p', { className: 'muted' }, mode === 'login' ? 'Log in with your Chatango account.' : 'It works on chatango.com and in Torch.')),
      mode === 'signup' ? h(T.TextField, { id: 'su-email', label: 'Email', type: 'email', autoComplete: 'email', value: email, error: errors.email, onChange: function (e) { setEmail(e.target.value); } }) : null,
      h(T.TextField, { id: 'lg-user', label: 'Username', autoComplete: 'username', value: user, error: errors.user, hint: mode === 'signup' ? "Letters and numbers, up to 20 characters. It can't be changed later." : undefined, onChange: function (e) { setUser(e.target.value); } }),
      h(T.TextField, {
        id: 'lg-pass', label: 'Password', type: 'password', autoComplete: mode === 'login' ? 'current-password' : 'new-password', value: pass, error: errors.pass,
        hint: mode === 'login' ? 'Demo account. Any password works.' : undefined, onChange: function (e) { setPass(e.target.value); },
        labelAside: mode === 'login' ? h('button', { type: 'button', className: 'linkbtn', style: { fontSize: 13 }, onClick: function () { switchMode('forgot'); } }, 'Forgot password?') : null
      }),
      mode === 'login'
        ? h(T.Checkbox, { label: 'Keep me signed in', defaultChecked: true })
        : h('div', { className: 'tc-field' },
          h(T.Checkbox, { label: 'I agree to the Terms of Service and the Privacy Policy', checked: agree, onChange: function (e) { setAgree(e.target.checked); } }),
          errors.agree ? h('span', { className: 'tc-error' }, errors.agree) : null),
      h(T.Button, { type: 'submit', variant: 'primary', size: 'lg', block: true, disabled: busy }, busy ? 'Signing in' : mode === 'login' ? 'Log in' : 'Create account'));
  }
  return h('div', { className: 'login' },
    h('section', { className: 'login-aside', 'aria-label': 'About Torch' },
      h('div', { className: 'brand', style: { padding: 0 } }, h('span', { className: 'brand-mark', style: { width: 32, height: 32, borderRadius: 8 } }, h(T.Icon, { name: 'flame', size: 18, strokeWidth: 2.2 })), h('span', { className: 'brand-name', style: { fontSize: 17 } }, 'Torch')),
      h('div', null,
        h('h1', null, 'A cleaner client for Chatango.'),
        h('p', { className: 'muted', style: { margin: '0 0 32px', fontSize: 15, color: 'var(--text-2)' } }, 'Same account, same groups. Fewer bugs and the tools Chatango never shipped.'),
        h('ul', null,
          [['Replies and mentions', 'Reply to a specific message and see who mentioned you.'], ['Block users inside groups', 'Hide someone everywhere, not only in private messages.'], ['Moderation that scales', 'AutoMod, roles and an audit log for group staff.']].map(function (f) {
            return h('li', { key: f[0] }, h(T.Icon, { name: 'check', size: 18, strokeWidth: 2.2 }), h('span', null, h('strong', null, f[0]), h('span', null, f[1])));
          }))),
      h('p', { className: 'muted', style: { margin: 0, fontSize: 13 } }, 'Free and open source under the MIT license. ', h('a', { href: 'https://github.com/Vissle-Drissle/Torch-Client', target: '_blank', rel: 'noopener noreferrer' }, 'View the source'))),
    h('section', { className: 'login-main', 'aria-label': 'Account' },
      h('form', { className: 'login-form', onSubmit: submit, noValidate: true }, tabs, form,
        h(T.Banner, { icon: 'lock' }, 'Torch signs in to Chatango on your behalf. To keep you signed in, your credentials are stored encrypted on Torch servers.')),
      h('div', { className: 'login-foot' },
        h('span', { className: 'mono' }, 'v' + APP_VERSION), h('span', null, 'Prototype with simulated data'),
        h('label', { htmlFor: 'lg-lang', style: { display: 'inline-flex', alignItems: 'center', gap: 6 } }, h(T.Icon, { name: 'globe', size: 14 }), h('span', { className: 'tc-sr' }, 'Language'),
          h('select', { id: 'lg-lang', defaultValue: 'en-US' }, h('option', { value: 'en-US' }, 'English (US)'), h('option', { value: 'en-GB' }, 'English (UK)'), h('option', { value: 'id' }, 'Bahasa Indonesia'), h('option', { value: 'pl' }, 'Polski'))))));
}

/* ---------- Coque de l'application ---------- */
function MobileNavButton() {
  var app = useApp();
  return h(T.IconButton, { icon: 'menu', label: 'Open navigation', className: 'only-mobile', onClick: app.ui.openNav });
}

function Shell() {
  var app = useApp(), r = app.state.route, main;
  if (r.view === 'settings') return h(SettingsView, { page: r.page });
  if (r.view === 'gsettings') return h(GroupSettingsView, { key: r.id, gid: r.id, page: r.page });
  if (r.view === 'group') main = h(GroupView, { key: r.id, gid: r.id });
  else if (r.view === 'dm') main = h(DMView, { id: r.id, tab: r.tab });
  else main = h(Discover, null);
  return h('div', { className: cx('shell', app.navOpen && 'nav-open') },
    h(Sidebar, null),
    h('div', { className: 'scrim', onClick: app.ui.closeNav }),
    main);
}

function Sidebar() {
  var app = useApp(), s = app.state, r = s.route;
  var joined = Object.keys(s.groups).map(function (k) { return s.groups[k]; }).filter(function (g) { return g.joined; });
  var favs = joined.filter(function (g) { return g.favorite; }), rest = joined.filter(function (g) { return !g.favorite; });
  var dmNames = Object.keys(s.dms).filter(function (n) { return !s.dms[n].request && !s.dms[n].closed; })
    .sort(function (a, b) { return lastTs(s.dms[b]) - lastTs(s.dms[a]); }).slice(0, 4);
  function toggle(k) { app.update(function (d) { d.sections[k] = !d.sections[k]; }); }
  function groupItem(g) {
    var isC = g.id === 'community';
    return h(T.NavItem, {
      key: g.id, label: g.id, active: r.view === 'group' && r.id === g.id, unread: g.unread > 0 && !g.muted,
      count: g.mentions || 0, mention: !!g.mentions, muted: g.muted && !g.mentions,
      avatar: h(T.Avatar, { name: g.id, square: true, size: 22, color: isC ? 'var(--accent)' : undefined, style: isC ? { color: 'var(--on-accent)' } : null }),
      onClick: function () { app.nav({ view: 'group', id: g.id }); }
    });
  }
  function section(key, label, items) {
    return h(Frag, { key: key },
      h('button', { type: 'button', className: 'sec-label', 'aria-expanded': String(!!s.sections[key]), onClick: function () { toggle(key); } }, h(T.Icon, { name: 'chevron-down', size: 12, strokeWidth: 2.4 }), label),
      s.sections[key] ? items : null);
  }
  var meUser = userOf(s, s.me);
  var onlineFriends = Object.keys(s.users).filter(function (n) { return n !== s.me && s.users[n].friend && s.users[n].status !== 'offline'; }).length;
  return h('nav', { className: 'sidebar', 'aria-label': 'Groups and messages' },
    h('div', { className: 'brand' },
      h('span', { className: 'brand-mark' }, h(T.Icon, { name: 'flame', size: 16, strokeWidth: 2.2 })),
      h('span', { className: 'brand-name' }, 'Torch'),
      h(MenuButton, {
        icon: 'plus', label: 'Join or create a group', items: [
          { label: 'Discover groups', icon: 'compass', onSelect: function () { app.nav({ view: 'discover' }); } },
          { label: 'Create a group', icon: 'plus', onSelect: function () { app.ui.openCreate(''); } },
          { label: 'New private message', icon: 'message', onSelect: function () { app.ui.openNewDm(); } }
        ]
      })),
    h('div', { style: { padding: '0 10px 8px' } },
      h('button', { type: 'button', className: 'searchbtn', onClick: app.ui.openPalette },
        h(T.Icon, { name: 'search', size: 15 }), h('span', { className: 'grow', style: { textAlign: 'left' } }, 'Search or jump to'), h('kbd', { className: 'kbd hide-mobile' }, 'Ctrl K'))),
    h('div', { className: 'navlist' },
      h(T.NavItem, { icon: 'compass', label: 'Discover groups', active: r.view === 'discover', onClick: function () { app.nav({ view: 'discover' }); } }),
      h(T.NavItem, { icon: 'message', label: 'Private messages', active: r.view === 'dm' && !r.tab, count: dmUnreadTotal(s), onClick: function () { app.nav({ view: 'dm', id: null }); } }),
      h(T.NavItem, { icon: 'users', label: 'Friends', active: r.view === 'dm' && r.tab === 'friends', trailing: onlineFriends ? h('span', { className: 'tc-msg-time' }, onlineFriends + ' online') : null, onClick: function () { app.nav({ view: 'dm', id: null, tab: 'friends' }); } }),
      h(T.NavItem, { icon: 'search', label: 'Meet people', active: r.view === 'dm' && r.tab === 'meet', onClick: function () { app.nav({ view: 'dm', id: null, tab: 'meet' }); } }),
      favs.length ? section('favorites', 'Favorites', favs.map(groupItem)) : null,
      section('groups', 'Groups', rest.length ? rest.map(groupItem) : h('p', { className: 'muted', style: { margin: '4px 10px', fontSize: 13 } }, 'Join a group from Discover.')),
      section('dms', 'Private messages', dmNames.map(function (n) {
        var u = userOf(s, n), c = s.dms[n];
        return h(T.NavItem, {
          key: n, label: n, active: r.view === 'dm' && r.id === n, unread: c.unread > 0, count: c.unread || 0,
          avatar: h(T.Avatar, { name: n, size: 22, status: u.status, ring: 'var(--sidebar)' }),
          onClick: function () { app.nav({ view: 'dm', id: n }); }
        });
      }))),
    h('div', { className: 'me' },
      h(MenuButton, {
        up: true, align: 'left', items: [
          { label: 'Online', swatch: 'var(--status-online)', checked: s.meStatus === 'online', onSelect: function () { app.actions.setStatus('online'); } },
          { label: 'Idle', swatch: 'var(--status-idle)', checked: s.meStatus === 'idle', onSelect: function () { app.actions.setStatus('idle'); } },
          { divider: true },
          { label: 'Edit profile', icon: 'edit', onSelect: function () { app.nav({ view: 'settings', page: 'profile' }); } },
          { label: 'Log out', icon: 'log-out', danger: true, onSelect: app.actions.logout }
        ],
        renderTrigger: function (tp) {
          return h('button', Object.assign({ type: 'button', className: 'me-btn', 'aria-label': 'Your status: ' + statusLabel(s.meStatus) }, tp),
            h(T.Avatar, { name: s.me, size: 32, status: s.meStatus, ring: 'var(--sidebar)' }),
            h('span', { className: 'me-text' }, h('span', { style: { fontWeight: 600, fontSize: 13 } }, s.me), h('span', { style: { fontSize: 12, color: 'var(--text-3)' } }, statusLabel(s.meStatus))));
        }
      }),
      h(T.IconButton, { icon: 'sliders', label: 'Settings', onClick: function () { app.nav({ view: 'settings', page: 'appearance' }); } })));
}
function lastTs(c) { return c.messages.length ? c.messages[c.messages.length - 1].ts : 0; }

/* ---------- Groupe ---------- */
function GroupView(p) {
  var app = useApp(), s = app.state, g = s.groups[p.gid], prefs = s.prefs, me = s.me;
  var a1 = useState(true), showMembers = a1[0], setShowMembers = a1[1];
  var a2 = useState(null), search = a2[0], setSearch = a2[1];
  var a3 = useState(null), replyTo = a3[0], setReplyTo = a3[1];
  var a4 = useState('none'), channel = a4[0], setChannel = a4[1];
  var a5 = useState({}), expanded = a5[0], setExpanded = a5[1];
  var a6 = useState({}), revealed = a6[0], setRevealed = a6[1];
  var a7 = useState(false), jump = a7[0], setJump = a7[1];
  var logRef = useRef(null), atBottom = useRef(true);
  var count = g ? g.messages.length : 0;
  useLayoutEffect(function () {
    var el = logRef.current; if (!el) return;
    if (atBottom.current) el.scrollTop = el.scrollHeight; else setJump(true);
  }, [count, !!search]);
  if (!g) return h('main', { className: 'main' }, h('div', { className: 'empty' }, h('h2', null, 'This group is gone'), h(T.Button, { onClick: function () { app.nav({ view: 'discover' }); } }, 'Discover groups')));

  var myRole = roleOf(g, me), staff = isStaffRole(myRole);
  var lp = LIVE ? livePerms(g, me) : null;
  var canClose = LIVE ? lp.closeGroup : canManage(g, me), canBroadcast = LIVE ? lp.broadcast : staff;
  var online = LIVE && g.liveCount ? g.liveCount : g.members.filter(function (n) { return userOf(s, n).status !== 'offline' || n === me; }).length;
  var typing = (s.typing[g.id] || []).filter(function (n) { return n !== me; });
  var ann = g.settings.announcement;
  var q = search ? search.trim().toLowerCase() : '';

  function onScroll() {
    var el = logRef.current;
    atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
    if (atBottom.current && jump) setJump(false);
  }
  function toBottom() { var el = logRef.current; atBottom.current = true; el.scrollTop = el.scrollHeight; setJump(false); }

  var items = [], prev = null, lastDay = null, marker = false;
  var msgs = q ? g.messages.filter(function (m) { return m.kind === 'msg' && !m.deleted && (m.text.toLowerCase().indexOf(q) >= 0 || m.author.indexOf(q) >= 0); }) : g.messages;
  for (var i = 0; i < msgs.length; i++) {
    var m = msgs[i], dk = dayKey(m.ts);
    if (dk !== lastDay) { items.push(h(T.DayDivider, { key: 'd' + m.id }, dayLabel(m.ts))); lastDay = dk; prev = null; }
    if (!q && prefs.markNew && !marker && s.route.markerTs && m.ts > s.route.markerTs && m.author !== me && m.kind === 'msg') {
      items.push(h('div', { key: 'n' + m.id, className: 'newmark', role: 'separator' }, 'New messages')); marker = true; prev = null;
    }
    if (m.kind === 'event') {
      var evs = [m];
      while (i + 1 < msgs.length && msgs[i + 1].kind === 'event' && dayKey(msgs[i + 1].ts) === dk) evs.push(msgs[++i]);
      items.push(h(EventRow, { key: 'e' + m.id, events: evs, open: !!expanded[m.id], onToggle: (function (id) { return function () { setExpanded(function (x) { var o = Object.assign({}, x); o[id] = !o[id]; return o; }); }; })(m.id) }));
      prev = null; continue;
    }
    if (m.kind === 'system') { items.push(h('div', { key: m.id, className: 'ev' }, h(T.Icon, { name: 'info', size: 14 }), m.text)); prev = null; continue; }
    var u = userOf(s, m.author);
    if ((u.ignored || (u.blocked && prefs.safety.syncBlocked)) && m.author !== me) {
      if (prefs.safety.ignoreMode === 'hide') continue;
      if (!revealed[m.id]) {
        items.push(h('div', { key: m.id, className: 'ignored-row' }, h(T.Icon, { name: 'eye-off', size: 14 }), 'Message from ' + m.author + ' hidden.',
          h('button', { type: 'button', className: 'linkbtn', onClick: (function (id) { return function () { setRevealed(function (x) { var o = Object.assign({}, x); o[id] = true; return o; }); }; })(m.id) }, 'Show')));
        prev = null; continue;
      }
    }
    var cont = !!(prev && prev.author === m.author && !m.replyTo && m.ts - prev.ts < 5 * MIN && !m.deleted && !prev.deleted);
    items.push(h(MessageRow, { key: m.id, m: m, g: g, continued: cont, onReply: setReplyTo }));
    prev = m;
  }
  if (LIVE && !q) items.unshift(g.historyDone
    ? h('div', { key: 'top', className: 'ev' }, h(T.Icon, { name: 'info', size: 14 }), 'This is the beginning of the history Chatango keeps for #' + g.id + '.')
    : h('div', { key: 'top', className: 'ev' }, h('button', { type: 'button', className: 'linkbtn', onClick: function () { atBottom.current = false; app.actions.loadMore(g.id); } }, 'Load earlier messages')));
  if (q && !items.length) items.push(h('div', { key: 'none', className: 'empty' }, h('h2', null, 'No messages match'), h('p', null, 'Search looks at loaded messages in #' + g.id + '.')));

  var composer;
  if (g.closed) {
    composer = h('div', { className: 'notice' }, h(T.Icon, { name: 'lock', size: 16 }), h('span', { className: 'grow' }, 'This group is closed. Nobody can post until staff reopen it.'),
      canClose ? h(T.Button, { size: 'sm', onClick: function () { app.actions.setClosed(g.id, false); } }, 'Reopen group') : null);
  } else if (ann.broadcast && !canBroadcast) {
    composer = h('div', { className: 'notice' }, h(T.Icon, { name: 'volume', size: 16 }), h('span', { className: 'grow' }, 'Broadcast mode is on. Only staff can post right now.'));
  } else {
    composer = h(T.Composer, {
      placeholder: 'Message #' + g.id, replyTo: replyTo ? { author: replyTo.author, text: messagePreview(replyTo) } : null,
      onCancelReply: function () { setReplyTo(null); },
      onSend: function (text) { atBottom.current = true; app.actions.sendGroup(g.id, text, { replyTo: replyTo ? { id: replyTo.id, author: replyTo.author, text: messagePreview(replyTo) } : null, channel: channel }); setReplyTo(null); },
      onEmoji: function () { app.ui.toast('The emoji picker is not part of this prototype.'); },
      onAttach: function () { app.ui.toast('Uploading media is not part of this prototype.'); },
      aside: h(MenuButton, {
        up: true, items: Object.keys(CHANNELS).filter(function (k) { return k !== 'mod' || staff; }).map(function (k) {
          return { label: CHANNELS[k].label + (k === 'none' ? '' : ' channel'), swatch: CHANNELS[k].color || 'transparent', checked: channel === k, onSelect: function () { setChannel(k); } };
        }),
        renderTrigger: function (tp) {
          return h('button', Object.assign({ type: 'button', className: 'pillbtn hide-mobile', style: { height: 28, border: '1px solid var(--border-strong)', fontSize: 12 } }, tp),
            h('span', { style: { width: 8, height: 8, borderRadius: '50%', background: CHANNELS[channel].color || 'transparent', border: CHANNELS[channel].color ? 0 : '1.5px solid var(--text-3)' } }),
            CHANNELS[channel].label, h(T.Icon, { name: 'chevron-down', size: 12 }));
        }
      })
    });
  }

  return h(Frag, null,
    h('main', { className: 'main' },
      h('header', { className: 'topbar' },
        h(MobileNavButton, null),
        h(T.Icon, { name: 'hash', size: 18, style: { color: 'var(--text-3)' } }),
        h('h1', null, g.id),
        h('span', { className: 'vsep' }),
        h('p', { className: 'topic' }, g.topic),
        h('span', { className: 'grow only-mobile' }),
        h('button', { type: 'button', className: 'pillbtn hide-mobile', 'aria-pressed': String(showMembers), onClick: function () { setShowMembers(!showMembers); } },
          h(T.Icon, { name: 'users', size: 16 }), online + ' online'),
        h(T.IconButton, { icon: 'search', label: 'Search in this group', pressed: search != null, onClick: function () { setSearch(search == null ? '' : null); } }),
        h(T.IconButton, { icon: g.muted ? 'volume-x' : 'bell', label: g.muted ? 'Unmute group' : 'Mute group', pressed: g.muted, onClick: function () { app.actions.toggleMute(g.id); } }),
        h(MenuButton, {
          label: 'Group options', items: [
            canManage(g, me) || staff ? { label: 'Group settings', icon: 'sliders', onSelect: function () { app.nav({ view: 'gsettings', id: g.id, page: canManage(g, me) ? 'overview' : 'automod' }); } } : null,
            { label: g.favorite ? 'Remove from favorites' : 'Add to favorites', icon: 'star', onSelect: function () { app.actions.toggleFavorite(g.id); } },
            { label: 'Copy invite link', icon: 'link', onSelect: function () { copyText('https://' + g.id + '.chatango.com', function (ok) { app.ui.toast(ok ? 'Invite link copied.' : 'Copy failed. The link is ' + g.id + '.chatango.com'); }); } },
            { divider: true },
            { label: 'Leave group', icon: 'log-out', danger: true, onSelect: function () { app.ui.confirm({ title: 'Leave #' + g.id + '?', body: 'You can join again from Discover at any time.', confirmLabel: 'Leave group', danger: true, onConfirm: function () { app.actions.leaveGroup(g.id); } }); } }
          ]
        })),
      ann.enabled && ann.text && !g.dismissedAnnouncement ? h('div', { className: 'banner-wrap' },
        h(T.Banner, { title: 'Announcement', onDismiss: function () { app.update(function (d) { d.groups[g.id].dismissedAnnouncement = true; }); } }, ann.text)) : null,
      search != null ? h('div', { className: 'searchbar' },
        h('label', { htmlFor: 'gsearch', className: 'tc-sr' }, 'Search messages'),
        h('input', { id: 'gsearch', className: 'tc-input', type: 'search', placeholder: 'Search messages in #' + g.id, value: search, autoFocus: true, onChange: function (e) { setSearch(e.target.value); }, onKeyDown: function (e) { if (e.key === 'Escape') setSearch(null); } }),
        h(T.Button, { variant: 'ghost', size: 'sm', onClick: function () { setSearch(null); } }, 'Close')) : null,
      h('div', { className: 'log', role: 'log', 'aria-label': 'Messages in ' + g.id, ref: logRef, onScroll: onScroll },
        h('div', { className: 'log-inner' }, items)),
      jump ? h('button', { type: 'button', className: 'jump', onClick: toBottom }, h(T.Icon, { name: 'chevron-down', size: 14 }), 'New messages') : null,
      LIVE && g.conn && g.conn !== 'open' ? h('div', { className: 'banner-wrap' }, h(T.Banner, {
        tone: 'warning', icon: 'info', title: g.conn === 'connecting' ? 'Connecting to #' + g.id : 'Disconnected from #' + g.id,
        action: g.conn === 'closed' ? h(T.Button, { size: 'sm', onClick: function () { app.actions.reconnect(g.id); } }, 'Reconnect') : null
      }, g.conn === 'connecting' ? 'Messages you send now may not arrive.' : 'New messages will not arrive until you reconnect.')) : null,
      h('div', { className: 'composer-wrap' },
        h('p', { className: 'typing', 'aria-live': 'polite' }, typing.length ? h(Frag, null, h('span', { className: 'dots', 'aria-hidden': 'true' }, h('i'), h('i'), h('i')), h('b', null, typing.join(', ')), typing.length > 1 ? ' are typing' : ' is typing') : null),
        composer)),
    showMembers ? h(MembersPanel, { g: g }) : null);
}

function EventRow(p) {
  var joined = [], left = [], banned = [];
  p.events.forEach(function (e) { (e.type === 'join' ? joined : e.type === 'leave' ? left : banned).push(e.user); });
  var parts = [];
  if (joined.length) parts.push(joined.length === 1 ? joined[0] + ' joined' : joined.length + ' people joined');
  if (left.length) parts.push(left.length === 1 && !joined.length ? left[0] + ' left' : left.length + ' left');
  if (banned.length) parts.push(banned.length === 1 ? banned[0] + ' was banned' : banned.length + ' were banned');
  var multi = p.events.length > 1;
  return h('div', { className: 'ev' },
    h(T.Icon, { name: banned.length ? 'ban' : 'user-plus', size: 14 }),
    h('span', null, parts.join(', ')),
    multi ? h('button', { type: 'button', className: 'linkbtn', 'aria-expanded': String(p.open), onClick: p.onToggle }, p.open ? 'Hide' : 'Show') : null,
    multi && p.open ? h('span', { className: 'ev-list' },
      [joined.length ? 'Joined: ' + joined.join(', ') + '.' : '', left.length ? 'Left: ' + left.join(', ') + '.' : '', banned.length ? 'Banned: ' + banned.join(', ') + '.' : ''].filter(Boolean).join(' ')) : null);
}

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
  var menuItems = [
    { label: 'Mention ' + m.author, icon: 'message', onSelect: function () { app.ui.toast('Type @' + m.author + ' in the composer to mention them.'); } },
    { label: 'Copy text', icon: 'list', onSelect: function () { copyText(messagePreview(m), function (ok) { app.ui.toast(ok ? 'Message copied.' : 'Copy failed.'); }); } },
    m.author !== me ? { label: 'View profile', icon: 'users', onSelect: function () { app.ui.openProfile(m.author, g.id); } } : null,
    canDelete || m.author !== me || canBan ? { divider: true } : null,
    canDelete ? { label: 'Delete message', icon: 'trash', danger: true, onSelect: function () { app.actions.deleteMessage(g.id, m.id); } } : null,
    LIVE && canBan ? { label: 'Delete all from ' + m.author, icon: 'trash', danger: true, onSelect: function () { app.ui.confirm({ title: 'Delete every message from ' + m.author + '?', body: 'Chatango removes their recent messages in #' + g.id + ' for everyone.', confirmLabel: 'Delete all', danger: true, onConfirm: function () { app.actions.deleteAllFrom(g.id, m.author, m); } }); } } : null,
    m.author !== me ? { label: u.ignored ? 'Stop ignoring ' + m.author : 'Ignore ' + m.author, icon: 'eye-off', onSelect: function () { app.actions.toggleUser(m.author, 'ignored'); } } : null,
    canBan ? { label: 'Ban from #' + g.id, icon: 'ban', danger: true, onSelect: function () { app.ui.ban(m.author, g.id, m); } } : null
  ];
  var actions = m.deleted ? null : h('div', { className: 'tc-msg-actions' },
    h(T.IconButton, { icon: 'reply', label: 'Reply', size: 28, iconSize: 16, onClick: function () { p.onReply(m); } }),
    h(MenuButton, { label: 'More actions', size: 28, iconSize: 16, items: menuItems, onOpenChange: setMenuOpen }));
  var body = m.deleted
    ? h('p', { className: 'tc-msg-text deleted' }, m.deleted.by === m.author ? 'Message deleted' : 'Message deleted by ' + m.deleted.by)
    : h(MessageContent, { m: m, style: textStyle }, m.edited ? h('span', { className: 'tc-msg-time' }, '(edited)') : null);
  var chan = m.channel && m.channel !== 'none' && CHANNELS[m.channel] ? h('span', { className: 'chan' }, h('i', { style: { background: CHANNELS[m.channel].color } }), CHANNELS[m.channel].label + ' channel') : null;
  var roleBadge = role ? h(T.Badge, { icon: role === 'owner' ? 'crown' : 'shield' }, ROLE_LABEL[role]) : null;
  var time = fmtTime(m.ts, prefs.h24);
  var reply = m.replyTo ? h('div', { className: 'tc-msg-reply' },
    h(T.Icon, { name: 'reply', size: 14 }), m.replyTo.author ? h(T.Avatar, { name: m.replyTo.author, size: 16 }) : null,
    m.replyTo.author ? h('span', { style: { fontWeight: 500, color: 'var(--text-2)' } }, m.replyTo.author) : null, h('span', { className: 'tc-msg-reply-text' }, m.replyTo.text)) : null;
  var authorBtn = h('button', { type: 'button', className: 'tc-msg-author linkbtn', style: Object.assign({ textDecoration: 'none', color: 'var(--text)', fontWeight: 600, fontSize: 14 }, nameStyle), onClick: function () { app.ui.openProfile(m.author, g.id); } }, m.author);

  if (prefs.density === 'compact') {
    return h('article', { className: cx('cmsg', mention && 'tc-msg-mention', menuOpen && 'menu-open'), style: rowStyle },
      h('time', { className: 'tc-msg-time' }, time), authorBtn,
      h('div', { style: { flex: 1, minWidth: 0 } }, reply, body), actions);
  }
  if (p.continued) {
    return h('article', { className: cx('tc-msg', 'tc-msg-cont', mention && 'tc-msg-mention', menuOpen && 'menu-open'), style: rowStyle },
      h('span', { className: 'tc-msg-gutter' }, time), h('div', { className: 'tc-msg-body' }, body), actions);
  }
  return h('article', { className: cx('tc-msg', mention && 'tc-msg-mention', menuOpen && 'menu-open'), style: Object.assign({ marginTop: 6 }, m.replyTo ? { flexDirection: 'column' } : null, rowStyle) },
    reply,
    h('div', { style: { display: 'flex', gap: 12 } },
      h(T.Avatar, { name: m.author }),
      h('div', { className: 'tc-msg-body' },
        h('div', { className: 'tc-msg-head' }, authorBtn, roleBadge, h('time', { className: 'tc-msg-time' }, time), chan),
        body)),
    actions);
}

function MessageContent(p) {
  var m = p.m;
  return h(Frag, null, m.text ? h(MessageText, { text: m.text, style: p.style }) : null, p.children, m.embeds && m.embeds.length ? h(MessageEmbeds, { embeds: m.embeds }) : null);
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

function MembersPanel(p) {
  var app = useApp(), s = app.state, g = p.g;
  var staff = g.members.filter(function (n) { return roleOf(g, n); });
  var others = g.members.filter(function (n) { return !roleOf(g, n); });
  var on = others.filter(function (n) { return userOf(s, n).status !== 'offline' || n === s.me; });
  var off = others.filter(function (n) { return userOf(s, n).status === 'offline' && n !== s.me; });
  function row(n, aside) {
    var u = userOf(s, n);
    return h('button', { key: n, type: 'button', className: 'mrow', onClick: function () { app.ui.openProfile(n, g.id); } },
      h(T.Avatar, { name: n, size: 28, status: n === s.me ? s.meStatus : u.status, ring: 'var(--panel)' }),
      h('span', { className: 'grow', style: u.status === 'offline' && n !== s.me ? { color: 'var(--text-3)' } : null }, n + (n === s.me ? ' (you)' : '')),
      aside ? h('span', { style: { fontSize: 11.5, color: 'var(--text-3)' } }, aside) : null);
  }
  return h('aside', { className: 'col members', 'aria-label': 'Members of ' + g.id },
    h('div', { className: 'topbar', style: { padding: '0 12px 0 16px' } }, h('h2', { className: 'grow' }, 'Members')),
    h('div', { className: 'scroll' },
      h('div', { className: 'members-list' },
        h('h3', { className: 'mlabel' }, 'Staff · ' + staff.length), staff.map(function (n) { return row(n, ROLE_LABEL[roleOf(g, n)]); }),
        h('h3', { className: 'mlabel' }, 'Online · ' + on.length), on.map(function (n) { return row(n); }),
        off.length ? h('h3', { className: 'mlabel' }, 'Offline · ' + off.length) : null, off.map(function (n) { return row(n); }),
        s.prefs.safety.showGuests && g.guests ? h('p', { className: 'mlabel', style: { marginTop: 16 } }, 'Guests · ' + g.guests) : null)));
}

/* ---------- Profil d'un membre ---------- */
function ProfileDialog(p) {
  var app = useApp(), s = app.state, name = p.name, u = userOf(s, name), isMe = name === s.me;
  var g = p.gid ? s.groups[p.gid] : null;
  var myRole = g ? roleOf(g, s.me) : null, theirRole = g ? roleOf(g, name) : null;
  var common = Object.keys(s.groups).filter(function (k) { var x = s.groups[k]; return x.joined && x.members.indexOf(name) >= 0; });
  var meta = [u.age && (isMe ? s.profile.visibility.age : true) ? u.age : null, u.gender && u.gender !== 'Not specified' ? u.gender : null, u.location || null].filter(Boolean).join(' · ');
  var guest = /^[!#]/.test(name);
  useEffect(function () { if (!guest) app.actions.loadProfile(name); }, [name]);
  function go(route) { p.onClose(); app.nav(route); }
  return h(Dialog, { label: 'Profile of ' + name, onClose: p.onClose },
    h('div', { className: 'profile-card' },
      h(T.Avatar, { name: name, size: 72, status: isMe ? s.meStatus : u.status, ring: 'var(--raised)' }),
      h('h2', null, name),
      h('span', { className: 'muted', style: { fontSize: 13 } }, [statusLabel(isMe ? s.meStatus : u.status), u.friend ? 'Friend' : null, theirRole ? ROLE_LONG[theirRole] + ' in #' + g.id : null].filter(Boolean).join(' · ')),
      meta ? h('span', { className: 'muted', style: { fontSize: 13 } }, meta) : null),
    profileAbout(u),
    !guest ? h('div', { style: { padding: '0 20px 4px' } }, h(T.Button, { size: 'sm', variant: 'ghost', icon: 'external', onClick: function () { app.ui.openFullProfile(name); } }, 'Full profile')) : null,
    common.length ? h('div', { className: 'kv' }, h('h3', null, 'Groups in common · ' + common.length), h('p', { className: 'about', style: { color: 'var(--text-2)' } }, common.map(function (c) { return '#' + c; }).join(', '))) : null,
    h('div', { className: 'dialog-foot', style: { justifyContent: 'flex-start', paddingTop: 14, borderTop: '1px solid var(--border)' } },
      isMe ? h(T.Button, { variant: 'primary', icon: 'edit', onClick: function () { go({ view: 'settings', page: 'profile' }); } }, 'Edit profile')
      : LIVE && /^[!#]/.test(name) ? h('span', { className: 'muted', style: { fontSize: 13 } }, 'Guests have no Chatango account: no messages, friends or blocks.') : h(Frag, null,
        h(T.Button, { variant: 'primary', icon: 'message', disabled: u.blocked, onClick: function () { app.actions.openDm(name); p.onClose(); } }, 'Message'),
        h(T.Button, { icon: u.friend ? 'user-minus' : 'user-plus', onClick: function () { app.actions.toggleUser(name, 'friend'); } }, u.friend ? 'Remove friend' : 'Add friend'),
        h(MenuButton, {
          label: 'More profile actions', items: [
            { label: u.ignored ? 'Stop ignoring' : 'Ignore in groups', icon: 'eye-off', onSelect: function () { app.actions.toggleUser(name, 'ignored'); } },
            { label: u.blocked ? 'Unblock' : 'Block', icon: 'ban', danger: !u.blocked, onSelect: function () { if (u.blocked) app.actions.toggleUser(name, 'blocked'); else app.ui.confirm({ title: 'Block ' + name + '?', body: name + " won't be able to message you, and their messages are hidden in groups.", confirmLabel: 'Block', danger: true, onConfirm: function () { app.actions.toggleUser(name, 'blocked'); } }); } },
            isStaffRole(myRole) && theirRole !== 'owner' ? { label: 'Ban from #' + g.id, icon: 'ban', danger: true, onSelect: function () { p.onClose(); app.ui.ban(name, g.id); } } : null
          ]
        }))));
}

function BanDialog(p) {
  var app = useApp();
  var st = useState('Spam'), reason = st[0], setReason = st[1];
  var dl = useState(false), wipe = dl[0], setWipe = dl[1];
  if (LIVE) {
    return h(Dialog, {
      title: 'Ban ' + p.name + ' from #' + p.gid + '?', description: 'Chatango bans the account and the IP of their last message. They cannot rejoin until unbanned.', onClose: p.onClose,
      footer: [h(T.Button, { key: 'c', variant: 'ghost', onClick: p.onClose }, 'Cancel'), h(T.Button, { key: 'b', variant: 'danger', icon: 'ban', onClick: function () { if (app.actions.ban(p.gid, p.name, null, { deleteAll: wipe, msg: p.msg }) !== false) p.onClose(); } }, 'Ban')]
    }, h('div', { className: 'dialog-body' }, h(T.Checkbox, { label: 'Also delete their recent messages', checked: wipe, onChange: function (e) { setWipe(e.target.checked); } })));
  }
  return h(Dialog, {
    title: 'Ban ' + p.name + ' from #' + p.gid + '?', description: 'They are removed from the group and cannot rejoin from this IP until unbanned.', onClose: p.onClose,
    footer: [h(T.Button, { key: 'c', variant: 'ghost', onClick: p.onClose }, 'Cancel'), h(T.Button, { key: 'b', variant: 'danger', icon: 'ban', onClick: function () { app.actions.ban(p.gid, p.name, reason); p.onClose(); } }, 'Ban')]
  },
    h('div', { className: 'dialog-body' },
      h('div', { className: 'tc-field' }, h('label', { className: 'tc-label', htmlFor: 'ban-reason' }, 'Reason'),
        h('select', { id: 'ban-reason', className: 'tc-input', value: reason, onChange: function (e) { setReason(e.target.value); } },
          ['Spam', 'Harassment', 'Ban evasion', 'Off-topic flooding', 'Other'].map(function (r) { return h('option', { key: r }, r); })),
        h('span', { className: 'tc-hint' }, 'Shown to other staff in the audit log.'))));
}

function LinkDialog(p) {
  var app = useApp();
  return h(Dialog, {
    title: 'This link leaves Torch', description: 'Check the address before you continue. Torch does not check external sites.', onClose: p.onClose,
    footer: [
      h(T.Button, { key: 'c', variant: 'ghost', onClick: p.onClose }, 'Cancel'),
      h('a', { key: 'o', className: 'tc-btn tc-btn-primary', href: p.url, target: '_blank', rel: 'noopener noreferrer', onClick: p.onClose, style: { textDecoration: 'none' } }, 'Open link', h(T.Icon, { name: 'external', size: 14 }))
    ]
  },
    h('div', { className: 'dialog-body' },
      h('p', { className: 'mono', style: { margin: 0, padding: '10px 12px', borderRadius: 8, background: 'var(--subtle)', border: '1px solid var(--border)', fontSize: 12.5, overflowWrap: 'anywhere', color: 'var(--text-body)' } }, p.url),
      h(T.Checkbox, { label: "Don't warn me again", onChange: function (e) { var v = e.target.checked; app.update(function (d) { d.prefs.safety.warnLinks = !v; }); } })));
}

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

var MEET_DEFAULTS = { query: '', sex: 'B', ageMin: 13, ageMax: 99, online: true, avatar: 0 };
/** Filtres qui s'écartent des valeurs par défaut de Torch, pour le compteur et les étiquettes. */
function meetActive(f) {
  var out = [];
  if (f.sex !== 'B') out.push(['sex', f.sex === 'M' ? 'Men' : 'Women']);
  if (+f.ageMin !== 13 || +f.ageMax !== 99) out.push(['age', 'Age ' + f.ageMin + ' to ' + f.ageMax]);
  if (+f.avatar) out.push(['avatar', +f.avatar === 1 ? 'Photos' : 'Characters']);
  if (!f.online) out.push(['online', 'Offline included']);
  return out;
}
/** Texte brut d'un mini profil pour un aperçu ; le document analysé est inerte (ni script ni chargement). */
function plainText(html) {
  try {
    var d = new DOMParser().parseFromString('<!doctype html><body>' + String(html).replace(/<br\s*\/?>/gi, ' '), 'text/html');
    Array.prototype.forEach.call(d.querySelectorAll('script,style'), function (x) { x.remove(); });
    return d.body.textContent.replace(/\s+/g, ' ').trim();
  } catch (e) { return ''; }
}
function personCard(s, n, onClick) {
  var u = userOf(s, n);
  var about = u.aboutHtml ? plainText(u.aboutHtml) : u.about || '';
  return h('button', { key: n, type: 'button', className: 'conv person', onClick: onClick },
    h(T.Avatar, { name: n, size: 44, status: u.status, ring: 'var(--panel)' }),
    h('span', { className: 'conv-main' },
      h('span', { className: 'conv-top' }, h('span', { className: 'conv-name' }, n), u.premium ? h(T.Badge, { tone: 'accent' }, 'Premium') : null),
      h('span', { className: 'conv-meta' }, personMeta(u)),
      about ? h('span', { className: 'conv-about' }, about)
        : u.profileMissing ? h('span', { className: 'conv-about' }, 'No public profile.')
          : LIVE && !u.profileLoaded ? h('span', { className: 'conv-about' }, 'Loading profile') : null));
}

function MeetFilters(p) {
  var a = useState(function () { return Object.assign({}, p.value); }), f = a[0], setF = a[1];
  function set(k, v) { setF(function (x) { var o = Object.assign({}, x); o[k] = v; return o; }); }
  var lo = parseInt(f.ageMin, 10), hi = parseInt(f.ageMax, 10);
  var ageErr = isNaN(lo) || isNaN(hi) || lo < 13 || hi > 99 || lo > hi ? 'Use ages between 13 and 99, youngest first.' : '';
  function seg(label, value, options, onChange) {
    return h('div', { className: 'tc-field' }, h('span', { className: 'tc-label' }, label),
      h(T.SegmentedControl, { label: label, block: true, value: value, onChange: onChange, options: options }));
  }
  var num = { className: 'tc-input', type: 'number', min: 13, max: 99, style: { width: 84 } };
  return h(Dialog, {
    title: 'Filter people', description: 'Chatango lists public profiles that match every filter.', onClose: p.onClose,
    footer: [
      h(T.Button, { key: 'r', variant: 'ghost', onClick: function () { setF(Object.assign({}, MEET_DEFAULTS, { query: f.query })); } }, 'Reset'),
      h('span', { key: 'g', style: { flex: 1 } }),
      h(T.Button, { key: 'c', variant: 'ghost', onClick: p.onClose }, 'Cancel'),
      h(T.Button, { key: 'a', variant: 'primary', disabled: !!ageErr, onClick: function () { p.onApply(Object.assign({}, f, { ageMin: lo, ageMax: hi })); } }, 'Show results')
    ]
  },
    h('div', { className: 'dialog-body', style: { gap: 18 } },
      seg('Gender', f.sex, [{ value: 'B', label: 'Anyone' }, { value: 'M', label: 'Men' }, { value: 'F', label: 'Women' }], function (v) { set('sex', v); }),
      h('div', { className: 'tc-field' },
        h('span', { className: 'tc-label', id: 'meet-age-l' }, 'Age'),
        h('div', { role: 'group', 'aria-labelledby': 'meet-age-l', style: { display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-2)' } },
          h('input', Object.assign({ 'aria-label': 'Youngest', value: f.ageMin, 'aria-invalid': ageErr ? 'true' : undefined, onChange: function (e) { set('ageMin', e.target.value); } }, num)), 'to',
          h('input', Object.assign({ 'aria-label': 'Oldest', value: f.ageMax, 'aria-invalid': ageErr ? 'true' : undefined, onChange: function (e) { set('ageMax', e.target.value); } }, num))),
        h('span', { className: ageErr ? 'tc-error' : 'tc-hint' }, ageErr || 'From 13 to 99.')),
      seg('Profile picture', String(f.avatar || 0), [{ value: '0', label: 'Any' }, { value: '1', label: 'Photos' }, { value: '2', label: 'Characters' }], function (v) { set('avatar', +v); }),
      h('label', { className: 'tc-checkline', style: { justifyContent: 'space-between', width: '100%' } },
        h('span', null, h('span', { style: { display: 'block', fontWeight: 500 } }, 'Online now'), h('span', { className: 'tc-hint' }, 'Only people connected right now.')),
        h(T.Switch, { checked: !!f.online, onChange: function (e) { set('online', e.target.checked); } }))));
}

function MeetPeople() {
  var app = useApp(), s = app.state, meet = s.meet || null;
  var a = useState(function () { return Object.assign({}, MEET_DEFAULTS, meet && meet.filters); }), f = a[0], setF = a[1];
  var b = useState(false), filtersOpen = b[0], setFiltersOpen = b[1];
  function run(next, more) { setF(next); app.actions.searchPeople(next, more); }
  useEffect(function () { if (!s.meet) run(f, false); }, []);
  var results = meet ? meet.results : [];
  useProfiles(results);
  var active = meetActive(f);
  function clear(key) {
    var nf = Object.assign({}, f);
    if (key === 'sex') nf.sex = 'B';
    if (key === 'age') { nf.ageMin = 13; nf.ageMax = 99; }
    if (key === 'avatar') nf.avatar = 0;
    if (key === 'online') nf.online = true;
    run(nf, false);
  }
  return h(Frag, null,
    h('form', { onSubmit: function (e) { e.preventDefault(); run(f, false); }, noValidate: true, role: 'search', style: { padding: '12px 12px 6px', display: 'flex', flexDirection: 'column', gap: 8 } },
      h('div', { style: { display: 'flex', gap: 8 } },
        h('label', { htmlFor: 'meet-q', className: 'tc-sr' }, 'Search people'),
        h('input', { id: 'meet-q', className: 'tc-input', type: 'search', style: { height: 34, flex: 1, minWidth: 0 }, placeholder: 'Username or keyword', value: f.query, onChange: function (e) { var v = e.target.value; setF(function (x) { return Object.assign({}, x, { query: v }); }); } }),
        h(T.Button, { size: 'sm', icon: 'sliders', style: { height: 34 }, 'aria-label': 'Filters' + (active.length ? ', ' + active.length + ' active' : ''), onClick: function () { setFiltersOpen(true); } },
          'Filters', active.length ? h('span', { className: 'filter-count', 'aria-hidden': 'true' }, active.length) : null),
        h(T.IconButton, { icon: 'rotate-cw', label: 'Refresh', size: 34, iconSize: 15, disabled: !!(meet && meet.loading), onClick: function () { run(f, false); } })),
      active.length ? h('div', { className: 'filter-chips' }, active.map(function (x) {
        return h('span', { key: x[0], className: 'filter-chip' }, x[1],
          h('button', { type: 'button', 'aria-label': 'Remove filter: ' + x[1], onClick: function () { clear(x[0]); } }, h(T.Icon, { name: 'x', size: 11 })));
      })) : null),
    h('div', { className: 'scroll', style: { padding: '0 8px 12px' } },
      meet && meet.error ? h('p', { className: 'pal-empty' }, meet.error) : null,
      results.map(function (n) { return personCard(s, n, function () { app.ui.openProfile(n, null); }); }),
      meet && meet.loading ? h('p', { className: 'pal-empty' }, 'Searching Chatango.') : null,
      meet && !meet.loading && !meet.error && !results.length ? h('p', { className: 'pal-empty' }, active.length ? 'Nobody matches these filters.' : 'Nobody found.') : null,
      meet && !meet.loading && !meet.done && results.length ? h('div', { style: { padding: 8, display: 'flex', justifyContent: 'center' } }, h(T.Button, { size: 'sm', onClick: function () { run(f, true); } }, 'Load more')) : null),
    filtersOpen ? h(MeetFilters, { value: f, onClose: function () { setFiltersOpen(false); }, onApply: function (nf) { setFiltersOpen(false); run(Object.assign({}, nf, { query: f.query }), false); } }) : null);
}

/** Bloc « About » : texte Chatango mis en forme en live, texte simple dans le prototype. */
function profileAbout(u) {
  if (u.profileMissing) return h('div', { className: 'kv' }, h('p', { className: 'about muted' }, 'This account has no public profile.'));
  if (u.aboutHtml) return h('div', { className: 'kv' }, h('h3', null, 'About'), h(RichText, { html: u.aboutHtml }));
  if (u.about) return h('div', { className: 'kv' }, h('h3', null, 'About'), h('p', { className: 'about' }, u.about));
  if (LIVE && !u.profileLoaded) return h('div', { className: 'kv' }, h('p', { className: 'about muted' }, 'Loading profile.'));
  return null;
}

/** Profil complet : page HTML du membre, affichée dans un cadre isolé sans script. */
function FullProfileDialog(p) {
  var app = useApp(), s = app.state, u = userOf(s, p.name), safety = s.prefs.safety;
  var a = useState(LIVE ? null : ''), html = a[0], setHtml = a[1];
  var b = useState(''), err = b[0], setErr = b[1];
  var c = useState(!safety.proxyMedia && safety.embedImages), media = c[0], setMedia = c[1];
  useEffect(function () {
    if (!LIVE) return;
    liveBridge.fetchFullProfile(p.name).then(setHtml, function () { setErr('Chatango did not return this profile.'); });
  }, [p.name]);
  // Prototype : page d'exemple construite à partir des données de démonstration, échappée.
  var sample = '<h2>' + String(p.name).replace(/[<>&"]/g, '') + '</h2><p>' + String(u.about || 'No full profile yet.').replace(/[<>&"]/g, '') + '</p>';
  var content = LIVE ? html : sample;
  return h(Dialog, {
    title: p.name + "'s profile", wide: true, onClose: p.onClose,
    footer: [
      !media && content ? h(T.Button, { key: 'm', variant: 'ghost', onClick: function () { setMedia(true); } }, 'Load images') : null,
      h('a', { key: 'o', className: 'tc-btn', href: 'https://' + p.name + '.chatango.com', target: '_blank', rel: 'noopener noreferrer', style: { textDecoration: 'none' } }, 'Open on chatango.com', h(T.Icon, { name: 'external', size: 14 })),
      h(T.Button, { key: 'c', variant: 'primary', onClick: p.onClose }, 'Close')
    ]
  },
    h('div', { className: 'dialog-body' },
      err ? h('p', { className: 'muted', style: { margin: 0 } }, err)
        : content === null ? h('p', { className: 'muted', style: { margin: 0 } }, 'Loading the profile from Chatango.')
          : !content ? h('p', { className: 'muted', style: { margin: 0 } }, p.name + " hasn't written a full profile.")
            : h('iframe', { title: p.name + "'s full profile", className: 'fullprofile', sandbox: 'allow-popups allow-popups-to-escape-sandbox', referrerPolicy: 'no-referrer', srcDoc: fullProfileDoc(content, media) })));
}

function ProfilePanel(p) {
  var app = useApp(), s = app.state, name = p.name, u = userOf(s, name);
  var common = Object.keys(s.groups).filter(function (k) { var x = s.groups[k]; return x.joined && x.members.indexOf(name) >= 0; });
  var meta = [u.age, u.gender && u.gender !== 'Not specified' ? u.gender : null, u.location].filter(Boolean).join(' · ');
  var notify = s.dms[name] && s.dms[name].notifyOnline;
  useEffect(function () { app.actions.loadProfile(name); }, [name]);
  return h('aside', { className: 'col profile', 'aria-label': 'Profile of ' + name },
    h('div', { className: 'scroll' },
      h('div', { className: 'profile-card' },
        h(T.Avatar, { name: name, size: 72, status: u.status, ring: 'var(--panel)' }),
        h('h2', null, name), meta ? h('span', { className: 'muted', style: { fontSize: 13 } }, meta) : null),
      profileAbout(u),
      h('div', { style: { padding: '0 16px 8px' } }, h(T.Button, { size: 'sm', variant: 'ghost', icon: 'external', onClick: function () { app.ui.openFullProfile(name); } }, 'Full profile')),
      common.length ? h('div', { className: 'kv' }, h('h3', null, 'Groups in common · ' + common.length),
        common.map(function (c) { return h('button', { key: c, type: 'button', className: 'mrow', style: { height: 32, padding: '0 4px' }, onClick: function () { app.nav({ view: 'group', id: c }); } }, h(T.Avatar, { name: c, square: true, size: 22 }), h('span', { className: 'grow' }, c)); })) : null,
      h('div', { style: { padding: '12px 12px 16px', display: 'flex', flexDirection: 'column', gap: 2, borderTop: '1px solid var(--border)' } },
        h('button', { type: 'button', className: 'mrow', 'aria-pressed': String(!!notify), onClick: function () { app.update(function (d) { d.dms[name].notifyOnline = !notify; }); app.ui.toast(notify ? 'You will not be notified.' : "You'll be notified when " + name + ' comes online.'); } },
          h(T.Icon, { name: 'bell', size: 15 }), h('span', { className: 'grow' }, notify ? 'Notifying when online' : 'Notify when online'), notify ? h(T.Icon, { name: 'check', size: 14 }) : null),
        h('button', { type: 'button', className: 'mrow', onClick: function () { app.actions.toggleUser(name, 'friend'); } }, h(T.Icon, { name: u.friend ? 'user-minus' : 'user-plus', size: 15 }), h('span', { className: 'grow' }, u.friend ? 'Remove friend' : 'Add friend')),
        h('button', { type: 'button', className: 'mrow', onClick: function () { app.actions.toggleUser(name, 'ignored'); } }, h(T.Icon, { name: 'eye-off', size: 15 }), h('span', { className: 'grow' }, u.ignored ? 'Stop ignoring' : 'Ignore in groups')),
        h('button', { type: 'button', className: 'mrow', style: { color: 'var(--danger)' }, onClick: function () { if (u.blocked) app.actions.toggleUser(name, 'blocked'); else app.ui.confirm({ title: 'Block ' + name + '?', body: name + " won't be able to message you, and their messages are hidden in groups.", confirmLabel: 'Block', danger: true, onConfirm: function () { app.actions.toggleUser(name, 'blocked'); } }); } },
          h(T.Icon, { name: 'ban', size: 15 }), h('span', { className: 'grow' }, u.blocked ? 'Unblock' : 'Block')))));
}

function NewDmDialog(p) {
  var app = useApp(), s = app.state;
  var a = useState(''), name = a[0], setName = a[1];
  var b = useState(''), err = b[0], setErr = b[1];
  var suggestions = Object.keys(s.users).filter(function (n) { return n !== s.me && (!name || n.indexOf(name.toLowerCase()) === 0); }).slice(0, 6);
  function start(n) {
    var v = (n || name).trim().toLowerCase();
    if (!v) { setErr('Enter a username.'); return; }
    if (LIVE ? !/^[a-z0-9_-]{1,20}$/.test(v) : !s.users[v]) { setErr(LIVE ? 'Usernames use letters, numbers, - and _ only.' : 'No Chatango user named ' + v + '.'); return; }
    if (v === s.me) { setErr("You can't message yourself."); return; }
    p.onClose(); app.actions.openDm(v);
  }
  return h(Dialog, {
    title: 'New private message', onClose: p.onClose,
    footer: [h(T.Button, { key: 'c', variant: 'ghost', onClick: p.onClose }, 'Cancel'), h(T.Button, { key: 's', variant: 'primary', onClick: function () { start(); } }, 'Start conversation')]
  },
    h('div', { className: 'dialog-body' },
      h(T.TextField, { id: 'newdm', label: 'Username', value: name, error: err, autoComplete: 'off', onChange: function (e) { setName(e.target.value); setErr(''); }, onKeyDown: function (e) { if (e.key === 'Enter') start(); } }),
      h('div', { className: 'chips' }, suggestions.map(function (n) { return h('button', { key: n, type: 'button', className: 'chip', onClick: function () { start(n); } }, n); }))));
}

/* ---------- Découvrir ---------- */
function parseGroupName(v) {
  return String(v || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^client\.chatango\.com\/q\?/, '').replace(/\.chatango\.com.*$/, '').replace(/\/.*$/, '').replace(/^#/, '');
}
function Discover() {
  var app = useApp(), s = app.state;
  var a = useState(''), joinName = a[0], setJoinName = a[1];
  var b = useState(null), err = b[0], setErr = b[1];
  var c = useState('All'), topic = c[0], setTopic = c[1];
  var d = useState(''), q = d[0], setQ = d[1];
  var all = Object.keys(s.groups).map(function (k) { return s.groups[k]; }).filter(function (g) { return g.discover; });
  var official = all.filter(function (g) { return g.discover.official; });
  var popular = all.filter(function (g) { return !g.discover.official && (g.settings.overview.showInDiscovery !== false); })
    .filter(function (g) { return topic === 'All' || g.discover.topic === topic; })
    .filter(function (g) { return !q || g.id.indexOf(q.toLowerCase()) >= 0 || g.discover.desc.toLowerCase().indexOf(q.toLowerCase()) >= 0; });
  function online(g) { return g.guests + g.members.filter(function (n) { return userOf(s, n).status !== 'offline'; }).length; }
  function submit(e) {
    e.preventDefault();
    var id = parseGroupName(joinName);
    if (!id) { setErr({ text: 'Enter a group name or a link.' }); return; }
    if (s.groups[id] || LIVE) { setErr(null); setJoinName(''); app.actions.joinGroup(id); return; }
    setErr({ text: 'No group named ' + id + '. Check the spelling, or create it.', name: id });
  }
  function joinBtn(g) {
    return g.joined
      ? h(T.Button, { size: 'sm', variant: 'ghost', onClick: function () { app.nav({ view: 'group', id: g.id }); } }, 'Open')
      : h(T.Button, { size: 'sm', onClick: function () { app.actions.joinGroup(g.id); } }, 'Join');
  }
  var topics = ['All', 'Gaming', 'Art', 'Music', 'Languages', 'Tech'];
  return h('main', { className: 'main' },
    h('header', { className: 'topbar' }, h(MobileNavButton, null), h('h1', { className: 'grow' }, 'Discover groups')),
    h('div', { className: 'scroll' },
      h('div', { style: { maxWidth: 1080, margin: '0 auto', padding: '32px 24px 56px', display: 'flex', flexDirection: 'column', gap: 28 } },
        h('div', { className: 'page-head' },
          h('div', null, h('h2', { style: { margin: '0 0 6px', fontSize: 24, lineHeight: '32px', fontWeight: 600 } }, 'Find a group'), h('p', { className: 'lede', style: { margin: 0 } }, 'Join a group, or open one directly by its name.')),
          h(T.Button, { variant: 'primary', icon: 'plus', onClick: function () { app.ui.openCreate(''); } }, 'Create a group')),
        h('form', { onSubmit: submit, className: 'tc-section', style: { padding: '16px 20px', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: '10px 12px' }, noValidate: true },
          h('div', { style: { flex: '1 1 320px' } }, h(T.TextField, { id: 'join', label: 'Join by name or link', placeholder: 'community, community.chatango.com or a full link', value: joinName, error: err ? err.text : undefined, onChange: function (e) { setJoinName(e.target.value); setErr(null); } })),
          h(T.Button, { type: 'submit', style: { height: 38 } }, 'Join'),
          err && err.name && !LIVE ? h(T.Button, { variant: 'ghost', icon: 'plus', style: { height: 38 }, onClick: function () { app.ui.openCreate(err.name); } }, 'Create ' + err.name) : null),
        LIVE ? h(LiveJoined, null) : null,
        LIVE ? null : h('section', { 'aria-labelledby': 'off-h', style: { display: 'flex', flexDirection: 'column', gap: 12 } },
          h('h2', { id: 'off-h', className: 'tc-section-title' }, 'Official'),
          h('div', { className: 'cards small' }, official.map(function (g) {
            return h('article', { key: g.id, className: 'card row' },
              h(T.Avatar, { name: g.id, square: true, size: 36, color: g.id === 'community' ? 'var(--accent)' : undefined, style: g.id === 'community' ? { color: 'var(--on-accent)' } : null }),
              h('span', { className: 'card-title' }, h('strong', null, g.id), h('span', null, g.title)), joinBtn(g));
          }))),
        LIVE ? null : h('section', { 'aria-labelledby': 'pop-h', style: { display: 'flex', flexDirection: 'column', gap: 14 } },
          h('div', { style: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 } },
            h('h2', { id: 'pop-h', className: 'tc-section-title', style: { flex: '1 1 160px' } }, 'Popular right now'),
            h('label', { htmlFor: 'find', className: 'tc-sr' }, 'Search groups'),
            h('input', { id: 'find', className: 'tc-input', type: 'search', placeholder: 'Search groups', value: q, style: { flex: '0 1 260px', height: 34 }, onChange: function (e) { setQ(e.target.value); } })),
          h('div', { className: 'chips', role: 'group', 'aria-label': 'Filter by topic' }, topics.map(function (t) {
            return h('button', { key: t, type: 'button', className: 'chip', 'aria-pressed': String(topic === t), onClick: function () { setTopic(t); } }, t);
          })),
          popular.length ? h('div', { className: 'cards' }, popular.map(function (g) {
            return h('article', { key: g.id, className: 'card' },
              h('div', { className: 'card-head' }, h(T.Avatar, { name: g.id, square: true, size: 40 }),
                h('span', { className: 'card-title' }, h('strong', null, g.id), h('span', { style: { display: 'inline-flex', alignItems: 'center', gap: 6 } }, h('span', { className: 'online-dot' }), online(g) + ' online'))),
              h('p', null, g.discover.desc),
              h('div', { className: 'card-foot' }, h('span', { className: 'grow muted', style: { fontSize: 12 } }, g.discover.topic), joinBtn(g)));
          })) : h('p', { className: 'pal-empty' }, 'No group matches. Try another topic, or create one.')))));
}

function CreateGroupDialog(p) {
  var app = useApp(), s = app.state;
  var a = useState(p.prefill || ''), name = a[0], setName = a[1];
  var b = useState(''), title = b[0], setTitle = b[1];
  var c = useState(''), desc = c[0], setDesc = c[1];
  var d = useState(true), listed = d[0], setListed = d[1];
  var e = useState({}), err = e[0], setErr = e[1];
  function create() {
    var n = name.trim().toLowerCase(), x = {};
    if (LIVE ? !/^[a-z0-9_-]{1,20}$/.test(n) : !/^[a-z0-9-]{3,20}$/.test(n)) x.name = LIVE ? 'Use up to 20 letters, numbers, - or _.' : 'Use 3 to 20 lowercase letters, numbers or dashes.';
    else if (s.groups[n] || s.users[n]) x.name = 'This name is taken. Try another one.';
    if (title.length > 60) x.title = 'Keep the title under 60 characters.';
    setErr(x);
    if (Object.keys(x).length) return;
    p.onClose();
    app.actions.createGroup(n, title.trim() || n, desc.trim(), listed);
  }
  return h(Dialog, {
    title: 'Create a group', description: 'You become its owner. The name is also its address: name.chatango.com.', onClose: p.onClose,
    footer: [h(T.Button, { key: 'c', variant: 'ghost', onClick: p.onClose }, 'Cancel'), h(T.Button, { key: 'k', variant: 'primary', onClick: create }, 'Create group')]
  },
    h('div', { className: 'dialog-body' },
      h(T.TextField, { id: 'cg-name', label: 'Group name', value: name, error: err.name, hint: name ? 'https://' + (parseGroupName(name) || 'name') + '.chatango.com' : 'Lowercase letters, numbers and dashes.', onChange: function (ev) { setName(ev.target.value); setErr({}); } }),
      h(T.TextField, { id: 'cg-title', label: 'Title', value: title, error: err.title, placeholder: 'Shown under the name in Discover', onChange: function (ev) { setTitle(ev.target.value); } }),
      h(T.TextField, { id: 'cg-desc', label: 'Description', multiline: true, rows: 3, value: desc, labelAside: h('span', { className: 'tc-msg-time' }, desc.length + ' / 300'), maxLength: 300, onChange: function (ev) { setDesc(ev.target.value); } }),
      h('label', { className: 'tc-checkline', style: { justifyContent: 'space-between', width: '100%' } }, h('span', null, 'Show in Discover'), h(T.Switch, { checked: listed, onChange: function (ev) { setListed(ev.target.checked); } }))));
}

/* ---------- Palette de commandes ---------- */
function Palette(p) {
  var app = useApp(), s = app.state;
  var a = useState(''), q = a[0], setQ = a[1];
  var b = useState(0), sel = b[0], setSel = b[1];
  var entries = [];
  Object.keys(s.groups).forEach(function (k) {
    var g = s.groups[k];
    if (g.joined) entries.push({ group: 'Groups', label: '#' + k, hint: g.mentions ? '@' + g.mentions : g.unread ? g.unread + ' new' : '', icon: 'hash', run: function () { app.nav({ view: 'group', id: k }); } });
  });
  Object.keys(s.dms).forEach(function (n) { entries.push({ group: 'People', label: n, hint: statusLabel(userOf(s, n).status), icon: 'message', run: function () { app.nav({ view: 'dm', id: n }); } }); });
  Object.keys(s.groups).forEach(function (k) { if (!s.groups[k].joined && s.groups[k].discover) entries.push({ group: 'Join', label: 'Join #' + k, hint: s.groups[k].discover.topic, icon: 'plus', run: function () { app.actions.joinGroup(k); } }); });
  [['Profile', 'profile'], ['Appearance', 'appearance'], ['Notifications', 'notifications'], ['Privacy', 'privacy'], ['Safety', 'safety'], ['Password and email', 'account'], ['Language', 'language'], ['Accessibility', 'accessibility'], ['Chatango Premium', 'premium'], ['About Torch', 'about']].forEach(function (x) {
    entries.push({ group: 'Settings', label: x[0], hint: 'Settings', icon: 'sliders', run: function () { app.nav({ view: 'settings', page: x[1] }); } });
  });
  entries.push({ group: 'Actions', label: 'Discover groups', icon: 'compass', run: function () { app.nav({ view: 'discover' }); } });
  entries.push({ group: 'Actions', label: 'Friends', icon: 'users', run: function () { app.nav({ view: 'dm', id: null, tab: 'friends' }); } });
  entries.push({ group: 'Actions', label: 'Meet people', icon: 'search', run: function () { app.nav({ view: 'dm', id: null, tab: 'meet' }); } });
  entries.push({ group: 'Actions', label: 'Create a group', icon: 'plus', run: function () { app.ui.openCreate(''); } });
  var ql = q.trim().toLowerCase();
  var shown = entries.filter(function (e) { return !ql || e.label.toLowerCase().indexOf(ql.replace(/^#/, '')) >= 0; }).slice(0, 40);
  var cur = Math.min(sel, Math.max(shown.length - 1, 0));
  function run(e) { p.onClose(); e.run(); }
  function onKey(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel((cur + 1) % Math.max(shown.length, 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSel((cur - 1 + shown.length) % Math.max(shown.length, 1)); }
    if (e.key === 'Enter' && shown[cur]) { e.preventDefault(); run(shown[cur]); }
  }
  var lastGroup = null;
  return h(Dialog, { label: 'Search or jump to', wide: true, onClose: p.onClose },
    h('input', { className: 'pal-input', placeholder: 'Search groups, people and settings', value: q, autoFocus: true, 'aria-label': 'Search', 'aria-controls': 'pal-list', 'aria-activedescendant': shown[cur] ? 'pal-' + cur : undefined, role: 'combobox', 'aria-expanded': 'true', onChange: function (e) { setQ(e.target.value); setSel(0); }, onKeyDown: onKey }),
    h('div', { className: 'pal-list', id: 'pal-list', role: 'listbox' },
      shown.length ? shown.map(function (e, i) {
        var head = e.group !== lastGroup ? h('div', { className: 'pal-group', key: 'g' + e.group }, e.group) : null;
        lastGroup = e.group;
        return h(Frag, { key: e.group + e.label },
          head,
          h('button', { type: 'button', id: 'pal-' + i, role: 'option', 'aria-selected': String(i === cur), className: 'pal-item', tabIndex: -1, onMouseEnter: function () { setSel(i); }, onClick: function () { run(e); } },
            h(T.Icon, { name: e.icon, size: 15 }), h('span', null, e.label), e.hint ? h('span', { className: 'muted' }, e.hint) : null));
      }) : h('p', { className: 'pal-empty' }, 'Nothing matches ' + q + '.')));
}

function LiveJoined() {
  var app = useApp(), s = app.state;
  var joined = Object.keys(s.groups).filter(function (k) { return s.groups[k].joined; });
  return h('section', { 'aria-labelledby': 'lj-h', style: { display: 'flex', flexDirection: 'column', gap: 12 } },
    h('h2', { id: 'lj-h', className: 'tc-section-title' }, 'Your groups'),
    joined.length ? h('div', { className: 'cards small' }, joined.map(function (k) {
      var g = s.groups[k];
      return h('article', { key: k, className: 'card row' }, h(T.Avatar, { name: k, square: true, size: 36 }),
        h('span', { className: 'card-title' }, h('strong', null, k), h('span', null, g.title)),
        h(T.Button, { size: 'sm', variant: 'ghost', onClick: function () { app.nav({ view: 'group', id: k }); } }, 'Open'));
    })) : h('p', { className: 'muted', style: { margin: 0 } }, 'Connecting to your groups. They appear here as Torch joins them.'));
}
