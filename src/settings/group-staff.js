/**
 * Staff and roles page in live and in the prototype: the owner then each moderator with their Chatango permissions.
 * @param {{g: Object, draft: Object, edit: Function, myRole: ?string, perms: Object}} p Group, settings draft, draft edit, role and permissions of the user.
 */
function GSStaff(p) {
  var app = useApp(), g = p.g, draft = p.draft;
  var owner = Object.keys(draft.staff).filter(function (n) { return draft.staff[n] === 'owner'; })[0] || null;
  var names = Object.keys(draft.modFlags || {}).sort();
  var a = useState(names[0] || null), selected = a[0], setSel = a[1];
  var b = useState(''), add = b[0], setAdd = b[1];
  var c = useState(''), err = c[0], setErr = c[1];
  var sel = selected && names.indexOf(selected) >= 0 ? selected : names[0] || null;
  var canEdit = p.myRole === 'owner' || p.perms.manageMods;
  function setPerms(n, perms) { p.edit(function (d) { d.modFlags[n] = permsToFlags(perms, d.modFlags[n]); d.staff[n] = roleOfFlags(d.modFlags[n]); }); }
  function addMod() {
    var n = add.trim().toLowerCase();
    if (!/^[a-z0-9_-]{1,20}$/.test(n)) { setErr('Enter a Chatango username.'); return; }
    if (n === owner) { setErr(n + ' owns the group.'); return; }
    if (draft.modFlags[n] != null) { setErr(n + ' is already on staff.'); return; }
    p.edit(function (d) { d.modFlags[n] = permsToFlags(defaultRoles().mod, 0); d.staff[n] = 'mod'; });
    setAdd(''); setErr(''); setSel(n);
  }
  function remove(n) { p.edit(function (d) { delete d.modFlags[n]; delete d.staff[n]; }); }
  var perms = sel ? flagsToPerms(draft.modFlags[sel]) : null;
  var colStyle = { display: 'flex', flexDirection: 'column', lineHeight: 1.3 };
  return h(Page, { title: 'Staff and roles', lede: 'Chatango sets permissions per moderator. Those who can change group settings show as admins.', wide: true },
    canEdit ? null : h(T.Banner, { icon: 'lock' }, 'Only the owner and moderators allowed to manage moderators can change staff.'),
    h('div', { className: 'split' },
      h('section', { 'aria-label': 'Staff', className: 'tc-section', style: { flex: '1 1 240px', alignSelf: 'flex-start' } },
        h('div', { className: 'roles' },
          owner ? h('div', { className: 'role-btn', style: { cursor: 'default' } },
            h('span', { className: 'role-ico' }, h(T.Icon, { name: 'crown', size: 15 })),
            h('span', { className: 'grow', style: colStyle }, h('span', { style: { fontWeight: 500, color: 'var(--text)' } }, owner), h('span', { style: { fontSize: 12, color: 'var(--text-3)' } }, 'Owner'))) : null,
          names.map(function (n) {
            return h('button', { key: n, type: 'button', className: 'role-btn', 'aria-current': String(sel === n), onClick: function () { setSel(n); } },
              h('span', { className: 'role-ico' }, h(T.Icon, { name: 'shield', size: 15 })),
              h('span', { className: 'grow', style: colStyle }, h('span', { style: { fontWeight: 500, color: 'var(--text)' } }, n), h('span', { style: { fontSize: 12, color: 'var(--text-3)' } }, ROLE_LONG[roleOfFlags(draft.modFlags[n])])),
              h(T.Icon, { name: 'chevron-right', size: 14, style: { color: 'var(--text-3)' } }));
          })),
        canEdit ? h('div', { style: { padding: '12px 14px 14px', borderTop: '1px solid var(--divider)' } },
          h(T.TextField, {
            id: 'add-mod', label: 'Add a moderator', value: add, error: err || undefined, autoComplete: 'off', onChange: function (e) { setAdd(e.target.value); setErr(''); }, onKeyDown: function (e) { if (e.key === 'Enter') addMod(); },
            action: h(T.Button, { onClick: addMod }, 'Add')
          })) : null),
      h('div', { className: 'grow' }, sel ? h(Frag, null,
        h('section', { className: 'tc-section', 'aria-label': sel, style: { padding: '16px 20px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px 16px' } },
          h('div', { style: { flex: '1 1 240px' } }, h('h2', { style: { margin: '0 0 2px', fontSize: 17, fontWeight: 600 } }, sel), h('p', { className: 'muted', style: { margin: 0, fontSize: 13 } }, ROLE_DESC[roleOfFlags(draft.modFlags[sel])])),
          canEdit ? h('div', { className: 'btnrow' },
            h(T.Button, { size: 'sm', onClick: function () { setPerms(sel, defaultRoles().mod); } }, 'Moderator defaults'),
            h(T.Button, { size: 'sm', onClick: function () { setPerms(sel, defaultRoles().admin); } }, 'Admin defaults'),
            h(T.Button, { size: 'sm', variant: 'danger', onClick: function () { remove(sel); } }, 'Remove')) : null),
        ['Visibility', 'Moderation', 'Administration'].map(function (grp) {
          return h(T.SettingsSection, { key: grp, title: grp }, PERMS.filter(function (x) { return x.group === grp; }).map(function (x) {
            return h(T.SettingRow, {
              key: x.key, title: x.title, description: x.desc,
              badge: x.sensitive ? h('span', { style: { marginLeft: 8 } }, h(T.Badge, { tone: 'accent' }, 'Sensitive')) : null,
              control: h(T.Switch, { checked: !!perms[x.key], disabled: !canEdit, onChange: function (e) { var np = Object.assign({}, perms); np[x.key] = e.target.checked; setPerms(sel, np); } })
            });
          }));
        }))
        : h(T.SettingsSection, { padded: true }, h('p', { className: 'pal-empty' }, 'No moderators yet.' + (canEdit ? ' Add one with their Chatango username.' : ''))))));
}

