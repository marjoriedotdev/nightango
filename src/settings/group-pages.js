function GSOverview(p) {
  var app = useApp(), g = p.g, o = g.settings.overview, owner = p.myRole === 'owner';
  return h(Page, { title: 'Overview', lede: 'How #' + g.id + ' appears on Chatango.' },
    g.closed ? h(T.Banner, { tone: 'warning', icon: 'lock', action: p.perms.closeGroup ? h(T.Button, { size: 'sm', onClick: function () { app.actions.setClosed(g.id, false); } }, 'Reopen') : null }, 'This group is closed. Nobody can post.') : null,
    h(T.SettingsSection, { title: 'Information', padded: true },
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: 16 } },
        h('div', { style: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 } },
          h(T.Avatar, { name: g.id, square: true, size: 56 }),
          h('span', { style: { display: 'flex', flexDirection: 'column' } }, h('span', { style: { fontWeight: 600 } }, o.title || g.id), h('span', { className: 'muted', style: { fontSize: 13 } }, g.id + '.chatango.com'))),
        o.description ? h('p', { style: { margin: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' } }, o.description) : h('p', { className: 'muted', style: { margin: 0 } }, 'No description.'),
        h('p', { className: 'tc-hint', style: { margin: 0 } }, 'Edit the title, description and icon on chatango.com.'))),
    LIVE && owner ? h(T.SettingsSection, { title: 'Messages' },
      h(T.SettingRow, {
        asLabel: false, title: 'Clear all messages', description: 'Removes every message in #' + g.id + ' for everyone. This cannot be undone.',
        control: h(T.Button, { variant: 'danger', size: 'sm', onClick: function () { app.ui.confirm({ title: 'Clear all messages in #' + g.id + '?', body: 'Every message is removed for everyone. This cannot be undone.', confirmLabel: 'Clear all', danger: true, onConfirm: function () { app.actions.clearGroup(g.id); } }); } }, 'Clear all')
      })) : null);
}

function GSAnnouncement(p) {
  var a = p.draft.announcement;
  function set(k, v) { p.edit(function (d) { d.announcement[k] = v; }); }
  return h(Page, { title: 'Announcement', lede: 'A pinned notice shown above the conversation. Members can dismiss it for themselves.' },
    h(T.SettingsSection, null,
      h(T.SettingRow, { title: 'Show the announcement', control: h(T.Switch, { checked: a.enabled, onChange: function (e) { set('enabled', e.target.checked); } }) }),
      h('div', { className: 'tc-section-pad', style: { paddingTop: 14, borderTop: '1px solid var(--divider)' } },
        h(T.TextField, { id: 'ann-text', label: 'Text', multiline: true, rows: 3, maxLength: 500, value: a.text, labelAside: h('span', { className: 'tc-msg-time' }, a.text.length + ' / 500'), onChange: function (e) { set('text', e.target.value); } })),
      h(T.SettingRow, {
        asLabel: false, title: 'Post it in the chat every', description: 'Only when more than 5 messages were sent since the last time.',
        control: h('select', { className: 'tc-input', style: { width: 'auto' }, 'aria-label': 'Repeat interval', value: a.interval, onChange: function (e) { set('interval', +e.target.value); } },
          [[0, 'Never'], [15, '15 minutes'], [30, '30 minutes'], [60, '1 hour']].map(function (o) { return h('option', { key: o[0], value: o[0] }, o[1]); }))
      }),
      h(T.SettingRow, { title: 'Broadcast mode', description: 'Only staff with the broadcast permission can post. Use it for events.', control: h(T.Switch, { checked: a.broadcast, onChange: function (e) { set('broadcast', e.target.checked); } }) })),
    a.text ? h('div', { style: { display: 'flex', flexDirection: 'column', gap: 10 } }, h('h2', { className: 'side-label' }, 'Preview'), h(T.Banner, { title: 'Announcement' }, a.text)) : null);
}

/**
 * AutoMod message filters.
 * @param {{filters: Object, disabled: boolean, onChange: Function}} p Draft filters, switches locked, receives the key and the new value.
 */
function AutoModFilters(p) {
  var f = p.filters;
  return h(T.SettingsSection, { title: 'Message filters' },
    h(T.SettingRow, {
      asLabel: false, title: 'Nonsense detection', description: 'Hides keyboard mashing and random characters. Advanced also catches subtler nonsense.',
      control: h('div', { style: { display: 'flex', alignItems: 'center', gap: 12 } },
        h('select', { className: 'tc-input', style: { width: 'auto', height: 32 }, 'aria-label': 'Nonsense detection sensitivity', disabled: p.disabled || !f.nonsense, value: f.nonsenseMode, onChange: function (e) { p.onChange('nonsenseMode', e.target.value); } }, h('option', null, 'Basic'), h('option', null, 'Advanced')),
        h(T.Switch, { label: 'Nonsense detection', checked: !!f.nonsense, disabled: p.disabled, onChange: function (e) { p.onChange('nonsense', e.target.checked); } }))
    }),
    h(T.SettingRow, { title: 'Repeated messages', description: 'Blocks the same message sent several times in a row.', control: h(T.Switch, { checked: !!f.repeat, disabled: p.disabled, onChange: function (e) { p.onChange('repeat', e.target.checked); } }) }));
}

/**
 * Switch for blocking proxies and VPNs.
 * @param {{on: boolean, disabled: boolean, onChange: Function}} p Blocking on, switch locked, receives the new value.
 */
