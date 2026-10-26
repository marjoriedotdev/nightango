/* ---------- Écrans du mode live : réglages branchés sur Chatango par le client BetterChatango ---------- */

function liveSelect(id, label, value, options, onChange, disabled) {
  return h('select', { id: id, className: 'tc-input', style: { width: 'auto' }, 'aria-label': label, value: value, disabled: !!disabled, onChange: function (e) { onChange(+e.target.value); } },
    options.map(function (o) { return h('option', { key: o[0], value: o[0] }, o[1]); }));
}
function withCurrent(options, value, label) {
  return value == null || options.some(function (o) { return o[0] === value; }) ? options : options.concat([[value, label(value)]]);
}
function chatangoLink(label) {
  return h('a', { className: 'tc-btn tc-btn-sm', href: 'https://chatango.com', target: '_blank', rel: 'noopener noreferrer', style: { textDecoration: 'none' } }, label, h(T.Icon, { name: 'external', size: 14 }));
}

function GroupSettingsViewLive(p) {
  var app = useApp(), s = app.state, g = s.groups[p.gid], me = s.me;
  var sig = g ? JSON.stringify(g.settings) : '';
  var a = useState(function () { return g ? JSON.parse(sig) : null; }), draft = a[0], setDraft = a[1];
  var b = useState(false), pending = b[0], setPending = b[1];
  var synced = useRef(sig);
  // Version serveur à partir de laquelle le brouillon a été construit : seuls les écarts avec elle sont envoyés.
  var base = useRef(sig);
  var saving = useRef(false);
  var scrollRef = useRef(null);
  useEffect(function () { if (g) app.actions.requestGroupSettings(g.id); }, [p.gid]);
  // Les réponses de Chatango arrivent après l'ouverture : on recale le brouillon tant qu'il n'est pas modifié.
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
      app.ui.toast("Chatango didn't confirm every change. The page shows the group's current settings.");
    }, CONFIRM_TIMEOUT);
    return function () { clearTimeout(t); };
  }, [pending]);
  if (!g || !draft) return h('div', { className: 'empty' }, h('h2', null, 'This group is gone'), h(T.Button, { onClick: app.actions.backToChat }, 'Back to chat'));

  var myRole = roleOf(g, me), perms = groupRights(g, me), owner = myRole === 'owner';
  var sections = [
    { title: 'General', items: [['overview', 'Overview']].concat(owner || perms.editAnnouncement ? [['announcement', 'Announcement']] : []) },
    { title: 'Moderation', items: [['automod', 'AutoMod'], ['media', 'Media and links'], ['bans', 'Bans']].concat(owner || perms.modLog ? [['audit', 'Audit log']] : []) },
    { title: 'People', items: [['roles', 'Staff and roles'], ['members', 'Members'], ['invites', 'Invites']] }
  ];
  var page = listedPage(sections, p.page);
  var dirty = JSON.stringify(draft) !== sig;
  function edit(fn) { setDraft(function (d0) { var d1 = JSON.parse(JSON.stringify(d0)); fn(d1); return d1; }); }
  function leave() {
    if (dirty && !pending) app.ui.confirm({ title: 'Discard unsaved changes?', body: 'Your changes to #' + g.id + ' are not saved yet.', confirmLabel: 'Discard', danger: true, onConfirm: function () { app.nav({ view: 'group', id: g.id }); } });
    else app.nav({ view: 'group', id: g.id });
  }
  var props = { g: g, draft: draft, edit: edit, myRole: myRole, perms: perms, manage: owner || perms.manageMods, scrollRef: scrollRef };
  var map = { overview: GSOverview, announcement: GSAnnouncementLive, automod: GSAutoModLive, media: GSMediaLive, bans: GSBansLive, audit: GSAuditLive, roles: GSStaff, members: GSMembers, invites: GSInvites };
  return h(SettingsShell, {
    navLabel: 'Group settings', sections: sections, page: page, onBack: leave, scrollRef: scrollRef,
    onPage: function (pg) { app.nav({ view: 'gsettings', id: g.id, page: pg }); },
    header: h('div', { className: 'snav-head' },
      h(T.Avatar, { name: g.id, square: true, size: 32 }),
      h('span', { style: { display: 'flex', flexDirection: 'column', lineHeight: 1.25, minWidth: 0 } }, h('span', { style: { fontWeight: 600 } }, g.id), h('span', { style: { fontSize: 12, color: 'var(--text-3)' } }, 'Group settings · ' + (ROLE_LONG[myRole] || 'Member')))),
    footer: perms.closeGroup ? h(T.NavItem, {
      icon: 'lock', label: g.closed ? 'Reopen group' : 'Close group',
      onClick: function () { if (g.closed) app.actions.setClosed(g.id, false); else app.ui.confirm({ title: 'Close #' + g.id + '?', body: 'Nobody can post until staff reopen it. Members stay in the group.', confirmLabel: 'Close group', danger: true, onConfirm: function () { app.actions.setClosed(g.id, true); } }); }
    }) : null
  },
    h(map[page], Object.assign({ key: page }, props)),
    pending ? h('div', { style: { maxWidth: 1040, paddingBottom: 16 } }, h(T.Banner, { icon: 'info' }, 'Waiting for Chatango to confirm your changes.'))
      : dirty ? h('div', { style: { maxWidth: 1040, paddingBottom: 16 } }, h(T.SaveBar, {
        onDiscard: function () { base.current = sig; setDraft(JSON.parse(sig)); },
        onSave: function () {
          if (saving.current) return;
          if (app.actions.saveGroupSettings(g.id, draft, JSON.parse(base.current))) { saving.current = true; setPending(true); }
          else { base.current = sig; setDraft(JSON.parse(sig)); }
        }
      }, 'Unsaved changes to #' + g.id)) : null);
}
