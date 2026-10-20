function LiveJoined() {
  var app = useApp(), s = app.state;
  var joined = Object.keys(s.groups).filter(function (k) { return s.groups[k].joined; });
  return h('section', { 'aria-labelledby': 'lj-h', style: { display: 'flex', flexDirection: 'column', gap: 12 } },
    h('h2', { id: 'lj-h', className: 'tc-section-title' }, 'Your groups'),
    joined.length ? h('div', { className: 'cards small' }, joined.map(function (k) {
      var g = s.groups[k];
      return h('article', { key: k, className: 'card row' }, h(T.Avatar, { name: k, square: true, size: 36 }),
        h('span', { className: 'card-title' }, h('strong', null, k), h('span', null, g.title)),
        h(T.Button, { size: 'sm', variant: 'ghost', onClick: function () { app.nav({ view: 'group', id: k }); } }, 'Open'));
    })) : h('p', { className: 'muted', style: { margin: 0 } }, 'Connecting to your groups. They appear here as Torch joins them.'));
}