function ProxiesRow(p) {
  return h(T.SettingRow, { title: 'Block proxies and VPNs', description: 'Members connecting through a known proxy or VPN can read but not post.', control: h(T.Switch, { checked: !!p.on, disabled: p.disabled, onChange: function (e) { p.onChange(e.target.checked); } }) });
}

function GSAutoMod(p) {
  var am = p.draft.automod, canEdit = p.manage || p.perms.automod;
  return h(Page, { title: 'AutoMod', lede: 'Filters messages before they reach the group. Staff whose role includes Bypass AutoMod are never filtered.' },
    !canEdit ? h(T.Banner, { icon: 'lock' }, 'Your role can view AutoMod but not change it.') : null,
    h(AutoModFilters, { filters: am.filters, disabled: !canEdit, onChange: function (k, v) { p.edit(function (d) { d.automod.filters[k] = v; }); } }),
    h(T.SettingsSection, { title: 'Who can post' },
      h(ProxiesRow, { on: am.proxies, disabled: !canEdit, onChange: function (v) { p.edit(function (d) { d.automod.proxies = v; }); } })));
}

function GSMedia(p) {
  var m = p.draft.media;
  return h(Page, { title: 'Media and links', lede: 'What members can share in #' + p.g.id + '. Staff are not restricted.' },
    h(T.SettingsSection, null, [['links', 'Allow links'], ['images', 'Allow images'], ['videos', 'Allow videos']].map(function (r) {
      return h(T.SettingRow, { key: r[0], title: r[1], control: h(T.Switch, { checked: !!m[r[0]], onChange: function (e) { var v = e.target.checked; p.edit(function (d) { d.media[r[0]] = v; }); } }) });
    })));
}

function GSBans(p) {
  var app = useApp(), g = p.g;
  var a = useState(''), name = a[0], setName = a[1];
  var b = useState(''), err = b[0], setErr = b[1];
  var showIp = p.perms.seeIps;
  function ban() {
    var n = name.trim().toLowerCase();
    if (!n) { setErr('Enter a username.'); return; }
    if (n === app.state.me) { setErr("You can't ban yourself."); return; }
    if (roleOf(g, n) === 'owner') { setErr("The owner can't be banned."); return; }
    if (g.bans.some(function (x) { return x.name === n; })) { setErr(n + ' is already banned.'); return; }
    setName(''); setErr(''); app.ui.ban(n, g.id);
  }
  return h(Page, {
    title: 'Bans', lede: 'Banned members cannot read or post. Bans apply to the account and its IP.',
    aside: g.bans.length && (p.myRole === 'owner' || p.perms.unbanAll) ? h(T.Button, { variant: 'danger', onClick: function () { app.ui.confirm({ title: 'Unban everyone?', body: g.bans.length + ' members will be able to join #' + g.id + ' again.', confirmLabel: 'Unban everyone', danger: true, onConfirm: function () { app.actions.unbanAll(g.id); } }); } }, 'Unban everyone') : null
  },
    h(T.SettingsSection, { title: 'Ban someone', padded: true },
      h(T.TextField, {
        id: 'ban-name', label: 'Username', value: name, error: err || undefined, onChange: function (e) { setName(e.target.value); setErr(''); }, onKeyDown: function (e) { if (e.key === 'Enter') ban(); },
        action: h(T.Button, { variant: 'danger', icon: 'ban', onClick: ban }, 'Ban')
      })),
    h(T.SettingsSection, { title: 'Banned · ' + g.bans.length },
      g.bans.length ? g.bans.map(function (x) {
        return h('div', { key: x.name, className: 'lrow' },
          h('span', { className: 'grow' }, h(Person, { name: x.name, gid: g.id, size: 28 }), h('span', { className: 'lrow-sub person-sub' }, 'by ' + x.by + ' · ' + ago(x.at))),
          showIp ? h('span', { className: 'muted', style: { fontSize: 12 } }, x.ip) : null,
          h(T.Button, { size: 'sm', onClick: function () { app.actions.unban(g.id, x.name); } }, 'Unban'));
      }) : h('p', { className: 'pal-empty' }, 'Nobody is banned.')));
}

function GSAudit(p) {
  var g = p.g;
  var a = useState('all'), actor = a[0], setActor = a[1];
  var actors = Object.keys(g.audit.reduce(function (o, x) { o[x.actor] = 1; return o; }, {}));
  var rows = g.audit.slice().reverse().filter(function (x) { return actor === 'all' || x.actor === actor; });
  return h(Page, {
    title: 'Audit log', lede: 'Every moderation and settings change in #' + g.id + ', newest first.',
    aside: h('label', { style: { display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-2)' } }, 'Staff member',
      h('select', { className: 'tc-input', style: { width: 'auto' }, value: actor, onChange: function (e) { setActor(e.target.value); } }, h('option', { value: 'all' }, 'Everyone'), actors.map(function (n) { return h('option', { key: n, value: n }, n); })))
  },
    h(T.SettingsSection, null, rows.length ? rows.map(function (x, i) {
      return h(ActivityRow, { key: x.id, first: !i, at: x.at }, h(Person, { name: x.actor, gid: g.id, size: 28 }), ' ', x.text.charAt(0).toLowerCase() + x.text.slice(1));
    }) : h('p', { className: 'pal-empty' }, 'No entries.')));
}
