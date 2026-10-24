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
      h('select', { className: 'tc-input', style: { width: 'auto' }, value: actor, onChange: function (e) { setActor(e.target.value); } }, h('option', { value: 'all' }, 'Everyone'), actors.map(function (n) { return h('option', { key: n, value: n }, n); })))
  },
    h(T.SettingsSection, null, log == null ? h(SkeletonRows, { count: 5, avatar: 28, label: 'Loading the log from Chatango' }) : rows.length ? rows.map(function (x, i) {
      var sys = MODLOG_SYSTEM[x.type], text = (MODLOG_TEXT[x.type] || 'did ' + x.type).replace('*t*', x.target || 'someone');
      return h(ActivityRow, { key: x.id, first: !i, at: x.at, lead: sys ? h('span', { className: 'role-ico' }, h(T.Icon, { name: 'lock', size: 14 })) : null },
        sys || h(Frag, null, h(Person, { name: x.actor, gid: g.id, size: 28 }), ' ', text));
    }) : h('p', { className: 'pal-empty' }, 'No entries.')));
}
