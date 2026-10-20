var MEET_DEFAULTS = { query: '', sex: 'B', ageMin: 13, ageMax: 99, online: true, avatar: 0 };
/** Filtres qui s'écartent des valeurs par défaut de Torch, pour le compteur et les étiquettes. */
function meetActive(f) {
  var out = [];
  if (f.sex !== 'B') out.push(['sex', f.sex === 'M' ? 'Men' : 'Women']);
  if (+f.ageMin !== 13 || +f.ageMax !== 99) out.push(['age', 'Age ' + f.ageMin + ' to ' + f.ageMax]);
  if (+f.avatar) out.push(['avatar', +f.avatar === 1 ? 'Photos' : 'Characters']);
  if (!f.online) out.push(['online', 'Offline included']);
  return out;
}
/**
 * Carte d'une personne dans Meet people.
 * @param {Object} s État de l'application.
 * @param {string} n Nom du membre.
 * @param {string} theme Thème résolu.
 * @param {Function} onClick Ouverture de la fiche.
 */
function personCard(s, n, theme, onClick) {
  var u = userOf(s, n), isMe = n === s.me, mini = miniStyleOf(s.prefs, u, theme);
  var about = u.aboutHtml ? h(RichText, { html: u.aboutHtml, inline: true, bg: mini ? mini.bg : null }) : u.about || null;
  return h('button', { key: n, type: 'button', className: 'conv person' + (mini ? ' mini-bg' : ''), style: mini ? { backgroundColor: mini.bg, color: mini.text } : null, onClick: onClick },
    h(T.Avatar, { name: n, size: 44, status: isMe ? s.meStatus : u.status, ring: mini ? mini.bg : 'var(--panel)' }),
    h('span', { className: 'conv-main' },
      h('span', { className: 'conv-top' }, h('span', { className: 'conv-name' }, n), isMe ? h(T.Badge, null, 'You') : null, u.premium ? h(T.Badge, { tone: 'accent' }, 'Premium') : null),
      personMetaLine(n, u),
      isProfilePending(n, u) ? h('span', { className: 'conv-about skel-about' }, h('span', { className: 'tc-sr' }, 'Loading profile'), h(T.Skeleton, { width: 220, height: 10 }), h(T.Skeleton, { width: 130, height: 10 }))
        : h('span', { className: 'conv-about' }, about || (u.profileMissing ? 'No public profile.' : null))));
}

