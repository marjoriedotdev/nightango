function GSRoles(p) {
  var app = useApp(), g = p.g, draft = p.draft, myRole = p.myRole;
  var a = useState('mod'), role = a[0], setRole = a[1];
  var b = useState(false), manageOpen = b[0], setManageOpen = b[1];
  function holders(r) { return Object.keys(draft.staff).filter(function (n) { return draft.staff[n] === r; }); }
  function canEditRole(r) { if (r === 'owner') return false; if (myRole === 'owner' || myRole === 'coowner') return true; return myRole === 'admin' && r === 'mod'; }
  var editable = canEditRole(role);
  var locks = ROLE_LOCKS[role] || [];
  var rolePerms = role === 'owner' ? allPerms(true) : draft.roles[role];
  var groupsOf = ['Visibility', 'Moderation', 'Administration'];
  return h(Page, {
    title: 'Staff and roles', lede: 'Choose what each role can do in #' + g.id + '. The owner always has every permission.', wide: true
  },
    h('div', { className: 'split' },
      h('section', { 'aria-label': 'Roles', className: 'tc-section', style: { flex: '1 1 240px', alignSelf: 'flex-start' } },
        h('div', { className: 'roles' }, ['owner', 'coowner', 'admin', 'mod'].map(function (r) {
          var n = holders(r).length;
          return h('button', { key: r, type: 'button', className: 'role-btn', 'aria-current': String(role === r), onClick: function () { setRole(r); } },
            h('span', { className: 'role-ico' }, h(T.Icon, { name: r === 'owner' ? 'crown' : 'shield', size: 15 })),
            h('span', { className: 'grow', style: { display: 'flex', flexDirection: 'column', lineHeight: 1.3 } }, h('span', { style: { fontWeight: 500, color: 'var(--text)' } }, ROLE_LONG[r]), h('span', { style: { fontSize: 12, color: 'var(--text-3)' } }, r === 'owner' ? holders('owner').join(', ') || 'Nobody' : n ? plural(n, 'member', 'members') : 'No members')),
            h(T.Icon, { name: 'chevron-right', size: 14, style: { color: 'var(--text-3)' } }));
        }))),
      h('div', { className: 'grow' },
        h('section', { className: 'tc-section', 'aria-label': ROLE_LONG[role], style: { padding: '16px 20px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px 16px' } },
          h('div', { style: { flex: '1 1 240px' } }, h('h2', { style: { margin: '0 0 2px', fontSize: 17, fontWeight: 600 } }, ROLE_LONG[role]), h('p', { className: 'muted', style: { margin: 0, fontSize: 13 } }, ROLE_DESC[role])),
          h('div', { style: { display: 'flex', alignItems: 'center', gap: 10 } },
            h('span', { style: { fontSize: 13, color: 'var(--text-2)' } }, holders(role).join(', ') || 'No members'),
            role !== 'owner' && editable ? h(T.Button, { size: 'sm', onClick: function () { setManageOpen(true); } }, 'Manage') : null)),
        !editable && role !== 'owner' ? h(T.Banner, { icon: 'lock' }, 'Only the owner and co-owners can change the ' + ROLE_LONG[role] + ' role.') : null,
        groupsOf.map(function (grp) {
          var list = PERMS.filter(function (x) { return x.group === grp; });
          var allLocked = list.every(function (x) { return locks.indexOf(x.key) >= 0; });
          return h(T.SettingsSection, { key: grp, title: grp, headerAside: allLocked && role !== 'owner' ? h(T.Badge, { icon: 'lock' }, 'Owner and above') : null },
            list.map(function (x) {
              var locked = role === 'owner' || locks.indexOf(x.key) >= 0 || !editable;
              return h(T.SettingRow, {
                key: x.key, title: x.title, description: x.desc,
                badge: x.sensitive ? h('span', { style: { marginLeft: 8 } }, h(T.Badge, { tone: 'accent' }, 'Sensitive')) : null,
                control: h(T.Switch, { checked: !!rolePerms[x.key], disabled: locked, onChange: function (e) { var v = e.target.checked; p.edit(function (d) { d.roles[role][x.key] = v; }); } })
              });
            }));
        }))),
    manageOpen ? h(ManageRoleDialog, { g: g, role: role, draft: draft, edit: p.edit, onClose: function () { setManageOpen(false); } }) : null);
}

