function AccessibilityPage() {
  var app = useApp(), pr = usePref();
  var keys = [['Ctrl K', 'Search or jump to a group, person or setting'], ['Enter', 'Send the message'], ['Shift Enter', 'New line in the message'], ['Esc', 'Cancel a reply, close a menu or a dialog'], ['Tab', 'Move between controls. Focus is always visible.']];
  return h(Page, { title: 'Accessibility', lede: 'Nightango follows your system settings for motion and contrast. These options add to them.' },
    h(T.SettingsSection, { title: 'Display' },
      h(T.SettingRow, { title: 'Reduce motion', description: 'Turns off transitions.', control: pr.sw('a11y.reduceMotion') }),
      h(T.SettingRow, { title: 'Always underline links', description: 'Links in messages are underlined, not only colored.', control: pr.sw('a11y.underlineLinks') }),
      h(T.SettingRow, { asLabel: false, title: 'Text size', description: 'Set in Appearance.', control: h(T.Button, { size: 'sm', onClick: function () { app.nav({ view: 'settings', page: 'appearance' }); } }, 'Open Appearance') })),
    h(T.SettingsSection, { title: 'Keyboard shortcuts' },
      keys.map(function (k) { return h('div', { key: k[0], className: 'lrow' }, h('kbd', { className: 'kbd', style: { fontSize: 12, padding: '2px 8px' } }, k[0]), h('span', { className: 'grow', style: { color: 'var(--text-body)' } }, k[1])); })));
}

function WhatsNewPage() {
  return h(Page, { title: "What's new", lede: 'Changes in each version of Nightango, newest first.' },
    RELEASE_NOTES.map(function (r) {
      // Changelog date read in local time: new Date('YYYY-MM-DD') would read it as UTC and move back one day west of UTC.
      var d = r.date.split('-');
      return h(T.SettingsSection, { key: r.version, title: r.version, description: new Date(+d[0], d[1] - 1, +d[2]).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) },
        r.groups.map(function (g) {
          return h('div', { key: g.title, className: 'lrow' },
            h('div', { className: 'grow' }, h('h3', { className: 'lrow-title notes-title' }, g.title),
              h('ul', { className: 'notes-list' }, g.items.map(function (item, i) { return h('li', { key: i }, item); }))));
        }));
    }));
}

var JOURNAL_SHOWN = 200;
function journalStamp(ts) {
  var d = new Date(ts);
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
}
/**
 * Turns the diagnostic journal into text with one line per event under a header with the local time and its offset.
 * @param {Array<{t: number, k: string, m: string}>} list Events, oldest to newest.
 * @returns {string} Text to copy or download.
 */
function journalText(list) {
  var offset = -new Date().getTimezoneOffset(), abs = Math.abs(offset);
  var zone = 'UTC' + (offset < 0 ? '-' : '+') + pad(Math.floor(abs / 60)) + ':' + pad(abs % 60);
  return ['Nightango ' + APP_VERSION + ' diagnostics, exported ' + journalStamp(Date.now()) + ' ' + zone]
    .concat(list.map(function (e) { return journalStamp(e.t) + '  ' + e.k + '  ' + e.m; })).join('\n') + '\n';
}

function DiagnosticsPage() {
  var app = useApp();
  var r = useState(0), setRev = r[1];
  useEffect(function () { return JOURNAL.subscribe(function () { setRev(function (n) { return n + 1; }); }); }, []);
  var list = JOURNAL.entries(), shown = list.slice(-JOURNAL_SHOWN).reverse();
  function copy() { copyText(journalText(list), function (ok) { app.ui.toast(ok ? 'Log copied.' : 'The log could not be copied. Download it instead.'); }); }
  function download() { var d = new Date(); downloadFile('torch-skin-log-' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '-' + pad(d.getHours()) + pad(d.getMinutes()) + '.txt', journalText(list), 'text/plain'); }
  function clear() { app.ui.confirm({ title: 'Clear the log?', body: 'Events recorded so far are deleted from this browser.', confirmLabel: 'Clear log', danger: true, onConfirm: JOURNAL.clear }); }
  return h(Page, { title: 'Diagnostics', lede: 'Connection and page events recorded by Nightango, to find out why a group or your private messages disconnect.' },
    h(T.Banner, { icon: 'lock' }, 'The log stays in this browser and is never sent. It holds no password and no message text. To share it, copy it into an issue.'),
    h(T.SettingsSection, {
      title: 'Log', description: plural(list.length, 'event', 'events') + ', newest first. Nightango keeps the latest ' + JOURNAL.limit.toLocaleString('en-US') + (list.length > JOURNAL_SHOWN ? ' and shows ' + JOURNAL_SHOWN + '. Copy the log to see them all.' : '.'),
      headerAside: h('div', { className: 'journal-actions' },
        h(T.Button, { size: 'sm', variant: 'primary', icon: 'copy', disabled: !list.length, onClick: copy }, 'Copy log'),
        h(T.Button, { size: 'sm', disabled: !list.length, onClick: download }, 'Download'),
        h(T.Button, { size: 'sm', variant: 'ghost', icon: 'trash', disabled: !list.length, onClick: clear }, 'Clear log'))
    },
      shown.length
        ? h('ol', { className: 'journal' }, shown.map(function (e, i) {
          return h('li', { key: list.length - i },
            h('span', { className: 'journal-meta' }, journalStamp(e.t) + ' · ' + e.k),
            h('span', { className: 'journal-text' }, e.m));
        }))
        : h('p', { className: 'pal-empty' }, 'No events recorded yet.')));
}

function AboutPage() {
  var app = useApp(), pr = usePref();
  return h(Page, { title: 'About Nightango', lede: 'A skin for BetterChatango, the free, open-source web client for Chatango.' },
    h(T.SettingsSection, { title: 'Version', padded: true }, h('span', { className: 'mono' }, APP_VERSION)),
    h(T.SettingsSection, { title: 'Open source', description: 'Nightango is released under the MIT license. Report a problem or suggest a change on GitHub.', padded: true },
      h('a', { href: REPO_URL, target: '_blank', rel: 'noopener noreferrer' }, 'Nightango source code and issue tracker')),
    h(T.SettingsSection, { title: 'Built on BetterChatango', description: 'BetterChatango is made by Vissle and released under the MIT license.', padded: true },
      h('a', { href: 'https://github.com/Vissle-Drissle/Torch-Client', target: '_blank', rel: 'noopener noreferrer' }, 'BetterChatango source code and issue tracker')),
    h(T.SettingsSection, { title: 'Independent project', description: 'Nightango is not affiliated with, endorsed by or sponsored by BetterChatango or Chatango.' }),
    LIVE ? h(T.Banner, { icon: 'info' }, 'Test build. Nightango runs on top of BetterChatango on st.chatango.com. BetterChatango handles sign-in and the Chatango connection; Nightango never sees your password.') : null,
    LIVE ? null : h(T.SettingsSection, { title: 'Prototype', description: 'This build runs on sample data. Nothing is sent to Chatango.' },
      h(T.SettingRow, { title: 'Simulate activity', description: 'Members post, join, leave and send you messages every few seconds.', control: pr.sw('simulate') }),
      h(T.SettingRow, {
        asLabel: false, title: 'Reset sample data', description: 'Restores groups, messages and people. Your settings stay.',
        control: h(T.Button, { size: 'sm', onClick: function () { app.ui.confirm({ title: 'Reset sample data?', body: 'Messages, groups and people go back to their starting state.', confirmLabel: 'Reset', onConfirm: app.actions.resetDemo }); } }, 'Reset')
      })));
}
