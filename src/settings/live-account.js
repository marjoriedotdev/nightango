/* ---------- Account settings in live mode ---------- */
var GENDER_LABEL = { M: 'Male', F: 'Female' };
var GENDER_CODE = { Male: 'M', Female: 'F' };
var FULL_PROFILE_VIEWS = [{ value: 'edit', label: 'Edit' }, { value: 'preview', label: 'Preview' }];

var AVATAR_TYPES = 'image/jpeg,image/png,image/gif';
var BANNER_TYPES = '.png, .apng, .jpg, .jpeg, .gif, .bmp, .webp';
/**
 * Reads the Premium background of the user's own account for the form.
 * @param {Object} u Signed-in account in the state.
 * @returns {?Object|boolean} Form from miniStyleForm, false without Premium, null while mod1.xml is not read.
 */
function ownMiniStyle(u) { return !u.profileLoaded ? null : u.premium ? miniStyleForm(u.miniStyle) : false; }

function ProfilePageLive() {
  var app = useApp(), s = app.state, me = userOf(s, s.me);
  // Empty field: full profile empty or not yet read back by BetterChatango, null until mod2.xml is read.
  function load() { var r = liveBridge.readProfile(); return { loaded: r.loaded, age: r.age, gender: GENDER_LABEL[r.gender] || 'Not specified', location: r.location, about: r.about, dir: r.dir, full: r.full || null, style: ownMiniStyle(me) }; }
  function fields(x) { return { age: x.age, gender: x.gender, location: x.location, about: x.about, dir: x.dir, full: x.full }; }
  function editable(x) { return Object.assign(fields(x), { style: x.style }); }
  var a = useState(load), base = a[0], setBase = a[1];
  var b = useState(function () { return editable(base); }), draft = b[0], setDraft = b[1];
  var c = useState(false), saving = c[0], setSaving = c[1];
  var f = useState(false), fullFailed = f[0], setFullFailed = f[1];
  var fv = useState('edit'), fullView = fv[0], setFullView = fv[1];
  var ph = useState(false), hasPhoto = ph[0], setHasPhoto = ph[1];
  var cr = useState(null), crop = cr[0], setCrop = cr[1];
  var up = useState(null), uploading = up[0], setUploading = up[1];
  var avatarInput = useRef(null), bannerInput = useRef(null), bioInput = useRef(null), fullInput = useRef(null);
  var media = useFullProfileMedia();
  var dirty = JSON.stringify(draft) !== JSON.stringify(editable(base));
  var ageErr = draft.age !== '' && (isNaN(+draft.age) || +draft.age < 13 || +draft.age > 120) ? 'Enter an age between 13 and 120.' : '';
  var imageErr = draft.style && draft.style.image && !SAFE_IMAGE_URL.test(draft.style.image) ? 'Enter an image link that starts with https:// and has no spaces, quotes or parentheses.' : '';
  function set(k, v) { setDraft(function (d) { var n = Object.assign({}, d); n[k] = v; return n; }); }
  function setStyle(k, v) { setDraft(function (d) { var n = Object.assign({}, d, { style: Object.assign({}, d.style) }); n.style[k] = v; return n; }); }
  function fetchFull() {
    setFullFailed(false);
    liveBridge.fetchFullProfile(s.me).then(function (html) {
      setBase(function (x) { return Object.assign({}, x, { full: html }); });
      setDraft(function (x) { return Object.assign({}, x, { full: html }); });
    }, function () { setFullFailed(true); });
  }
  useEffect(function () { if (base.full === null) fetchFull(); app.actions.loadProfile(s.me); }, []);
  // The Premium background arrives with mod1.xml, after the page opens.
  var knownStyle = ownMiniStyle(me);
  useEffect(function () {
    if (knownStyle === null || base.style !== null) return;
    setBase(function (x) { return Object.assign({}, x, { style: knownStyle }); });
    setDraft(function (x) { return Object.assign({}, x, { style: knownStyle }); });
  }, [me.profileLoaded, me.premium]);
  function reload() { var nb = load(); setBase(nb); setDraft(editable(nb)); if (nb.full === null) fetchFull(); }
  function save() {
    if (ageErr) { app.ui.toast('Fix the age before saving.'); return; }
    if (imageErr) { app.ui.toast('Fix the background image link before saving.'); return; }
    if (!base.loaded) { app.ui.toast('Your profile is not loaded yet. Nothing was saved.'); return; }
    var sent = draft, profileDirty = JSON.stringify(fields(sent)) !== JSON.stringify(fields(base));
    var styleDirty = !!sent.style && JSON.stringify(sent.style) !== JSON.stringify(base.style);
    setSaving(true);
    // BetterChatango accepts only one request at a time: the background is sent after the profile.
    (profileDirty ? liveBridge.saveProfile({ age: sent.age, gender: GENDER_CODE[sent.gender] || '?', location: sent.location, about: sent.about, dir: sent.dir, full: sent.full }).then(function () {
      setBase(function (x) { return Object.assign({}, x, fields(sent)); });
      app.update(function (d) { var u = d.users[d.me]; if (u) { u.age = sent.age === '' ? '' : +sent.age; u.location = sent.location; u.about = sent.about; u.aboutHtml = sent.about; u.gender = sent.gender; } });
    }) : Promise.resolve()).then(function () {
      if (!styleDirty) return;
      return liveBridge.saveProfileStyle(sent.style, sent.dir).then(function () {
        setBase(function (x) { return Object.assign({}, x, { style: sent.style }); });
        app.update(function (d) { var u = d.users[d.me]; if (u) u.miniStyle = miniStyleOfForm(sent.style); });
      });
    }).then(function () {
      setSaving(false);
      app.ui.toast('Profile saved to Chatango.', { icon: 'check' });
    }, function (e) {
      setSaving(false);
      app.ui.toast(e && e.message ? e.message : 'Chatango did not save your profile.');
    });
  }
  // Re-renders the whole application: the avatars read again the version the bridge set.
  function avatarsChanged() { app.update(function () {}); }
  function pickAvatar(e) {
    var file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setUploading('avatar');
    liveBridge.uploadAvatar(file).then(function () {
      setUploading(null);
      avatarsChanged();
      setCrop({ initial: null });
    }, function (err) { setUploading(null); app.ui.toast(err.message); });
  }
  function pickBanner(e) {
    var file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    app.ui.confirm({
      title: 'Upload ' + file.name + '?', body: 'vissle.me stores the image and your mini profile links to it. Anyone with the link can open it.', confirmLabel: 'Upload',
      onConfirm: function () {
        setUploading('banner');
        liveBridge.uploadFile(file).then(function (url) { setUploading(null); setStyle('image', url); }, function (err) { setUploading(null); app.ui.toast(err.message); });
      }
    });
  }
  var meta = [draft.age, genderShort(draft.gender), draft.location].filter(Boolean).join(' · ');
  var preview = draft.style ? miniStyleOf(s.prefs, { miniStyle: miniStyleOfForm(draft.style) }, app.theme) : miniStyleOf(s.prefs, me, app.theme);
  var locked = !base.loaded || saving;
  var bioMarkup = useMarkupToolbar(bioInput, 'pf-bio'), fullMarkup = useMarkupToolbar(fullInput, 'pf-full', locked || draft.full === null);
  return h(Page, { title: 'Profile', lede: 'This is your Chatango profile. Everyone on Chatango sees it, not only BetterChatango users.', wide: true },
    base.loaded ? null : h(T.Banner, { tone: 'warning', icon: 'info', action: h(T.Button, { size: 'sm', onClick: reload }, 'Try again') }, "BetterChatango hasn't loaded your profile yet. Saving stays off so nothing gets erased."),
    h('div', { className: 'split' },
      h('div', { className: 'grow' },
        h(T.SettingsSection, { title: 'Profile picture', padded: true },
          h('div', { style: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 } },
            h(T.Avatar, { name: s.me, size: 72, onLoad: function () { setHasPhoto(true); } }),
            h('div', { style: { display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' } },
              h('div', { className: 'btnrow' },
                h(T.Button, { icon: 'upload', disabled: !!uploading || saving, onClick: function () { avatarInput.current.click(); } }, uploading === 'avatar' ? 'Uploading' : 'Upload image'),
                hasPhoto ? h(T.Button, { variant: 'ghost', icon: 'image', disabled: !!uploading || saving, onClick: function () { setCrop({ initial: liveBridge.readProfile().crop }); } }, 'Adjust crop') : null),
              h('span', { className: 'tc-hint' }, 'JPG, PNG or GIF. Your avatar shows the square you crop from it.'),
              h('input', { ref: avatarInput, type: 'file', accept: AVATAR_TYPES, hidden: true, onChange: pickAvatar })))),
        h(T.SettingsSection, { title: 'About you', padded: true },
          h('fieldset', { disabled: locked, style: { border: 0, margin: 0, padding: 0, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 } },
            h('div', { className: 'grid3' },
              h(T.TextField, { id: 'pf-age', label: 'Age', type: 'number', min: 13, max: 120, value: draft.age, error: ageErr || undefined, onChange: function (e) { set('age', e.target.value); } }),
              h('div', { className: 'tc-field' }, h('label', { className: 'tc-label', htmlFor: 'pf-gender' }, 'Gender'),
                h('select', { id: 'pf-gender', className: 'tc-input', value: draft.gender, onChange: function (e) { set('gender', e.target.value); } }, ['Not specified', 'Male', 'Female'].map(function (g) { return h('option', { key: g }, g); }))),
              h(T.TextField, { id: 'pf-loc', label: 'Location', value: draft.location, onChange: function (e) { set('location', e.target.value); } })),
            h(T.TextField, { id: 'pf-bio', label: 'Bio', multiline: true, rows: 5, maxLength: 2000, value: draft.about, inputRef: bioInput, toolbar: bioMarkup.toolbar, onKeyDown: bioMarkup.onKeyDown, labelAside: h('span', { className: 'tc-msg-time' }, draft.about.length + ' / 2000'), hint: 'Shown in your mini profile.', onChange: function (e) { set('about', e.target.value); } }))),
        h(MiniBackgroundSection, { style: draft.style, failed: me.profileFailed, locked: locked, uploading: uploading, imageErr: imageErr, onChange: setStyle, onUpload: function () { bannerInput.current.click(); } }),
        h('input', { ref: bannerInput, type: 'file', accept: BANNER_TYPES, hidden: true, onChange: pickBanner }),
        h(T.SettingsSection, { title: 'Full profile', description: 'Your page on chatango.com, written in HTML. Members open it from your mini profile.', padded: true },
          h('div', { style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' } },
            h('div', null, h(T.SegmentedControl, { label: 'Full profile view', value: fullView, options: FULL_PROFILE_VIEWS, onChange: setFullView })),
            draft.full === null ? h('div', { className: 'btnrow', style: { alignItems: 'center' } },
              h('span', { className: 'tc-hint' }, fullFailed ? 'Chatango did not return your full profile.' : 'Loading your full profile from Chatango.'),
              fullFailed ? h(T.Button, { size: 'sm', onClick: fetchFull }, 'Try again') : null) : null,
            fullView === 'edit' ? h(T.TextField, { id: 'pf-full', label: 'HTML', multiline: true, rows: 10, maxLength: 20000, value: draft.full || '', inputRef: fullInput, toolbar: fullMarkup.toolbar, onKeyDown: fullMarkup.onKeyDown, disabled: locked || draft.full === null, labelAside: draft.full === null ? null : h('span', { className: 'tc-msg-time' }, draft.full.length + ' / 20000'), onChange: function (e) { set('full', e.target.value); } })
              : draft.full === null ? null
                : draft.full ? h(Frag, null, h(FullProfileFrame, { name: s.me, html: draft.full, media: media.on }), media.button ? h('div', null, media.button) : null)
                  : h('p', { className: 'muted', style: { margin: 0 } }, "You haven't written a full profile."))),
        h(VisibilitySection, { meet: draft.dir, disabled: locked, onChange: function (v) { set('dir', v); } }),
        h(VisitorsSection, { bio: base.about, draft: draft.about, onDraft: function (v) { set('about', v); }, disabled: locked })),
      h('aside', { className: 'side', 'aria-labelledby': 'pv-h' },
        h('h2', { id: 'pv-h', className: 'side-label' }, 'Preview'),
        h(ProfilePreviewCard, { name: s.me, meta: meta, about: draft.about, mini: preview }),
        draft.style && !s.prefs.styles.profileBackgrounds ? h('p', { className: 'muted', style: { margin: 0, fontSize: 12.5 } }, 'Profile backgrounds are off in Appearance, so the preview uses your theme.') : null)),
    dirty && base.loaded ? h(T.SaveBar, { onDiscard: function () { setDraft(editable(base)); }, onSave: saving ? function () {} : save, saveLabel: saving ? 'Saving' : 'Save profile' }, 'Unsaved changes to your Chatango profile') : null,
    crop ? h(AvatarCropDialog, { name: s.me, initial: crop.initial, onClose: function () { setCrop(null); }, onSaved: function () { setCrop(null); avatarsChanged(); app.ui.toast('Picture crop saved to Chatango.', { icon: 'check' }); } }) : null);
}

/**
 * Premium background of the user's own mini profile: colors plus image and tiling as in the BetterChatango background form.
 * @param {?Object|boolean} p.style Draft form, false without Premium, null while mod1.xml is not read.
 * @param {boolean} p.failed Reading mod1.xml failed.
 * @param {boolean} p.locked Fields disabled.
 * @param {?string} p.uploading Upload in progress (avatar or banner).
 * @param {string} p.imageErr Error of the image link.
 * @param {Function} p.onChange Receives the field name and its value.
 * @param {Function} p.onUpload Opens the picker for the image uploaded to vissle.
 */
function MiniBackgroundSection(p) {
  var st = p.style;
  return h(T.SettingsSection, { title: 'Mini profile background', description: 'Colors and image of your mini profile. Chatango shows them to everyone while you have Premium.', padded: true },
    st === null ? h('span', { className: 'tc-hint' }, p.failed ? 'Chatango did not return your mini profile. Reload the page to try again.' : 'Loading your mini profile from Chatango.')
      : st === false ? h('p', { className: 'muted', style: { margin: 0 } }, 'Mini profile backgrounds need Chatango Premium.')
        : h('fieldset', { disabled: p.locked, style: { border: 0, margin: 0, padding: 0, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 } },
          h('div', { className: 'grid3' }, [['bg', 'Background'], ['text', 'Text'], ['link', 'Links']].map(function (c) {
            return h(ColorField, { key: c[0], id: 'pf-mini-' + c[0], label: c[1], value: st[c[0]], onChange: function (v) { p.onChange(c[0], v); } });
          })),
          h(T.TextField, { id: 'pf-mini-img', label: 'Background image', placeholder: 'https://', value: st.image, error: p.imageErr || undefined, hint: p.imageErr ? undefined : 'Paste a link or upload an image. Shown as a banner on your mini profile and behind your full profile.', onChange: function (e) { p.onChange('image', e.target.value.trim()); } }),
          h('div', { className: 'btnrow' },
            h(T.Button, { size: 'sm', icon: 'upload', disabled: !!p.uploading, onClick: p.onUpload }, p.uploading === 'banner' ? 'Uploading' : 'Upload to vissle'),
            st.image ? h(T.Button, { size: 'sm', variant: 'ghost', icon: 'x', onClick: function () { p.onChange('image', ''); } }, 'Remove image') : null),
          h('div', { className: 'btnrow', style: { gap: 16 } },
            h(T.Checkbox, { label: 'Tile down', checked: st.tileDown, onChange: function (e) { p.onChange('tileDown', e.target.checked); } }),
            h(T.Checkbox, { label: 'Tile across', checked: st.tileAcross, onChange: function (e) { p.onChange('tileAcross', e.target.checked); } }))));
}

// The interface changes only if BetterChatango saved the value, otherwise a toast says so.
function useBetterChatangoSettings(read, write) {
  var app = useApp();
  var st = useState(read), value = st[0], setValue = st[1];
  function set(key, v) {
    if (!saveBetterChatangoSetting(app, write, key, v)) return;
    setValue(function (x) { var n = Object.assign({}, x); n[key] = v; return n; });
  }
  return [value, set];
}

var PMR_STATUS = {
  ok: 'vissle reports no restriction on your private messages.',
  restricted: 'vissle reports that your private messages appear to be restricted.',
  unknown: 'vissle could not check your private message status.'
};
function readPmrCheck() { var v = liveBridge.setting('pmrCheck'); return v === null ? null : { pmrCheck: v }; }

function PrivacyPageLive() {
  var app = useApp();
  var st = useBetterChatangoSettings(liveBridge.startupSettings, liveBridge.setSetting), startup = st[0], setStartupSetting = st[1];
  var pc = useBetterChatangoSettings(readPmrCheck, liveBridge.setSetting), pmr = pc[0], setPmrSetting = pc[1];
  var checking = !!(pmr && pmr.pmrCheck);
  // Also runs when the setting is turned off: pmrStatus then returns null, which removes the status and the PM banner.
  useEffect(function () { app.actions.checkPmr(); }, [checking]);
  return h(Page, { title: 'Privacy', lede: 'What Nightango keeps in this browser.' },
    h(T.SettingsSection, { title: 'Private messages' },
      pmr ? h(T.SettingRow, {
        title: 'Check my private message status', description: checking ? PMR_STATUS[app.state.pmrStatus] : null,
        control: h(T.Switch, { checked: checking, onChange: function (e) { setPmrSetting('pmrCheck', e.target.checked); } })
      }) : null,
      h(PmHistoryRows, null),
      h(T.SettingRow, {
        asLabel: false, title: 'Delete saved conversations', description: 'BetterChatango keeps a copy of your private messages in this browser. Chatango does not store them.',
        control: h(T.Button, { variant: 'danger', size: 'sm', onClick: function () { app.ui.confirm({ title: 'Delete saved conversations?', body: 'Every private message BetterChatango saved in this browser is removed. The people you talked to keep their copy.', confirmLabel: 'Delete all', danger: true, onConfirm: app.actions.deleteAllDms }); } }, 'Delete all')
      })),
    h(BrowserTabSection, null),
    startup ? h(StartupSection, { value: startup, onChange: setStartupSetting }) : null);
}

function AccountPage() {
  return h(Page, { title: 'Password and email', lede: 'Sign-in details for your Chatango account.' },
    h(T.Banner, { icon: 'lock', title: 'Managed on chatango.com', action: chatangoLink('Open chatango.com') },
      'Nightango never handles your password, so it cannot change it, change your email or delete your account. Do it on chatango.com.'));
}

function PremiumPage() {
  return h(Page, { title: 'Chatango Premium', lede: 'Custom backgrounds, media and badges for your account.' },
    h(T.Banner, { icon: 'info', title: 'Not available in Nightango', action: chatangoLink('Open chatango.com') },
      'Nightango does not take payments. Buy or gift Premium on chatango.com.'));
}
