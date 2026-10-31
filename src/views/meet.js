var MEET_DEFAULTS = { query: '', sex: 'B', ageMin: 13, ageMax: 99, online: true, avatar: 0 };
var PULL_TRIGGER = 64, PULL_MAX = 96;
/** Filters that differ from BetterChatango's defaults, for the counter and the chips. */
function meetActive(f) {
  var out = [];
  if (f.sex !== 'B') out.push(['sex', f.sex]);
  if (+f.ageMin !== 13 || +f.ageMax !== 99) out.push(['age', 'Age ' + f.ageMin + ' to ' + f.ageMax]);
  if (+f.avatar) out.push(['avatar', +f.avatar === 1 ? 'Photos' : 'Characters']);
  if (!f.online) out.push(['online', 'Offline included']);
  return out;
}
/**
 * Person card in Meet people.
 * @param {Object} s Application state.
 * @param {string} n Member name.
 * @param {string} theme Resolved theme.
 * @param {Function} onClick Opens the card.
 * @param {boolean} [noStatus] True where Nightango has no presence for the account: no dot, neither online nor offline.
 */
function personCard(s, n, theme, onClick, noStatus) {
  var u = userOf(s, n), isMe = n === s.me, status = noStatus ? null : isMe ? s.meStatus : u.status, mini = miniStyleOf(s.prefs, u, theme);
  var about = u.aboutHtml ? h(RichText, { html: u.aboutHtml, inline: true, bg: mini ? mini.bg : null }) : u.about || null;
  return h('button', { key: n, type: 'button', className: 'conv person' + (mini ? ' mini-bg' : ''), style: mini ? { backgroundColor: mini.bg, color: mini.text } : null, onClick: onClick },
    h(T.Avatar, { name: n, size: 44, status: status, ring: mini ? mini.bg : 'var(--panel)' }),
    h('span', { className: 'conv-main' },
      h('span', { className: 'conv-top' }, h('span', { className: 'conv-name' }, n), status ? presenceSr(status) : null, youBadge(isMe), developerBadge(n), premiumBadge(u.premium)),
      personMetaLine(n, u),
      isProfilePending(n, u) ? h('span', { className: 'conv-about skel-about' }, h('span', { className: 'tc-sr' }, 'Loading profile'), h(T.Skeleton, { width: 220, height: 10 }), h(T.Skeleton, { width: 130, height: 10 }))
        : h('span', { className: 'conv-about' }, about || (u.profileMissing ? 'No public profile.' : null))));
}

/**
 * Age range with two handles that never meet: Chatango finds nobody when the youngest and oldest ages are equal.
 * @param {{lo: number, hi: number, onChange: Function}} p Ages shown and their setter, called with (lo, hi).
 */
function AgeRange(p) {
  var min = MEET_DEFAULTS.ageMin, max = MEET_DEFAULTS.ageMax, span = max - min;
  var a = useState(null), hover = a[0], setHover = a[1];
  // Handles can overlap: the one on the pointer's side goes on top, else the one that can still move away from its end.
  var loOnTop = hover ? hover === 'lo' : p.lo > (min + max) / 2;
  function onPointerMove(e) {
    if (e.buttons) return;
    var r = e.currentTarget.getBoundingClientRect();
    // 9: half the handle width in app.css, where the handle center stops at each end.
    var v = min + (e.clientX - r.left - 9) / (r.width - 18) * span;
    setHover(v < (p.lo + p.hi) / 2 ? 'lo' : 'hi');
  }
  function handle(label, value, onValue, top) {
    return h('input', { type: 'range', min: min, max: max, step: 1, value: value, 'aria-label': label, style: top ? { zIndex: 1 } : null, onChange: function (e) { onValue(+e.target.value); } });
  }
  return h('div', { className: 'age-range', onPointerMove: onPointerMove, onPointerLeave: function () { setHover(null); } },
    h('div', { className: 'age-range-track' }, h('span', { style: { left: (p.lo - min) / span * 100 + '%', right: (max - p.hi) / span * 100 + '%' } })),
    handle('Youngest', p.lo, function (v) { p.onChange(Math.min(v, p.hi - 1), p.hi); }, loOnTop),
    handle('Oldest', p.hi, function (v) { p.onChange(p.lo, Math.max(v, p.lo + 1)); }, false));
}

