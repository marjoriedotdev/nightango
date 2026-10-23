function GSOverview(p) {
  var app = useApp(), o = p.draft.overview, g = p.g;
  return h(Page, { title: 'Overview', lede: 'How #' + g.id + ' appears in Discover and to new members.' },
    g.closed ? h(T.Banner, { tone: 'warning', icon: 'lock', action: h(T.Button, { size: 'sm', onClick: function () { app.actions.setClosed(g.id, false); } }, 'Reopen') }, 'This group is closed. Nobody can post.') : null,
    h(T.SettingsSection, { title: 'Information', padded: true },
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: 16 } },
        h('div', { style: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 } },
          h(T.Avatar, { name: g.id, square: true, size: 56 }),
          h('div', { className: 'btnrow' }, h(T.Button, { icon: 'upload', onClick: function () { app.ui.toast('Uploading an icon is not part of this prototype.'); } }, 'Change icon'))),
        h(T.TextField, { id: 'gs-name', label: 'Group name', value: g.id, disabled: true, hint: 'The name is the address, ' + g.id + '.chatango.com. It cannot change.' }),
        h(T.TextField, { id: 'gs-title', label: 'Title', value: o.title, maxLength: 60, onChange: function (e) { var v = e.target.value; p.edit(function (d) { d.overview.title = v; }); } }),
        h(T.TextField, { id: 'gs-desc', label: 'Description', multiline: true, rows: 4, maxLength: 300, value: o.description, labelAside: h('span', { className: 'tc-msg-time' }, o.description.length + ' / 300'), onChange: function (e) { var v = e.target.value; p.edit(function (d) { d.overview.description = v; }); } }))),
    h(T.SettingsSection, { title: 'Visibility' },
      h(T.SettingRow, { title: 'Show in Discover', description: 'Anyone can find the group by topic or name.', control: h(T.Switch, { checked: o.showInDiscovery, onChange: function (e) { var v = e.target.checked; p.edit(function (d) { d.overview.showInDiscovery = v; }); } }) }),
      h(T.SettingRow, { title: 'Members list is public', description: 'Everyone can see who is in the group, not only staff.', control: h(T.Switch, { checked: o.membersPublic, onChange: function (e) { var v = e.target.checked; p.edit(function (d) { d.overview.membersPublic = v; }); } }) }),
      h(T.SettingRow, { title: 'Label as adult content', description: 'Hides the group from Discover for members under 18.', control: h(T.Switch, { checked: !!o.nsfw, onChange: function (e) { var v = e.target.checked; p.edit(function (d) { d.overview.nsfw = v; }); } }) })));
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

function GSAutoMod(p) {
  var am = p.draft.automod, canEdit = p.manage || p.perms.automod;
  var filters = [
    ['nonsense', 'Nonsense detection', 'Hides keyboard mashing and random characters.'],
    ['repeat', 'Repeated messages', 'Blocks the same message sent several times in a row.'],
    ['flood', 'Message flooding', 'Limits how fast one member can post.'],
    ['caps', 'Excessive capitals', 'Blocks messages written mostly in capital letters.'],
    ['links', 'Excessive links', 'Blocks messages that contain many links.'],
    ['emoji', 'Repeated emojis', 'Blocks the same emoji repeated many times in one message.'],
    ['mentions', 'Mass mentions', 'Blocks messages that mention many members at once.']
  ];
  function setLevel(l) { p.edit(function (d) { d.automod.level = l; if (AUTOMOD_PRESETS[l]) d.automod.filters = JSON.parse(JSON.stringify(AUTOMOD_PRESETS[l])); }); }
  function setFilter(k, v) {
    p.edit(function (d) {
      d.automod.filters[k] = v;
      var match = Object.keys(AUTOMOD_PRESETS).filter(function (l) { return JSON.stringify(AUTOMOD_PRESETS[l]) === JSON.stringify(d.automod.filters); })[0];
      d.automod.level = match || 'custom';
    });
  }
  var levelText = { off: 'Nothing is filtered. Staff moderate by hand.', standard: 'Blocks spam and nonsense without slowing normal conversation.', strict: 'Adds capitals and emoji filters, and the advanced nonsense check.', custom: 'Your own selection of filters.' };
  return h(Page, { title: 'AutoMod', lede: 'Filters messages before they reach the group. Staff whose role includes Bypass AutoMod are never filtered.' },
    !canEdit ? h(T.Banner, { icon: 'lock' }, 'Your role can view AutoMod but not change it.') : null,
    h(T.SettingsSection, { title: 'Protection level', padded: true },
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: 10 } },
        h('fieldset', { disabled: !canEdit, style: { border: 0, margin: 0, padding: 0, minWidth: 0 } },
          h(T.SegmentedControl, { label: 'Protection level', block: true, value: am.level, onChange: setLevel, options: [{ value: 'off', label: 'Off' }, { value: 'standard', label: 'Standard' }, { value: 'strict', label: 'Strict' }, { value: 'custom', label: 'Custom' }] })),
        h('p', { className: 'tc-hint', style: { margin: 0, fontSize: 13 } }, levelText[am.level] + ' Changing a filter below switches to Custom.'))),
    h(T.SettingsSection, { title: 'Message filters' }, filters.map(function (f) {
      return h(T.SettingRow, {
        key: f[0], asLabel: f[0] !== 'nonsense', title: f[1], description: f[2],
        control: f[0] === 'nonsense'
          ? h('div', { style: { display: 'flex', alignItems: 'center', gap: 12 } },
            h('select', { className: 'tc-input', style: { width: 'auto', height: 32 }, 'aria-label': 'Nonsense detection sensitivity', disabled: !canEdit || !am.filters.nonsense, value: am.filters.nonsenseMode, onChange: function (e) { setFilter('nonsenseMode', e.target.value); } }, h('option', null, 'Basic'), h('option', null, 'Advanced')),
            h(T.Switch, { label: f[1], checked: !!am.filters.nonsense, disabled: !canEdit, onChange: function (e) { setFilter('nonsense', e.target.checked); } }))
          : h(T.Switch, { checked: !!am.filters[f[0]], disabled: !canEdit, onChange: function (e) { setFilter(f[0], e.target.checked); } })
      });
    })),
    h(T.SettingsSection, { title: 'Who can post' },
      [['proxies', 'Block proxies and VPNs', 'Members connecting through a known proxy or VPN can read but not post.'], ['advancedProxy', 'Advanced proxy detection', 'Catches more residential proxies. Adds a short delay on the first message.'], ['verifiedEmail', 'Require a verified email', 'Members need a verified email on their Chatango account to post.']].map(function (r) {
        return h(T.SettingRow, { key: r[0], title: r[1], description: r[2], control: h(T.Switch, { checked: !!am[r[0]], disabled: !canEdit, onChange: function (e) { var v = e.target.checked; p.edit(function (d) { d.automod[r[0]] = v; }); } }) });
      })));
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
  var showIp = canSeeIps(p.myRole, p.perms);
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
          h('span', { className: 'grow' }, h(Person, { name: x.name, gid: g.id, size: 28 }), h('span', { className: 'lrow-sub person-sub' }, x.reason + ' · by ' + x.by + ' · ' + ago(x.at))),
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
