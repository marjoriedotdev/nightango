/* ---------- Coque de l'application ---------- */
function MobileNavButton() {
  var app = useApp();
  return h(T.IconButton, { icon: 'menu', label: 'Open navigation', className: 'only-mobile', onClick: app.ui.openNav });
}

/**
 * En-tête titré d'une page principale, avec le bouton de navigation mobile.
 * @param {string} title Titre de la page.
 */
function pageHeader(title) {
  return h('header', { className: 'topbar' }, h(MobileNavButton, null), h('h1', { className: 'grow' }, title));
}

/**
 * En-tête titré d'une colonne de droite.
 * @param {string} title Titre de la colonne.
 */
function columnHeader(title) {
  return h('header', { className: 'topbar col-head' }, h('h2', { className: 'grow' }, title));
}

function Shell() {
  var app = useApp(), r = app.state.route, main;
  if (r.view === 'settings') return h(SettingsView, { page: r.page });
  if (r.view === 'gsettings') return h(GroupSettingsView, { key: r.id, gid: r.id, page: r.page });
  if (LIVE && !app.state.groupsSeen) main = h(StartupScreen, null);
  else if (r.view === 'group') main = h(GroupView, { key: r.id, gid: r.id, msgId: r.msgId });
  else if (r.view === 'dm') main = h(DMView, { id: r.id, tab: r.tab, seek: r.seek });
  else if (r.view === 'mentions') main = h(MentionsView, null);
  else main = h(Discover, null);
  return h('div', { className: cx('shell', app.navOpen && 'nav-open') },
    h(Sidebar, null),
    h('div', { className: 'scrim', onClick: app.ui.closeNav }),
    main);
}

// La lune de ce soir, ou la phase fixe choisie dans Appearance (rang dans Torch.moonNames).
function BrandMark() {
  var moon = useApp().state.prefs.sky.moon;
  return h('span', { className: 'brand-mark' }, h(T.Moon, { size: 30, label: true, phase: moon === 'auto' ? undefined : moon / 8 }));
}

function StartupScreen() {
  return h('main', { className: 'main' },
    h('div', { className: 'empty', role: 'status' },
      h(BrandMark),
      h('p', { className: 'startup' }, h(T.Spinner, null), 'Signing in')));
}

function Sidebar() {
  var app = useApp(), s = app.state, r = s.route;
  var joined = Object.keys(s.groups).map(function (k) { return s.groups[k]; }).filter(function (g) { return g.joined; });
  var favs = joined.filter(function (g) { return g.favorite; }), rest = joined.filter(function (g) { return !g.favorite; });
  var groupsLoading = LIVE && !s.groupsSeen;
  var dmNames = listedDms(s).slice(0, 4);
  function toggle(k) { app.update(function (d) { d.sections[k] = !d.sections[k]; }); }
  function groupItem(g) {
    return h(T.NavItem, {
      key: g.id, label: g.id, active: r.view === 'group' && r.id === g.id, unread: g.unread > 0 && !g.muted,
      count: g.mentions || 0, mention: !!g.mentions, muted: g.muted && !g.mentions,
      avatar: h(T.Avatar, { name: g.id, square: true, size: 22 }),
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
      h(T.NavItem, { icon: 'users', label: 'Friends', active: r.view === 'dm' && r.tab === 'friends', trailing: onlineFriends ? h('span', { className: 'tc-msg-time' }, onlineFriends + ' online') : null, onClick: function () { app.nav({ view: 'dm', id: null, tab: 'friends' }); } }),
      h(T.NavItem, { icon: 'search', label: 'Meet people', active: r.view === 'dm' && r.tab === 'meet', onClick: function () { app.nav({ view: 'dm', id: null, tab: 'meet' }); } }),
      h(T.NavItem, { icon: 'at-sign', label: 'Mentions', active: r.view === 'mentions', onClick: function () { app.nav({ view: 'mentions' }); } }),
      favs.length ? section('favorites', 'Favorites', favs.map(groupItem)) : null,
      groupsLoading || rest.length || !joined.length ? section('groups', 'Groups', groupsLoading ? h(SkeletonRows, { count: 3, avatar: 22, square: true, label: 'Loading groups' })
        : rest.length ? rest.map(groupItem) : h('p', { className: 'pal-empty' }, 'Join a group from Discover.')) : null,
      section('dms', 'Private messages', LIVE && !s.pmLoaded ? h(SkeletonRows, { count: 3, avatar: 22, label: 'Loading private messages' }) : dmNames.length ? dmNames.map(function (n) {
        var u = userOf(s, n), c = s.dms[n];
        return h(T.NavItem, {
          key: n, label: h(Frag, null, n, presenceSr(u.status)), active: r.view === 'dm' && r.id === n, unread: c.unread > 0, count: c.unread || 0,
          avatar: h(T.Avatar, { name: n, size: 22, status: u.status, ring: 'var(--sidebar)' }),
          onClick: function () { app.nav({ view: 'dm', id: n }); }
        });
      }) : h('p', { className: 'pal-empty' }, 'No conversations yet.'))),
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
