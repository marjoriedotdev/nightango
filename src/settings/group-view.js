import { T, h, useEffect, useRef, useState } from '../core/globals.js';
import { LIVE } from '../core/env.js';
import { ROLE_LONG } from '../core/roles.js';
import { groupRights, roleOf } from '../core/selectors.js';
import { useApp } from '../core/ui.js';
import { CONFIRM_TIMEOUT } from '../core/util.js';
import { GSAnnouncement, GSAudit, GSAutoMod, GSBans, GSMedia, GSOverview } from './group-pages.js';
import { GSInvites, GSMembers, GSStaff } from './group-staff.js';
import { SettingsShell, listedPage } from './kit.js';
import { GSAnnouncementLive, GSAutoModLive, GSBansLive, GSMediaLive } from './live-group-pages.js';
import { GSAuditLive } from './live-group-staff.js';
// -- Group settings -----------------------------------------------------------

var PAGES = { overview: GSOverview, announcement: GSAnnouncement, automod: GSAutoMod, media: GSMedia, bans: GSBans, audit: GSAudit, roles: GSStaff, members: GSMembers, invites: GSInvites };
var LIVE_PAGES = { overview: GSOverview, announcement: GSAnnouncementLive, automod: GSAutoModLive, media: GSMediaLive, bans: GSBansLive, audit: GSAuditLive, roles: GSStaff, members: GSMembers, invites: GSInvites };

/**
 * Settings of a group the user is staff of: one page per section and a draft saved at once.
 * In live, the draft follows Chatango's answers while it is not edited, and a save waits for Chatango to confirm it.
 * @param {{gid: string, page: ?string}} p Group and page shown.
 */
export function GroupSettingsView(p) {
  var app = useApp(), s = app.state, g = s.groups[p.gid], me = s.me;
  var sig = g ? JSON.stringify(g.settings) : '';
  var a = useState(function () { return g ? JSON.parse(sig) : null; }), draft = a[0], setDraft = a[1];
  var b = useState(false), pending = b[0], setPending = b[1];
  var synced = useRef(sig);
  // Server version the draft was built from: only the differences from it are sent.
  var base = useRef(sig);
  var saving = useRef(false);
  var scrollRef = useRef(null);
  useEffect(function () { if (LIVE && g) app.actions.requestGroupSettings(g.id); }, [p.gid]);
  // Chatango's answers arrive after the page opens: the draft is realigned as long as it is not edited.
  useEffect(function () {
    if (!g) return;
    if (pending || JSON.stringify(draft) === synced.current) { setDraft(JSON.parse(sig)); setPending(false); base.current = sig; saving.current = false; }
    synced.current = sig;
  }, [sig]);
  useEffect(function () {
    if (!pending) return undefined;
    var t = setTimeout(function () {
      setPending(false);
      saving.current = false;
      base.current = synced.current;
      setDraft(JSON.parse(synced.current));
      app.ui.toast("Chatango didn't confirm every change. The page shows the group's current settings.", { tone: 'error' });
    }, CONFIRM_TIMEOUT);
    return function () { clearTimeout(t); };
  }, [pending]);
  if (!g || !draft) return h('div', { className: 'empty' }, h('h2', null, 'This group is gone'), h(T.Button, { onClick: app.actions.backToChat }, 'Back to chat'));

  var myRole = roleOf(g, me), perms = groupRights(g, me), owner = myRole === 'owner', manage = owner || perms.manageMods;
  var sections = !LIVE ? (manage
    ? [{ title: 'General', items: [['overview', 'Overview'], ['announcement', 'Announcement']] }, { title: 'Moderation', items: [['automod', 'AutoMod'], ['media', 'Media and links'], ['bans', 'Bans'], ['audit', 'Audit log']] }, { title: 'People', items: [['roles', 'Staff and roles'], ['members', 'Members'], ['invites', 'Invites']] }]
    : [{ title: 'Moderation', items: [['automod', 'AutoMod'], ['bans', 'Bans']].concat(perms.modLog ? [['audit', 'Audit log']] : []) }, { title: 'People', items: [['members', 'Members'], ['invites', 'Invites']] }])
    : [
    { title: 'General', items: [['overview', 'Overview']].concat(owner || perms.editAnnouncement ? [['announcement', 'Announcement']] : []) },
    { title: 'Moderation', items: [['automod', 'AutoMod'], ['media', 'Media and links'], ['bans', 'Bans']].concat(owner || perms.modLog ? [['audit', 'Audit log']] : []) },
    { title: 'People', items: [['roles', 'Staff and roles'], ['members', 'Members'], ['invites', 'Invites']] }
  ];
  var page = listedPage(sections, p.page);
  var dirty = JSON.stringify(draft) !== sig;
  function edit(fn) { setDraft(function (d0) { var d1 = JSON.parse(JSON.stringify(d0)); fn(d1); return d1; }); }
  function leave() {
    if (dirty && !pending) app.ui.confirm({ title: 'Discard unsaved changes?', body: 'Your changes to #' + g.id + " aren't saved yet.", confirmLabel: 'Discard', danger: true, onConfirm: function () { app.nav({ view: 'group', id: g.id }); } });
    else app.nav({ view: 'group', id: g.id });
  }
  var props = { g: g, draft: draft, edit: edit, myRole: myRole, perms: perms, manage: manage, scrollRef: scrollRef };
  var map = LIVE ? LIVE_PAGES : PAGES;
  return h(SettingsShell, {
    navLabel: 'Group settings', sections: sections, page: page, onBack: leave, scrollRef: scrollRef,
    onPage: function (pg) { app.nav({ view: 'gsettings', id: g.id, page: pg }); },
    header: h('div', { className: 'snav-head' },
      h(T.Avatar, { name: g.id, square: true, size: 36 }),
      h('span', { style: { display: 'flex', flexDirection: 'column', lineHeight: 1.25, minWidth: 0 } }, h('span', { style: { fontWeight: 600 } }, g.id), h('span', { style: { fontSize: 'var(--font-size-caption)', color: 'var(--text-3)' } }, 'Group settings · ' + (ROLE_LONG[myRole] || 'Member')))),
    footer: perms.closeGroup ? h(T.NavItem, {
      icon: 'lock', label: g.closed ? 'Reopen group' : 'Close group',
      onClick: function () { if (g.closed) app.actions.setClosed(g.id, false); else app.ui.confirm({ title: 'Close #' + g.id + '?', body: 'Nobody can post until staff reopen it. Members stay in the group.', confirmLabel: 'Close group', danger: true, onConfirm: function () { app.actions.setClosed(g.id, true); } }); }
    }) : null
  },
    h(map[page], Object.assign({ key: page }, props)),
    pending ? h('div', { style: { maxWidth: 'var(--size-page-wide)', paddingBottom: 16 } }, h(T.Banner, { icon: 'info' }, 'Waiting for Chatango to confirm your changes.'))
      : dirty ? h('div', { style: { maxWidth: 'var(--size-page-wide)', paddingBottom: 16 } }, h(T.SaveBar, {
        onDiscard: function () { base.current = sig; setDraft(JSON.parse(sig)); },
        onSave: function () {
          // The prototype applies the draft at once: nothing to wait for.
          if (!LIVE) { app.actions.saveGroupSettings(g.id, draft); return; }
          if (saving.current) return;
          if (app.actions.saveGroupSettings(g.id, draft, JSON.parse(base.current))) { saving.current = true; setPending(true); }
          else { base.current = sig; setDraft(JSON.parse(sig)); }
        }
      }, 'Unsaved changes to #' + g.id)) : null);
}
