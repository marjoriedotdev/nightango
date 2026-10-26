/* ---------- Discover ---------- */
function parseGroupName(v) {
  return String(v || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^client\.chatango\.com\/q\?/, '').replace(/\.chatango\.com.*$/, '').replace(/\/.*$/, '').replace(/^#/, '');
}
/**
 * Rejects a group missing from the sample data in the prototype.
 * @param {Object} s Application state.
 * @param {string} id Group name read by parseGroupName.
 */
function unknownGroupError(s, id) { return s.groups[id] || LIVE ? '' : 'No group named ' + id + '. Check the spelling.'; }
function GroupJoinButton(p) {
  var app = useApp(), g = p.group;
  return g.joined
    ? h(T.Button, { size: 'sm', variant: 'ghost', onClick: function () { app.nav({ view: 'group', id: g.id }); } }, 'Open')
    : h(T.Button, { size: 'sm', onClick: function () { app.actions.joinGroup(g.id); } }, 'Join');
}
function Discover() {
  var app = useApp(), s = app.state;
  var a = useState(''), joinName = a[0], setJoinName = a[1];
  var b = useState(''), err = b[0], setErr = b[1];
  function submit(e) {
    e.preventDefault();
    var id = parseGroupName(joinName);
    if (!id) { setErr('Enter a group name or a link.'); return; }
    var unknown = unknownGroupError(s, id);
    if (unknown) { setErr(unknown); return; }
    setErr(''); setJoinName(''); app.actions.joinGroup(id);
  }
  return h('main', { className: 'main' },
    pageHeader('Discover groups'),
    h('div', { className: 'scroll' },
      h('div', { style: { maxWidth: 1080, margin: '0 auto', padding: '32px 24px 56px', display: 'flex', flexDirection: 'column', gap: 28 } },
        h('div', { className: 'page-head' },
          h('div', null, h('h2', { style: { margin: '0 0 6px', fontSize: 24, lineHeight: '32px', fontWeight: 600 } }, 'Find a group'), h('p', { className: 'lede', style: { margin: 0 } }, 'Join a group, or open one directly by its name.')),
          h(T.Button, { variant: 'primary', icon: 'plus', onClick: function () { app.ui.openCreate(''); } }, 'Create a group')),
        h('form', { onSubmit: submit, className: 'tc-section', style: { padding: '16px 20px' }, noValidate: true },
          h(T.TextField, {
            id: 'join', label: 'Join by name or link', placeholder: 'community, community.chatango.com or a full link', value: joinName, error: err || undefined, onChange: function (e) { setJoinName(e.target.value); setErr(''); },
            action: h(T.Button, { type: 'submit' }, 'Join')
          })),
        h(JoinedGroups, null))));
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
