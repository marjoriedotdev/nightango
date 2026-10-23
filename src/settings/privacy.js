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
    h(StartupSection, { value: prefs.privacy, onChange: function (k, v) { pr.set('privacy.' + k, v); } }),
    h(T.SettingsSection, { title: 'Discoverability' },
      h(T.SettingRow, { title: 'Show my profile in Meet people', description: 'Lets other Chatango users find you by age and location.', control: pr.sw('privacy.meet') }),
      h(T.SettingRow, { title: 'Show my username in the tab title', description: 'Useful when you run several accounts in different tabs.', control: pr.sw('privacy.usernameInTitle') })),
    h(T.SettingsSection, { title: 'Your data' },
      h(T.SettingRow, { asLabel: false, title: 'Request a copy of your data', description: 'Chatango holds your account data. Torch keeps only your encrypted sign-in and these settings.', control: h(T.Button, { size: 'sm', onClick: function () { app.ui.toast('Data requests are not part of this prototype.'); } }, 'Request') })));
}

var STARTUP_ROWS = [['joinOwned', 'Join groups I own'], ['joinRecent', 'Join recent groups'], ['joinFavorites', 'Join favorite groups']];

/**
 * Réglages de démarrage de Torch.
 * @param {{value: Object, onChange: function}} p value porte les trois interrupteurs, onChange reçoit la clé et la nouvelle valeur.
 */
function StartupSection(p) {
  return h(T.SettingsSection, { title: 'On startup', description: 'Torch applies these the next time it loads.' },
    STARTUP_ROWS.map(function (r) {
      return h(T.SettingRow, { key: r[0], title: r[1], control: h(T.Switch, { checked: !!p.value[r[0]], onChange: function (e) { p.onChange(r[0], e.target.checked); } }) });
    }));
}

function SafetyPage() {
  var app = useApp(), s = app.state, pr = usePref(), prefs = s.prefs;
  var blocked = Object.keys(s.users).filter(function (n) { return s.users[n].blocked; });
  var ignored = Object.keys(s.users).filter(function (n) { return s.users[n].ignored; });
  function people(list, key, action, empty) {
    return list.length ? list.map(function (n) {
      return h('div', { key: n, className: 'lrow' }, h('span', { className: 'grow' }, h(Person, { name: n, size: 28 })),
        h(T.Button, { size: 'sm', onClick: function () { app.actions.toggleUser(n, key); } }, action));
    }) : h('p', { className: 'pal-empty' }, empty);
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
      h(T.SettingRow, { title: 'Show messages from guests', control: pr.sw('safety.guestMessages') }),
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
