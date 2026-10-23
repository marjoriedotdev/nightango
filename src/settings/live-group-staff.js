/* Libellés du journal Chatango, d'après les modèles de chadango (models/modaction.go). */
var MODLOG_TEXT = {
  amod: 'made *t* a moderator', aadm: 'made *t* an admin', rmod: 'removed *t* as a moderator', radm: 'removed *t* as an admin',
  emod: "changed *t*'s permissions", chrl: 'changed the slow mode', anon: 'changed whether anons can post', prxy: 'changed proxy and VPN blocking',
  brdc: 'turned broadcast mode on or off', cinm: 'changed closing the group when no moderator is online', chan: 'turned channels on or off',
  cntr: 'turned the member counter on or off', chbw: 'changed banned words', enlp: 'changed auto-moderation', annc: 'changed the announcement',
  egrp: 'edited the group', shwi: 'made moderator badges visible', hidi: 'hid moderator badges', chsi: 'let moderators choose their badge visibility', ubna: 'removed all bans'
};
var MODLOG_SYSTEM = { acls: 'The group closed automatically: no moderator was online.', aopn: 'The group reopened when a moderator signed in.' };

function GSAuditLive(p) {
  var g = p.g, log = g.live.modlog;
  var a = useState('all'), actor = a[0], setActor = a[1];
  var list = log || [];
  var actors = Object.keys(list.reduce(function (o, x) { if (x.actor) o[x.actor] = 1; return o; }, {}));
  var rows = list.filter(function (x) { return actor === 'all' || x.actor === actor; });
  return h(Page, {
    title: 'Audit log', lede: 'The latest moderation changes Chatango recorded in #' + g.id + ', newest first.',
    aside: h('label', { style: { display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-2)' } }, 'Staff member',
      h('select', { className: 'tc-input', style: { width: 'auto', height: 34 }, value: actor, onChange: function (e) { setActor(e.target.value); } }, h('option', { value: 'all' }, 'Everyone'), actors.map(function (n) { return h('option', { key: n, value: n }, n); })))
  },
    h(T.SettingsSection, null, log == null ? h(SkeletonRows, { count: 5, avatar: 28, label: 'Loading the log from Chatango' }) : rows.length ? rows.map(function (x, i) {
      var sys = MODLOG_SYSTEM[x.type], text = (MODLOG_TEXT[x.type] || 'did ' + x.type).replace('*t*', x.target || 'someone');
      return h(ActivityRow, { key: x.id, first: !i, at: x.at, lead: sys ? h('span', { className: 'role-ico' }, h(T.Icon, { name: 'lock', size: 14 })) : null },
        sys || h(Frag, null, h(Person, { name: x.actor, gid: g.id, size: 28 }), ' ', text));
    }) : h('p', { className: 'pal-empty' }, 'No entries.')));
}

function GSStaffLive(p) {
  var app = useApp(), g = p.g, draft = p.draft, owner = g.live.owner;
  var names = Object.keys(draft.modFlags || {}).sort();
  var a = useState(names[0] || null), selected = a[0], setSel = a[1];
  var b = useState(''), add = b[0], setAdd = b[1];
  var c = useState(''), err = c[0], setErr = c[1];
  var sel = selected && names.indexOf(selected) >= 0 ? selected : names[0] || null;
  var canEdit = p.myRole === 'owner' || p.perms.manageMods;
  function setPerms(n, perms) { p.edit(function (d) { d.modFlags[n] = permsToFlags(perms, d.modFlags[n]); d.staff[n] = liveRole(d.modFlags[n]); }); }
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
  return h(Page, { title: 'Staff and roles', lede: 'Chatango sets permissions for each moderator. Moderators who can change group settings are shown as admins.', wide: true },
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
              h('span', { className: 'grow', style: colStyle }, h('span', { style: { fontWeight: 500, color: 'var(--text)' } }, n), h('span', { style: { fontSize: 12, color: 'var(--text-3)' } }, ROLE_LONG[liveRole(draft.modFlags[n])])),
              h(T.Icon, { name: 'chevron-right', size: 14, style: { color: 'var(--text-3)' } }));
          })),
        canEdit ? h('div', { style: { padding: '12px 14px 14px', borderTop: '1px solid var(--divider)', display: 'flex', alignItems: 'flex-end', gap: 8 } },
          h('div', { style: { flex: 1 } }, h(T.TextField, { id: 'add-mod', label: 'Add a moderator', value: add, error: err || undefined, autoComplete: 'off', onChange: function (e) { setAdd(e.target.value); setErr(''); }, onKeyDown: function (e) { if (e.key === 'Enter') addMod(); } })),
          h(T.Button, { style: { height: 38 }, onClick: addMod }, 'Add')) : null),
      h('div', { className: 'grow' }, sel ? h(Frag, null,
        h('section', { className: 'tc-section', 'aria-label': sel, style: { padding: '16px 20px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px 16px' } },
          h('div', { style: { flex: '1 1 240px' } }, h('h2', { style: { margin: '0 0 2px', fontSize: 17, fontWeight: 600 } }, sel), h('p', { className: 'muted', style: { margin: 0, fontSize: 13 } }, ROLE_DESC[liveRole(draft.modFlags[sel])])),
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
        : h(T.SettingsSection, { padded: true }, h('p', { className: 'muted', style: { margin: 0 } }, 'No moderators yet.' + (canEdit ? ' Add one with their Chatango username.' : ''))))));
}
