function PrivacyPage() {
  if (LIVE) return h(PrivacyPageLive, null);
  var app = useApp(), pr = usePref(), prefs = app.state.prefs;
  return h(Page, { title: 'Privacy', lede: 'What Nightango keeps in this browser.' },
    h(T.SettingsSection, { title: 'Private messages' },
      h(PmHistoryRows, null),
      h(T.SettingRow, {
        asLabel: false, title: 'Delete saved conversations', description: 'Removes the sample private messages from this prototype.',
        control: h(T.Button, { variant: 'danger', size: 'sm', onClick: function () { app.ui.confirm({ title: 'Delete saved conversations?', body: 'Every sample private message is removed until you reset the sample data.', confirmLabel: 'Delete all', danger: true, onConfirm: app.actions.deleteAllDms }); } }, 'Delete all')
      })),
    h(StartupSection, { value: prefs.privacy, onChange: function (k, v) { pr.set('privacy.' + k, v); } }),
    h(BrowserTabSection, null));
}

function BrowserTabSection() {
  var pr = usePref();
  return h(T.SettingsSection, { title: 'Browser tab' },
    h(T.SettingRow, { title: 'Show my username in the tab title', description: 'Useful when you run several accounts in different tabs.', control: pr.sw('privacy.usernameInTitle') }));
}

/**
 * Export and import of the private history in the BetterChatango file format (exportMessages and importMessages).
 */
function PmHistoryRows() {
  var app = useApp(), toast = app.ui.toast;
  function exportFile() {
    app.actions.exportDms().then(function (records) {
      downloadJson(app.state.me + '_history.json', records);
    }, function (e) { toast(e.message); });
  }
  function importFile(file) {
    readJsonArray(file).then(function (records) {
      if (!records) { toast('This file is not a BetterChatango message history.'); return; }
      app.actions.importDms(records).then(function (r) {
        if (r.foreign) toast("This file holds another account's messages. Nothing was imported.");
        else toast('Imported ' + plural(r.added, 'message', 'messages') + '. ' + r.saved + ' already saved, ' + r.skipped + ' skipped.', { icon: r.added ? 'check' : 'info' });
      }, function (e) { toast(e.message); });
    });
  }
  return h(Frag, null,
    h(T.SettingRow, { asLabel: false, title: 'Export messages', description: 'The file holds your messages in plain text. Keep it private.', control: h(T.Button, { size: 'sm', onClick: exportFile }, 'Export') }),
    h(T.SettingRow, { asLabel: false, title: 'Import messages', description: 'Adds the messages of a BetterChatango history file. Messages already saved stay as they are.', control: h(JsonFileButton, { size: 'sm', onFile: importFile }, 'Import') }));
}

var STARTUP_ROWS = [['joinOwned', 'Join groups I own'], ['joinRecent', 'Join recent groups'], ['joinFavorites', 'Join favorite groups']];

/**
 * BetterChatango startup settings.
 * @param {{value: Object, onChange: function}} p value holds the three switches, onChange receives the key and the new value.
 */
function StartupSection(p) {
  return h(T.SettingsSection, { title: 'On startup', description: 'BetterChatango applies these the next time it loads.' },
    STARTUP_ROWS.map(function (r) {
      return h(T.SettingRow, { key: r[0], title: r[1], control: h(T.Switch, { checked: !!p.value[r[0]], onChange: function (e) { p.onChange(r[0], e.target.checked); } }) });
    }));
}

/**
 * Reads a host typed alone (no scheme or path or user info) as new URL would return it.
 * @param {string} text User input.
 * @returns {?string} Lowercase host, null if the input is not a host alone.
 */
function typedHost(text) {
  var v = text.trim().toLowerCase();
  return /^[a-z0-9.-]+(?::\d+)?$/.test(v) && httpsHost('https://' + v) === v ? v : null;
}

/**
 * Rows of a Safety list with a button each or the empty list text.
 * @param {Array<string>} list Listed values.
 * @param {Function} content Row content for a value.
 * @param {string} action Button text.
 * @param {Function} run Button action on a value.
 * @param {string} empty Text of the empty list.
 */
function safetyRows(list, content, action, run, empty) {
  return list.length ? list.map(function (x) {
    return h('div', { key: x, className: 'lrow' }, h('span', { className: 'grow' }, content(x)),
      h(T.Button, { size: 'sm', 'aria-label': action + ' ' + x, onClick: function () { run(x); } }, action));
  }) : h('p', { className: 'pal-empty' }, empty);
}

/**
 * Trusted hosts: adding a typed host and a list with removal.
 * @param {{hosts: Array<string>}} p Lowercase trusted hosts.
 */
function TrustedSites(p) {
  var app = useApp();
  var a = useState(''), text = a[0], setText = a[1];
  var b = useState(''), err = b[0], setErr = b[1];
  function add(e) {
    e.preventDefault();
    var host = typedHost(text);
    if (!host) { setErr('Enter a site like i.imgur.com, without https:// or a path.'); return; }
    if (p.hosts.indexOf(host) < 0 && !app.actions.setTrustedHost(host, true)) return;
    setText(''); setErr('');
  }
  return h(Frag, null,
    h(T.SettingRow, {
      asLabel: false, title: 'Trusted sites', description: 'Links open without a warning. Images, videos and audio load without a click.',
      control: h('form', { className: 'trust-add', onSubmit: add, noValidate: true },
        h(T.TextField, {
          id: 'trust-site', label: 'Add a site', placeholder: 'i.imgur.com', value: text, error: err || undefined, autoComplete: 'off', spellCheck: false,
          onChange: function (e) { setText(e.target.value); setErr(''); },
          action: h(T.Button, { type: 'submit' }, 'Add')
        }))
    }),
    safetyRows(p.hosts, function (host) { return h('span', { className: 'trust-host' }, host); }, 'Remove', function (host) { app.actions.setTrustedHost(host, false); }, 'No trusted sites.'));
}

function SafetyPage() {
  var app = useApp(), s = app.state, pr = usePref(), prefs = s.prefs;
  var blocked = Object.keys(s.users).filter(function (n) { return s.users[n].blocked; });
  var ignored = Object.keys(s.users).filter(function (n) { return s.users[n].ignored; });
  function people(list, key, action, empty) {
    return safetyRows(list, function (n) { return h(Person, { name: n, size: 28 }); }, action, function (n) { app.actions.toggleUser(n, key); }, empty);
  }
  return h(Page, { title: 'Safety', lede: 'Decide what reaches your screen.' },
    h(T.SettingsSection, { title: 'Media and links' },
      h(T.SettingRow, { title: 'Embed images', description: 'Shows images in messages. When off, you see a link.', control: pr.sw('safety.embedImages') }),
      h(T.SettingRow, { title: 'Embed videos', description: 'Shows videos and audio in messages. Nothing plays until you click. When off, you see a link.', control: pr.sw('safety.embedVideos') }),
      h(T.SettingRow, { title: 'Embed X posts', description: 'Shows X posts in messages.', control: pr.sw('safety.embedX') }),
      h(T.SettingRow, { title: 'Block external media until I click', description: 'Images from other sites load only when you ask, so they cannot track you.', control: pr.sw('safety.proxyMedia') }),
      h(T.SettingRow, { title: 'Warn before opening links', description: 'Shows the full address before you leave Nightango.', control: pr.sw('safety.warnLinks') }),
      prefs.safety.trustedHosts ? h(TrustedSites, { hosts: prefs.safety.trustedHosts }) : null),
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
