import { Frag, React, T, h, useEffect, useMemo, useState } from '../core/globals.js';
import { cx } from '../core/util.js';
import { onAccentOf } from '../core/colors.js';
import { SkeletonRows, useApp, useStatePart, useWideLayout } from '../core/ui.js';
import { favoritePeople, isPaneOpen, listedDms, paneShown, shownName, statusLabel, unreadDmCount, userOf } from '../core/selectors.js';
import { NewYearMark, NewYearSky, SeasonSky, SeasonStar, skyMoves } from './season.js';
import { GroupView } from './group.js';
import { DMView, DmThread } from './dm.js';
import { SpaceBar, currentSpace, inCurrentSpace, spacesItem } from './spaces.js';
import { MentionsView } from './mentions.js';
import { Discover } from './discover.js';
import { SettingsView } from '../settings/shell.js';
import { GroupSettingsView } from '../settings/group-view.js';
import { LIVE } from '../core/env.js';
import { favoriteItem } from './chrome.js';
import { DraftMark, dmDraftKey, groupDraftKey, showsDraft, useDraftMarks } from '../core/drafts.js';
import { MenuButton } from '../core/layers.js';
import { presenceSr } from '../core/people-ui.js';
// -- Application shell --------------------------------------------------------

// Memoized: Root renders again for its toasts and dialogs, which leave the shell alone.
export var Shell = React.memo(function Shell() {
  var app = useApp(), s = app.state, r = s.route, main;
  var wide = useWideLayout();
  var split = wide && s.split && paneShown(s, s.split) ? s.split : null;
  // A window too narrow for two panes, or a conversation that went away, closes the pane beside.
  useEffect(function () { if (s.split && !split) app.actions.closeSplit(); }, [!!s.split, !!split]);
  if (r.view === 'settings') return h(SettingsView, { page: r.page });
  if (r.view === 'gsettings') return h(GroupSettingsView, { key: r.id, gid: r.id, page: r.page });
  if (LIVE && !s.groupsSeen) main = h(StartupScreen, null);
  else if (r.view === 'group') main = h(GroupView, { key: r.id, gid: r.id, role: 'main', msgId: r.msgId, markerTs: r.markerTs, compact: !!split });
  else if (r.view === 'dm') main = h(DMView, { id: r.id, tab: r.tab, seek: r.seek, compact: !!split });
  else if (r.view === 'mentions') main = h(MentionsView, null);
  else main = h(Discover, null);
  var side = split ? h(SidePane, { route: split, role: 'beside' }) : null;
  return h('div', { className: cx('shell', app.navOpen && 'nav-open', split && 'side-by-side') },
    h(NewYearSky, null),
    h(Sidebar, { wide: wide }),
    h('div', { className: 'scrim', onClick: app.ui.closeNav }),
    main, side);
});

/**
 * Group or private conversation shown beside the main pane or in the floating window.
 * @param {{route: {view: string, id: string, markerTs: ?number}, role: string}} p Conversation and pane: beside or floating.
 */
export function SidePane(p) {
  var r = p.route, key = p.role + ':' + r.id;
  if (r.view === 'group') return h(GroupView, { key: key, gid: r.id, role: p.role, markerTs: r.markerTs });
  return h('div', { key: key, className: 'main', style: { flexDirection: 'row' } }, h(DmThread, { id: r.id, role: p.role }));
}

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
  var app = useApp(), moon = app.state.prefs.sky.moon;
  return h('span', { className: 'brand-mark' }, h(T.Moon, { size: 30, label: true, phase: moon === 'auto' ? undefined : moon / 8 }),
    app.season === 'christmas' ? h(SeasonStar) : null,
    p.startup ? null : h(NewYearMark, null));
}

// In seconds, as the duration of sky-turn in the stylesheet: the two must stay equal for the stars to start where they stand.
var SIDEREAL_DAY = 86164;
// Stars of the sky band. They turn in the stylesheet: only where the turn stands when they start moving is read here, from the device time.
function BrandSky() {
  var moves = skyMoves(useStatePart(function (s) { return s.prefs; }));
  var turned = useMemo(function () { return Math.round(Date.now() / 1000 % SIDEREAL_DAY); }, [moves]);
  return h('span', { className: 'brand-sky', 'aria-hidden': 'true' }, h('span', { className: 'sky-turn', style: { animationDelay: -turned + 's' } }));
}

function StartupScreen() {
  return h('main', { className: 'main' },
    h('div', { className: 'empty', role: 'status' },
      h(BrandMark, { startup: true }),
      h('p', { className: 'startup' }, h(T.Spinner, null), 'Logging in')));
}

