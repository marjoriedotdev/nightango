/* ---------- Réglages du compte en mode live ---------- */
var GENDER_LABEL = { M: 'Male', F: 'Female' };
var GENDER_CODE = { Male: 'M', Female: 'F' };
var FULL_PROFILE_VIEWS = [{ value: 'edit', label: 'Edit' }, { value: 'preview', label: 'Preview' }];

function ProfilePageLive() {
  var app = useApp(), s = app.state;
  // Champ vide : profil complet vide ou pas encore relu par Torch, null jusqu'à la lecture de mod2.xml.
  function load() { var r = liveBridge.readProfile(); return { loaded: r.loaded, age: r.age, gender: GENDER_LABEL[r.gender] || 'Not specified', location: r.location, about: r.about, dir: r.dir, full: r.full || null }; }
  function editable(x) { return { age: x.age, gender: x.gender, location: x.location, about: x.about, dir: x.dir, full: x.full }; }
  var a = useState(load), base = a[0], setBase = a[1];
  var b = useState(function () { return editable(base); }), draft = b[0], setDraft = b[1];
  var c = useState(false), saving = c[0], setSaving = c[1];
  var f = useState(false), fullFailed = f[0], setFullFailed = f[1];
  var fv = useState('edit'), fullView = fv[0], setFullView = fv[1];
  var media = useFullProfileMedia();
  var dirty = JSON.stringify(draft) !== JSON.stringify(editable(base));
  var ageErr = draft.age !== '' && (isNaN(+draft.age) || +draft.age < 13 || +draft.age > 120) ? 'Enter an age between 13 and 120.' : '';
  function set(k, v) { setDraft(function (d) { var n = Object.assign({}, d); n[k] = v; return n; }); }
  function fetchFull() {
    setFullFailed(false);
    liveBridge.fetchFullProfile(s.me).then(function (html) {
      setBase(function (x) { return Object.assign({}, x, { full: html }); });
      setDraft(function (x) { return Object.assign({}, x, { full: html }); });
    }, function () { setFullFailed(true); });
  }
  useEffect(function () { if (base.full === null) fetchFull(); }, []);
  function reload() { var nb = load(); setBase(nb); setDraft(editable(nb)); if (nb.full === null) fetchFull(); }
  function save() {
    if (ageErr) { app.ui.toast('Fix the age before saving.'); return; }
    if (!base.loaded) { app.ui.toast('Your profile is not loaded yet. Nothing was saved.'); return; }
    setSaving(true);
    liveBridge.saveProfile({ age: draft.age, gender: GENDER_CODE[draft.gender] || '?', location: draft.location, about: draft.about, dir: draft.dir, full: draft.full }).then(function () {
      setBase(Object.assign({}, base, draft));
      setSaving(false);
      app.update(function (d) { var u = d.users[d.me]; if (u) { u.age = draft.age === '' ? '' : +draft.age; u.location = draft.location; u.about = draft.about; u.aboutHtml = draft.about; u.gender = draft.gender; } });
      app.ui.toast('Profile saved to Chatango.', { icon: 'check' });
    }, function (e) {
      setSaving(false);
      app.ui.toast(e && e.message ? e.message : 'Chatango did not save your profile.');
    });
  }
  var meta = [draft.age, genderShort(draft.gender), draft.location].filter(Boolean).join(' · ');
  return h(Page, { title: 'Profile', lede: 'This is your Chatango profile. Everyone on Chatango sees it, not only Torch users.', wide: true },
    base.loaded ? null : h(T.Banner, { tone: 'warning', icon: 'info', action: h(T.Button, { size: 'sm', onClick: reload }, 'Try again') }, "Torch hasn't loaded your profile yet. Saving stays off so nothing gets erased."),
    h('div', { className: 'split' },
      h('div', { className: 'grow' },
        h(T.SettingsSection, { title: 'Profile picture', padded: true },
          h('div', { style: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 } },
            h(T.Avatar, { name: s.me, size: 72 }),
            h('div', { style: { display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' } },
              h('span', { className: 'tc-hint' }, 'Change your picture on chatango.com. Torch Skin shows it here once Chatango updates it.'),
              chatangoLink('Open chatango.com')))),
        h(T.SettingsSection, { title: 'About you', padded: true },
          h('fieldset', { disabled: !base.loaded || saving, style: { border: 0, margin: 0, padding: 0, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 } },
            h('div', { className: 'grid3' },
              h(T.TextField, { id: 'pf-age', label: 'Age', type: 'number', min: 13, max: 120, value: draft.age, error: ageErr || undefined, onChange: function (e) { set('age', e.target.value); } }),
              h('div', { className: 'tc-field' }, h('label', { className: 'tc-label', htmlFor: 'pf-gender' }, 'Gender'),
                h('select', { id: 'pf-gender', className: 'tc-input', value: draft.gender, onChange: function (e) { set('gender', e.target.value); } }, ['Not specified', 'Male', 'Female'].map(function (g) { return h('option', { key: g }, g); }))),
              h(T.TextField, { id: 'pf-loc', label: 'Location', value: draft.location, onChange: function (e) { set('location', e.target.value); } })),
            h(T.TextField, { id: 'pf-bio', label: 'Bio', multiline: true, rows: 5, maxLength: 2000, value: draft.about, labelAside: h('span', { className: 'tc-msg-time' }, draft.about.length + ' / 2000'), hint: 'Shown in your mini profile.', onChange: function (e) { set('about', e.target.value); } }))),
        h(T.SettingsSection, { title: 'Full profile', description: 'Your page on chatango.com, written in HTML. Members open it from your mini profile.', padded: true },
          h('div', { style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' } },
            h('div', null, h(T.SegmentedControl, { label: 'Full profile view', value: fullView, options: FULL_PROFILE_VIEWS, onChange: setFullView })),
            draft.full === null ? h('div', { className: 'btnrow', style: { alignItems: 'center' } },
              h('span', { className: 'tc-hint' }, fullFailed ? 'Chatango did not return your full profile.' : 'Loading your full profile from Chatango.'),
              fullFailed ? h(T.Button, { size: 'sm', onClick: fetchFull }, 'Try again') : null) : null,
            fullView === 'edit' ? h(T.TextField, { id: 'pf-full', label: 'HTML', multiline: true, rows: 10, maxLength: 20000, value: draft.full || '', disabled: !base.loaded || saving || draft.full === null, labelAside: draft.full === null ? null : h('span', { className: 'tc-msg-time' }, draft.full.length + ' / 20000'), onChange: function (e) { set('full', e.target.value); } })
              : draft.full === null ? null
                : draft.full ? h(Frag, null, h(FullProfileFrame, { name: s.me, html: draft.full, media: media.on }), media.button ? h('div', null, media.button) : null)
                  : h('p', { className: 'muted', style: { margin: 0 } }, "You haven't written a full profile."))),
        h(T.SettingsSection, { title: 'Visibility' },
          h(T.SettingRow, { title: 'Appear in Meet people', description: 'Lets other Chatango users find you by age and location.', control: h(T.Switch, { checked: !!draft.dir, disabled: !base.loaded || saving, onChange: function (e) { set('dir', e.target.checked); } }) })),
        h(VisitorsSection, { bio: base.about, draft: draft.about, onDraft: function (v) { set('about', v); }, disabled: !base.loaded || saving })),
      h('aside', { className: 'side', 'aria-labelledby': 'pv-h' },
        h('h2', { id: 'pv-h', className: 'side-label' }, 'Preview'),
        profilePreviewCard(s.me, meta, draft.about))),
    dirty && base.loaded ? h(T.SaveBar, { onDiscard: function () { setDraft(editable(base)); }, onSave: saving ? function () {} : save, saveLabel: saving ? 'Saving' : 'Save profile' }, 'Unsaved changes to your Chatango profile') : null);
}

// L'interface ne change que si Torch a enregistré la valeur, sinon un toast le dit.
function useTorchSettings(read, write) {
  var app = useApp();
  var st = useState(read), value = st[0], setValue = st[1];
  function set(key, v) {
    if (!saveTorchSetting(app, write, key, v)) return;
    setValue(function (x) { var n = Object.assign({}, x); n[key] = v; return n; });
  }
  return [value, set];
}

function PrivacyPageLive() {
  var app = useApp(), pr = usePref();
  var st = useTorchSettings(liveBridge.startupSettings, liveBridge.setSetting), startup = st[0], setStartupSetting = st[1];
  return h(Page, { title: 'Privacy', lede: 'What Torch Skin keeps in this browser.' },
    h(T.SettingsSection, { title: 'Private messages' },
      h(T.SettingRow, {
        asLabel: false, title: 'Delete saved conversations', description: 'Torch keeps a copy of your private messages in this browser. Chatango does not store them.',
        control: h(T.Button, { variant: 'danger', size: 'sm', onClick: function () { app.ui.confirm({ title: 'Delete saved conversations?', body: 'Every private message Torch saved in this browser is removed. The people you talked to keep their copy.', confirmLabel: 'Delete all', danger: true, onConfirm: app.actions.deleteAllDms }); } }, 'Delete all')
      })),
    h(T.SettingsSection, { title: 'Browser tab' },
      h(T.SettingRow, { title: 'Show my username in the tab title', description: 'Useful when you run several accounts in different tabs.', control: pr.sw('privacy.usernameInTitle') })),
    startup ? h(StartupSection, { value: startup, onChange: setStartupSetting }) : null);
}

function AccountPageLive() {
  return h(Page, { title: 'Password and email', lede: 'Sign-in details for your Chatango account.' },
    h(T.Banner, { icon: 'lock', title: 'Managed on chatango.com', action: chatangoLink('Open chatango.com') },
      'Torch Skin never handles your password, so it cannot change it, change your email or delete your account. Do it on chatango.com.'));
}

function PremiumPageLive() {
  return h(Page, { title: 'Chatango Premium', lede: 'Custom backgrounds, media and badges for your account.' },
    h(T.Banner, { icon: 'info', title: 'Not available in Torch Skin', action: chatangoLink('Open chatango.com') },
      'Torch Skin does not take payments. Buy or gift Premium on chatango.com.'));
}
