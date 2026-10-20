/* ---------- Réglages utilisateur ---------- */
var SETTINGS_NAV = [
  { title: 'Account', items: [['profile', 'Profile'], ['privacy', 'Privacy'], ['safety', 'Safety'], ['account', 'Password and email'], ['premium', 'Chatango Premium']] },
  { title: 'App', items: [['appearance', 'Appearance'], ['notifications', 'Notifications'], ['language', 'Language'], ['accessibility', 'Accessibility']] },
  { title: 'Support', items: [['whatsnew', "What's new"], ['about', 'About Torch']] }
];

function setIn(obj, path, value) {
  var keys = path.split('.'), o = obj;
  for (var i = 0; i < keys.length - 1; i++) o = o[keys[i]];
  o[keys[keys.length - 1]] = value;
}
function getIn(obj, path) { return path.split('.').reduce(function (o, k) { return o == null ? o : o[k]; }, obj); }
function usePref() {
  var app = useApp();
  return {
    get: function (path) { return getIn(app.state.prefs, path); },
    set: function (path, v) { app.update(function (d) { setIn(d.prefs, path, v); }); },
    sw: function (path) {
      var v = getIn(app.state.prefs, path);
      return h(T.Switch, { checked: !!v, onChange: function (e) { var nv = e.target.checked; app.update(function (d) { setIn(d.prefs, path, nv); }); } });
    }
  };
}

function SettingsShell(p) {
  var app = useApp();
  return h('div', { className: 'settings' },
    h('nav', { className: 'snav', 'aria-label': p.navLabel },
      h(T.NavItem, { icon: 'arrow-left', label: 'Back to chat', onClick: p.onBack }),
      p.header || null,
      p.sections.map(function (sec) {
        return h(Frag, { key: sec.title },
          h('h3', null, sec.title),
          sec.items.map(function (it) {
            return h(T.NavItem, { key: it[0], label: it[1], active: p.page === it[0], onClick: function () { p.onPage(it[0]); } });
          }));
      }),
      h('span', { style: { flex: 1, minHeight: 24 } }),
      p.footer || null),
    h('div', { className: 'snav-select' },
      h(T.IconButton, { icon: 'arrow-left', label: 'Back to chat', onClick: p.onBack }),
      h('label', { htmlFor: 'snav-sel', className: 'tc-sr' }, 'Settings page'),
      h('select', { id: 'snav-sel', className: 'tc-input', style: { height: 36 }, value: p.page, onChange: function (e) { p.onPage(e.target.value); } },
        p.sections.map(function (sec) { return h('optgroup', { key: sec.title, label: sec.title }, sec.items.map(function (it) { return h('option', { key: it[0], value: it[0] }, it[1]); })); }))),
    h('div', { className: 'spage' }, p.children));
}

function Page(p) {
  return h('div', { className: cx('spage-inner', p.wide && 'wide') },
    h('div', { className: p.aside ? 'page-head' : null },
      h('div', null, h('h1', null, p.title), p.lede ? h('p', { className: 'lede' }, p.lede) : null),
      p.aside || null),
    p.children);
}

function SettingsView(p) {
  var app = useApp(), page = p.page || 'appearance';
  var map = { profile: ProfilePage, privacy: PrivacyPage, safety: SafetyPage, account: AccountPage, premium: PremiumPage, appearance: AppearancePage, notifications: NotificationsPage, language: LanguagePage, accessibility: AccessibilityPage, whatsnew: WhatsNewPage, about: AboutPage };
  var Comp = map[page] || AppearancePage;
  return h(SettingsShell, {
    navLabel: 'Settings', sections: SETTINGS_NAV, page: page,
    onBack: app.actions.backToChat, onPage: function (pg) { app.nav({ view: 'settings', page: pg }); },
    footer: h(T.NavItem, { icon: 'log-out', label: 'Log out', className: 'danger-nav', onClick: app.actions.logout })
  }, h(Comp, { key: page }));
}

function ProfilePage() {
  if (LIVE) return h(ProfilePageLive, null);
  var app = useApp(), s = app.state, me = userOf(s, s.me);
  function snapshot() { return { age: me.age || '', gender: me.gender || 'Not specified', location: me.location || '', about: me.about || '', visibility: Object.assign({}, s.profile.visibility), colors: Object.assign({}, s.profile.colors) }; }
  var st = useState(snapshot), draft = st[0], setDraft = st[1];
  var dirty = JSON.stringify(draft) !== JSON.stringify(snapshot());
  function set(k, v) { setDraft(function (d) { var n = JSON.parse(JSON.stringify(d)); setIn(n, k, v); return n; }); }
  var ageErr = draft.age !== '' && (isNaN(+draft.age) || +draft.age < 13 || +draft.age > 120) ? 'Enter an age between 13 and 120.' : '';
  var vis = [['age', 'Show my age', 'Displayed next to your name on your profile.'], ['gender', 'Show my gender', 'Hidden when set to Not specified.'], ['location', 'Show my location', 'Displayed next to your name on your profile.'], ['meet', 'Appear in Meet people', 'Lets other Chatango users find you by age and location.'], ['fullPage', 'Public full profile page', 'Your page on chatango.com. When off, only your mini profile is visible.']];
  var meta = [draft.visibility.age && draft.age ? draft.age : null, draft.visibility.gender && draft.gender !== 'Not specified' ? draft.gender : null, draft.visibility.location && draft.location ? draft.location : null].filter(Boolean).join(' · ');
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
            h(T.TextField, { id: 'pf-bio', label: 'Bio', multiline: true, rows: 5, maxLength: 2000, value: draft.about, labelAside: h('span', { className: 'tc-msg-time' }, draft.about.length + ' / 2000'), hint: 'Bold, italic, links and images are supported. Scripts and custom fonts are removed.', onChange: function (e) { set('about', e.target.value); } }))),
        h(T.SettingsSection, { title: 'Visibility' }, vis.map(function (v) {
          return h(T.SettingRow, { key: v[0], title: v[1], description: v[2], control: h(T.Switch, { checked: !!draft.visibility[v[0]], onChange: function (e) { set('visibility.' + v[0], e.target.checked); } }) });
        })),
        h(T.SettingsSection, { title: 'Full profile page', description: 'Colors of your page on chatango.com. Torch shows profiles in its own theme.', padded: true },
          h('div', { className: 'grid3' }, [['bg', 'Background'], ['text', 'Text'], ['link', 'Links']].map(function (c) {
            return h('div', { key: c[0], className: 'tc-field' },
              h('label', { className: 'tc-label', htmlFor: 'pf-c-' + c[0] }, c[1]),
              h('div', { style: { display: 'flex', alignItems: 'center', gap: 8 } },
                h('input', { id: 'pf-c-' + c[0], type: 'color', className: 'color-in', style: { borderRadius: 7 }, value: draft.colors[c[0]], onChange: function (e) { set('colors.' + c[0], e.target.value); } }),
                h('span', { className: 'mono', style: { fontSize: 12.5, color: 'var(--text-2)' } }, draft.colors[c[0]])));
          }))),
        h(VisitorsSection, null)),
      h('aside', { className: 'side', 'aria-labelledby': 'pv-h' },
        h('h2', { id: 'pv-h', className: 'side-label' }, 'Preview'),
        h('div', { style: { border: '1px solid var(--border)', borderRadius: 12, background: 'var(--subtle)', overflow: 'hidden' } },
          h('div', { style: { height: 64, background: 'var(--selected)' } }),
          h('div', { style: { padding: '0 18px 18px', marginTop: -32 } },
            h(T.Avatar, { name: s.me, size: 64, style: { border: '4px solid var(--subtle)', boxSizing: 'content-box' } }),
            h('p', { style: { margin: '8px 0 0', fontSize: 17, fontWeight: 600 } }, s.me),
            meta ? h('p', { className: 'muted', style: { margin: 0, fontSize: 13 } }, meta) : null,
            h('p', { className: 'about', style: { marginTop: 12 } }, draft.about || 'No bio yet.'))),
        h('p', { className: 'muted', style: { margin: 0, fontSize: 12.5 } }, 'How other members see you when they open your profile from a group or a private message.'))),
    dirty ? h(T.SaveBar, {
      onDiscard: function () { setDraft(snapshot()); },
      onSave: function () {
        if (ageErr) { app.ui.toast('Fix the age before saving.'); return; }
        if (LIVE) { app.ui.toast('Saving your profile to Chatango is not wired in this test build yet.'); return; }
        app.update(function (d) { var u = d.users[d.me]; u.age = draft.age === '' ? '' : +draft.age; u.gender = draft.gender; u.location = draft.location; u.about = draft.about; d.profile.visibility = draft.visibility; d.profile.colors = draft.colors; });
        app.ui.toast('Profile saved to Chatango.', { icon: 'check' });
      }, saveLabel: 'Save profile'
    }, 'Unsaved changes to your Chatango profile') : null);
}

var VISIT_FILTERS = [{ value: 'all', label: 'All' }, { value: 'log', label: 'Visits' }, { value: 'like', label: 'Likes' }, { value: 'dislike', label: 'Dislikes' }, { value: 'msg', label: 'Comments' }, { value: 'refer', label: 'Referrals' }];
/**
 * Permet d'afficher une ligne d'activité vissle.
 * @param {object} app Contexte de l'application.
 * @param {object} r Ligne produite par visitorPage.
 */