function MeetFilters(p) {
  var a = useState(function () { return Object.assign({}, p.value); }), f = a[0], setF = a[1];
  function set(k, v) { setF(function (x) { var o = Object.assign({}, x); o[k] = v; return o; }); }
  var lo = parseInt(f.ageMin, 10), hi = parseInt(f.ageMax, 10);
  var ageErr = isNaN(lo) || isNaN(hi) || lo < 13 || hi > 99 || lo > hi ? 'Use ages between 13 and 99, youngest first.' : '';
  function seg(label, value, options, onChange) {
    return h('div', { className: 'tc-field' }, h('span', { className: 'tc-label' }, label),
      h(T.SegmentedControl, { label: label, block: true, value: value, onChange: onChange, options: options }));
  }
  var num = { className: 'tc-input', type: 'number', min: 13, max: 99, style: { width: 84 } };
  return h(Dialog, {
    title: 'Filter people', description: 'Chatango lists public profiles that match every filter.', onClose: p.onClose,
    footer: [
      h(T.Button, { key: 'r', variant: 'ghost', onClick: function () { setF(Object.assign({}, MEET_DEFAULTS, { query: f.query })); } }, 'Reset'),
      h('span', { key: 'g', style: { flex: 1 } }),
      h(T.Button, { key: 'c', variant: 'ghost', onClick: p.onClose }, 'Cancel'),
      h(T.Button, { key: 'a', variant: 'primary', disabled: !!ageErr, onClick: function () { p.onApply(Object.assign({}, f, { ageMin: lo, ageMax: hi })); } }, 'Show results')
    ]
  },
    h('div', { className: 'dialog-body', style: { gap: 18 } },
      seg('Gender', f.sex, [{ value: 'B', label: 'Anyone' }, { value: 'M', label: 'Men' }, { value: 'F', label: 'Women' }], function (v) { set('sex', v); }),
      h('div', { className: 'tc-field' },
        h('span', { className: 'tc-label', id: 'meet-age-l' }, 'Age'),
        h('div', { role: 'group', 'aria-labelledby': 'meet-age-l', style: { display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-2)' } },
          h('input', Object.assign({ 'aria-label': 'Youngest', value: f.ageMin, 'aria-invalid': ageErr ? 'true' : undefined, onChange: function (e) { set('ageMin', e.target.value); } }, num)), 'to',
          h('input', Object.assign({ 'aria-label': 'Oldest', value: f.ageMax, 'aria-invalid': ageErr ? 'true' : undefined, onChange: function (e) { set('ageMax', e.target.value); } }, num))),
        h('span', { className: ageErr ? 'tc-error' : 'tc-hint' }, ageErr || 'From 13 to 99.')),
      seg('Profile picture', String(f.avatar || 0), [{ value: '0', label: 'Any' }, { value: '1', label: 'Photos' }, { value: '2', label: 'Characters' }], function (v) { set('avatar', +v); }),
      h('label', { className: 'tc-checkline', style: { justifyContent: 'space-between', width: '100%' } },
        h('span', null, h('span', { style: { display: 'block', fontWeight: 500 } }, 'Online now'), h('span', { className: 'tc-hint' }, 'Only people connected right now.')),
        h(T.Switch, { checked: !!f.online, onChange: function (e) { set('online', e.target.checked); } }))));
}

function MeetPeople() {
  var app = useApp(), s = app.state, meet = s.meet || null;
  var a = useState(function () { return Object.assign({}, MEET_DEFAULTS, meet && meet.filters); }), f = a[0], setF = a[1];
  var b = useState(false), filtersOpen = b[0], setFiltersOpen = b[1];
  function run(next) { setF(next); app.actions.searchPeople(next, false); }
  useEffect(function () { if (!s.meet) run(f); }, []);
  var results = meet ? meet.results : [];
  useProfiles(results);
  var scrollRef = useRef(null), sentinelRef = useRef(null);
  var canLoadMore = !!(meet && !meet.loading && !meet.done && !meet.error && results.length);
  // La page suivante reprend les filtres des résultats affichés : ils ne changent pas sans passer par un chargement.
  useEffect(function () {
    if (!canLoadMore) return;
    var io = new IntersectionObserver(function (entries) {
      if (entries.some(function (e) { return e.isIntersecting; })) app.actions.searchPeople(meet.filters, true);
    }, { root: scrollRef.current, rootMargin: '0px 0px 400px 0px' });
    io.observe(sentinelRef.current);
    return function () { io.disconnect(); };
  }, [canLoadMore]);
  var active = meetActive(f);
  function clear(key) {
    var nf = Object.assign({}, f);
    if (key === 'sex') nf.sex = 'B';
    if (key === 'age') { nf.ageMin = 13; nf.ageMax = 99; }
    if (key === 'avatar') nf.avatar = 0;
    if (key === 'online') nf.online = true;
    run(nf);
  }
  return h(Frag, null,
    h('form', { onSubmit: function (e) { e.preventDefault(); run(f); }, noValidate: true, role: 'search', style: { padding: '12px 12px 6px', display: 'flex', flexDirection: 'column', gap: 8 } },
      h('div', { style: { display: 'flex', gap: 8 } },
        h('label', { htmlFor: 'meet-q', className: 'tc-sr' }, 'Search people'),
        h('input', { id: 'meet-q', className: 'tc-input', type: 'search', style: { height: 34, flex: 1, minWidth: 0 }, placeholder: 'Username or keyword', value: f.query, onChange: function (e) { var v = e.target.value; setF(function (x) { return Object.assign({}, x, { query: v }); }); } }),
        h(T.Button, { size: 'sm', icon: 'sliders', style: { height: 34 }, 'aria-label': 'Filters' + (active.length ? ', ' + active.length + ' active' : ''), onClick: function () { setFiltersOpen(true); } },
          'Filters', active.length ? h('span', { className: 'filter-count', 'aria-hidden': 'true' }, active.length) : null),
        h(T.IconButton, { icon: 'rotate-cw', label: 'Refresh', size: 34, iconSize: 15, disabled: !!(meet && meet.loading), onClick: function () { run(f); } })),
      active.length ? h('div', { className: 'filter-chips' }, active.map(function (x) {
        return h('span', { key: x[0], className: 'filter-chip' }, x[1],
          h('button', { type: 'button', 'aria-label': 'Remove filter: ' + x[1], onClick: function () { clear(x[0]); } }, h(T.Icon, { name: 'x', size: 11 })));
      })) : null),
    h('div', { ref: scrollRef, className: 'scroll', style: { padding: '0 8px 12px' } },
      meet && meet.error ? h('p', { className: 'pal-empty' }, meet.error) : null,
      results.map(function (n) { return personCard(s, n, app.theme, function () { app.ui.openProfile(n, null); }); }),
      canLoadMore ? h('div', { ref: sentinelRef, 'aria-hidden': 'true', style: { height: 1 } }) : null,
      meet && meet.loading ? results.length ? h('div', { className: 'meet-more' }, h(T.Spinner, { label: 'Loading more people' }))
        : h('p', { className: 'pal-empty' }, 'Searching Chatango.') : null,
      meet && !meet.loading && !meet.error && !results.length ? h('p', { className: 'pal-empty' }, active.length ? 'Nobody matches these filters.' : 'Nobody found.') : null),
    filtersOpen ? h(MeetFilters, { value: f, onClose: function () { setFiltersOpen(false); }, onApply: function (nf) { setFiltersOpen(false); run(Object.assign({}, nf, { query: f.query })); } }) : null);
}
