/* ---------- Découvrir ---------- */
function parseGroupName(v) {
  return String(v || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^client\.chatango\.com\/q\?/, '').replace(/\.chatango\.com.*$/, '').replace(/\/.*$/, '').replace(/^#/, '');
}
/**
 * Permet de refuser, dans le prototype, un groupe absent des données d'exemple.
 * @param {Object} s État de l'application.
 * @param {string} id Nom du groupe lu par parseGroupName.
 */
function unknownGroupError(s, id) { return s.groups[id] || LIVE ? '' : 'No group named ' + id + '. Check the spelling, or create it.'; }
function Discover() {
  var app = useApp(), s = app.state;
  var a = useState(''), joinName = a[0], setJoinName = a[1];
  var b = useState(null), err = b[0], setErr = b[1];
  var c = useState('All'), topic = c[0], setTopic = c[1];
  var d = useState(''), q = d[0], setQ = d[1];
  var all = Object.keys(s.groups).map(function (k) { return s.groups[k]; }).filter(function (g) { return g.discover; });
  var official = all.filter(function (g) { return g.discover.official; });
  var popular = all.filter(function (g) { return !g.discover.official && (g.settings.overview.showInDiscovery !== false); })
    .filter(function (g) { return topic === 'All' || g.discover.topic === topic; })
    .filter(function (g) { return !q || g.id.indexOf(q.toLowerCase()) >= 0 || g.discover.desc.toLowerCase().indexOf(q.toLowerCase()) >= 0; });
  function online(g) { return g.guests + g.members.filter(function (n) { return userOf(s, n).status !== 'offline'; }).length; }
  function submit(e) {
    e.preventDefault();
    var id = parseGroupName(joinName);
    if (!id) { setErr({ text: 'Enter a group name or a link.' }); return; }
    var unknown = unknownGroupError(s, id);
    if (unknown) { setErr({ text: unknown, name: id }); return; }
    setErr(null); setJoinName(''); app.actions.joinGroup(id);
  }
  function joinBtn(g) {
    return g.joined
      ? h(T.Button, { size: 'sm', variant: 'ghost', onClick: function () { app.nav({ view: 'group', id: g.id }); } }, 'Open')
      : h(T.Button, { size: 'sm', onClick: function () { app.actions.joinGroup(g.id); } }, 'Join');
  }
  var topics = ['All', 'Gaming', 'Art', 'Music', 'Languages', 'Tech'];
  return h('main', { className: 'main' },
    h('header', { className: 'topbar' }, h(MobileNavButton, null), h('h1', { className: 'grow' }, 'Discover groups')),
    h('div', { className: 'scroll' },
      h('div', { style: { maxWidth: 1080, margin: '0 auto', padding: '32px 24px 56px', display: 'flex', flexDirection: 'column', gap: 28 } },
        h('div', { className: 'page-head' },
          h('div', null, h('h2', { style: { margin: '0 0 6px', fontSize: 24, lineHeight: '32px', fontWeight: 600 } }, 'Find a group'), h('p', { className: 'lede', style: { margin: 0 } }, 'Join a group, or open one directly by its name.')),
          h(T.Button, { variant: 'primary', icon: 'plus', onClick: function () { app.ui.openCreate(''); } }, 'Create a group')),
        h('form', { onSubmit: submit, className: 'tc-section', style: { padding: '16px 20px', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: '10px 12px' }, noValidate: true },
          h('div', { style: { flex: '1 1 320px' } }, h(T.TextField, { id: 'join', label: 'Join by name or link', placeholder: 'community, community.chatango.com or a full link', value: joinName, error: err ? err.text : undefined, onChange: function (e) { setJoinName(e.target.value); setErr(null); } })),
          h(T.Button, { type: 'submit', style: { height: 38 } }, 'Join'),
          err && err.name && !LIVE ? h(T.Button, { variant: 'ghost', icon: 'plus', style: { height: 38 }, onClick: function () { app.ui.openCreate(err.name); } }, 'Create ' + err.name) : null),
        LIVE ? h(LiveJoined, null) : null,
        LIVE ? null : h('section', { 'aria-labelledby': 'off-h', style: { display: 'flex', flexDirection: 'column', gap: 12 } },
          h('h2', { id: 'off-h', className: 'tc-section-title' }, 'Official'),
          h('div', { className: 'cards small' }, official.map(function (g) {
            return h('article', { key: g.id, className: 'card row' },
              h(T.Avatar, { name: g.id, square: true, size: 36, color: g.id === 'community' ? 'var(--accent)' : undefined, style: g.id === 'community' ? { color: 'var(--on-accent)' } : null }),
              h('span', { className: 'card-title' }, h('strong', null, g.id), h('span', null, g.title)), joinBtn(g));
          }))),
        LIVE ? null : h('section', { 'aria-labelledby': 'pop-h', style: { display: 'flex', flexDirection: 'column', gap: 14 } },
          h('div', { style: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 } },
            h('h2', { id: 'pop-h', className: 'tc-section-title', style: { flex: '1 1 160px' } }, 'Popular right now'),
            h('label', { htmlFor: 'find', className: 'tc-sr' }, 'Search groups'),
            h('input', { id: 'find', className: 'tc-input', type: 'search', placeholder: 'Search groups', value: q, style: { flex: '0 1 260px', height: 34 }, onChange: function (e) { setQ(e.target.value); } })),
          h('div', { className: 'chips', role: 'group', 'aria-label': 'Filter by topic' }, topics.map(function (t) {
            return h('button', { key: t, type: 'button', className: 'chip', 'aria-pressed': String(topic === t), onClick: function () { setTopic(t); } }, t);
          })),
          popular.length ? h('div', { className: 'cards' }, popular.map(function (g) {
            return h('article', { key: g.id, className: 'card' },
              h('div', { className: 'card-head' }, h(T.Avatar, { name: g.id, square: true, size: 40 }),
                h('span', { className: 'card-title' }, h('strong', null, g.id), h('span', { style: { display: 'inline-flex', alignItems: 'center', gap: 6 } }, h('span', { className: 'online-dot' }), online(g) + ' online'))),
              h('p', null, g.discover.desc),
              h('div', { className: 'card-foot' }, h('span', { className: 'grow muted', style: { fontSize: 12 } }, g.discover.topic), joinBtn(g)));
          })) : h('p', { className: 'pal-empty' }, 'No group matches. Try another topic, or create one.')))));
}