function visitorRow(app, r) {
  return h('div', { key: r.key, className: 'lrow' },
    h(T.Avatar, { name: r.name, size: 32 }),
    h('span', { className: 'grow' },
      h('span', { className: 'lrow-title', style: { fontWeight: 400 } },
        r.guest ? h('b', { style: { fontWeight: 600 } }, r.name)
          : h('button', { type: 'button', className: 'linkbtn', style: { fontWeight: 600, color: 'var(--text)', textDecoration: 'none' }, onClick: function () { app.ui.openProfile(r.user, null); } }, r.name),
        ' ' + r.label,
        r.guest ? h('span', { style: { marginLeft: 8 } }, h(T.Badge, null, 'Guest')) : null),
      r.msg ? h('span', { className: 'lrow-sub' }, r.msg) : null),
    h('time', { className: 'tc-msg-time', title: new Date(r.ts).toLocaleString('en-GB') }, ago(r.ts)));
}

/**
 * Activité de son propre profil enregistrée par vissle.me.
 */
function VisitorsSection() {
  var app = useApp(), v = app.state.visitors;
  var get = v ? v.get : 'all', rows = v ? v.rows : [], loading = !v || v.loading;
  useEffect(function () { app.actions.loadVisitors(get, false); }, []);
  return h(T.SettingsSection, {
    title: 'Visitors', description: 'Activity on your profile recorded by vissle.me.',
    headerAside: h(T.IconButton, { icon: 'rotate-cw', label: 'Refresh', size: 34, iconSize: 15, disabled: loading, onClick: function () { app.actions.loadVisitors(get, false); } })
  },
    h('div', { className: 'tc-section-pad seg-scroll' }, h(T.SegmentedControl, { label: 'Activity type', value: get, options: VISIT_FILTERS, onChange: function (g) { app.actions.loadVisitors(g, false); } })),
    rows.map(function (r) { return visitorRow(app, r); }),
    v && v.error ? h('p', { className: 'pal-empty' }, v.error)
      : loading ? h('p', { className: 'pal-empty' }, 'Loading activity from vissle.me.')
        : !rows.length ? h('p', { className: 'pal-empty' }, 'No activity yet.')
          : v.next ? h('div', { style: { padding: 12, display: 'flex', justifyContent: 'center', borderTop: '1px solid var(--divider)' } }, h(T.Button, { size: 'sm', onClick: function () { app.actions.loadVisitors(get, true); } }, 'Load more')) : null);
}

