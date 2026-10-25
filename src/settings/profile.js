function ProfilePage() {
  if (LIVE) return h(ProfilePageLive, null);
  var app = useApp(), s = app.state, me = userOf(s, s.me);
  function snapshot() { return { age: me.age || '', gender: me.gender || 'Not specified', location: me.location || '', about: me.about || '', visibility: Object.assign({}, s.profile.visibility), colors: Object.assign({}, s.profile.colors) }; }
  var st = useState(snapshot), draft = st[0], setDraft = st[1];
  var bioInput = useRef(null), bioMarkup = useMarkupToolbar(bioInput, 'pf-bio');
  var dirty = JSON.stringify(draft) !== JSON.stringify(snapshot());
  function set(k, v) { setDraft(function (d) { var n = JSON.parse(JSON.stringify(d)); setIn(n, k, v); return n; }); }
  var ageErr = draft.age !== '' && (isNaN(+draft.age) || +draft.age < 13 || +draft.age > 120) ? 'Enter an age between 13 and 120.' : '';
  var vis = [['age', 'Show my age', 'Displayed next to your name on your profile.'], ['gender', 'Show my gender', 'Hidden when set to Not specified.'], ['location', 'Show my location', 'Displayed next to your name on your profile.'], ['meet', 'Appear in Meet people', 'Lets other Chatango users find you by age and location.'], ['fullPage', 'Public full profile page', 'Your page on chatango.com. When off, only your mini profile is visible.']];
  var meta = [draft.visibility.age && draft.age ? draft.age : null, draft.visibility.gender ? genderShort(draft.gender) : null, draft.visibility.location && draft.location ? draft.location : null].filter(Boolean).join(' · ');
  return h(Page, { title: 'Profile', lede: 'This is your Chatango profile. Everyone on Chatango sees it, not only Torch users.', wide: true },
    h('div', { className: 'split' },
      h('div', { className: 'grow' },
        h(T.SettingsSection, { title: 'Profile picture', padded: true },
          h('div', { style: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 } },
            h(T.Avatar, { name: s.me, size: 72 }),
            h('div', { style: { display: 'flex', flexDirection: 'column', gap: 8 } },
              h('div', { className: 'btnrow' },
                h(T.Button, { icon: 'upload', onClick: function () { app.ui.toast('Uploading a picture is not part of this prototype.'); } }, 'Upload image'),
                h(T.Button, { variant: 'ghost', onClick: function () { app.ui.toast('Uploading a picture is not part of this prototype.'); } }, 'Remove')),
              h('span', { className: 'tc-hint' }, "JPG, PNG or GIF. You'll crop it to a square after upload.")))),
        h(T.SettingsSection, { title: 'About you', padded: true },
          h('div', { style: { display: 'flex', flexDirection: 'column', gap: 16 } },
            h('div', { className: 'grid3' },
              h(T.TextField, { id: 'pf-age', label: 'Age', type: 'number', min: 13, max: 120, value: draft.age, error: ageErr || undefined, onChange: function (e) { set('age', e.target.value); } }),
              h('div', { className: 'tc-field' }, h('label', { className: 'tc-label', htmlFor: 'pf-gender' }, 'Gender'),
                h('select', { id: 'pf-gender', className: 'tc-input', value: draft.gender, onChange: function (e) { set('gender', e.target.value); } }, ['Not specified', 'Male', 'Female'].map(function (g) { return h('option', { key: g }, g); }))),
              h(T.TextField, { id: 'pf-loc', label: 'Location', value: draft.location, onChange: function (e) { set('location', e.target.value); } })),
            h(T.TextField, { id: 'pf-bio', label: 'Bio', multiline: true, rows: 5, maxLength: 2000, value: draft.about, inputRef: bioInput, toolbar: bioMarkup.toolbar, onKeyDown: bioMarkup.onKeyDown, labelAside: h('span', { className: 'tc-msg-time' }, draft.about.length + ' / 2000'), hint: 'Bold, italic, links and images are supported. Scripts and custom fonts are removed.', onChange: function (e) { set('about', e.target.value); } }))),
        h(T.SettingsSection, { title: 'Visibility' }, vis.map(function (v) {
          return h(T.SettingRow, { key: v[0], title: v[1], description: v[2], control: h(T.Switch, { checked: !!draft.visibility[v[0]], onChange: function (e) { set('visibility.' + v[0], e.target.checked); } }) });
        })),
        h(T.SettingsSection, { title: 'Full profile page', description: 'Colors of your page on chatango.com. Nightango shows profiles in its own theme.', padded: true },
          h('div', { className: 'grid3' }, [['bg', 'Background'], ['text', 'Text'], ['link', 'Links']].map(function (c) {
            return h(ColorField, { key: c[0], id: 'pf-c-' + c[0], label: c[1], value: draft.colors[c[0]], onChange: function (v) { set('colors.' + c[0], v); } });
          }))),
        h(VisitorsSection, { bio: me.about || '', draft: draft.about, onDraft: function (v) { set('about', v); } })),
      h('aside', { className: 'side', 'aria-labelledby': 'pv-h' },
        h('h2', { id: 'pv-h', className: 'side-label' }, 'Preview'),
        h(ProfilePreviewCard, { name: s.me, meta: meta, about: draft.about, mini: miniStyleOf(s.prefs, { miniStyle: draft.colors }, app.theme) }),
        h('p', { className: 'muted', style: { margin: 0, fontSize: 12.5 } }, 'How other members see you when they open your profile from a group or a private message.'))),
    dirty ? h(T.SaveBar, {
      onDiscard: function () { setDraft(snapshot()); },
      onSave: function () {
        if (ageErr) { app.ui.toast('Fix the age before saving.'); return; }
        if (LIVE) { app.ui.toast('Saving your profile to Chatango is not wired in this test build yet.'); return; }
        app.update(function (d) { var u = d.users[d.me]; u.age = draft.age === '' ? '' : +draft.age; u.gender = draft.gender; u.location = draft.location; u.about = draft.about; u.aboutHtml = draft.about; d.profile.visibility = draft.visibility; d.profile.colors = draft.colors; });
        app.ui.toast('Profile saved to Chatango.', { icon: 'check' });
      }, saveLabel: 'Save profile'
    }, 'Unsaved changes to your Chatango profile') : null);
}

