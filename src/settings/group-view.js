/* ---------- Réglages de groupe ---------- */
function GroupSettingsView(p) {
  if (LIVE) return h(GroupSettingsViewLive, p);
  var app = useApp(), s = app.state, g = s.groups[p.gid], me = s.me;
  var a = useState(function () { return g ? JSON.parse(JSON.stringify(g.settings)) : null; }), draft = a[0], setDraft = a[1];
  if (!g) return h('div', { className: 'empty' }, h('h2', null, 'This group is gone'), h(T.Button, { onClick: app.actions.backToChat }, 'Back to chat'));
  var myRole = roleOf(g, me), manage = canManage(g, me), perms = myRole === 'owner' ? allPerms(true) : (g.settings.roles[myRole] || allPerms(false));
  var dirty = JSON.stringify(draft) !== JSON.stringify(g.settings);
  var sections = manage
    ? [{ title: 'General', items: [['overview', 'Overview'], ['announcement', 'Announcement']] }, { title: 'Moderation', items: [['automod', 'AutoMod'], ['media', 'Media and links'], ['bans', 'Bans'], ['audit', 'Audit log']] }, { title: 'People', items: [['roles', 'Staff and roles'], ['members', 'Members'], ['invites', 'Invites']] }]
    : [{ title: 'Moderation', items: [['automod', 'AutoMod'], ['bans', 'Bans']].concat(perms.modLog ? [['audit', 'Audit log']] : []) }, { title: 'People', items: [['members', 'Members'], ['invites', 'Invites']] }];
  var page = listedPage(sections, p.page);
  function edit(fn) { setDraft(function (d0) { var d1 = JSON.parse(JSON.stringify(d0)); fn(d1); return d1; }); }
  function leave() {
    if (dirty) app.ui.confirm({ title: 'Discard unsaved changes?', body: 'Your changes to #' + g.id + ' are not saved yet.', confirmLabel: 'Discard', danger: true, onConfirm: function () { app.nav({ view: 'group', id: g.id }); } });
    else app.nav({ view: 'group', id: g.id });
  }
  var props = { g: g, draft: draft, edit: edit, myRole: myRole, perms: perms, manage: manage };
  var map = { overview: GSOverview, announcement: GSAnnouncement, automod: GSAutoMod, media: GSMedia, bans: GSBans, audit: GSAudit, roles: GSRoles, members: GSMembers, invites: GSInvites };
  var canClose = myRole === 'owner' || (g.settings.roles[myRole] && g.settings.roles[myRole].closeGroup);
  return h(SettingsShell, {
    navLabel: 'Group settings', sections: sections, page: page, onBack: leave,
    onPage: function (pg) { app.nav({ view: 'gsettings', id: g.id, page: pg }); },
    header: h('div', { className: 'snav-head' },
      h(T.Avatar, { name: g.id, square: true, size: 32 }),
      h('span', { style: { display: 'flex', flexDirection: 'column', lineHeight: 1.25, minWidth: 0 } }, h('span', { style: { fontWeight: 600 } }, g.id), h('span', { style: { fontSize: 12, color: 'var(--text-3)' } }, 'Group settings · ' + ROLE_LONG[myRole]))),
    footer: canClose ? h(T.NavItem, {
      icon: 'lock', label: g.closed ? 'Reopen group' : 'Close group',
      onClick: function () { if (g.closed) app.actions.setClosed(g.id, false); else app.ui.confirm({ title: 'Close #' + g.id + '?', body: 'Nobody can post until staff reopen it. Members stay in the group.', confirmLabel: 'Close group', danger: true, onConfirm: function () { app.actions.setClosed(g.id, true); } }); }
    }) : null
  },
    h(map[page], Object.assign({ key: page }, props)),
    dirty ? h('div', { style: { maxWidth: 1040, paddingBottom: 16 } }, h(T.SaveBar, {
      onDiscard: function () { setDraft(JSON.parse(JSON.stringify(g.settings))); },
      onSave: function () { app.actions.saveGroupSettings(g.id, draft); }
    }, 'Unsaved changes to #' + g.id)) : null);
}