function AppearancePage() {
  var app = useApp(), pr = usePref(), prefs = app.state.prefs;
  var fileRef = useRef(null);
  var themes = [
    ['dark', 'Dark', ['#16171a', '#111214', '#3a3d44', '#2e3036', '#1d1f23']],
    ['light', 'Light', ['#ffffff', '#f6f6f7', '#c9cbd1', '#e4e4e8', '#ffffff']],
    ['system', 'Match system', null]
  ];
  var accents = [['Ember', '#f27a3f'], ['Blue', '#5b8def'], ['Green', '#3fb27f'], ['Violet', '#c084fc'], ['Pink', '#f472b6'], ['Slate', '#94a3b8']];
  function thumb(c) {
    if (!c) return h('span', { className: 'thumb', 'aria-hidden': 'true', style: { border: '1px solid var(--border-strong)' } },
      h('span', { style: { flex: 1, background: '#f6f6f7' } }), h('span', { style: { flex: 1, background: '#16171a' } }));
    return h('span', { className: 'thumb', 'aria-hidden': 'true', style: { background: c[0], border: '1px solid ' + c[3] } },
      h('span', { style: { width: '28%', background: c[1], borderRight: '1px solid ' + c[3], padding: '8px 6px', display: 'flex', flexDirection: 'column', gap: 5 } },
        h('span', { style: { height: 5, width: '70%', borderRadius: 3, background: c[2] } }), h('span', { style: { height: 5, width: '90%', borderRadius: 3, background: c[3] } })),
      h('span', { style: { flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 6 } },
        h('span', { style: { height: 5, width: '80%', borderRadius: 3, background: c[2] } }), h('span', { style: { height: 5, width: '60%', borderRadius: 3, background: c[3] } }),
        h('span', { style: { marginTop: 'auto', height: 12, borderRadius: 4, background: c[4], border: '1px solid ' + c[3] } })));
  }
  function importFile(e) {
    var file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var src = JSON.parse(reader.result);
        var accent = src.active || src.highlight || src.accent;
        if (!hexToRgb(accent)) throw new Error('no accent');
        var name = (file.name || 'Theme').replace(/\.json$/i, '');
        var colors = [src.backdrop, src.primary, src.secondary, accent].filter(hexToRgb);
        app.update(function (d) { d.prefs.customThemes = (d.prefs.customThemes || []).concat([{ id: uid(), name: name, accent: accent, colors: colors, at: Date.now() }]); });
        app.ui.toast('Imported ' + name + '.', { icon: 'check' });
      } catch (err) { app.ui.toast('This file is not a Torch theme. Export one from the old theme editor and try again.'); }
    };
    reader.readAsText(file);
  }
  var custom = prefs.customThemes || [];
  var palette = accents.some(function (a) { return a[1] === prefs.accent; });
  return h(Page, { title: 'Appearance', lede: 'Changes apply right away and are saved on this device.' },
    h(T.SettingsSection, { title: 'Theme', padded: true },
      h('div', { className: 'grid3', role: 'radiogroup', 'aria-label': 'Theme' }, themes.map(function (t) {
        return h('button', { key: t[0], type: 'button', role: 'radio', className: 'pick', 'aria-checked': String(prefs.theme === t[0]), onClick: function () { pr.set('theme', t[0]); } },
          thumb(t[2]), h('span', { className: 'pick-title' }, t[1]));
      }))),
    h(T.SettingsSection, { title: 'Accent color', description: 'Used for buttons, mentions and unread markers. Torch adjusts text on the accent so it stays readable.', padded: true },
      h('div', { className: 'swatches', role: 'radiogroup', 'aria-label': 'Accent color' },
        accents.map(function (a) {
          var on = prefs.accent === a[1];
          return h('button', { key: a[1], type: 'button', role: 'radio', className: 'sw-dot', 'aria-checked': String(on), 'aria-label': a[0], title: a[0], style: { background: a[1] }, onClick: function () { pr.set('accent', a[1]); } },
            on ? h(T.Icon, { name: 'check', size: 16, strokeWidth: 2.6, style: { color: contrast(hexToRgb(a[1]), [15, 16, 18]) >= 4.5 ? '#0f1012' : '#ffffff' } }) : null);
        }),
        h('span', { className: 'vsep', style: { margin: '0 4px' } }),
        h('label', { style: { display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-2)' } },
          h('input', { type: 'color', className: 'color-in', value: prefs.accent, 'aria-label': 'Custom accent color', onChange: function (e) { pr.set('accent', e.target.value); }, style: !palette ? { boxShadow: '0 0 0 2px var(--bg), 0 0 0 4px var(--text)' } : null }),
          'Custom'))),
    h(T.SettingsSection, { title: 'Messages' },
      h(T.SettingRow, { asLabel: false, title: 'Density', description: 'Compact hides avatars and puts the time before the name.', control: h(T.SegmentedControl, { label: 'Density', value: prefs.density, onChange: function (v) { pr.set('density', v); }, options: [{ value: 'comfortable', label: 'Comfortable' }, { value: 'compact', label: 'Compact' }] }) }),
      h(T.SettingRow, {
        asLabel: false, title: 'Text size', description: 'Applies to message text.', control: h('div', { className: 'range-row' },
          h('span', { 'aria-hidden': 'true', style: { fontSize: 12, color: 'var(--text-3)' } }, 'A'),
          h('input', { type: 'range', min: 12, max: 18, step: 1, value: prefs.textSize, 'aria-label': 'Text size', onChange: function (e) { pr.set('textSize', +e.target.value); } }),
          h('span', { 'aria-hidden': 'true', style: { fontSize: 18, color: 'var(--text-3)' } }, 'A'),
          h('span', { className: 'mono', style: { width: 38, textAlign: 'right', fontSize: 12.5, color: 'var(--text-2)' } }, prefs.textSize + 'px'))
      }),
      h(T.SettingRow, { title: '24-hour time', description: 'Shows 14:05 instead of 2:05 PM.', control: pr.sw('h24') })),
    h(T.SettingsSection, { title: 'Chatango styles', description: 'Members can style their name and messages on Chatango. Off by default for readability. When on, Torch corrects colors that would be hard to read.' },
      h(T.SettingRow, { title: 'Name colors', description: 'The color each member picked for their username.', control: pr.sw('styles.names') }),
      h(T.SettingRow, { title: 'Fonts and text colors', description: 'Custom typefaces and text colors in messages.', control: pr.sw('styles.fonts') }),
      h(T.SettingRow, { title: 'Message backgrounds', description: 'Background colors set by Premium members.', control: pr.sw('styles.backgrounds') })),
    h(T.SettingsSection, {
      title: 'Imported themes', description: 'Theme files (.json) exported from the old Torch theme editor. Torch uses their accent color.',
      headerAside: h(Frag, null,
        h('input', { ref: fileRef, type: 'file', accept: '.json,application/json', hidden: true, onChange: importFile }),
        h(T.Button, { icon: 'upload', onClick: function () { fileRef.current.click(); } }, 'Import file'))
    },
      custom.length ? custom.map(function (t) {
        return h('div', { key: t.id, className: 'lrow' },
          h('span', { 'aria-hidden': 'true', style: { display: 'inline-flex', borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border-strong)' } }, t.colors.map(function (c, i) { return h('span', { key: i, style: { width: 18, height: 28, background: c } }); })),
          h('span', { className: 'grow' }, h('span', { className: 'lrow-title' }, t.name), h('span', { className: 'lrow-sub' }, 'Imported ' + new Date(t.at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }))),
          h(T.Button, { size: 'sm', onClick: function () { pr.set('accent', t.accent); app.ui.toast('Applied the accent from ' + t.name + '.'); } }, 'Apply'),
          h(T.IconButton, { icon: 'trash', label: 'Delete ' + t.name, onClick: function () { app.update(function (d) { d.prefs.customThemes = d.prefs.customThemes.filter(function (x) { return x.id !== t.id; }); }); } }));
      }) : h('p', { className: 'muted', style: { margin: 0, padding: '4px 20px 18px', fontSize: 13 } }, 'No imported themes.')));
}

function NotificationsPage() {
  var app = useApp(), pr = usePref(), prefs = app.state.prefs;
  var perm = 'default';
  try { perm = window.Notification ? window.Notification.permission : 'unsupported'; } catch (e) { perm = 'unsupported'; }
  var p1 = useState(perm), permission = p1[0], setPermission = p1[1];
  var rows = [
    ['mentions', 'Mentions', 'Someone writes @' + app.state.me + ' in a group'],
    ['pm', 'Private messages', 'A new private message arrives'],
    ['friendOn', 'Friend comes online', 'Someone on your friends list connects'],
    ['friendOff', 'Friend goes offline', 'Someone on your friends list disconnects'],
    ['gift', 'Premium gift', 'Someone gifts you Chatango Premium'],
    ['account', 'Account changes', 'Your email changes or you create a group'],
    ['updates', 'Torch updates', 'A new version of the client is available']
  ];
  var cols = [['app', 'In app'], ['sound', 'Sound'], ['desktop', 'Desktop'], ['email', 'Email']];
  // En live, Torch joue lui-même les sons et rien n'envoie d'e-mail : ces colonnes et événements sont retirés.
  if (LIVE) {
    rows = rows.filter(function (r) { return ['mentions', 'pm', 'friendOn', 'friendOff'].indexOf(r[0]) >= 0; });
    cols = cols.filter(function (c) { return c[0] === 'app' || c[0] === 'desktop'; });
  }
  function ask() {
    try {
      window.Notification.requestPermission().then(function (r) { setPermission(r); app.ui.toast(r === 'granted' ? 'Desktop alerts are on.' : 'The browser kept desktop alerts blocked. Allow them in its site settings.'); }, function () { app.ui.toast('The browser refused the request.'); });
    } catch (e) { app.ui.toast('This browser view cannot show desktop alerts.'); }
  }
  return h(Page, { title: 'Notifications', lede: 'Choose where Torch alerts you. Changes are saved automatically.' },
    permission !== 'granted' ? h(T.Banner, { tone: 'warning', action: permission === 'unsupported' ? null : h(T.Button, { size: 'sm', onClick: ask }, 'Allow in browser') },
      permission === 'unsupported' ? 'This browser view cannot show desktop alerts. The Desktop column has no effect here.' : "Your browser blocks desktop notifications for this site. Desktop alerts won't show until you allow them.") : null,
    h(T.SettingsSection, { title: 'Alerts' },
      h('div', { className: 'matrix-wrap' },
        h('table', { className: 'matrix' },
          h('thead', null, h('tr', null, h('th', { scope: 'col', style: { textAlign: 'left', paddingLeft: 20 } }, 'Event'), cols.map(function (c) { return h('th', { key: c[0], scope: 'col' }, c[1]); }))),
          h('tbody', null, rows.map(function (r) {
            return h('tr', { key: r[0] },
              h('th', { scope: 'row' }, h('span', { style: { display: 'block', fontWeight: 500, color: 'var(--text)' } }, r[1]), h('span', { style: { display: 'block', fontSize: 12.5, color: 'var(--text-3)' } }, r[2])),
              cols.map(function (c) {
                var v = prefs.notify[r[0]][c[0]];
                return h('td', { key: c[0] }, v === null || v === undefined
                  ? h(Frag, null, h('span', { className: 'na', 'aria-hidden': 'true' }), h('span', { className: 'tc-sr' }, r[1] + ', ' + c[1] + ' not available'))
                  : h(T.Checkbox, { ariaLabel: r[1] + ', ' + c[1], checked: !!v, onChange: function (e) { pr.set('notify.' + r[0] + '.' + c[0], e.target.checked); } }));
              }));
          }))))),
    LIVE ? h(T.Banner, { icon: 'volume', title: 'Sounds' }, 'Torch plays alert sounds with its own settings, so Torch Skin stays silent to avoid hearing every alert twice.') : null,
    LIVE ? null : h(T.SettingsSection, { title: 'Sound' },
      h(T.SettingRow, {
        asLabel: false, title: 'Volume', description: 'Applies to every alert sound.', control: h('div', { className: 'range-row' },
          h('input', { type: 'range', min: 0, max: 100, value: prefs.volume, 'aria-label': 'Volume', onChange: function (e) { pr.set('volume', +e.target.value); } }),
          h('span', { className: 'mono', style: { width: 40, textAlign: 'right', fontSize: 12.5, color: 'var(--text-2)' } }, prefs.volume + '%'),
          h(T.IconButton, { icon: 'volume', label: 'Play test sound', onClick: function () { beep(prefs.volume, true); } }))
      }),
      h(T.SettingRow, { title: 'Only when Torch is in focus', description: "Stay silent while you're in another tab or app.", control: pr.sw('soundFocusOnly') })),
    h(T.SettingsSection, { title: 'In the app' },
      h(T.SettingRow, { title: 'Show mentions in the tab title', description: 'Adds a counter to the browser tab, for example (2) Torch.', control: pr.sw('tabTitle') }),
      h(T.SettingRow, { title: 'Mark new messages', description: "Draws a line above the first message you haven't read.", control: pr.sw('markNew') }),
      h(T.SettingRow, { title: 'Preview private messages', description: 'Shows the text in the alert instead of only the sender.', control: pr.sw('pmPreview') }),
      h(T.SettingRow, { title: 'Highlight new features', description: 'Marks settings and tools added in recent updates.', control: pr.sw('featureHints') })));
}

function PrivacyPage() {
  if (LIVE) return h(PrivacyPageLive, null);
  var app = useApp(), pr = usePref(), prefs = app.state.prefs;
  return h(Page, { title: 'Privacy', lede: 'Control who can reach you and what others see.' },
    h(T.SettingsSection, { title: 'Private messages' },
      h(T.SettingRow, {
        asLabel: false, title: 'Who can message you', description: 'Messages from anyone else land in Requests, where you accept or decline them.',
        control: h('select', { className: 'tc-input', style: { width: 'auto', height: 34 }, 'aria-label': 'Who can message you', value: prefs.privacy.pmFrom, onChange: function (e) { pr.set('privacy.pmFrom', e.target.value); } },
          h('option', { value: 'everyone' }, 'Everyone'), h('option', { value: 'groups' }, 'Members of my groups'), h('option', { value: 'friends' }, 'Friends only'))
      }),
      h(T.SettingRow, { title: 'Show read receipts and idle time', description: 'Others see when you read their message and how long you have been idle.', control: pr.sw('privacy.showIdle') }),
      h(T.SettingRow, {
        asLabel: false, title: 'Delete all conversations', description: 'Removes every private message from your account. Others keep their copy.',
        control: h(T.Button, { variant: 'danger', size: 'sm', onClick: function () { app.ui.confirm({ title: 'Delete all conversations?', body: 'Every private message is removed from your account. This cannot be undone.', confirmLabel: 'Delete all', danger: true, onConfirm: app.actions.deleteAllDms }); } }, 'Delete all')
      })),
    h(T.SettingsSection, { title: 'On startup' },
      h(T.SettingRow, { title: 'Join groups I own', control: pr.sw('privacy.joinOwned') }),
      h(T.SettingRow, { title: 'Join recent groups', control: pr.sw('privacy.joinRecent') }),
      h(T.SettingRow, { title: 'Join favorite groups', control: pr.sw('privacy.joinFavorites') })),
    h(T.SettingsSection, { title: 'Discoverability' },
      h(T.SettingRow, { title: 'Show my profile in Meet people', description: 'Lets other Chatango users find you by age and location.', control: pr.sw('privacy.meet') }),
      h(T.SettingRow, { title: 'Show my username in the tab title', description: 'Useful when you run several accounts in different tabs.', control: pr.sw('privacy.usernameInTitle') })),
    h(T.SettingsSection, { title: 'Your data' },
      h(T.SettingRow, { asLabel: false, title: 'Request a copy of your data', description: 'Chatango holds your account data. Torch keeps only your encrypted sign-in and these settings.', control: h(T.Button, { size: 'sm', onClick: function () { app.ui.toast('Data requests are not part of this prototype.'); } }, 'Request') })));
}

function SafetyPage() {
  var app = useApp(), s = app.state, pr = usePref(), prefs = s.prefs;
  var blocked = Object.keys(s.users).filter(function (n) { return s.users[n].blocked; });
  var ignored = Object.keys(s.users).filter(function (n) { return s.users[n].ignored; });
  function people(list, key, action, empty) {
    return list.length ? list.map(function (n) {
      return h('div', { key: n, className: 'lrow' }, h(T.Avatar, { name: n, size: 28 }), h('span', { className: 'grow lrow-title' }, n),
        h(T.Button, { size: 'sm', onClick: function () { app.actions.toggleUser(n, key); } }, action));
    }) : h('p', { className: 'muted', style: { margin: 0, padding: '4px 20px 18px', fontSize: 13 } }, empty);
  }
  return h(Page, { title: 'Safety', lede: 'Decide what reaches your screen.' },
    h(T.SettingsSection, { title: 'Media and links' },
      h(T.SettingRow, { title: 'Embed images', description: 'Shows images in messages. When off, you see a link.', control: pr.sw('safety.embedImages') }),
      h(T.SettingRow, { title: 'Embed videos', control: pr.sw('safety.embedVideos') }),
      h(T.SettingRow, { title: 'Block external media until I click', description: 'Images from other sites load only when you ask, so they cannot track you.', control: pr.sw('safety.proxyMedia') }),
      h(T.SettingRow, { title: 'Warn before opening links', description: 'Shows the full address before you leave Torch.', control: pr.sw('safety.warnLinks') })),
    h(T.SettingsSection, { title: 'People' },
      h(T.SettingRow, {
        asLabel: false, title: 'Messages from ignored users', description: 'Collapse leaves a line you can expand. Hide removes them completely.',
        control: h(T.SegmentedControl, { label: 'Messages from ignored users', value: prefs.safety.ignoreMode, onChange: function (v) { pr.set('safety.ignoreMode', v); }, options: [{ value: 'collapse', label: 'Collapse' }, { value: 'hide', label: 'Hide' }] })
      }),
      h(T.SettingRow, { title: 'Hide blocked users in groups too', description: 'Blocking someone also hides their messages in every group.', control: pr.sw('safety.syncBlocked') }),
      h(T.SettingRow, { title: 'Show guests in member lists', control: pr.sw('safety.showGuests') })),
    h(T.SettingsSection, { title: 'Blocked · ' + blocked.length }, people(blocked, 'blocked', 'Unblock', 'Nobody is blocked.')),
    h(T.SettingsSection, { title: 'Ignored · ' + ignored.length }, people(ignored, 'ignored', 'Stop ignoring', 'Nobody is ignored. Ignore someone from their profile or a message menu.')));
}

function AccountPage() {
  if (LIVE) return h(AccountPageLive, null);
  var app = useApp(), s = app.state;
  var a = useState(''), email = a[0], setEmail = a[1];
  var b = useState({ cur: '', next: '', confirm: '' }), pw = b[0], setPw = b[1];
  var c = useState({}), err = c[0], setErr = c[1];
  var d = useState(false), del = d[0], setDel = d[1];
  var e = useState(''), delName = e[0], setDelName = e[1];
  function changeEmail() {
    if (!/^\S+@\S+\.\S+$/.test(email)) { setErr({ email: 'Enter a valid email address.' }); return; }
    setErr({}); app.update(function (x) { x.account.pending = email; }); setEmail('');
    app.ui.toast('Chatango sends a confirmation link to ' + email + '. In this prototype nothing is sent.');
  }
  function changePw() {
    var x = {};
    if (!pw.cur) x.cur = 'Enter your current password.';
    if (pw.next.length < 8) x.next = 'Use at least 8 characters.';
    if (pw.next !== pw.confirm) x.confirm = "The passwords don't match.";
    setErr(x);
    if (Object.keys(x).length) return;
    setPw({ cur: '', next: '', confirm: '' });
    app.ui.toast('Password changed.', { icon: 'check' });
  }
  return h(Page, { title: 'Password and email', lede: 'Sign-in details for your Chatango account.' },
    h(T.SettingsSection, { title: 'Email', padded: true },
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: 14 } },
        h('div', { style: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 } },
          h('span', { style: { fontWeight: 500 } }, s.account.email), s.account.verified ? h(T.Badge, { icon: 'check' }, 'Verified') : null,
          s.account.pending ? h('span', { className: 'muted', style: { fontSize: 13 } }, 'Waiting for confirmation of ' + s.account.pending) : null),
        h('div', { style: { display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 10 } },
          h('div', { style: { flex: '1 1 260px' } }, h(T.TextField, { id: 'acc-email', label: 'New email', type: 'email', value: email, error: err.email, onChange: function (ev) { setEmail(ev.target.value); } })),
          h(T.Button, { onClick: changeEmail, style: { height: 38 } }, 'Change email')))),
    h(T.SettingsSection, { title: 'Password', padded: true },
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 420 } },
        h(T.TextField, { id: 'pw-cur', label: 'Current password', type: 'password', autoComplete: 'current-password', value: pw.cur, error: err.cur, onChange: function (ev) { setPw(Object.assign({}, pw, { cur: ev.target.value })); } }),
        h(T.TextField, { id: 'pw-new', label: 'New password', type: 'password', autoComplete: 'new-password', value: pw.next, error: err.next, hint: 'At least 8 characters.', onChange: function (ev) { setPw(Object.assign({}, pw, { next: ev.target.value })); } }),
        h(T.TextField, { id: 'pw-confirm', label: 'Confirm new password', type: 'password', autoComplete: 'new-password', value: pw.confirm, error: err.confirm, onChange: function (ev) { setPw(Object.assign({}, pw, { confirm: ev.target.value })); } }),
        h('div', null, h(T.Button, { variant: 'primary', onClick: changePw }, 'Change password')))),
    h(T.SettingsSection, { title: 'Delete account' },
      h(T.SettingRow, { asLabel: false, title: 'Delete your Chatango account', description: 'Your profile, messages and owned groups are removed after 30 days.', control: h(T.Button, { variant: 'danger', size: 'sm', onClick: function () { setDel(true); } }, 'Delete account') })),
    del ? h(Dialog, {
      title: 'Delete your account?', description: 'Type your username to confirm. Owned groups close with it.', onClose: function () { setDel(false); setDelName(''); },
      footer: [h(T.Button, { key: 'c', variant: 'ghost', onClick: function () { setDel(false); } }, 'Cancel'),
        h(T.Button, { key: 'd', variant: 'danger', disabled: delName !== s.me, onClick: function () { setDel(false); setDelName(''); app.ui.toast('Deleting accounts is disabled in this prototype.'); } }, 'Delete account')]
    }, h('div', { className: 'dialog-body' }, h(T.TextField, { id: 'del-name', label: 'Username', value: delName, autoComplete: 'off', onChange: function (ev) { setDelName(ev.target.value); } }))) : null);
}

