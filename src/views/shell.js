/* ---------- Application shell ---------- */
function MobileNavButton() {
  var app = useApp();
  return h(T.IconButton, { icon: 'menu', label: 'Open navigation', className: 'only-mobile', onClick: app.ui.openNav });
}

/**
 * Titled header of a main page with the mobile navigation button.
 * @param {string} title Page title.
 */
function pageHeader(title) {
  return h('header', { className: 'topbar' }, h(MobileNavButton, null), h('h1', { className: 'grow' }, title));
}

/**
 * Titled header of a right column.
 * @param {string} title Column title.
 */
function columnHeader(title) {
  return h('header', { className: 'topbar col-head' }, h('h2', { className: 'grow' }, title));
}

// Memoized: Root renders again for its toasts and dialogs, which leave the shell alone.
var Shell = React.memo(function Shell() {
  var app = useApp(), s = app.state, r = s.route, main;
  var wide = useWideLayout();
  var split = wide && s.split && paneShown(s, s.split) ? s.split : null;
  // A window too narrow for two panes, or a conversation that went away, closes the pane beside.
  useEffect(function () { if (s.split && !split) app.actions.closeSplit(); }, [!!s.split, !!split]);
  if (r.view === 'settings') return h(SettingsView, { page: r.page });
  if (r.view === 'gsettings') return h(GroupSettingsView, { key: r.id, gid: r.id, page: r.page });
  if (LIVE && !s.groupsSeen) main = h(StartupScreen, null);
  else if (r.view === 'group') main = h(GroupView, { key: r.id, gid: r.id, msgId: r.msgId, markerTs: r.markerTs, compact: !!split });
  else if (r.view === 'dm') main = h(DMView, { id: r.id, tab: r.tab, seek: r.seek, compact: !!split });
  else if (r.view === 'mentions') main = h(MentionsView, null);
  else main = h(Discover, null);
  var side = !split ? null : split.view === 'group'
    ? h(GroupView, { key: 'split:' + split.id, gid: split.id, markerTs: split.markerTs, compact: true, onClose: app.actions.closeSplit, closeLabel: 'Close #' + split.id + ' side by side' })
    : h(SplitDm, { key: 'split:' + split.id, id: split.id });
  return h('div', { className: cx('shell', app.navOpen && 'nav-open', split && 'side-by-side') },
    h(NewYearSky, null),
    h(Sidebar, { wide: wide }),
    h('div', { className: 'scrim', onClick: app.ui.closeNav }),
    main, side,
    h(PipHost, null));
});

/**
 * Tells whether a pane can show its conversation: a joined group or a known PM.
 * @param {Object} s Application state.
 * @param {{view: string, id: string}} t Conversation of the pane.
 */
function paneShown(s, t) { return t.view === 'group' ? !!(s.groups[t.id] && s.groups[t.id].joined) : !!s.dms[t.id]; }

/**
 * Menu entry that opens a conversation beside the main one, absent where two panes do not fit.
 * @param {Object} app Application context.
 * @param {boolean} wide The window has room for two panes.
 * @param {{view: string, id: string}} route Conversation to open.
 */
function splitItem(app, wide, route) {
  return wide && !isPaneOpen(app.state, route.view, route.id) ? { label: 'Open side by side', icon: 'panel', onSelect: function () { app.actions.openSplit(route); } } : null;
}

// Tonight's moon, or the fixed phase chosen in Appearance (index in Torch.moonNames). The startup screen leaves New Year out.
function BrandMark(p) {
  var moon = useApp().state.prefs.sky.moon;
  return h('span', { className: 'brand-mark' }, h(T.Moon, { size: 30, label: true, phase: moon === 'auto' ? undefined : moon / 8 }),
    p.startup ? null : h(NewYearMark, null));
}

function StartupScreen() {
  return h('main', { className: 'main' },
    h('div', { className: 'empty', role: 'status' },
      h(BrandMark, { startup: true }),
      h('p', { className: 'startup' }, h(T.Spinner, null), 'Signing in')));
}