function Sidebar(p) {
  var app = useApp(), s = app.state, r = s.route;
  var cm = useState(null), ctx = cm[0], setCtx = cm[1];
  // Right click on a conversation: its menu at the pointer.
  function contextMenu(route) {
    return function (e) { e.preventDefault(); setCtx({ at: { x: e.clientX, y: e.clientY }, route: route }); };
  }
  var space = currentSpace(s);
  var joined = Object.keys(s.groups).map(function (k) { return s.groups[k]; }).filter(function (g) { return g.joined && inCurrentSpace(s, 'group', g.id); });
  var favs = joined.filter(function (g) { return g.favorite; }), rest = joined.filter(function (g) { return !g.favorite; });
  var groupsLoading = LIVE && !s.groupsSeen, pmsLoading = LIVE && !s.pmLoaded;
  var favPeople = favoritePeople(s).filter(function (n) { return inCurrentSpace(s, 'dm', n); });
  var dmNames = listedDms(s).filter(function (n) { return inCurrentSpace(s, 'dm', n) && !userOf(s, n).favorite; }).slice(0, 4);
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
  function dmItem(n) {
    var u = userOf(s, n), c = s.dms[n], active = isPaneOpen(s, 'dm', n), unread = c ? c.unread : 0;
    return h(T.NavItem, {
      key: 'dm:' + n, label: h(Frag, null, markedLabel(shownName(s, n), dmDraftKey(n), active), presenceSr(u.status)), active: active, unread: unread > 0, count: unread,
      avatar: h(T.Avatar, { name: n, size: 22, status: u.status, ring: 'var(--sidebar)' }),
      // A favorite person may have no conversation yet, or a closed one.
      onClick: function () { app.actions.openDm(n); }, onContextMenu: contextMenu({ view: 'dm', id: n })
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
      h(BrandSky, null),
      app.season ? h(SeasonSky, { season: app.season, south: s.prefs.sky.south }) : null,
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
        h(T.Icon, { name: 'search', size: 16 }), h('span', { className: 'grow', style: { textAlign: 'left' } }, 'Search or jump to'), h('kbd', { className: 'kbd hide-mobile' }, 'Ctrl K'))),
    h(SpaceBar, null),
    h('div', { className: 'navlist' },
      h(T.NavItem, { icon: 'compass', label: 'Discover groups', active: r.view === 'discover', onClick: function () { app.nav({ view: 'discover' }); } }),
      h(T.NavItem, { icon: 'message', label: 'Private messages', active: r.view === 'dm' && !r.tab, count: unreadDmCount(s), onClick: function () { app.nav({ view: 'dm', id: null }); } }),
      h(T.NavItem, { icon: 'users', label: 'Friends', active: r.view === 'dm' && r.tab === 'friends', trailing: onlineFriends ? h('span', { className: 'tc-msg-time' }, onlineFriends.toLocaleString('en-US') + ' online') : null, onClick: function () { app.nav({ view: 'dm', id: null, tab: 'friends' }); } }),
      h(T.NavItem, { icon: 'search', label: 'Meet people', active: r.view === 'dm' && r.tab === 'meet', onClick: function () { app.nav({ view: 'dm', id: null, tab: 'meet' }); } }),
      h(T.NavItem, { icon: 'at-sign', label: 'Mentions', active: r.view === 'mentions', onClick: function () { app.nav({ view: 'mentions' }); } }),
      favs.length || favPeople.length ? section('favorites', 'Favorites', favs.map(groupItem).concat(favPeople.map(dmItem))) : null,
      groupsLoading || rest.length || !joined.length ? section('groups', 'Groups', groupsLoading ? h(SkeletonRows, { count: 3, avatar: 22, square: true, label: 'Loading groups' })
        : rest.length ? rest.map(groupItem) : h('p', { className: 'pal-empty' }, space ? 'No group in ' + space.name + '. Add one from its menu, Spaces…' : 'Join a group from Discover.')) : null,
      pmsLoading || dmNames.length || !favPeople.length ? section('dms', 'Private messages', pmsLoading ? h(SkeletonRows, { count: 3, avatar: 22, label: 'Loading private messages' })
        : dmNames.length ? dmNames.map(dmItem) : h('p', { className: 'pal-empty' }, space ? 'No private message in ' + space.name + '.' : 'No conversations yet.')) : null),
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
            h(T.Avatar, { name: s.me, size: 36, status: s.meStatus, ring: 'var(--sidebar)' }),
            h('span', { className: 'me-text' }, h('span', { style: { fontWeight: 600, fontSize: 'var(--font-size-body-sm)' } }, shownName(s, s.me)), h('span', { style: { fontSize: 'var(--font-size-caption)', color: 'var(--text-3)' } }, statusLabel(s.meStatus))));
        }
      }),
      h(T.IconButton, { icon: 'sliders', label: 'Settings', onClick: function () { app.nav({ view: 'settings', page: 'appearance' }); } })),
    ctx ? h(MenuButton, {
      open: true, at: ctx.at, align: 'left', onOpenChange: function (o) { if (!o) setCtx(null); },
      renderTrigger: function () { return null; },
      items: ctx.route.view === 'group'
        ? [{ label: 'Open', icon: 'hash', onSelect: function () { app.nav(ctx.route); } }, splitItem(app, p.wide, ctx.route), favoriteItem(app, ctx.route, s.groups[ctx.route.id].favorite), spacesItem(app, ctx.route)]
        : [{ label: 'Open', icon: 'message', onSelect: function () { app.actions.openDm(ctx.route.id); } }, s.dms[ctx.route.id] ? splitItem(app, p.wide, ctx.route) : null, favoriteItem(app, ctx.route, userOf(s, ctx.route.id).favorite), spacesItem(app, ctx.route)]
    }) : null);
}