function LanguagePage() {
  var app = useApp(), pr = usePref(), prefs = app.state.prefs;
  var a = useState(''), q = a[0], setQ = a[1];
  var langs = [['en-US', 'English (US)', 'English (US)', 'cheese'], ['en-GB', 'English (UK)', 'English (UK)', 'jamie'], ['id', 'Bahasa Indonesia', 'Indonesian', 'fath'], ['pl', 'Polski', 'Polish', 'froq']];
  var shown = langs.filter(function (l) { return !q || (l[1] + l[2] + l[0]).toLowerCase().indexOf(q.toLowerCase()) >= 0; });
  return h(Page, { title: 'Language', lede: 'Translations come from community volunteers.' },
    h(T.TextField, { id: 'lang-q', label: 'Search languages', type: 'search', value: q, onChange: function (e) { setQ(e.target.value); } }),
    h(T.SettingsSection, null,
      h('div', { role: 'radiogroup', 'aria-label': 'Interface language' },
        shown.length ? shown.map(function (l, i) {
          var on = prefs.language === l[0];
          return h('button', { key: l[0], type: 'button', role: 'radio', 'aria-checked': String(on), className: 'lrow', style: { width: '100%', border: 0, borderTop: i ? '1px solid var(--divider)' : 0, background: 'none', textAlign: 'left', cursor: 'pointer', color: 'inherit' }, onClick: function () { pr.set('language', l[0]); app.ui.toast(l[1] + ' selected. This prototype stays in English.'); } },
            h('span', { className: 'radio', 'aria-hidden': 'true' }),
            h('span', { className: 'grow' }, h('span', { className: 'lrow-title' }, l[1]), h('span', { className: 'lrow-sub' }, l[2] + ' · translated by ' + l[3])),
            h('span', { className: 'mono muted', style: { fontSize: 12 } }, l[0]));
        }) : h('p', { className: 'pal-empty' }, 'Language not found or not supported yet.'))));
}

function AccessibilityPage() {
  var app = useApp(), pr = usePref();
  var keys = [['Ctrl K', 'Search or jump to a group, person or setting'], ['Enter', 'Send the message'], ['Shift Enter', 'New line in the message'], ['Esc', 'Cancel a reply, close a menu or a dialog'], ['Tab', 'Move between controls. Focus is always visible.']];
  return h(Page, { title: 'Accessibility', lede: 'Torch follows your system settings for motion and contrast. These options add to them.' },
    h(T.SettingsSection, { title: 'Display' },
      h(T.SettingRow, { title: 'Reduce motion', description: 'Turns off transitions and the typing animation.', control: pr.sw('a11y.reduceMotion') }),
      h(T.SettingRow, { title: 'Always underline links', description: 'Links in messages are underlined, not only colored.', control: pr.sw('a11y.underlineLinks') }),
      h(T.SettingRow, { asLabel: false, title: 'Text size', description: 'Set in Appearance.', control: h(T.Button, { size: 'sm', onClick: function () { app.nav({ view: 'settings', page: 'appearance' }); } }, 'Open Appearance') })),
    h(T.SettingsSection, { title: 'Keyboard shortcuts' },
      keys.map(function (k) { return h('div', { key: k[0], className: 'lrow' }, h('kbd', { className: 'kbd', style: { fontSize: 12, padding: '2px 8px' } }, k[0]), h('span', { className: 'grow', style: { color: 'var(--text-body)' } }, k[1])); })));
}

