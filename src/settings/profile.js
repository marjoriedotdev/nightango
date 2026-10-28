function ProfilePage() {
  if (LIVE) return h(ProfilePageLive, null);
  var app = useApp(), s = app.state, me = userOf(s, s.me);
  function snapshot() { return { age: me.age || '', gender: me.gender || 'Not specified', location: me.location || '', about: me.about || '', meet: !!s.profile.visibility.meet }; }
  var st = useState(snapshot), draft = st[0], setDraft = st[1];
  var bioInput = useRef(null), bioMarkup = useMarkupToolbar(bioInput, 'pf-bio');
  var dirty = JSON.stringify(draft) !== JSON.stringify(snapshot());
  function set(k, v) { setDraft(function (d) { var n = JSON.parse(JSON.stringify(d)); setIn(n, k, v); return n; }); }
  var ageErr = draft.age !== '' && (isNaN(+draft.age) || +draft.age < 13 || +draft.age > 120) ? 'Enter an age between 13 and 120.' : '';
  var meta = [draft.age, genderShort(draft.gender), draft.location].filter(Boolean).join(' · ');
  return h(Page, { title: 'Profile', lede: 'This is your Chatango profile. Everyone on Chatango sees it, not only BetterChatango users.', wide: true },
    h('div', { className: 'split' },
      h('div', { className: 'grow' },
        h(T.SettingsSection, { title: 'About you', padded: true },
          h('div', { style: { display: 'flex', flexDirection: 'column', gap: 16 } },
            h('div', { className: 'grid3' },
              h(T.TextField, { id: 'pf-age', label: 'Age', type: 'number', min: 13, max: 120, value: draft.age, error: ageErr || undefined, onChange: function (e) { set('age', e.target.value); } }),
              h('div', { className: 'tc-field' }, h('label', { className: 'tc-label', htmlFor: 'pf-gender' }, 'Gender'),
                h('select', { id: 'pf-gender', className: 'tc-input', value: draft.gender, onChange: function (e) { set('gender', e.target.value); } }, [['Not specified', 'Not specified'], ['Male', 'M'], ['Female', 'F']].map(function (g) { return h('option', { key: g[0], value: g[0] }, g[1]); }))),
              h(T.TextField, { id: 'pf-loc', label: 'Location', value: draft.location, onChange: function (e) { set('location', e.target.value); } })),
            h(T.TextField, { id: 'pf-bio', label: 'Bio', multiline: true, rows: 5, maxLength: 2000, value: draft.about, inputRef: bioInput, toolbar: bioMarkup.toolbar, onKeyDown: bioMarkup.onKeyDown, labelAside: h('span', { className: 'tc-msg-time' }, draft.about.length + ' / 2000'), hint: 'Shown in your mini profile.', onChange: function (e) { set('about', e.target.value); } }))),
        h(VisibilitySection, { meet: draft.meet, onChange: function (v) { set('meet', v); } }),
        h(VisitorsSection, { bio: me.about || '', draft: draft.about, onDraft: function (v) { set('about', v); } })),
      h('aside', { className: 'side', 'aria-labelledby': 'pv-h' },
        h('h2', { id: 'pv-h', className: 'side-label' }, 'Preview'),
        h(ProfilePreviewCard, { name: s.me, meta: meta, about: draft.about, mini: miniStyleOf(s.prefs, me, app.theme) }),
        h('p', { className: 'muted', style: { margin: 0, fontSize: 12.5 } }, 'How other members see you when they open your profile from a group or a private message.'))),
    dirty ? h(T.SaveBar, {
      onDiscard: function () { setDraft(snapshot()); },
      onSave: function () {
        if (ageErr) { app.ui.toast('Fix the age before saving.'); return; }
        app.update(function (d) { var u = d.users[d.me]; u.age = draft.age === '' ? '' : +draft.age; u.gender = draft.gender; u.location = draft.location; u.about = draft.about; u.aboutHtml = draft.about; d.profile.visibility.meet = draft.meet; });
        app.ui.toast('Profile saved.', { icon: 'check' });
      }, saveLabel: 'Save profile'
    }, 'Unsaved changes to your Chatango profile') : null);
}

/**
 * Visibility of the user's own profile in Meet people.
 * @param {{meet: boolean, disabled: boolean, onChange: Function}} p Profile listed in Meet people, switch locked, receives the new value.
 */
function VisibilitySection(p) {
  return h(T.SettingsSection, { title: 'Visibility' },
    h(T.SettingRow, { title: 'Appear in Meet people', description: 'Lets other Chatango users find you by age and location.', control: h(T.Switch, { checked: !!p.meet, disabled: p.disabled, onChange: function (e) { p.onChange(e.target.checked); } }) }));
}

/**
 * Preview of the user's own mini profile on its Premium background with the bio rendered without ever injecting HTML.
 * @param {string} p.name Name of the signed-in user.
 * @param {string} p.meta Age, gender and location already joined.
 * @param {string} p.about Draft bio.
 * @param {?Object} p.mini Background as miniStyleOf returns it.
 */
