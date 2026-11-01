function GSAnnouncementLive(p) {
  var a = p.draft.announcement, loaded = !!p.g.live.annc, owner = p.myRole === 'owner';
  var canEdit = loaded && (owner || p.perms.editAnnouncement), canBroadcast = owner || p.perms.editRestrictions;
  function set(k, v) { p.edit(function (d) { d.announcement[k] = v; if (k === 'enabled' && v && !d.announcement.interval) d.announcement.interval = 15; }); }
  var options = withCurrent([[15, '15 minutes'], [30, '30 minutes'], [60, '1 hour']], a.interval || null, function (v) { return plural(v, 'minute', 'minutes'); });
  return h(Page, { title: 'Announcement', lede: 'Chatango posts the announcement in the chat at a regular interval.' },
    loaded ? null : h(T.Banner, { icon: 'info' }, 'Loading the announcement from Chatango.'),
    h(T.SettingsSection, null,
      h(T.SettingRow, { title: 'Post the announcement', control: h(T.Switch, { checked: !!a.enabled, disabled: !canEdit, onChange: function (e) { set('enabled', e.target.checked); } }) }),
      h('div', { className: 'tc-section-pad', style: { paddingTop: 14, borderTop: '1px solid var(--divider)' } },
        h(T.TextField, { id: 'ann-text', label: 'Text', multiline: true, rows: 3, maxLength: 500, value: a.text, disabled: !canEdit, labelAside: h('span', { className: 'tc-msg-time' }, a.text.length + ' / 500'), onChange: function (e) { set('text', e.target.value); } })),
      h(T.SettingRow, { asLabel: false, title: 'Post it every', control: liveSelect('ann-int', 'Repeat interval', a.interval || 15, options, function (v) { set('interval', v); }, !canEdit) }),
      h(T.SettingRow, { title: 'Broadcast mode', description: 'Only staff with the broadcast permission can post.', control: h(T.Switch, { checked: !!a.broadcast, disabled: !canBroadcast, onChange: function (e) { set('broadcast', e.target.checked); } }) })),
    a.text ? h('div', { style: { display: 'flex', flexDirection: 'column', gap: 10 } }, h('h2', { className: 'side-label' }, 'Preview'), h(T.Banner, { title: 'Announcement' }, a.text)) : null);
}