function WhatsNewPage() {
  var items = [
    ['0.1.0-b', 'Redesigned interface', 'A calmer layout with one accent color, light and dark themes, and compact density.'],
    ['0.1.0-b', 'Notification matrix', 'Choose in-app, sound, desktop and email alerts per event on one screen.'],
    ['0.1.0-b', 'Roles and permissions', 'Every staff permission is named and explained. Admin-only rights are visible but locked.'],
    ['0.1.0-b', 'Message requests', 'Private messages from people outside your friends list wait in Requests.'],
    ['0.1.0-b', 'Readable Chatango styles', "Members' colors and fonts are off by default. When on, Torch fixes colors that would be hard to read."]
  ];
  return h(Page, { title: "What's new", lede: 'Changes in the redesigned client.' },
    h(T.SettingsSection, null, items.map(function (i, k) {
      return h('div', { key: k, className: 'lrow', style: k ? null : { borderTop: 0 } },
        h('span', { className: 'grow' }, h('span', { className: 'lrow-title' }, i[1]), h('span', { className: 'lrow-sub', style: { fontSize: 13 } }, i[2])),
        h('span', { className: 'mono muted', style: { fontSize: 12 } }, i[0]));
    })));
}

function AboutPage() {
  var app = useApp(), pr = usePref();
  return h(Page, { title: 'About Torch', lede: 'A free, open-source web client for Chatango.' },
    h(T.SettingsSection, { title: 'Version', padded: true },
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: 8 } },
        h('span', null, h('span', { className: 'mono' }, APP_VERSION), h('span', { className: 'muted' }, ' · MIT license')),
        h('a', { href: 'https://github.com/Vissle-Drissle/Torch-Client', target: '_blank', rel: 'noopener noreferrer' }, 'Source code and issue tracker'))),
    LIVE ? h(T.Banner, { icon: 'info' }, 'Test build. This interface runs on top of the Torch client on st.chatango.com. Torch handles sign-in and the Chatango connection; Torch Skin never sees your password.') : null,
    LIVE ? null : h(T.SettingsSection, { title: 'Prototype', description: 'This build runs on sample data. Nothing is sent to Chatango.' },
      h(T.SettingRow, { title: 'Simulate activity', description: 'Members post, join, leave and send you messages every few seconds.', control: pr.sw('simulate') }),
      h(T.SettingRow, {
        asLabel: false, title: 'Reset sample data', description: 'Restores groups, messages and people. Your settings stay.',
        control: h(T.Button, { size: 'sm', onClick: function () { app.ui.confirm({ title: 'Reset sample data?', body: 'Messages, groups and people go back to their starting state.', confirmLabel: 'Reset', onConfirm: app.actions.resetDemo }); } }, 'Reset')
      })));
}

/* ---------- Premium ---------- */
var PLANS = [
  { id: 'm1', price: 0.95, label: 'Premium, 1 month', desc: 'For your account. Custom backgrounds, media and badges.', tag: 'Recommended' },
  { id: 'g2', price: 3, label: '2 gifts', desc: 'Two months of Premium to give to any account.' },
  { id: 'g4', price: 5, label: '4 gifts', desc: 'Four months to give away.' },
  { id: 'g13', price: 10, label: '13 gifts', desc: 'Thirteen months to give away.', tag: '+33% bonus' },
  { id: 'g29', price: 20, label: '29 gifts and 1 inactive username', desc: 'For groups that reward their members.', tag: '+42.5% bonus' }
];
var RATES = { USD: [1, '$'], GBP: [0.79, '£'], EUR: [0.92, '€'], JPY: [150, '¥'] };
function money(v, cur) { var r = RATES[cur]; var n = v * r[0]; return r[1] + (cur === 'JPY' ? Math.round(n).toLocaleString('en-GB') : n.toFixed(2)); }

function PremiumPage() {
  if (LIVE) return h(PremiumPageLive, null);
  var app = useApp(), s = app.state;
  var a = useState('premium'), mode = a[0], setMode = a[1];
  var b = useState('plan'), step = b[0], setStep = b[1];
  var c = useState('m1'), planId = c[0], setPlan = c[1];
  var d = useState('USD'), cur = d[0], setCur = d[1];
  var e = useState('me'), forWho = e[0], setForWho = e[1];
  var f = useState([]), recips = f[0], setRecips = f[1];
  var g = useState(''), rin = g[0], setRin = g[1];
  var h1 = useState(''), rerr = h1[0], setRerr = h1[1];
  var i1 = useState('paypal'), method = i1[0], setMethod = i1[1];
  var j = useState(''), uname = j[0], setUname = j[1];
  var k = useState(null), check = k[0], setCheck = k[1];
  var plan = PLANS.filter(function (x) { return x.id === planId; })[0];
  function addRecipient() {
    var n = rin.trim().toLowerCase();
    if (!n) return;
    if (!s.users[n]) { setRerr('No Chatango user named ' + n + '.'); return; }
    if (recips.indexOf(n) >= 0) { setRerr(n + ' is already in the list.'); return; }
    setRecips(recips.concat([n])); setRin(''); setRerr('');
  }
  function checkName() {
    var n = uname.trim().toLowerCase();
    if (!/^[a-z0-9]{1,20}$/.test(n)) setCheck({ ok: false, text: 'Usernames use 1 to 20 letters or numbers.' });
    else if (s.groups[n]) setCheck({ ok: false, text: n + ' belongs to a group, so it cannot be bought.' });
    else if (s.users[n]) setCheck({ ok: false, text: n + ' is an active account, so it is not for sale.' });
    else setCheck({ ok: true, text: 'No account uses ' + n + '. You can sign up with it for free.' });
  }
  var steps = h('div', { className: 'steps', 'aria-label': 'Progress' }, [['plan', 'Choose'], ['who', 'Recipients'], ['review', 'Review']].map(function (x, idx) {
    return h('span', { key: x[0] }, idx ? '› ' : '', step === x[0] ? h('b', null, x[1]) : x[1]);
  }));
  var body;
  if (mode === 'name') {
    body = h(T.SettingsSection, { title: 'Inactive username', description: 'Chatango sells names of accounts that expired. Check a name before buying it.', padded: true },
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: 12 } },
        h('div', { style: { display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 10 } },
          h('div', { style: { flex: '1 1 240px' } }, h(T.TextField, { id: 'inact', label: 'Username', value: uname, onChange: function (ev) { setUname(ev.target.value); setCheck(null); }, onKeyDown: function (ev) { if (ev.key === 'Enter') checkName(); } })),
          h(T.Button, { onClick: checkName, style: { height: 38 } }, 'Check')),
        check ? h(T.Banner, { tone: check.ok ? 'info' : 'warning', icon: check.ok ? 'check' : 'alert' }, check.text) : null));
  } else if (step === 'plan') {
    body = h(T.SettingsSection, {
      title: 'Choose a plan', padded: true,
      headerAside: h('label', { style: { display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-2)' } }, 'Currency',
        h('select', { className: 'tc-input', style: { width: 'auto', height: 32 }, value: cur, onChange: function (ev) { setCur(ev.target.value); } }, Object.keys(RATES).map(function (r) { return h('option', { key: r }, r); })))
    },
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: 10 } },
        h('div', { role: 'radiogroup', 'aria-label': 'Plan', style: { display: 'flex', flexDirection: 'column', gap: 10 } }, PLANS.map(function (pl) {
          return h('button', { key: pl.id, type: 'button', role: 'radio', className: 'plan', 'aria-checked': String(planId === pl.id), onClick: function () { setPlan(pl.id); } },
            h('span', { className: 'radio', 'aria-hidden': 'true' }),
            h('span', { className: 'price' }, money(pl.price, cur)),
            h('span', { className: 'grow' }, h('span', { style: { display: 'block', fontWeight: 500 } }, pl.label), h('span', { style: { display: 'block', fontSize: 12.5, color: 'var(--text-3)' } }, pl.desc)),
            pl.tag ? h(T.Badge, { tone: pl.tag === 'Recommended' ? 'accent' : 'neutral' }, pl.tag) : null);
        })),
        cur !== 'USD' ? h('p', { className: 'tc-hint', style: { margin: 0 } }, 'Approximate. Chatango charges in US dollars.') : null,
        h('div', { className: 'btnrow', style: { justifyContent: 'flex-end' } }, h(T.Button, { variant: 'primary', iconRight: 'chevron-right', onClick: function () { setStep('who'); } }, 'Continue'))));
  } else if (step === 'who') {
    var canNext = forWho === 'me' || recips.length > 0;
    body = h(T.SettingsSection, { title: 'Who is it for?', padded: true },
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: 14 } },
        h(T.SegmentedControl, { label: 'Recipient', value: forWho, onChange: setForWho, options: [{ value: 'me', label: 'For me' }, { value: 'gift', label: 'As a gift' }] }),
        forWho === 'gift' ? h(Frag, null,
          h('div', { style: { display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 10 } },
            h('div', { style: { flex: '1 1 240px' } }, h(T.TextField, { id: 'recip', label: 'Add a username', value: rin, error: rerr || undefined, onChange: function (ev) { setRin(ev.target.value); setRerr(''); }, onKeyDown: function (ev) { if (ev.key === 'Enter') addRecipient(); } })),
            h(T.Button, { onClick: addRecipient, style: { height: 38 } }, 'Add')),
          recips.length ? h('div', { className: 'recipients' }, recips.map(function (n) {
            return h('span', { key: n, className: 'rchip' }, n, h(T.IconButton, { icon: 'x', label: 'Remove ' + n, size: 22, iconSize: 12, onClick: function () { setRecips(recips.filter(function (x) { return x !== n; })); } }));
          })) : h('p', { className: 'tc-hint', style: { margin: 0 } }, 'Gifts are split between the people you add.')) : h('p', { className: 'tc-hint', style: { margin: 0 } }, 'Premium starts on ' + s.me + ' right after payment.'),
        h('div', { className: 'btnrow', style: { justifyContent: 'space-between' } },
          h(T.Button, { variant: 'ghost', icon: 'chevron-left', onClick: function () { setStep('plan'); } }, 'Back'),
          h(T.Button, { variant: 'primary', iconRight: 'chevron-right', disabled: !canNext, onClick: function () { setStep('review'); } }, 'Continue'))));
  } else {
    body = h(T.SettingsSection, { title: 'Review and pay' },
      h('div', { className: 'summary' },
        h('div', null, h('span', null, plan.label), h('span', { className: 'mono' }, money(plan.price, cur))),
        h('div', null, h('span', { className: 'muted' }, 'For'), h('span', null, forWho === 'me' ? s.me : recips.join(', '))),
        h('div', { className: 'total' }, h('span', null, 'Total'), h('span', { className: 'mono' }, money(plan.price, cur)))),
      h(T.SettingRow, {
        asLabel: false, title: 'Payment method', description: "You confirm and pay on chatango.com. Torch never sees your payment details.",
        control: h(T.SegmentedControl, { label: 'Payment method', value: method, onChange: setMethod, options: [{ value: 'paypal', label: 'PayPal' }, { value: 'card', label: 'Card' }] })
      }),
      h('div', { className: 'btnrow', style: { justifyContent: 'space-between', padding: '14px 20px 18px', borderTop: '1px solid var(--divider)' } },
        h(T.Button, { variant: 'ghost', icon: 'chevron-left', onClick: function () { setStep('who'); } }, 'Back'),
        h(T.Button, { variant: 'primary', iconRight: 'external', onClick: function () { app.ui.toast('Payments are disabled in this prototype. Nothing was charged.'); } }, 'Continue to Chatango')));
  }
  return h(Page, {
    title: 'Chatango Premium', lede: 'Premium is sold by Chatango. Torch shows the offers and hands you over to pay.',
    aside: h(T.SegmentedControl, { label: 'Purchase type', value: mode, onChange: function (v) { setMode(v); setStep('plan'); }, options: [{ value: 'premium', label: 'Premium' }, { value: 'name', label: 'Inactive username' }] })
  }, mode === 'premium' ? steps : null, body);
}

