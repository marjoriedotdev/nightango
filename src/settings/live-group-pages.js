function GSOverviewLive(p) {
  var app = useApp(), g = p.g, o = g.settings.overview, owner = p.myRole === 'owner';
  return h(Page, { title: 'Overview', lede: 'How #' + g.id + ' appears on Chatango.' },
    g.closed ? h(T.Banner, { tone: 'warning', icon: 'lock', action: p.perms.closeGroup ? h(T.Button, { size: 'sm', onClick: function () { app.actions.setClosed(g.id, false); } }, 'Reopen') : null }, 'This group is closed. Nobody can post.') : null,
    h(T.SettingsSection, { title: 'Information', padded: true },
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: 16 } },
        h('div', { style: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 } },
          h(T.Avatar, { name: g.id, square: true, size: 56 }),
          h('span', { style: { display: 'flex', flexDirection: 'column' } }, h('span', { style: { fontWeight: 600 } }, o.title || g.id), h('span', { className: 'muted', style: { fontSize: 13 } }, g.id + '.chatango.com'))),
        h(T.TextField, { id: 'gs-title', label: 'Title', value: o.title, disabled: true }),
        h(T.TextField, { id: 'gs-desc', label: 'Description', multiline: true, rows: 4, value: o.description, disabled: true, hint: "Torch Skin can't change the title, description or icon yet. Edit them on chatango.com." }))),
    owner ? h(T.SettingsSection, { title: 'Messages' },
      h(T.SettingRow, {
        asLabel: false, title: 'Clear all messages', description: 'Removes every message in #' + g.id + ' for everyone. This cannot be undone.',
        control: h(T.Button, { variant: 'danger', size: 'sm', onClick: function () { app.ui.confirm({ title: 'Clear all messages in #' + g.id + '?', body: 'Every message is removed for everyone. This cannot be undone.', confirmLabel: 'Clear all', danger: true, onConfirm: function () { app.actions.clearGroup(g.id); } }); } }, 'Clear all')
      })) : null);
}

function GSAnnouncementLive(p) {
  var a = p.draft.announcement, loaded = !!p.g.live.annc, owner = p.myRole === 'owner';
  var canEdit = loaded && (owner || p.perms.editAnnouncement), canBroadcast = owner || p.perms.editRestrictions;
  function set(k, v) { p.edit(function (d) { d.announcement[k] = v; if (k === 'enabled' && v && !d.announcement.interval) d.announcement.interval = 15; }); }
  var options = withCurrent([[15, '15 minutes'], [30, '30 minutes'], [60, '1 hour']], a.interval || null, function (v) { return v + ' minutes'; });
  return h(Page, { title: 'Announcement', lede: 'Chatango posts the announcement in the chat at a regular interval.' },
    loaded ? null : h(T.Banner, { icon: 'info' }, 'Loading the announcement from Chatango.'),
    h(T.SettingsSection, null,
      h(T.SettingRow, { title: 'Post the announcement', control: h(T.Switch, { checked: !!a.enabled, disabled: !canEdit, onChange: function (e) { set('enabled', e.target.checked); } }) }),
      h('div', { className: 'tc-section-pad', style: { paddingTop: 14, borderTop: '1px solid var(--divider)' } },
        h(T.TextField, { id: 'ann-text', label: 'Text', multiline: true, rows: 3, maxLength: 500, value: a.text, disabled: !canEdit, labelAside: h('span', { className: 'tc-msg-time' }, a.text.length + ' / 500'), onChange: function (e) { set('text', e.target.value); } })),
      h(T.SettingRow, { asLabel: false, title: 'Post it every', control: liveSelect('ann-int', 'Repeat interval', a.interval || 15, options, function (v) { set('interval', v); }, !canEdit) }),
      h(T.SettingRow, { title: 'Broadcast mode', description: 'Only staff with the broadcast permission can post. Use it for events.', control: h(T.Switch, { checked: !!a.broadcast, disabled: !canBroadcast, onChange: function (e) { set('broadcast', e.target.checked); } }) })),
    a.text ? h('div', { style: { display: 'flex', flexDirection: 'column', gap: 10 } }, h('h2', { className: 'side-label' }, 'Preview'), h(T.Banner, { title: 'Announcement' }, a.text)) : null);
}