/**
 * Aperçu de son mini profil sur son fond Premium, bio rendue sans jamais injecter de HTML.
 * @param {string} p.name Nom de l'utilisateur connecté.
 * @param {string} p.meta Âge, genre et lieu déjà composés.
 * @param {string} p.about Bio du brouillon.
 * @param {?Object} p.mini Fond tel que le renvoie miniStyleOf.
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

// Motifs de Torch recopiés tels quels, point de vissle.me non échappé compris (inject.js:1472, 1490).
var VISSLE_TRACKER = /<script src="(?:https:)?\/\/vissle.me\/profile\/(\d+)"><\/script>/;
var VISSLE_TRACKER_LINE = /(\n)?(<script src="(?:https:)?\/\/vissle.me\/profile\/\d+"><\/script>)/;
// Barre oblique échappée : le prototype inline ce code dans une balise script que la fin de balise fermerait.
var VISSLE_TRACKER_ADD = '\n<script src="//vissle.me/profile/512"><\/script>';
/**
 * Permet de lire le tracker vissle d'une bio avec le motif de Torch.
 * @param {string} bio Bio du mini profil.
 * @returns {?number} Le n du tracker, null sans tracker.
 */
function vissleTrackerOf(bio) { var m = VISSLE_TRACKER.exec(bio); return m ? +m[1] : null; }

var VISIT_FILTERS = [{ value: 'all', label: 'All' }, { value: 'log', label: 'Visits' }, { value: 'like', label: 'Likes' }, { value: 'dislike', label: 'Dislikes' }, { value: 'msg', label: 'Comments' }, { value: 'refer', label: 'Referrals' }];
/**
 * Permet d'afficher une ligne d'activité vissle.
 * @param {object} r Ligne produite par visitorPage.
 */
function visitorRow(r) {
  return h(ActivityRow, { key: r.key, sub: r.msg, at: r.ts },
    h(Person, { name: r.user, label: r.name, size: 28, inert: r.guest }),
    ' ' + r.label,
    r.guest ? h('span', { style: { marginLeft: 8 } }, h(T.Badge, null, 'Guest')) : null);
}

/**
 * Activité de son propre profil enregistrée par vissle.me, et tracker vissle de la bio.
 * @param {string} p.bio Bio enregistrée, qui donne le statut du tracker.
 * @param {string} p.draft Bio du brouillon, que les boutons du tracker modifient.
 * @param {Function} p.onDraft Reçoit la nouvelle bio du brouillon.
 * @param {boolean} [p.disabled] Boutons du tracker désactivés.
 */
function VisitorsSection(p) {
  var app = useApp(), v = app.state.visitors;
  var get = v ? v.get : 'all', rows = v ? v.rows : [], loading = !v || v.loading;
  var tracked = vissleTrackerOf(p.bio) !== null, drafted = vissleTrackerOf(p.draft) !== null;
  var invite = 'Add the vissle tracker to your bio so vissle can record who opens your profile.';
  var inviteInList = !tracked && !rows.length && !loading && !(v && v.error);
  function toggleTracker() {
    if (drafted) { p.onDraft(p.draft.replace(VISSLE_TRACKER_LINE, '')); return; }
    // Règle de Torch : la bio balise comprise reste strictement sous 2000 caractères.
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