/* ---------- Réglages de groupe ---------- */
function GroupSettingsView(p) {
  if (LIVE) return h(GroupSettingsViewLive, p);
  var app = useApp(), s = app.state, g = s.groups[p.gid], me = s.me;
  var a = useState(function () { return g ? JSON.parse(JSON.stringify(g.settings)) : null; }), draft = a[0], setDraft = a[1];
  if (!g) return h('div', { className: 'empty' }, h('h2', null, 'This group is gone'), h(T.Button, { onClick: app.actions.backToChat }, 'Back to chat'));
  var myRole = roleOf(g, me), manage = canManage(g, me), perms = myRole === 'owner' ? allPerms(true) : (g.settings.roles[myRole] || allPerms(false));
  var dirty = JSON.stringify(draft) !== JSON.stringify(g.settings);
  var sections = manage
    ? [{ title: 'General', items: [['overview', 'Overview'], ['announcement', 'Announcement']] }, { title: 'Moderation', items: [['automod', 'AutoMod'], ['media', 'Media and links'], ['bans', 'Bans'], ['audit', 'Audit log']] }, { title: 'People', items: [['roles', 'Staff and roles'], ['members', 'Members'], ['invites', 'Invites']] }]
    : [{ title: 'Moderation', items: [['automod', 'AutoMod'], ['bans', 'Bans']].concat(perms.modLog ? [['audit', 'Audit log']] : []) }, { title: 'People', items: [['members', 'Members'], ['invites', 'Invites']] }];
  var allowed = [].concat.apply([], sections.map(function (x) { return x.items.map(function (i) { return i[0]; }); }));
  var page = allowed.indexOf(p.page) >= 0 ? p.page : allowed[0];
  function edit(fn) { setDraft(function (d0) { var d1 = JSON.parse(JSON.stringify(d0)); fn(d1); return d1; }); }
  function leave() {
    if (dirty) app.ui.confirm({ title: 'Discard unsaved changes?', body: 'Your changes to #' + g.id + ' are not saved yet.', confirmLabel: 'Discard', danger: true, onConfirm: function () { app.nav({ view: 'group', id: g.id }); } });
    else app.nav({ view: 'group', id: g.id });
  }
  var props = { g: g, draft: draft, edit: edit, myRole: myRole, perms: perms, manage: manage };
  var map = { overview: GSOverview, announcement: GSAnnouncement, automod: GSAutoMod, media: GSMedia, bans: GSBans, audit: GSAudit, roles: GSRoles, members: GSMembers, invites: GSInvites };
  var canClose = myRole === 'owner' || (g.settings.roles[myRole] && g.settings.roles[myRole].closeGroup);
  return h(SettingsShell, {
    navLabel: 'Group settings', sections: sections, page: page, onBack: leave,
    onPage: function (pg) { app.nav({ view: 'gsettings', id: g.id, page: pg }); },
    header: h('div', { className: 'snav-head' },
      h(T.Avatar, { name: g.id, square: true, size: 32, color: g.id === 'community' ? 'var(--accent)' : undefined, style: g.id === 'community' ? { color: 'var(--on-accent)' } : null }),
      h('span', { style: { display: 'flex', flexDirection: 'column', lineHeight: 1.25, minWidth: 0 } }, h('span', { style: { fontWeight: 600 } }, g.id), h('span', { style: { fontSize: 12, color: 'var(--text-3)' } }, 'Group settings · ' + ROLE_LONG[myRole]))),
    footer: canClose ? h(T.NavItem, {
      icon: 'lock', label: g.closed ? 'Reopen group' : 'Close group',
      onClick: function () { if (g.closed) app.actions.setClosed(g.id, false); else app.ui.confirm({ title: 'Close #' + g.id + '?', body: 'Nobody can post until staff reopen it. Members stay in the group.', confirmLabel: 'Close group', danger: true, onConfirm: function () { app.actions.setClosed(g.id, true); } }); }
    }) : null
  },
    h(map[page], Object.assign({ key: page }, props)),
    dirty ? h('div', { style: { maxWidth: 1040, paddingBottom: 16 } }, h(T.SaveBar, {
      onDiscard: function () { setDraft(JSON.parse(JSON.stringify(g.settings))); },
      onSave: function () { app.actions.saveGroupSettings(g.id, draft); }
    }, 'Unsaved changes to #' + g.id)) : null);
}

function GSOverview(p) {
  var app = useApp(), o = p.draft.overview, g = p.g;
  return h(Page, { title: 'Overview', lede: 'How #' + g.id + ' appears in Discover and to new members.' },
    g.closed ? h(T.Banner, { tone: 'warning', icon: 'lock', action: h(T.Button, { size: 'sm', onClick: function () { app.actions.setClosed(g.id, false); } }, 'Reopen') }, 'This group is closed. Nobody can post.') : null,
    h(T.SettingsSection, { title: 'Information', padded: true },
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: 16 } },
        h('div', { style: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 } },
          h(T.Avatar, { name: g.id, square: true, size: 56, color: g.id === 'community' ? 'var(--accent)' : undefined, style: g.id === 'community' ? { color: 'var(--on-accent)' } : null }),
          h('div', { className: 'btnrow' }, h(T.Button, { icon: 'upload', onClick: function () { app.ui.toast('Uploading an icon is not part of this prototype.'); } }, 'Change icon'))),
        h(T.TextField, { id: 'gs-name', label: 'Group name', value: g.id, disabled: true, hint: 'The name is the address, ' + g.id + '.chatango.com. It cannot change.' }),
        h(T.TextField, { id: 'gs-title', label: 'Title', value: o.title, maxLength: 60, onChange: function (e) { var v = e.target.value; p.edit(function (d) { d.overview.title = v; }); } }),
        h(T.TextField, { id: 'gs-desc', label: 'Description', multiline: true, rows: 4, maxLength: 300, value: o.description, labelAside: h('span', { className: 'tc-msg-time' }, o.description.length + ' / 300'), onChange: function (e) { var v = e.target.value; p.edit(function (d) { d.overview.description = v; }); } }))),
    h(T.SettingsSection, { title: 'Visibility' },
      h(T.SettingRow, { title: 'Show in Discover', description: 'Anyone can find the group by topic or name.', control: h(T.Switch, { checked: o.showInDiscovery, onChange: function (e) { var v = e.target.checked; p.edit(function (d) { d.overview.showInDiscovery = v; }); } }) }),
      h(T.SettingRow, { title: 'Members list is public', description: 'Everyone can see who is in the group, not only staff.', control: h(T.Switch, { checked: o.membersPublic, onChange: function (e) { var v = e.target.checked; p.edit(function (d) { d.overview.membersPublic = v; }); } }) }),
      h(T.SettingRow, { title: 'Label as adult content', description: 'Hides the group from Discover for members under 18.', control: h(T.Switch, { checked: !!o.nsfw, onChange: function (e) { var v = e.target.checked; p.edit(function (d) { d.overview.nsfw = v; }); } }) })));
}

