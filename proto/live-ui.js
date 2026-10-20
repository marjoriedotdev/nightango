/* ---------- Écrans du mode live : réglages branchés sur Chatango par le client Torch ---------- */

function liveSelect(id, label, value, options, onChange, disabled) {
  return h('select', { id: id, className: 'tc-input', style: { width: 'auto', height: 34 }, 'aria-label': label, value: value, disabled: !!disabled, onChange: function (e) { onChange(+e.target.value); } },
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
    }, 8000);
    return function () { clearTimeout(t); };
  }, [pending]);
  if (!g || !draft) return h('div', { className: 'empty' }, h('h2', null, 'This group is gone'), h(T.Button, { onClick: app.actions.backToChat }, 'Back to chat'));

  var myRole = roleOf(g, me), perms = livePerms(g, me), owner = myRole === 'owner';
  var sections = [
    { title: 'General', items: [['overview', 'Overview']].concat(owner || perms.editAnnouncement ? [['announcement', 'Announcement']] : []) },
    { title: 'Moderation', items: [['automod', 'AutoMod'], ['media', 'Media and links'], ['bans', 'Bans']].concat(owner || perms.modLog ? [['audit', 'Audit log']] : []) },
    { title: 'People', items: [['roles', 'Staff and roles'], ['members', 'Members'], ['invites', 'Invites']] }
  ];
  var allowed = [].concat.apply([], sections.map(function (x) { return x.items.map(function (i) { return i[0]; }); }));
  var page = allowed.indexOf(p.page) >= 0 ? p.page : allowed[0];
  var dirty = JSON.stringify(draft) !== sig;
  function edit(fn) { setDraft(function (d0) { var d1 = JSON.parse(JSON.stringify(d0)); fn(d1); return d1; }); }
  function leave() {
    if (dirty && !pending) app.ui.confirm({ title: 'Discard unsaved changes?', body: 'Your changes to #' + g.id + ' are not saved yet.', confirmLabel: 'Discard', danger: true, onConfirm: function () { app.nav({ view: 'group', id: g.id }); } });
    else app.nav({ view: 'group', id: g.id });
  }
  var props = { g: g, draft: draft, edit: edit, myRole: myRole, perms: perms, manage: owner || perms.manageMods };
  var map = { overview: GSOverviewLive, announcement: GSAnnouncementLive, automod: GSAutoModLive, media: GSMediaLive, bans: GSBansLive, audit: GSAuditLive, roles: GSStaffLive, members: GSMembers, invites: GSInvites };
  return h(SettingsShell, {
    navLabel: 'Group settings', sections: sections, page: page, onBack: leave,
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
            h(T.Avatar, { name: x.name, size: 32 }),
            h('span', { className: 'grow' }, h('span', { className: 'lrow-title' }, x.name), h('span', { className: 'lrow-sub' }, (x.by ? 'by ' + x.by + ' · ' : '') + ago(x.at))),
            showIp ? h('span', { className: 'mono muted', style: { fontSize: 12 } }, x.ip) : null,
            h(T.Button, { size: 'sm', onClick: function () { app.actions.unbanEntry(g.id, x); } }, 'Unban'));
        }) : h('p', { className: 'muted', style: { margin: 0, padding: '4px 20px 18px', fontSize: 13 } }, 'Nobody is banned.')));
}

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
    h(T.SettingsSection, null, log == null ? h('p', { className: 'pal-empty' }, 'Loading the log from Chatango.') : rows.length ? rows.map(function (x, i) {
      var sys = MODLOG_SYSTEM[x.type], text = (MODLOG_TEXT[x.type] || 'did ' + x.type).replace('*t*', x.target || 'someone');
      return h('div', { key: x.id, className: 'lrow', style: i ? null : { borderTop: 0 } },
        sys ? h('span', { className: 'role-ico' }, h(T.Icon, { name: 'lock', size: 14 })) : h(T.Avatar, { name: x.actor, size: 28 }),
        h('span', { className: 'grow' }, h('span', { className: 'lrow-title', style: { fontWeight: 400 } }, sys || h(Frag, null, h('b', { style: { fontWeight: 600 } }, x.actor), ' ', text))),
        x.at ? h('time', { className: 'tc-msg-time', title: new Date(x.at).toLocaleString('en-GB') }, ago(x.at)) : null);
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

/* ---------- Réglages du compte en mode live ---------- */
var GENDER_LABEL = { M: 'Male', F: 'Female' };
var GENDER_CODE = { Male: 'M', Female: 'F' };
function bioFromLine(line) { return line.replace(/<br\s*\/?>(\r?\n)?/gi, '\n'); }
function bioToLine(bio) { return bio.replace(/\r?\n/g, '<br/>'); }

function ProfilePageLive() {
  var app = useApp(), s = app.state;
  function load() { var r = liveBridge.readProfile(); return { loaded: r.loaded, age: r.age, gender: GENDER_LABEL[r.gender] || 'Not specified', location: r.location, about: bioFromLine(r.about), line: r.about, dir: r.dir, full: r.full }; }
  function editable(x) { return { age: x.age, gender: x.gender, location: x.location, about: x.about, dir: x.dir }; }
  var a = useState(load), base = a[0], setBase = a[1];
  var b = useState(function () { return editable(base); }), draft = b[0], setDraft = b[1];
  var c = useState(false), saving = c[0], setSaving = c[1];
  var dirty = JSON.stringify(draft) !== JSON.stringify(editable(base));
  var ageErr = draft.age !== '' && (isNaN(+draft.age) || +draft.age < 13 || +draft.age > 120) ? 'Enter an age between 13 and 120.' : '';
  function set(k, v) { setDraft(function (d) { var n = Object.assign({}, d); n[k] = v; return n; }); }
  function reload() { var nb = load(); setBase(nb); setDraft(editable(nb)); }
  function save() {
    if (ageErr) { app.ui.toast('Fix the age before saving.'); return; }
    if (!base.loaded) { app.ui.toast('Your profile is not loaded yet. Nothing was saved.'); return; }
    setSaving(true);
    var line = draft.about === base.about ? base.line : bioToLine(draft.about);
    liveBridge.saveProfile({ age: draft.age, gender: GENDER_CODE[draft.gender] || '?', location: draft.location, about: line, dir: draft.dir, full: base.full }).then(function () {
      setBase(Object.assign({}, base, draft, { line: line }));
      setSaving(false);
      app.update(function (d) { var u = d.users[d.me]; if (u) { u.age = draft.age === '' ? '' : +draft.age; u.location = draft.location; u.about = draft.about; u.aboutHtml = line; u.gender = draft.gender; } });
      app.ui.toast('Profile saved to Chatango.', { icon: 'check' });
    }, function (e) {
      setSaving(false);
      app.ui.toast(e && e.message ? e.message : 'Chatango did not save your profile.');
    });
  }
  var meta = [draft.age, draft.gender !== 'Not specified' ? draft.gender : null, draft.location].filter(Boolean).join(' · ');
  return h(Page, { title: 'Profile', lede: 'This is your Chatango profile. Everyone on Chatango sees it, not only Torch users.', wide: true },
    base.loaded ? null : h(T.Banner, { tone: 'warning', icon: 'info', action: h(T.Button, { size: 'sm', onClick: reload }, 'Try again') }, "Torch hasn't loaded your profile yet. Saving stays off so nothing gets erased."),
    h('div', { className: 'split' },
      h('div', { className: 'grow' },
        h(T.SettingsSection, { title: 'Profile picture', padded: true },
          h('div', { style: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 } },
            h(T.Avatar, { name: s.me, size: 72 }),
            h('div', { style: { display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' } },
              h('span', { className: 'tc-hint' }, 'Change your picture on chatango.com. Torch Skin shows it here once Chatango updates it.'),
              chatangoLink('Open chatango.com')))),
        h(T.SettingsSection, { title: 'About you', padded: true },
          h('fieldset', { disabled: !base.loaded || saving, style: { border: 0, margin: 0, padding: 0, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 } },
            h('div', { className: 'grid3' },
              h(T.TextField, { id: 'pf-age', label: 'Age', type: 'number', min: 13, max: 120, value: draft.age, error: ageErr || undefined, onChange: function (e) { set('age', e.target.value); } }),
              h('div', { className: 'tc-field' }, h('label', { className: 'tc-label', htmlFor: 'pf-gender' }, 'Gender'),
                h('select', { id: 'pf-gender', className: 'tc-input', value: draft.gender, onChange: function (e) { set('gender', e.target.value); } }, ['Not specified', 'Male', 'Female'].map(function (g) { return h('option', { key: g }, g); }))),
              h(T.TextField, { id: 'pf-loc', label: 'Location', value: draft.location, onChange: function (e) { set('location', e.target.value); } })),
            h(T.TextField, { id: 'pf-bio', label: 'Bio', multiline: true, rows: 5, maxLength: 2000, value: draft.about, labelAside: h('span', { className: 'tc-msg-time' }, draft.about.length + ' / 2000'), hint: 'Shown in your mini profile. Your full profile page is kept as it is.', onChange: function (e) { set('about', e.target.value); } }))),
        h(T.SettingsSection, { title: 'Visibility' },
          h(T.SettingRow, { title: 'Appear in Meet people', description: 'Lets other Chatango users find you by age and location.', control: h(T.Switch, { checked: !!draft.dir, disabled: !base.loaded || saving, onChange: function (e) { set('dir', e.target.checked); } }) })),
        h(VisitorsSection, null)),
      h('aside', { className: 'side', 'aria-labelledby': 'pv-h' },
        h('h2', { id: 'pv-h', className: 'side-label' }, 'Preview'),
        h('div', { style: { border: '1px solid var(--border)', borderRadius: 12, background: 'var(--subtle)', overflow: 'hidden' } },
          h('div', { style: { height: 64, background: 'var(--selected)' } }),
          h('div', { style: { padding: '0 18px 18px', marginTop: -32 } },
            h(T.Avatar, { name: s.me, size: 64, style: { border: '4px solid var(--subtle)', boxSizing: 'content-box' } }),
            h('p', { style: { margin: '8px 0 0', fontSize: 17, fontWeight: 600 } }, s.me),
            meta ? h('p', { className: 'muted', style: { margin: 0, fontSize: 13 } }, meta) : null,
            draft.about ? h('div', { style: { marginTop: 12 } }, h(RichText, { html: bioToLine(draft.about) })) : h('p', { className: 'about', style: { marginTop: 12 } }, 'No bio yet.'))))),
    dirty && base.loaded ? h(T.SaveBar, { onDiscard: function () { setDraft(editable(base)); }, onSave: saving ? function () {} : save, saveLabel: saving ? 'Saving' : 'Save profile' }, 'Unsaved changes to your Chatango profile') : null);
}

function PrivacyPageLive() {
  var app = useApp(), pr = usePref();
  return h(Page, { title: 'Privacy', lede: 'What Torch Skin keeps in this browser.' },
    h(T.SettingsSection, { title: 'Private messages' },
      h(T.SettingRow, {
        asLabel: false, title: 'Delete saved conversations', description: 'Torch keeps a copy of your private messages in this browser. Chatango does not store them.',
        control: h(T.Button, { variant: 'danger', size: 'sm', onClick: function () { app.ui.confirm({ title: 'Delete saved conversations?', body: 'Every private message Torch saved in this browser is removed. The people you talked to keep their copy.', confirmLabel: 'Delete all', danger: true, onConfirm: app.actions.deleteAllDms }); } }, 'Delete all')
      })),
    h(T.SettingsSection, { title: 'Browser tab' },
      h(T.SettingRow, { title: 'Show my username in the tab title', description: 'Useful when you run several accounts in different tabs.', control: pr.sw('privacy.usernameInTitle') })),
    h(T.Banner, { icon: 'info' }, "Who can message you, idle visibility and the groups Torch joins at startup stay in Torch's own settings. Torch Skin doesn't change them yet."));
}

function AccountPageLive() {
  return h(Page, { title: 'Password and email', lede: 'Sign-in details for your Chatango account.' },
    h(T.Banner, { icon: 'lock', title: 'Managed on chatango.com', action: chatangoLink('Open chatango.com') },
      'Torch Skin never handles your password, so it cannot change it, change your email or delete your account. Do it on chatango.com.'));
}

function PremiumPageLive() {
  return h(Page, { title: 'Chatango Premium', lede: 'Custom backgrounds, media and badges for your account.' },
    h(T.Banner, { icon: 'info', title: 'Not available in Torch Skin', action: chatangoLink('Open chatango.com') },
      'Torch Skin does not take payments. Buy or gift Premium on chatango.com.'));
}