function CreateGroupDialog(p) {
  var app = useApp(), s = app.state;
  var a = useState(p.prefill || ''), name = a[0], setName = a[1];
  var b = useState(''), title = b[0], setTitle = b[1];
  var c = useState(''), desc = c[0], setDesc = c[1];
  var d = useState(true), listed = d[0], setListed = d[1];
  var e = useState({}), err = e[0], setErr = e[1];
  var f = useState(false), busy = f[0], setBusy = f[1];
  function create() {
    var n = name.trim().toLowerCase(), x = {};
    if (LIVE ? !/^[a-z0-9_-]{1,20}$/.test(n) : !/^[a-z0-9-]{3,20}$/.test(n)) x.name = LIVE ? 'Use up to 20 letters, numbers, - or _.' : 'Use 3 to 20 lowercase letters, numbers or dashes.';
    else if (s.groups[n] || s.users[n]) x.name = 'This name is taken. Try another one.';
    if (title.length > 60) x.title = 'Keep the title under 60 characters.';
    setErr(x);
    if (Object.keys(x).length) return;
    setBusy(true);
    Promise.resolve(app.actions.createGroup(n, title.trim() || n, desc.trim(), listed)).then(function (ok) { if (ok) p.onClose(); else setBusy(false); });
  }
  return h(Dialog, {
    title: 'Create a group', description: 'You become its owner. The name is also its address: name.chatango.com.', onClose: p.onClose,
    footer: [h(T.Button, { key: 'c', variant: 'ghost', onClick: p.onClose }, 'Cancel'), h(T.Button, { key: 'k', variant: 'primary', disabled: busy, onClick: create }, busy ? 'Creating group' : 'Create group')]
  },
    h('div', { className: 'dialog-body' },
      h(T.TextField, { id: 'cg-name', label: 'Group name', value: name, error: err.name, hint: name ? 'https://' + (parseGroupName(name) || 'name') + '.chatango.com' : 'Lowercase letters, numbers and dashes.', onChange: function (ev) { setName(ev.target.value); setErr({}); } }),
      h(T.TextField, { id: 'cg-title', label: 'Title', value: title, error: err.title, placeholder: 'Shown under the name in Discover', onChange: function (ev) { setTitle(ev.target.value); } }),
      h(T.TextField, { id: 'cg-desc', label: 'Description', multiline: true, rows: 3, value: desc, labelAside: h('span', { className: 'tc-msg-time' }, desc.length + ' / 300'), maxLength: 300, onChange: function (ev) { setDesc(ev.target.value); } }),
      h('label', { className: 'tc-checkline', style: { justifyContent: 'space-between', width: '100%' } }, h('span', null, 'Show in Discover'), h(T.Switch, { checked: listed, onChange: function (ev) { setListed(ev.target.checked); } }))));
}