function GSAnnouncement(p) {
  var a = p.draft.announcement;
  function set(k, v) { p.edit(function (d) { d.announcement[k] = v; }); }
  return h(Page, { title: 'Announcement', lede: 'A pinned notice shown above the conversation. Members can dismiss it for themselves.' },
    h(T.SettingsSection, null,
      h(T.SettingRow, { title: 'Show the announcement', control: h(T.Switch, { checked: a.enabled, onChange: function (e) { set('enabled', e.target.checked); } }) }),
      h('div', { className: 'tc-section-pad', style: { paddingTop: 14, borderTop: '1px solid var(--divider)' } },
        h(T.TextField, { id: 'ann-text', label: 'Text', multiline: true, rows: 3, maxLength: 500, value: a.text, labelAside: h('span', { className: 'tc-msg-time' }, a.text.length + ' / 500'), onChange: function (e) { set('text', e.target.value); } })),
      h(T.SettingRow, {
        asLabel: false, title: 'Post it in the chat every', description: 'Only when more than 5 messages were sent since the last time.',
        control: h('select', { className: 'tc-input', style: { width: 'auto', height: 34 }, 'aria-label': 'Repeat interval', value: a.interval, onChange: function (e) { set('interval', +e.target.value); } },
          [[0, 'Never'], [15, '15 minutes'], [30, '30 minutes'], [60, '1 hour']].map(function (o) { return h('option', { key: o[0], value: o[0] }, o[1]); }))
      }),
      h(T.SettingRow, { title: 'Broadcast mode', description: 'Only staff with the broadcast permission can post. Use it for events.', control: h(T.Switch, { checked: a.broadcast, onChange: function (e) { set('broadcast', e.target.checked); } }) })),
    a.text ? h('div', { style: { display: 'flex', flexDirection: 'column', gap: 10 } }, h('h2', { className: 'side-label' }, 'Preview'), h(T.Banner, { title: 'Announcement' }, a.text)) : null);
}

function GSAutoMod(p) {
  var am = p.draft.automod, canEdit = p.manage || p.perms.automod;
  var filters = [
    ['nonsense', 'Nonsense detection', 'Hides keyboard mashing and random characters.'],
    ['repeat', 'Repeated messages', 'Blocks the same message sent several times in a row.'],
    ['flood', 'Message flooding', 'Limits how fast one member can post.'],
    ['caps', 'Excessive capitals', 'Blocks messages written mostly in capital letters.'],
    ['links', 'Excessive links', 'Blocks messages that contain many links.'],
    ['emoji', 'Repeated emojis', 'Blocks the same emoji repeated many times in one message.'],
    ['mentions', 'Mass mentions', 'Blocks messages that mention many members at once.']
  ];
  function setLevel(l) { p.edit(function (d) { d.automod.level = l; if (AUTOMOD_PRESETS[l]) d.automod.filters = JSON.parse(JSON.stringify(AUTOMOD_PRESETS[l])); }); }
  function setFilter(k, v) {
    p.edit(function (d) {
      d.automod.filters[k] = v;
      var match = Object.keys(AUTOMOD_PRESETS).filter(function (l) { return JSON.stringify(AUTOMOD_PRESETS[l]) === JSON.stringify(d.automod.filters); })[0];
      d.automod.level = match || 'custom';
    });
  }
  var levelText = { off: 'Nothing is filtered. Staff moderate by hand.', standard: 'Blocks spam and nonsense without slowing normal conversation.', strict: 'Adds capitals and emoji filters, and the advanced nonsense check.', custom: 'Your own selection of filters.' };
  return h(Page, { title: 'AutoMod', lede: 'Filters messages before they reach the group. Staff whose role includes Bypass AutoMod are never filtered.' },
    !canEdit ? h(T.Banner, { icon: 'lock' }, 'Your role can view AutoMod but not change it.') : null,
    h(T.SettingsSection, { title: 'Protection level', padded: true },
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: 10 } },
        h('fieldset', { disabled: !canEdit, style: { border: 0, margin: 0, padding: 0, minWidth: 0 } },
          h(T.SegmentedControl, { label: 'Protection level', block: true, value: am.level, onChange: setLevel, options: [{ value: 'off', label: 'Off' }, { value: 'standard', label: 'Standard' }, { value: 'strict', label: 'Strict' }, { value: 'custom', label: 'Custom' }] })),
        h('p', { className: 'tc-hint', style: { margin: 0, fontSize: 13 } }, levelText[am.level] + ' Changing a filter below switches to Custom.'))),
    h(T.SettingsSection, { title: 'Message filters' }, filters.map(function (f) {
      return h(T.SettingRow, {
        key: f[0], asLabel: f[0] !== 'nonsense', title: f[1], description: f[2],
        control: f[0] === 'nonsense'
          ? h('div', { style: { display: 'flex', alignItems: 'center', gap: 12 } },
            h('select', { className: 'tc-input', style: { width: 'auto', height: 32 }, 'aria-label': 'Nonsense detection sensitivity', disabled: !canEdit || !am.filters.nonsense, value: am.filters.nonsenseMode, onChange: function (e) { setFilter('nonsenseMode', e.target.value); } }, h('option', null, 'Basic'), h('option', null, 'Advanced')),
            h(T.Switch, { label: f[1], checked: !!am.filters.nonsense, disabled: !canEdit, onChange: function (e) { setFilter('nonsense', e.target.checked); } }))
          : h(T.Switch, { checked: !!am.filters[f[0]], disabled: !canEdit, onChange: function (e) { setFilter(f[0], e.target.checked); } })
      });
    })),
    h(T.SettingsSection, { title: 'Who can post' },
      [['proxies', 'Block proxies and VPNs', 'Members connecting through a known proxy or VPN can read but not post.'], ['advancedProxy', 'Advanced proxy detection', 'Catches more residential proxies. Adds a short delay on the first message.'], ['verifiedEmail', 'Require a verified email', 'Members need a verified email on their Chatango account to post.']].map(function (r) {
        return h(T.SettingRow, { key: r[0], title: r[1], description: r[2], control: h(T.Switch, { checked: !!am[r[0]], disabled: !canEdit, onChange: function (e) { var v = e.target.checked; p.edit(function (d) { d.automod[r[0]] = v; }); } }) });
      })));
}

function GSMedia(p) {
  var m = p.draft.media;
  return h(Page, { title: 'Media and links', lede: 'What members can share in #' + p.g.id + '. Staff are not restricted.' },
    h(T.SettingsSection, null, [['links', 'Allow links'], ['images', 'Allow images'], ['videos', 'Allow videos']].map(function (r) {
      return h(T.SettingRow, { key: r[0], title: r[1], control: h(T.Switch, { checked: !!m[r[0]], onChange: function (e) { var v = e.target.checked; p.edit(function (d) { d.media[r[0]] = v; }); } }) });
    })));
}

function GSBans(p) {
  var app = useApp(), g = p.g;
  var a = useState(''), name = a[0], setName = a[1];
  var b = useState(''), err = b[0], setErr = b[1];
  var showIp = p.myRole === 'owner' || p.perms.seeIps;
  function ban() {
    var n = name.trim().toLowerCase();
    if (!n) { setErr('Enter a username.'); return; }
    if (n === app.state.me) { setErr("You can't ban yourself."); return; }
    if (roleOf(g, n) === 'owner') { setErr("The owner can't be banned."); return; }
    if (g.bans.some(function (x) { return x.name === n; })) { setErr(n + ' is already banned.'); return; }
    setName(''); setErr(''); app.ui.ban(n, g.id);
  }
  return h(Page, {
    title: 'Bans', lede: 'Banned members cannot read or post. Bans apply to the account and its IP.',
    aside: g.bans.length && (p.myRole === 'owner' || p.perms.unbanAll) ? h(T.Button, { variant: 'danger', onClick: function () { app.ui.confirm({ title: 'Unban everyone?', body: g.bans.length + ' members will be able to join #' + g.id + ' again.', confirmLabel: 'Unban everyone', danger: true, onConfirm: function () { app.actions.unbanAll(g.id); } }); } }, 'Unban everyone') : null
  },
    h(T.SettingsSection, { title: 'Ban someone', padded: true },
      h('div', { style: { display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 10 } },
        h('div', { style: { flex: '1 1 260px' } }, h(T.TextField, { id: 'ban-name', label: 'Username', value: name, error: err || undefined, onChange: function (e) { setName(e.target.value); setErr(''); }, onKeyDown: function (e) { if (e.key === 'Enter') ban(); } })),
        h(T.Button, { variant: 'danger', icon: 'ban', style: { height: 38 }, onClick: ban }, 'Ban'))),
    h(T.SettingsSection, { title: 'Banned · ' + g.bans.length },
      g.bans.length ? g.bans.map(function (x) {
        return h('div', { key: x.name, className: 'lrow' },
          h(T.Avatar, { name: x.name, size: 32 }),
          h('span', { className: 'grow' }, h('span', { className: 'lrow-title' }, x.name), h('span', { className: 'lrow-sub' }, x.reason + ' · by ' + x.by + ' · ' + ago(x.at))),
          showIp ? h('span', { className: 'mono muted', style: { fontSize: 12 } }, x.ip) : null,
          h(T.Button, { size: 'sm', onClick: function () { app.actions.unban(g.id, x.name); } }, 'Unban'));
      }) : h('p', { className: 'muted', style: { margin: 0, padding: '4px 20px 18px', fontSize: 13 } }, 'Nobody is banned.')));
}