function GSAutoModLive(p) {
  var am = p.draft.automod, owner = p.myRole === 'owner';
  var canNlp = owner || p.perms.automod, canBw = owner || p.perms.bannedWords, canRes = owner || p.perms.editRestrictions;
  var slowOptions = withCurrent([[0, 'Off'], [5, '5 seconds'], [10, '10 seconds'], [30, '30 seconds'], [60, '1 minute']], am.slowMode, function (v) { return plural(v, 'second', 'seconds'); });
  return h(Page, { title: 'AutoMod', lede: 'Applied by Chatango before messages reach #' + p.g.id + '. Staff with the bypass permission are exempt.' },
    h(AutoModFilters, { filters: am.filters, disabled: !canNlp, onChange: function (k, v) { p.edit(function (d) { d.automod.filters[k] = v; }); } }),
    h(T.SettingsSection, { title: 'Who can post' },
      h(ProxiesRow, { on: am.proxies, disabled: !canRes, onChange: function (v) { p.edit(function (d) { d.automod.proxies = v; }); } }),
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

var BAN_SEARCH_ERRORS = { 1: 'That search is too long.', 2: "That's not a valid username.", 4: "That's not a valid IP address." };

/**
 * Shows a ban: member and author and date plus other names and the IP depending on the permission.
 * @param {Object} g Group.
 * @param {Object} x Ban read by the bridge.
 * @param {boolean} showIp The user can see IPs.
 * @param {*} action Button of the row.
 */
function banRow(g, x, showIp, action) {
  return h('div', { key: banKey(x), className: 'lrow' },
    h('span', { className: 'grow' },
      h(Person, { name: x.name, gid: g.id, size: 28, inert: !ACCOUNT_NAME.test(x.name) }),
      h('span', { className: 'lrow-sub person-sub' }, [x.by && 'by ' + x.by, x.at && ago(x.at)].filter(Boolean).join(' · ')),
      x.includes && x.includes.length ? h('span', { className: 'lrow-sub person-sub' }, 'Includes ' + x.includes.join(', ') + '.') : null),
    showIp ? h('span', { className: 'muted', style: { fontSize: 12 } }, x.ip) : null,
    action);
}

var BAN_LIST_TEXT = {
  block: { tab: 'Banned', loading: 'Loading the ban list from Chatango', more: 'Loading more bans', empty: 'Nobody is banned.', guests: 'Only guests are banned.' },
  unblock: { tab: 'Unbanned', loading: 'Loading unbans from Chatango', more: 'Loading more unbans', empty: 'Nobody was unbanned.', guests: 'Only guests were unbanned.' }
};

/**
 * List of bans or unbans loaded page by page on scroll.
 * @param {{g: Object, kind: string, hideGuests: boolean, showIp: boolean, scrollRef: Object, action: ?Function}} p Group, list, guest filter, permission to see IPs, scrolling area and button of each row.
 */
function BanPages(p) {
  var app = useApp(), list = banListOf(p.g, p.kind), page = list.page, text = BAN_LIST_TEXT[p.kind];
  var sentinelRef = useRef(null);
  useInfiniteScroll(p.scrollRef, sentinelRef, page.loaded && page.more && !page.loading, function () { app.actions.moreBans(p.g.id, p.kind); }, LOAD_BELOW_MARGIN);
  var rows = p.hideGuests ? list.rows.filter(function (x) { return !x.guest; }) : list.rows;
  if (!page.loaded) return h(SkeletonRows, { count: 3, avatar: 28, twoLines: true, label: text.loading });
  if (!rows.length && !page.more) return h('p', { className: 'pal-empty' }, list.rows.length ? text.guests : text.empty);
  return h(Frag, null,
    rows.map(function (x) { return banRow(p.g, x, p.showIp, p.action ? p.action(x) : null); }),
    page.more ? h('div', { ref: sentinelRef, className: 'list-more' }, page.loading ? h(T.Spinner, { label: text.more }) : null) : null);
}

function GSBansLive(p) {
  var app = useApp(), g = p.g, owner = p.myRole === 'owner', search = g.live.banSearch;
  var a = useState(''), name = a[0], setName = a[1];
  var b = useState(''), err = b[0], setErr = b[1];
  var c = useState(false), hideGuests = c[0], setHideGuests = c[1];
  var q = useState(''), query = q[0], setQuery = q[1];
  var t = useState('block'), tab = t[0], setTab = t[1];
  var list = banListOf(g, tab), unbansLoaded = g.live.unbanPage.loaded;
  var searching = tab === 'block' && !!search && (search.status === 'pending' || search.status === 'done');
  var searchError = !search ? '' : search.status === 'refused' ? BAN_SEARCH_ERRORS[search.code] || 'Chatango refused this search.' : search.status === 'timeout' ? "Chatango didn't answer the search. Try again." : '';
  useEffect(function () { app.actions.requestBans(g.id); }, [g.id]);
  useEffect(function () { if (tab === 'unblock' && !unbansLoaded) app.actions.requestUnbans(g.id); }, [g.id, tab, unbansLoaded]);
  var showIp = p.perms.seeIps;
  function ban() {
    var n = name.trim().toLowerCase();
    if (!n) { setErr('Enter a username.'); return; }
    if (n === app.state.me) { setErr("You can't ban yourself."); return; }
    if (roleOf(g, n) === 'owner') { setErr("The owner can't be banned."); return; }
    setName(''); setErr(''); app.ui.ban(n, g.id);
  }
  function runSearch() {
    var v = query.trim();
    if (v) app.actions.searchBans(g.id, v); else app.actions.clearBanSearch(g.id);
  }
  function unbanButton(x) { return h(T.Button, { size: 'sm', onClick: function () { app.actions.unbanEntry(g.id, x); } }, 'Unban'); }
  return h(Page, {
    title: 'Bans', lede: 'Banned members cannot post. Chatango bans the account and the IP of one of their messages.',
    aside: g.bans.length && (owner || p.perms.unbanAll) ? h(T.Button, { variant: 'danger', onClick: function () { app.ui.confirm({ title: 'Unban everyone?', body: g.live.banPage.more ? 'Everyone banned in #' + g.id + ' will be able to post again.' : plural(g.bans.length, 'member', 'members') + ' will be able to post in #' + g.id + ' again.', confirmLabel: 'Unban everyone', danger: true, onConfirm: function () { app.actions.unbanAll(g.id); } }); } }, 'Unban everyone') : null
  },
    h(T.SettingsSection, { title: 'Ban someone', padded: true },
      h(T.TextField, {
        id: 'ban-name', label: 'Username', value: name, error: err || undefined, hint: err ? undefined : 'They need a recent message in #' + g.id + '.', onChange: function (e) { setName(e.target.value); setErr(''); }, onKeyDown: function (e) { if (e.key === 'Enter') ban(); },
        action: h(T.Button, { variant: 'danger', icon: 'ban', onClick: ban }, 'Ban')
      })),
    h(T.SettingsSection, { title: BAN_LIST_TEXT[tab].tab + ' · ' + list.rows.length + (list.page.more ? '+' : '') },
      h('div', { className: 'tc-section-pad seg-scroll' }, h(T.SegmentedControl, { label: 'Ban list', value: tab, onChange: setTab, options: ['block', 'unblock'].map(function (k) { return { value: k, label: BAN_LIST_TEXT[k].tab }; }) })),
      tab === 'block' ? h('div', { className: 'tc-section-pad' }, h(T.TextField, {
        id: 'ban-search', label: 'Search bans', value: query, error: searchError || undefined, hint: searchError ? undefined : 'Username or IP address.',
        onChange: function (e) { setQuery(e.target.value); if (searchError) app.actions.clearBanSearch(g.id); }, onKeyDown: function (e) { if (e.key === 'Enter') runSearch(); },
        action: h(T.Button, { icon: 'search', onClick: runSearch }, 'Search')
      })) : null,
      searching ? h(Frag, null,
        search.status === 'pending' ? h(SkeletonRows, { count: 1, avatar: 28, twoLines: true, label: 'Searching the ban list' })
          : search.ban ? banRow(g, search.ban, showIp, unbanButton(search.ban))
            : h('p', { className: 'pal-empty' }, 'No ban found for ' + search.query + '.'),
        h('div', { className: 'tc-section-pad' }, h(T.Button, { size: 'sm', onClick: function () { setQuery(''); app.actions.clearBanSearch(g.id); } }, 'Clear search')))
        : h(Frag, null,
          h(T.SettingRow, { title: 'Hide guests', control: h(T.Switch, { checked: hideGuests, onChange: function (e) { setHideGuests(e.target.checked); } }) }),
          // One list per tab: the sentinel and its next page start over on every switch.
          h(BanPages, { key: tab, g: g, kind: tab, hideGuests: hideGuests, showIp: showIp, scrollRef: p.scrollRef, action: tab === 'block' ? unbanButton : null }))));
}