function ProfilePreviewCard(p) {
  var mini = p.mini, cover = useMiniCover(mini), bg = mini ? mini.bg : 'var(--subtle)';
  return h('div', { style: Object.assign(mini ? miniSkin(mini) : {}, { border: '1px solid var(--border)', borderRadius: 12, background: bg, overflow: 'hidden' }) },
    h('div', { style: { height: 64, background: mini ? 'var(--hover-2)' : 'var(--selected)' } },
      cover.shown ? h('img', { src: cover.image, alt: '', referrerPolicy: 'no-referrer', style: { display: 'block', width: '100%', height: '100%', objectFit: 'cover' } }) : null),
    h('div', { style: { padding: '0 18px 18px', marginTop: -32 } },
      h(T.Avatar, { name: p.name, size: 64, style: { border: '4px solid ' + bg, boxSizing: 'content-box' } }),
      h('p', { style: { margin: '8px 0 0', fontSize: 17, fontWeight: 600 } }, p.name),
      p.meta ? h('p', { className: 'muted', style: { margin: 0, fontSize: 13 } }, p.meta) : null,
      p.about ? h('div', { style: { marginTop: 12 } }, h(RichText, { html: p.about, bg: mini ? mini.bg : null, link: mini ? mini.link : null })) : h('p', { className: 'about', style: { marginTop: 12 } }, 'No bio yet.'),
      mini ? coverReveal(cover, mini) : null));
}

// BetterChatango patterns copied as is, including the unescaped dot of vissle.me (inject.js:1472, 1490).
var VISSLE_TRACKER = /<script src="(?:https:)?\/\/vissle.me\/profile\/(\d+)"><\/script>/;
var VISSLE_TRACKER_LINE = /(\n)?(<script src="(?:https:)?\/\/vissle.me\/profile\/\d+"><\/script>)/;
// Escaped slash: the prototype inlines this code in a script tag that the closing tag would end.
var VISSLE_TRACKER_ADD = '\n<script src="//vissle.me/profile/512"><\/script>';
/**
 * Reads the vissle tracker of a bio with the BetterChatango pattern.
 * @param {string} bio Mini profile bio.
 * @returns {?number} The tracker n, null without a tracker.
 */
function vissleTrackerOf(bio) { var m = VISSLE_TRACKER.exec(bio); return m ? +m[1] : null; }

var VISIT_FILTERS = [{ value: 'all', label: 'All' }, { value: 'log', label: 'Visits' }, { value: 'like', label: 'Likes' }, { value: 'dislike', label: 'Dislikes' }, { value: 'msg', label: 'Comments' }, { value: 'refer', label: 'Referrals' }];
/**
 * Shows a vissle activity row.
 * @param {object} r Row produced by visitorPage.
 */
function visitorRow(r) {
  return h(ActivityRow, { key: r.key, sub: r.msg, at: r.ts },
    h(Person, { name: r.user, label: r.name, size: 28, inert: r.guest }),
    ' ' + r.label,
    r.guest ? h('span', { style: { marginLeft: 8 } }, h(T.Badge, null, 'Guest')) : null);
}

/**
 * Activity of the user's own profile recorded by vissle.me and the vissle tracker of the bio.
 * @param {string} p.bio Saved bio, which gives the tracker status.
 * @param {string} p.draft Draft bio, which the tracker buttons edit.
 * @param {Function} p.onDraft Receives the new draft bio.
 * @param {boolean} [p.disabled] Tracker buttons disabled.
 */
function VisitorsSection(p) {
  var app = useApp(), v = app.state.visitors;
  var get = v ? v.get : 'all', rows = v ? v.rows : [], loading = !v || v.loading;
  var tracked = vissleTrackerOf(p.bio) !== null, drafted = vissleTrackerOf(p.draft) !== null;
  var invite = 'Add the vissle tracker to your bio so vissle can record who opens your profile.';
  var inviteInList = !tracked && !rows.length && !loading && !(v && v.error);
  function toggleTracker() {
    if (drafted) { p.onDraft(p.draft.replace(VISSLE_TRACKER_LINE, '')); return; }
    // BetterChatango rule: the bio, tag included, stays strictly under 2000 characters.
    var over = p.draft.length - (2000 - VISSLE_TRACKER_ADD.length) + 1;
    if (over > 0) { app.ui.toast('Remove ' + over + (over === 1 ? ' character' : ' characters') + ' from your bio to make room for the tracker.'); return; }
    p.onDraft(p.draft + VISSLE_TRACKER_ADD);
  }
  useEffect(function () { app.actions.loadVisitors(get, false); }, []);
  return h(T.SettingsSection, {
    title: 'Visitors', description: 'Activity on your profile recorded by vissle.me.',
    headerAside: h(T.IconButton, { icon: 'rotate-cw', label: 'Refresh', size: 34, iconSize: 15, disabled: loading, onClick: function () { app.actions.loadVisitors(get, false); } })
  },
    h(T.SettingRow, { asLabel: false, title: 'Profile tracker', description: tracked ? 'The vissle tracker is in your bio.' : inviteInList ? null : invite, control: h(T.Button, { size: 'sm', disabled: p.disabled, onClick: toggleTracker }, drafted ? 'Remove tracker' : 'Add tracker') }),
    h('div', { className: 'tc-section-pad seg-scroll' }, h(T.SegmentedControl, { label: 'Activity type', value: get, options: VISIT_FILTERS, onChange: function (g) { app.actions.loadVisitors(g, false); } })),
    rows.map(visitorRow),
    v && v.error ? h('p', { className: 'pal-empty' }, v.error)
      : !rows.length ? loading ? h(SkeletonRows, { count: 5, avatar: 28, label: 'Loading activity from vissle.me' }) : h('p', { className: 'pal-empty' }, tracked ? 'No activity yet.' : invite)
        : v.next ? h('div', { style: { padding: 12, display: 'flex', justifyContent: 'center', borderTop: '1px solid var(--divider)' } },
          loading ? h(T.Spinner, { label: 'Loading more activity' }) : h(T.Button, { size: 'sm', onClick: function () { app.actions.loadVisitors(get, true); } }, 'Load more')) : null);
}