function MeetFilters(p) {
  var a = useState(function () { return Object.assign({}, p.value); }), f = a[0], setF = a[1];
  function set(k, v) { setF(function (x) { var o = Object.assign({}, x); o[k] = v; return o; }); }
  function seg(label, value, options, onChange) {
    return h('div', { className: 'tc-field' }, h('span', { className: 'tc-label' }, label),
      h(T.SegmentedControl, { label: label, block: true, value: value, onChange: onChange, options: options }));
  }
  return h(Dialog, {
    title: 'Filter people', description: 'Chatango lists public profiles that match every filter.', onClose: p.onClose,
    footer: [
      h(T.Button, { key: 'r', variant: 'ghost', onClick: function () { setF(Object.assign({}, MEET_DEFAULTS, { query: f.query })); } }, 'Reset'),
      h('span', { key: 'g', style: { flex: 1 } }),
      h(T.Button, { key: 'c', variant: 'ghost', onClick: p.onClose }, 'Cancel'),
      h(T.Button, { key: 'a', variant: 'primary', onClick: function () { p.onApply(f); } }, 'Show results')
    ]
  },
    h('div', { className: 'dialog-body', style: { gap: 18 } },
      seg('Gender', f.sex, [{ value: 'B', label: 'Anyone' }, { value: 'M', label: 'M' }, { value: 'F', label: 'F' }], function (v) { set('sex', v); }),
      h('div', { className: 'tc-field', role: 'group', 'aria-labelledby': 'meet-age-l' },
        h('span', { className: 'age-range-head' }, h('span', { className: 'tc-label', id: 'meet-age-l' }, 'Age'), h('span', { className: 'tnum' }, f.ageMin + ' to ' + f.ageMax)),
        h(AgeRange, { lo: f.ageMin, hi: f.ageMax, onChange: function (lo, hi) { setF(function (x) { return Object.assign({}, x, { ageMin: lo, ageMax: hi }); }); } }),
        h('span', { className: 'tc-hint' }, 'Chatango searches two ages or more.')),
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
  var scrollRef = useRef(null), sentinelRef = useRef(null), pullRef = useRef(null);
  var c = useState(null), pull = c[0], setPull = c[1];
  var loading = !!(meet && meet.loading);
  if (pull === 'refresh' && !loading) setPull(null);
  // The offset follows the finger outside React: one render per touchmove would cost too much.
  function setPullOffset(dy) {
    scrollRef.current.style.setProperty('--pull', dy + 'px');
    scrollRef.current.style.setProperty('--pull-progress', dy / PULL_TRIGGER);
  }
  function onTouchStart(e) {
    pullRef.current = !loading && scrollRef.current.scrollTop <= 0 ? { y: e.touches[0].clientY, dy: 0 } : null;
  }
  function onTouchMove(e) {
    var g = pullRef.current;
    if (!g) return;
    var dy = e.touches[0].clientY - g.y;
    if (dy <= 0 || scrollRef.current.scrollTop > 0) { onTouchCancel(); return; }
    g.dy = Math.min(PULL_MAX, dy / 2);
    setPullOffset(g.dy);
    setPull('drag');
  }
  function onTouchEnd() {
    var g = pullRef.current;
    if (!g) return;
    pullRef.current = null;
    setPullOffset(0);
    if (g.dy >= PULL_TRIGGER && !loading) { run(f); setPull('refresh'); } else setPull(null);
  }
  function onTouchCancel() {
    pullRef.current = null;
    setPullOffset(0);
    setPull(null);
  }
  var canLoadMore = !!(meet && !meet.loading && !meet.done && !meet.error && results.length);
  // The next page reuses the filters of the shown results: they never change without a load.
  useInfiniteScroll(scrollRef, sentinelRef, canLoadMore, function () { app.actions.searchPeople(meet.filters, true); }, LOAD_BELOW_MARGIN);
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
        h('input', { id: 'meet-q', className: 'tc-input', type: 'search', style: { flex: 1, minWidth: 0 }, placeholder: 'Username or keyword', value: f.query, onChange: function (e) { var v = e.target.value; setF(function (x) { return Object.assign({}, x, { query: v }); }); } }),
        h(T.Button, { icon: 'sliders', 'aria-label': 'Filters' + (active.length ? ', ' + active.length + ' active' : ''), onClick: function () { setFiltersOpen(true); } },
          'Filters', active.length ? h('span', { className: 'filter-count', 'aria-hidden': 'true' }, active.length) : null),
        h(T.IconButton, { icon: 'rotate-cw', label: 'Refresh', size: 34, iconSize: 15, className: 'hide-mobile', disabled: loading, onClick: function () { run(f); } })),
      active.length ? h('div', { className: 'filter-chips' }, active.map(function (x) {
        return h('span', { key: x[0], className: 'filter-chip' }, x[1],
          h('button', { type: 'button', 'aria-label': 'Remove filter: ' + x[1], onClick: function () { clear(x[0]); } }, h(T.Icon, { name: 'x', size: 11 })));
      })) : null),
    h('div', { ref: scrollRef, className: 'scroll pull-scroll', style: { padding: '0 8px 12px' }, onTouchStart: onTouchStart, onTouchMove: onTouchMove, onTouchEnd: onTouchEnd, onTouchCancel: onTouchCancel },
      h('div', { className: cx('pull', pull), 'aria-hidden': 'true' }, pull === 'refresh' ? h(T.Spinner, null) : h(T.Icon, { name: 'rotate-cw', size: 16 })),
      meet && meet.error ? h('p', { className: 'pal-empty' }, meet.error) : null,
      results.map(function (n) { return personCard(s, n, app.theme, function () { app.ui.openProfile(n, null); }); }),
      canLoadMore ? h('div', { ref: sentinelRef, 'aria-hidden': 'true', style: { height: 1 } }) : null,
      meet && meet.loading ? results.length ? h('div', { className: 'list-more' }, h(T.Spinner, { label: 'Loading more people' }))
        : h(SkeletonRows, { count: 5, avatar: 44, twoLines: true, label: 'Searching Chatango' }) : null,
      meet && !meet.loading && !meet.error && !results.length ? h('p', { className: 'pal-empty' }, active.length ? 'Nobody matches these filters.' : 'Nobody found.') : null),
    filtersOpen ? h(MeetFilters, { value: f, onClose: function () { setFiltersOpen(false); }, onApply: function (nf) { setFiltersOpen(false); run(Object.assign({}, nf, { query: f.query })); } }) : null);
}
