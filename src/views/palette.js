/* ---------- Command palette ---------- */
function Palette(p) {
  var app = useApp(), s = app.state;
  var a = useState(''), q = a[0], setQ = a[1];
  var b = useState(0), sel = b[0], setSel = b[1];
  var entries = [];
  Object.keys(s.groups).forEach(function (k) {
    var g = s.groups[k];
    if (g.joined) entries.push({ group: 'Groups', label: '#' + k, hint: g.mentions ? '@' + g.mentions.toLocaleString('en-US') : g.unread ? g.unread.toLocaleString('en-US') + ' new' : '', icon: 'hash', run: function () { app.nav({ view: 'group', id: k }); } });
  });
  listedDms(s).forEach(function (n) { entries.push({ group: 'People', label: n, hint: statusLabel(userOf(s, n).status), icon: 'message', run: function () { app.actions.openDm(n); } }); });
  SETTINGS_NAV.forEach(function (sec) {
    sec.items.forEach(function (it) { entries.push({ group: 'Settings', label: it[1], hint: 'Settings', icon: 'sliders', run: function () { app.nav({ view: 'settings', page: it[0] }); } }); });
  });
  entries.push({ group: 'Actions', label: 'Discover groups', icon: 'compass', run: function () { app.nav({ view: 'discover' }); } });
  entries.push({ group: 'Actions', label: 'Friends', icon: 'users', run: function () { app.nav({ view: 'dm', id: null, tab: 'friends' }); } });
  entries.push({ group: 'Actions', label: 'Meet people', icon: 'search', run: function () { app.nav({ view: 'dm', id: null, tab: 'meet' }); } });
  entries.push({ group: 'Actions', label: 'Create a group', icon: 'plus', run: function () { app.ui.openCreate(''); } });
  var ql = q.trim().toLowerCase();
  var shown = entries.filter(function (e) { return !ql || e.label.toLowerCase().indexOf(ql.replace(/^#/, '')) >= 0; }).slice(0, 40);
  var cur = Math.min(sel, Math.max(shown.length - 1, 0));
  function run(e) { p.onClose(); e.run(); }
  function onKey(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel((cur + 1) % Math.max(shown.length, 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSel((cur - 1 + shown.length) % Math.max(shown.length, 1)); }
    if (e.key === 'Enter' && shown[cur]) { e.preventDefault(); run(shown[cur]); }
  }
  var lastGroup = null;
  return h(Dialog, { label: 'Search or jump to', wide: true, onClose: p.onClose },
    h('input', { className: 'pal-input', placeholder: 'Search groups, people and settings', value: q, autoFocus: true, 'aria-label': 'Search', 'aria-controls': 'pal-list', 'aria-activedescendant': shown[cur] ? 'pal-' + cur : undefined, role: 'combobox', 'aria-expanded': 'true', onChange: function (e) { setQ(e.target.value); setSel(0); }, onKeyDown: onKey }),
    h('div', { className: 'pal-list', id: 'pal-list', role: 'listbox' },
      shown.length ? shown.map(function (e, i) {
        var head = e.group !== lastGroup ? h('div', { className: 'pal-group', key: 'g' + e.group }, e.group) : null;
        lastGroup = e.group;
        return h(Frag, { key: e.group + e.label },
          head,
          h('button', { type: 'button', id: 'pal-' + i, role: 'option', 'aria-selected': String(i === cur), className: 'pal-item', tabIndex: -1, onMouseEnter: function () { setSel(i); }, onClick: function () { run(e); } },
            h(T.Icon, { name: e.icon, size: 15 }), h('span', null, e.label), e.hint ? h('span', { className: 'muted' }, e.hint) : null));
      }) : h('p', { className: 'pal-empty' }, 'Nothing matches ' + q + '.')));
}