function ManageRoleDialog(p) {
  var app = useApp(), g = p.g, role = p.role;
  var a = useState(''), pickName = a[0], setPick = a[1];
  var holders = Object.keys(p.draft.staff).filter(function (n) { return p.draft.staff[n] === role; });
  var candidates = g.members.filter(function (n) { return !p.draft.staff[n] && n !== app.state.me; });
  return h(Dialog, { title: ROLE_LONG[role] + 's in #' + g.id, description: 'Changes are saved with the rest of the page.', onClose: p.onClose, footer: h(T.Button, { variant: 'primary', onClick: p.onClose }, 'Done') },
    h('div', { className: 'dialog-body', style: { gap: 8 } },
      holders.length ? holders.map(function (n) {
        return h('div', { key: n, style: { display: 'flex', alignItems: 'center', gap: 10 } }, h(T.Avatar, { name: n, size: 28 }), h('span', { className: 'grow' }, n),
          h(T.Button, { size: 'sm', variant: 'ghost', onClick: function () { p.edit(function (d) { delete d.staff[n]; }); } }, 'Remove'));
      }) : h('p', { className: 'muted', style: { margin: 0 } }, 'Nobody has this role yet.'),
      h('div', { style: { display: 'flex', alignItems: 'flex-end', gap: 10, marginTop: 8 } },
        h('div', { className: 'tc-field', style: { flex: 1 } }, h('label', { className: 'tc-label', htmlFor: 'add-staff' }, 'Add a member'),
          h('select', { id: 'add-staff', className: 'tc-input', value: pickName, onChange: function (e) { setPick(e.target.value); } }, h('option', { value: '' }, 'Choose a member'), candidates.map(function (n) { return h('option', { key: n, value: n }, n); }))),
        h(T.Button, { disabled: !pickName, style: { height: 38 }, onClick: function () { var n = pickName; p.edit(function (d) { d.staff[n] = role; }); setPick(''); } }, 'Add'))));
}

function GSMembers(p) {
  var app = useApp(), s = app.state, g = p.g;
  var a = useState(''), q = a[0], setQ = a[1];
  var list = g.members.filter(function (n) { return !q || n.indexOf(q.toLowerCase()) >= 0; });
  var canMods = LIVE ? p.perms.manageMods : (p.myRole === 'owner' || p.myRole === 'coowner' || p.myRole === 'admin');
  return h(Page, { title: 'Members', lede: g.members.length + ' members and ' + g.guests + ' guests right now.' },
    h(T.TextField, { id: 'mem-q', label: 'Search members', type: 'search', value: q, onChange: function (e) { setQ(e.target.value); } }),
    h(T.SettingsSection, null, list.length ? list.map(function (n, i) {
      var r = p.draft.staff[n], isMe = n === s.me, status = isMe ? s.meStatus : userOf(s, n).status;
      return h('div', { key: n, className: 'lrow', style: i ? null : { borderTop: 0 } },
        h(T.Avatar, { name: n, size: 28, status: status, ring: 'var(--panel)' }),
        h('span', { className: 'grow' }, h('span', { className: 'lrow-title' }, n), h('span', { className: 'lrow-sub' }, (r ? ROLE_LONG[r] + ' · ' : '') + statusLabel(status))),
        youBadge(isMe),
        isMe || r === 'owner' ? null : h(MenuButton, {
          label: 'Actions for ' + n, items: [
            { label: 'View profile', icon: 'users', onSelect: function () { app.ui.openProfile(n, g.id); } },
            canMods && !r ? { label: 'Make moderator', icon: 'shield', onSelect: function () { p.edit(function (d) { d.staff[n] = 'mod'; if (LIVE) d.modFlags[n] = permsToFlags(defaultRoles().mod, 0); }); app.ui.toast(n + ' will be a moderator once you save.'); } } : null,
            canMods && (r === 'mod' || (LIVE && r === 'admin')) ? { label: 'Remove from staff', icon: 'user-minus', onSelect: function () { p.edit(function (d) { delete d.staff[n]; if (LIVE) delete d.modFlags[n]; }); app.ui.toast(n + ' leaves staff once you save.'); } } : null,
            { divider: true },
            { label: 'Ban', icon: 'ban', danger: true, onSelect: function () { app.ui.ban(n, g.id); } }
          ]
        }));
    }) : h('p', { className: 'pal-empty' }, 'No member matches.')));
}

function GSInvites(p) {
  var app = useApp(), link = 'https://' + p.g.id + '.chatango.com';
  return h(Page, { title: 'Invites', lede: 'Anyone with the link can join. Banned members still cannot.' },
    h(T.SettingsSection, { title: 'Invite link', padded: true },
      h('div', { style: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 } },
        h('input', { className: 'tc-input mono', style: { flex: '1 1 260px' }, readOnly: true, value: link, 'aria-label': 'Invite link', onFocus: function (e) { e.target.select(); } }),
        h(T.Button, { variant: 'primary', icon: 'link', onClick: function () { copyText(link, function (ok) { app.ui.toast(ok ? 'Invite link copied.' : 'Copy failed. Select the link and copy it.'); }); } }, 'Copy link'))));
}