function GSMembers(p) {
  var app = useApp(), s = app.state, g = p.g;
  var a = useState(''), q = a[0], setQ = a[1];
  var list = g.members.filter(function (n) { return !q || n.indexOf(q.toLowerCase()) >= 0; });
  var canMods = p.perms.manageMods;
  return h(Page, { title: 'Members', lede: plural(g.members.length, 'member', 'members') + ' and ' + plural(guestsOf(g).count, 'guest', 'guests') + ' right now.' },
    h(T.TextField, { id: 'mem-q', label: 'Search members', type: 'search', value: q, onChange: function (e) { setQ(e.target.value); } }),
    h(T.SettingsSection, null, list.length ? list.map(function (n, i) {
      var r = p.draft.staff[n], isMe = n === s.me, status = isMe ? s.meStatus : userOf(s, n).status;
      return h('div', { key: n, className: 'lrow', style: i ? null : { borderTop: 0 } },
        h(T.Avatar, { name: n, size: 28, status: status, ring: 'var(--panel)' }),
        h('span', { className: 'grow' }, h('span', { className: 'lrow-title' }, n), h('span', { className: 'lrow-sub' }, (r ? ROLE_LONG[r] + ' · ' : '') + statusLabel(status))),
        youBadge(isMe),
        isMe || r === 'owner' ? null : h(MenuButton, {
          label: 'Actions for ' + n, items: [
            viewProfileItem(app, n, g.id),
            whoItem(app, n),
            canMods && !r ? { label: 'Make moderator', icon: 'shield', onSelect: function () { p.edit(function (d) { d.staff[n] = 'mod'; d.modFlags[n] = permsToFlags(defaultRoles().mod, 0); }); app.ui.toast(n + ' will be a moderator once you save.'); } } : null,
            canMods && (r === 'mod' || r === 'admin') ? { label: 'Remove from staff', icon: 'user-minus', onSelect: function () { p.edit(function (d) { delete d.staff[n]; delete d.modFlags[n]; }); app.ui.toast(n + ' leaves staff once you save.'); } } : null,
            { divider: true },
            banItem(app, n, g.id)
          ]
        }));
    }) : h('p', { className: 'pal-empty' }, 'No member matches.')));
}

function GSInvites(p) {
  var app = useApp(), link = 'https://' + p.g.id + '.chatango.com';
  return h(Page, { title: 'Invites', lede: 'Anyone with the link can join. Banned members still cannot.' },
    h(T.SettingsSection, { title: 'Invite link', padded: true },
      h('div', { style: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 } },
        h('input', { className: 'tc-input', style: { flex: '1 1 260px' }, readOnly: true, value: link, 'aria-label': 'Invite link', onFocus: function (e) { e.target.select(); } }),
        h(T.Button, { variant: 'primary', icon: 'link', onClick: function () { copyText(link, function (ok) { app.ui.toast(ok ? 'Invite link copied.' : 'Copy failed. Select the link and copy it.'); }); } }, 'Copy link'))));
}