function GSAutoModLive(p) {
  var am = p.draft.automod, f = am.filters, owner = p.myRole === 'owner';
  var canNlp = owner || p.perms.automod, canBw = owner || p.perms.bannedWords, canRes = owner || p.perms.editRestrictions;
  function setF(k, v) { p.edit(function (d) { d.automod.filters[k] = v; }); }
  var slowOptions = withCurrent([[0, 'Off'], [5, '5 seconds'], [10, '10 seconds'], [30, '30 seconds'], [60, '1 minute']], am.slowMode, function (v) { return v + ' seconds'; });
  return h(Page, { title: 'AutoMod', lede: 'Filters Chatango applies before messages reach #' + p.g.id + '. Staff with the bypass permission are not filtered.' },
    h(T.SettingsSection, { title: 'Message filters' },
      h(T.SettingRow, {
        asLabel: false, title: 'Nonsense detection', description: 'Hides keyboard mashing and random characters. Advanced also catches subtler nonsense.',
        control: h('div', { style: { display: 'flex', alignItems: 'center', gap: 12 } },
          h('select', { className: 'tc-input', style: { width: 'auto', height: 32 }, 'aria-label': 'Nonsense detection sensitivity', disabled: !canNlp || !f.nonsense, value: f.nonsenseMode, onChange: function (e) { setF('nonsenseMode', e.target.value); } }, h('option', null, 'Basic'), h('option', null, 'Advanced')),
          h(T.Switch, { label: 'Nonsense detection', checked: !!f.nonsense, disabled: !canNlp, onChange: function (e) { setF('nonsense', e.target.checked); } }))
      }),
      h(T.SettingRow, { title: 'Repeated messages', description: 'Blocks the same message sent several times in a row.', control: h(T.Switch, { checked: !!f.repeat, disabled: !canNlp, onChange: function (e) { setF('repeat', e.target.checked); } }) })),
    h(T.SettingsSection, { title: 'Who can post' },
      h(T.SettingRow, { title: 'Block proxies and VPNs', description: 'Members connecting through a known proxy or VPN can read but not post.', control: h(T.Switch, { checked: !!am.proxies, disabled: !canRes, onChange: function (e) { var v = e.target.checked; p.edit(function (d) { d.automod.proxies = v; }); } }) }),
      h(T.SettingRow, {
        asLabel: false, title: 'Slow mode', description: 'Minimum time between two messages from the same member.',
        control: am.slowMode == null ? h('span', { className: 'muted', style: { fontSize: 13 } }, 'Loading') : liveSelect('slow', 'Slow mode', am.slowMode, slowOptions, function (v) { p.edit(function (d) { d.automod.slowMode = v; }); }, !canRes)
      })),
    h(T.SettingsSection, { title: 'Banned words', description: 'Separate words with commas. Messages that contain them are blocked.', padded: true },
      am.banned ? h('div', { style: { display: 'flex', flexDirection: 'column', gap: 14 } },
        h(T.TextField, { id: 'bw-part', label: 'Blocked anywhere in a word', multiline: true, rows: 2, value: am.banned.part, disabled: !canBw, hint: 'Parts of words, 4 characters or more.', onChange: function (e) { var v = e.target.value; p.edit(function (d) { d.automod.banned.part = v; }); } }),
        h(T.TextField, { id: 'bw-whole', label: 'Blocked as whole words', multiline: true, rows: 2, value: am.banned.whole, disabled: !canBw, onChange: function (e) { var v = e.target.value; p.edit(function (d) { d.automod.banned.whole = v; }); } }))
        : h('p', { className: 'muted', style: { margin: 0, fontSize: 13 } }, 'Loading banned words from Chatango.')));
}