function Sidebar(p) {
  var app = useApp(), s = app.state, r = s.route;
  var cm = useState(null), ctx = cm[0], setCtx = cm[1];
  // Right click on a conversation: its menu at the pointer, where two panes fit.
  function contextMenu(route) {
    return p.wide ? function (e) { e.preventDefault(); setCtx({ at: { x: e.clientX, y: e.clientY }, route: route }); } : undefined;
  }
  var joined = Object.keys(s.groups).map(function (k) { return s.groups[k]; }).filter(function (g) { return g.joined; });
  var favs = joined.filter(function (g) { return g.favorite; }), rest = joined.filter(function (g) { return !g.favorite; });
  var groupsLoading = LIVE && !s.groupsSeen;
  var dmNames = listedDms(s).slice(0, 4);
  var drafted = useDraftMarks(function (m) { return m; });
  function toggle(k) { app.update(function (d) { d.sections[k] = !d.sections[k]; }); }
  function markedLabel(name, key, active) {
    return showsDraft(drafted, key, active) ? h('span', { className: 'nav-draft' }, h('span', { className: 'nav-draft-name' }, name), h(DraftMark)) : name;
  }
  function groupItem(g) {
    var active = isPaneOpen(s, 'group', g.id);
    return h(T.NavItem, {
      key: g.id, label: markedLabel(g.id, groupDraftKey(g.id), active), active: active, unread: g.unread > 0 && !g.muted,
      count: g.mentions || 0, mention: !!g.mentions, muted: g.muted && !g.mentions,
      avatar: h(T.Avatar, { name: g.id, square: true, size: 22, color: g.accent || undefined, style: g.accent ? { color: onAccentOf(g.accent) } : undefined }),
      onClick: function () { app.nav({ view: 'group', id: g.id }); }, onContextMenu: contextMenu({ view: 'group', id: g.id })
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
      app.season ? h(SeasonSky, { season: app.season }) : null,
      h(BrandMark),
      h('span', { className: 'brand-name' }, 'Nightango'),
      h(MenuButton, {
        icon: 'plus', label: 'Join or create a group', items: [
          { label: 'Discover groups', icon: 'compass', onSelect: function () { app.nav({ view: 'discover' }); } },
          { label: 'Create a group…', icon: 'plus', onSelect: function () { app.ui.openCreate(''); } },
          { label: 'New private message…', icon: 'message', onSelect: function () { app.ui.openNewDm(); } }
        ]
      })),
    h('div', { style: { padding: '0 10px 8px' } },
      h('button', { type: 'button', className: 'searchbtn', onClick: app.ui.openPalette },
        h(T.Icon, { name: 'search', size: 15 }), h('span', { className: 'grow', style: { textAlign: 'left' } }, 'Search or jump to'), h('kbd', { className: 'kbd hide-mobile' }, 'Ctrl K'))),
    h('div', { className: 'navlist' },
      h(T.NavItem, { icon: 'compass', label: 'Discover groups', active: r.view === 'discover', onClick: function () { app.nav({ view: 'discover' }); } }),
      h(T.NavItem, { icon: 'message', label: 'Private messages', active: r.view === 'dm' && !r.tab, count: unreadDmCount(s), onClick: function () { app.nav({ view: 'dm', id: null }); } }),
      h(T.NavItem, { icon: 'users', label: 'Friends', active: r.view === 'dm' && r.tab === 'friends', trailing: onlineFriends ? h('span', { className: 'tc-msg-time' }, onlineFriends.toLocaleString('en-US') + ' online') : null, onClick: function () { app.nav({ view: 'dm', id: null, tab: 'friends' }); } }),
      h(T.NavItem, { icon: 'search', label: 'Meet people', active: r.view === 'dm' && r.tab === 'meet', onClick: function () { app.nav({ view: 'dm', id: null, tab: 'meet' }); } }),
      h(T.NavItem, { icon: 'at-sign', label: 'Mentions', active: r.view === 'mentions', onClick: function () { app.nav({ view: 'mentions' }); } }),
      favs.length ? section('favorites', 'Favorites', favs.map(groupItem)) : null,
      groupsLoading || rest.length || !joined.length ? section('groups', 'Groups', groupsLoading ? h(SkeletonRows, { count: 3, avatar: 22, square: true, label: 'Loading groups' })
        : rest.length ? rest.map(groupItem) : h('p', { className: 'pal-empty' }, 'Join a group from Discover.')) : null,
      section('dms', 'Private messages', LIVE && !s.pmLoaded ? h(SkeletonRows, { count: 3, avatar: 22, label: 'Loading private messages' }) : dmNames.length ? dmNames.map(function (n) {
        var u = userOf(s, n), c = s.dms[n], active = isPaneOpen(s, 'dm', n);
        return h(T.NavItem, {
          key: n, label: h(Frag, null, markedLabel(n, dmDraftKey(n), active), presenceSr(u.status)), active: active, unread: c.unread > 0, count: c.unread || 0,
          avatar: h(T.Avatar, { name: n, size: 22, status: u.status, ring: 'var(--sidebar)' }),
          onClick: function () { app.nav({ view: 'dm', id: n }); }, onContextMenu: contextMenu({ view: 'dm', id: n })
        });
      }) : h('p', { className: 'pal-empty' }, 'No conversations yet.'))),
    h('div', { className: 'me' },
      h(MenuButton, {
        up: true, align: 'left', items: [
          { label: 'Online', presence: 'online', checked: s.meStatus === 'online', onSelect: function () { app.actions.setStatus('online'); } },
          { label: 'Idle', presence: 'idle', checked: s.meStatus === 'idle', onSelect: function () { app.actions.setStatus('idle'); } },
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
      h(T.IconButton, { icon: 'sliders', label: 'Settings', onClick: function () { app.nav({ view: 'settings', page: 'appearance' }); } })),
    ctx ? h(MenuButton, {
      open: true, at: ctx.at, align: 'left', onOpenChange: function (o) { if (!o) setCtx(null); },
      renderTrigger: function () { return null; },
      items: [{ label: 'Open', icon: ctx.route.view === 'group' ? 'hash' : 'message', onSelect: function () { app.nav(ctx.route); } }, splitItem(app, p.wide, ctx.route)]
    }) : null);
}
