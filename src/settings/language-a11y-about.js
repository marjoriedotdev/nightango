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
            h('span', { className: 'muted', style: { fontSize: 12 } }, l[0]));
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
        h('span', { className: 'muted', style: { fontSize: 12 } }, i[0]));
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