function GSAudit(p) {
  var g = p.g;
  var a = useState('all'), actor = a[0], setActor = a[1];
  var actors = Object.keys(g.audit.reduce(function (o, x) { o[x.actor] = 1; return o; }, {}));
  var rows = g.audit.slice().reverse().filter(function (x) { return actor === 'all' || x.actor === actor; });
  return h(Page, {
    title: 'Audit log', lede: 'Every moderation and settings change in #' + g.id + ', newest first.',
    aside: h('label', { style: { display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-2)' } }, 'Staff member',
      h('select', { className: 'tc-input', style: { width: 'auto', height: 34 }, value: actor, onChange: function (e) { setActor(e.target.value); } }, h('option', { value: 'all' }, 'Everyone'), actors.map(function (n) { return h('option', { key: n, value: n }, n); })))
  },
    h(T.SettingsSection, null, rows.length ? rows.map(function (x, i) {
      return h('div', { key: x.id, className: 'lrow', style: i ? null : { borderTop: 0 } },
        h(T.Avatar, { name: x.actor, size: 28 }),
        h('span', { className: 'grow' }, h('span', { className: 'lrow-title', style: { fontWeight: 400 } }, h('b', { style: { fontWeight: 600 } }, x.actor), ' ', x.text.charAt(0).toLowerCase() + x.text.slice(1))),
        h('time', { className: 'tc-msg-time', title: new Date(x.at).toLocaleString('en-GB') }, ago(x.at)));
    }) : h('p', { className: 'pal-empty' }, 'No entries.')));
}

function GSRoles(p) {
  var app = useApp(), g = p.g, draft = p.draft, myRole = p.myRole;
  var a = useState('mod'), role = a[0], setRole = a[1];
  var b = useState(false), manageOpen = b[0], setManageOpen = b[1];
  function holders(r) { return Object.keys(draft.staff).filter(function (n) { return draft.staff[n] === r; }); }
  function canEditRole(r) { if (r === 'owner') return false; if (myRole === 'owner' || myRole === 'coowner') return true; return myRole === 'admin' && r === 'mod'; }
  var editable = canEditRole(role);
  var locks = ROLE_LOCKS[role] || [];
  var rolePerms = role === 'owner' ? allPerms(true) : draft.roles[role];
  var groupsOf = ['Visibility', 'Moderation', 'Administration'];
  return h(Page, {
    title: 'Staff and roles', lede: 'Choose what each role can do in #' + g.id + '. The owner always has every permission.', wide: true
  },
    h('div', { className: 'split' },
      h('section', { 'aria-label': 'Roles', className: 'tc-section', style: { flex: '1 1 240px', alignSelf: 'flex-start' } },
        h('div', { className: 'roles' }, ['owner', 'coowner', 'admin', 'mod'].map(function (r) {
          var n = holders(r).length;
          return h('button', { key: r, type: 'button', className: 'role-btn', 'aria-current': String(role === r), onClick: function () { setRole(r); } },
            h('span', { className: 'role-ico' }, h(T.Icon, { name: r === 'owner' ? 'crown' : 'shield', size: 15 })),
            h('span', { className: 'grow', style: { display: 'flex', flexDirection: 'column', lineHeight: 1.3 } }, h('span', { style: { fontWeight: 500, color: 'var(--text)' } }, ROLE_LONG[r]), h('span', { style: { fontSize: 12, color: 'var(--text-3)' } }, r === 'owner' ? holders('owner').join(', ') || 'Nobody' : n ? plural(n, 'member', 'members') : 'No members')),
            h(T.Icon, { name: 'chevron-right', size: 14, style: { color: 'var(--text-3)' } }));
        }))),
      h('div', { className: 'grow' },
        h('section', { className: 'tc-section', 'aria-label': ROLE_LONG[role], style: { padding: '16px 20px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px 16px' } },
          h('div', { style: { flex: '1 1 240px' } }, h('h2', { style: { margin: '0 0 2px', fontSize: 17, fontWeight: 600 } }, ROLE_LONG[role]), h('p', { className: 'muted', style: { margin: 0, fontSize: 13 } }, ROLE_DESC[role])),
          h('div', { style: { display: 'flex', alignItems: 'center', gap: 10 } },
            h('span', { style: { fontSize: 13, color: 'var(--text-2)' } }, holders(role).join(', ') || 'No members'),
            role !== 'owner' && editable ? h(T.Button, { size: 'sm', onClick: function () { setManageOpen(true); } }, 'Manage') : null)),
        !editable && role !== 'owner' ? h(T.Banner, { icon: 'lock' }, 'Only the owner and co-owners can change the ' + ROLE_LONG[role] + ' role.') : null,
        groupsOf.map(function (grp) {
          var list = PERMS.filter(function (x) { return x.group === grp; });
          var allLocked = list.every(function (x) { return locks.indexOf(x.key) >= 0; });
          return h(T.SettingsSection, { key: grp, title: grp, headerAside: allLocked && role !== 'owner' ? h(T.Badge, { icon: 'lock' }, 'Owner and above') : null },
            list.map(function (x) {
              var locked = role === 'owner' || locks.indexOf(x.key) >= 0 || !editable;
              return h(T.SettingRow, {
                key: x.key, title: x.title, description: x.desc,
                badge: x.sensitive ? h('span', { style: { marginLeft: 8 } }, h(T.Badge, { tone: 'accent' }, 'Sensitive')) : null,
                control: h(T.Switch, { checked: !!rolePerms[x.key], disabled: locked, onChange: function (e) { var v = e.target.checked; p.edit(function (d) { d.roles[role][x.key] = v; }); } })
              });
            }));
        }))),
    manageOpen ? h(ManageRoleDialog, { g: g, role: role, draft: draft, edit: p.edit, onClose: function () { setManageOpen(false); } }) : null);
}

function ManageRoleDialog(p) {
  var app = useApp(), g = p.g, role = p.role;
  var a = useState(''), pickName = a[0], setPick = a[1];
  var holders = Object.keys(p.draft.staff).filter(function (n) { return p.draft.staff[n] === role; });
  var candidates = g.members.filter(function (n) { return !p.draft.staff[n] && n !== app.state.me; });
  return h(Dialog, { title: ROLE_LONG[role] + 's in #' + g.id, description: 'Changes are saved with the rest of the page.', onClose: p.onClose, footer: h(T.Button, { variant: 'primary', onClick: p.onClose }, 'Done') },
    h('div', { className: 'dialog-body', style: { gap: 8 } },
      holders.length ? holders.map(function (n) {
        return h('div', { key: n, style: { display: 'flex', alignItems: 'center', gap: 10 } }, h(T.Avatar, { name: n, size: 28 }), h('span', { className: 'grow' }, n),
          h(T.Button, { size: 'sm', variant: 'ghost', onClick: function () { p.edit(function (d) { delete d.staff[n]; }); } }, 'Remove'));
      }) : h('p', { className: 'muted', style: { margin: 0 } }, 'Nobody has this role yet.'),
      h('div', { style: { display: 'flex', alignItems: 'flex-end', gap: 10, marginTop: 8 } },
        h('div', { className: 'tc-field', style: { flex: 1 } }, h('label', { className: 'tc-label', htmlFor: 'add-staff' }, 'Add a member'),
          h('select', { id: 'add-staff', className: 'tc-input', value: pickName, onChange: function (e) { setPick(e.target.value); } }, h('option', { value: '' }, 'Choose a member'), candidates.map(function (n) { return h('option', { key: n, value: n }, n); }))),
        h(T.Button, { disabled: !pickName, style: { height: 38 }, onClick: function () { var n = pickName; p.edit(function (d) { d.staff[n] = role; }); setPick(''); } }, 'Add'))));
}

function GSMembers(p) {
  var app = useApp(), s = app.state, g = p.g;
  var a = useState(''), q = a[0], setQ = a[1];
  var list = g.members.filter(function (n) { return !q || n.indexOf(q.toLowerCase()) >= 0; });
  var canMods = LIVE ? p.perms.manageMods : (p.myRole === 'owner' || p.myRole === 'coowner' || p.myRole === 'admin');
  return h(Page, { title: 'Members', lede: g.members.length + ' members and ' + g.guests + ' guests right now.' },
    h(T.TextField, { id: 'mem-q', label: 'Search members', type: 'search', value: q, onChange: function (e) { setQ(e.target.value); } }),
    h(T.SettingsSection, null, list.length ? list.map(function (n, i) {
      var r = p.draft.staff[n], u = userOf(s, n);
      return h('div', { key: n, className: 'lrow', style: i ? null : { borderTop: 0 } },
        h(T.Avatar, { name: n, size: 32, status: n === s.me ? s.meStatus : u.status, ring: 'var(--panel)' }),
        h('span', { className: 'grow' }, h('span', { className: 'lrow-title' }, n + (n === s.me ? ' (you)' : '')), h('span', { className: 'lrow-sub' }, (r ? ROLE_LONG[r] + ' · ' : '') + statusLabel(n === s.me ? s.meStatus : u.status))),
        n === s.me || r === 'owner' ? null : h(MenuButton, {
          label: 'Actions for ' + n, items: [
            { label: 'View profile', icon: 'users', onSelect: function () { app.ui.openProfile(n, g.id); } },
            canMods && !r ? { label: 'Make moderator', icon: 'shield', onSelect: function () { p.edit(function (d) { d.staff[n] = 'mod'; if (LIVE) d.modFlags[n] = permsToFlags(defaultRoles().mod, 0); }); app.ui.toast(n + ' will be a moderator once you save.'); } } : null,
            canMods && (r === 'mod' || (LIVE && r === 'admin')) ? { label: 'Remove from staff', icon: 'user-minus', onSelect: function () { p.edit(function (d) { delete d.staff[n]; if (LIVE) delete d.modFlags[n]; }); app.ui.toast(n + ' leaves staff once you save.'); } } : null,
            { divider: true },
            { label: 'Ban', icon: 'ban', danger: true, onSelect: function () { app.ui.ban(n, g.id); } }
          ]
        }));
    }) : h('p', { className: 'pal-empty' }, 'No member matches.')));
}

function GSInvites(p) {
  var app = useApp(), link = 'https://' + p.g.id + '.chatango.com';
  return h(Page, { title: 'Invites', lede: 'Anyone with the link can join. Banned members still cannot.' },
    h(T.SettingsSection, { title: 'Invite link', padded: true },
      h('div', { style: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 } },
        h('input', { className: 'tc-input mono', style: { flex: '1 1 260px' }, readOnly: true, value: link, 'aria-label': 'Invite link', onFocus: function (e) { e.target.select(); } }),
        h(T.Button, { variant: 'primary', icon: 'link', onClick: function () { copyText(link, function (ok) { app.ui.toast(ok ? 'Invite link copied.' : 'Copy failed. Select the link and copy it.'); }); } }, 'Copy link'))));
}