function GSMediaLive(p) {
  var m = p.draft.media, can = p.myRole === 'owner' || p.perms.editRestrictions;
  return h(Page, { title: 'Media and links', lede: 'What members can share in #' + p.g.id + '. Staff are not restricted.' },
    can ? null : h(T.Banner, { icon: 'lock' }, 'Your permissions let you view these rules but not change them.'),
    h(T.SettingsSection, null, [['links', 'Allow links'], ['images', 'Allow images'], ['videos', 'Allow videos']].map(function (r) {
      return h(T.SettingRow, { key: r[0], title: r[1], control: h(T.Switch, { checked: !!m[r[0]], disabled: !can, onChange: function (e) { var v = e.target.checked; p.edit(function (d) { d.media[r[0]] = v; }); } }) });
    })));
}

function GSBansLive(p) {
  var app = useApp(), g = p.g, owner = p.myRole === 'owner';
  var a = useState(''), name = a[0], setName = a[1];
  var b = useState(''), err = b[0], setErr = b[1];
  useEffect(function () { app.actions.requestBans(g.id); }, [g.id]);
  var showIp = owner || p.perms.seeIps;
  function ban() {
    var n = name.trim().toLowerCase();
    if (!n) { setErr('Enter a username.'); return; }
    if (n === app.state.me) { setErr("You can't ban yourself."); return; }
    if (roleOf(g, n) === 'owner') { setErr("The owner can't be banned."); return; }
    setName(''); setErr(''); app.ui.ban(n, g.id);
  }
  return h(Page, {
    title: 'Bans', lede: 'Banned members cannot post. Chatango bans the account and the IP of one of their messages.',
    aside: g.bans.length && (owner || p.perms.unbanAll) ? h(T.Button, { variant: 'danger', onClick: function () { app.ui.confirm({ title: 'Unban everyone?', body: g.bans.length + ' members will be able to post in #' + g.id + ' again.', confirmLabel: 'Unban everyone', danger: true, onConfirm: function () { app.actions.unbanAll(g.id); } }); } }, 'Unban everyone') : null
  },
    h(T.SettingsSection, { title: 'Ban someone', padded: true },
      h('div', { style: { display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 10 } },
        h('div', { style: { flex: '1 1 260px' } }, h(T.TextField, { id: 'ban-name', label: 'Username', value: name, error: err || undefined, hint: err ? undefined : 'They need a recent message in #' + g.id + '.', onChange: function (e) { setName(e.target.value); setErr(''); }, onKeyDown: function (e) { if (e.key === 'Enter') ban(); } })),
        h(T.Button, { variant: 'danger', icon: 'ban', style: { height: 38 }, onClick: ban }, 'Ban'))),
    h(T.SettingsSection, { title: 'Banned · ' + g.bans.length },
      !g.live.bansLoaded ? h('p', { className: 'muted', style: { margin: 0, padding: '4px 20px 18px', fontSize: 13 } }, 'Loading the ban list from Chatango.')
        : g.bans.length ? g.bans.map(function (x) {
          return h('div', { key: x.unid + ':' + x.ip, className: 'lrow' },
            h(T.Avatar, { name: x.name, size: 28 }),
            h('span', { className: 'grow' }, h('span', { className: 'lrow-title' }, x.name), h('span', { className: 'lrow-sub' }, (x.by ? 'by ' + x.by + ' · ' : '') + ago(x.at))),
            showIp ? h('span', { className: 'mono muted', style: { fontSize: 12 } }, x.ip) : null,
            h(T.Button, { size: 'sm', onClick: function () { app.actions.unbanEntry(g.id, x); } }, 'Unban'));
        }) : h('p', { className: 'muted', style: { margin: 0, padding: '4px 20px 18px', fontSize: 13 } }, 'Nobody is banned.')));
}
