function LiveGroupSection(p) {
  var s = useApp().state;
  return h('section', { 'aria-labelledby': p.id, style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' } },
    h('h2', { id: p.id, className: 'tc-section-title' }, p.title),
    p.names.length ? h('div', { className: 'cards small' }, p.names.map(function (k) {
      return h('article', { key: k, className: 'card row' }, h(T.Avatar, { name: k, square: true, size: 36 }),
        h('span', { className: 'card-title' }, h('strong', null, k), h('span', null, s.groups[k].title)), h(GroupJoinButton, { group: s.groups[k] }));
    })) : h('p', { className: 'muted', style: { margin: 0 } }, p.empty));
}
function LiveJoined() {
  var s = useApp().state;
  var names = Object.keys(s.groups);
  var joined = names.filter(function (k) { return s.groups[k].joined; });
  var rest = names.filter(function (k) { return !s.groups[k].joined; }).sort();
  var owned = rest.filter(function (k) { return s.groups[k].owned; });
  var recent = rest.filter(function (k) { return !s.groups[k].owned; });
  return h(Frag, null,
    h(LiveGroupSection, { id: 'lj-h', title: 'Joined groups', names: joined, empty: 'Connecting to your groups. They appear here as BetterChatango joins them.' }),
    owned.length ? h(LiveGroupSection, { id: 'lo-h', title: 'Groups you own', names: owned }) : null,
    recent.length ? h(LiveGroupSection, { id: 'lr-h', title: 'Recent groups', names: recent }) : null);
}
