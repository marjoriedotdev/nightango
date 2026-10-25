function AppearancePage() {
  var app = useApp(), pr = usePref(), prefs = app.state.prefs;
  var md = useState(function () { return LIVE ? liveBridge.setting('markdown') : null; }), markdown = md[0], setMarkdown = md[1];
  var themes = [
    ['dark', 'Dark', ['#0d1427', '#0a1020', '#34446a', '#283657', '#142039']],
    ['light', 'Light', ['#fdfcfa', '#f2f0f7', '#c6c2d1', '#d6d2df', '#ffffff']],
    ['system', 'Match system', null]
  ];
  var accents = [['Ember', '#f27a3f'], ['Blue', '#5b8def'], ['Green', '#3fb27f'], ['Violet', '#c084fc'], ['Pink', '#f472b6'], ['Slate', '#94a3b8']];
  function thumb(c) {
    if (!c) return h('span', { className: 'thumb', 'aria-hidden': 'true', style: { border: '1px solid var(--border-strong)' } },
      h('span', { style: { flex: 1, background: '#f2f0f7' } }), h('span', { style: { flex: 1, background: '#0d1427' } }));
    return h('span', { className: 'thumb', 'aria-hidden': 'true', style: { background: c[0], border: '1px solid ' + c[3] } },
      h('span', { style: { width: '28%', background: c[1], borderRight: '1px solid ' + c[3], padding: '8px 6px', display: 'flex', flexDirection: 'column', gap: 5 } },
        h('span', { style: { height: 5, width: '70%', borderRadius: 3, background: c[2] } }), h('span', { style: { height: 5, width: '90%', borderRadius: 3, background: c[3] } })),
      h('span', { style: { flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 6 } },
        h('span', { style: { height: 5, width: '80%', borderRadius: 3, background: c[2] } }), h('span', { style: { height: 5, width: '60%', borderRadius: 3, background: c[3] } }),
        h('span', { style: { marginTop: 'auto', height: 12, borderRadius: 4, background: c[4], border: '1px solid ' + c[3] } })));
  }
  function importFile(file) {
    readJsonFile(file).then(function (src) {
      var accent = src.active || src.highlight || src.accent;
      if (!hexToRgb(accent)) throw new Error('no accent');
      var name = (file.name || 'Theme').replace(/\.json$/i, '');
      var colors = [src.backdrop, src.primary, src.secondary, accent].filter(hexToRgb);
      app.update(function (d) { d.prefs.customThemes = (d.prefs.customThemes || []).concat([{ id: uid(), name: name, accent: accent, colors: colors, at: Date.now() }]); });
      app.ui.toast('Imported ' + name + '.', { icon: 'check' });
    }).catch(function () { app.ui.toast('This file is not a Torch theme. Export one from the old theme editor and try again.'); });
  }
  var custom = prefs.customThemes || [];
  var palette = accents.some(function (a) { return a[1] === prefs.accent; });
  return h(Page, { title: 'Appearance', lede: 'Changes apply right away and are saved on this device.' },
    h(T.SettingsSection, { title: 'Theme', padded: true },
      h('div', { className: 'grid3', role: 'radiogroup', 'aria-label': 'Theme' }, themes.map(function (t) {
        return h('button', { key: t[0], type: 'button', role: 'radio', className: 'pick', 'aria-checked': String(prefs.theme === t[0]), onClick: function () { pr.set('theme', t[0]); } },
          thumb(t[2]), h('span', { className: 'pick-title' }, t[1]));
      }))),
    h(T.SettingsSection, { title: 'Accent color', description: 'Used for buttons, mentions and unread markers. Nightango adjusts text on the accent so it stays readable.', padded: true },
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
    h(T.SettingsSection, { title: 'Sky', description: "Tonight's moon is computed on this device. Nothing is requested." },
      h(T.SettingRow, {
        title: 'Moon', description: 'The moon next to Nightango. Day dividers keep the moon of each night.',
        control: h('select', { className: 'tc-input', style: { width: 'auto' }, value: String(prefs.sky.moon), onChange: function (e) { pr.set('sky.moon', e.target.value === 'auto' ? 'auto' : +e.target.value); } },
          h('option', { value: 'auto' }, "Auto (tonight's moon)"),
          T.moonNames.map(function (n, i) { return h('option', { key: i, value: String(i) }, n); }))
      }),
      h(T.SettingRow, { title: 'Calm sky', description: 'Stops the clouds drifting across the sky.', control: pr.sw('sky.calm') }),
      h(T.SettingRow, { title: 'Southern hemisphere', description: 'Draws the moon as it looks south of the equator. The phase is the same everywhere.', control: pr.sw('sky.south') })),
    h(T.SettingsSection, { title: 'Messages' },
      h(T.SettingRow, { asLabel: false, title: 'Density', description: 'Compact hides avatars and puts the time before the name.', control: h(T.SegmentedControl, { label: 'Density', value: prefs.density, onChange: function (v) { pr.set('density', v); }, options: [{ value: 'comfortable', label: 'Comfortable' }, { value: 'compact', label: 'Compact' }] }) }),
      h(T.SettingRow, {
        asLabel: false, title: 'Text size', description: 'Applies to message text.', control: h('div', { className: 'range-row' },
          h('span', { 'aria-hidden': 'true', style: { fontSize: 12, color: 'var(--text-3)' } }, 'A'),
          h('input', { type: 'range', min: 12, max: 18, step: 1, value: prefs.textSize, 'aria-label': 'Text size', onChange: function (e) { pr.set('textSize', +e.target.value); } }),
          h('span', { 'aria-hidden': 'true', style: { fontSize: 18, color: 'var(--text-3)' } }, 'A'),
          h('span', { className: 'tnum', style: { width: 38, textAlign: 'right', fontSize: 12.5, color: 'var(--text-2)' } }, prefs.textSize + 'px'))
      }),
      h(T.SettingRow, { title: '24-hour time', description: 'Shows 14:05 instead of 2:05 PM.', control: pr.sw('h24') }),
      h(T.SettingRow, { title: 'Show group announcements', description: 'Announcements staff post on a timer, and the banner at the top of a group.', control: pr.sw('announcements') }),
      markdown === null ? null : h(T.SettingRow, {
        title: 'Format Markdown when sending', description: '*text* sends as italic, **text** as bold and __text__ as underlined, in groups and private messages.',
        control: h(T.Switch, { checked: markdown, onChange: function (e) { var v = e.target.checked; if (saveTorchSetting(app, liveBridge.setSetting, 'markdown', v)) setMarkdown(v); } })
      })),
    h(T.SettingsSection, { title: 'Chatango styles', description: 'Members can style their name, messages and mini profile on Chatango. Nightango corrects colors that would be hard to read.' },
      h(T.SettingRow, { title: 'Name colors', description: 'The color each member picked for their username.', control: pr.sw('styles.names') }),
      h(T.SettingRow, { title: 'Fonts and text colors', description: 'Custom typefaces, text sizes and text colors in messages.', control: pr.sw('styles.fonts') }),
      h(T.SettingRow, { title: 'Message backgrounds', description: 'Background colors and images set by Premium members.', control: pr.sw('styles.backgrounds') }),
      h(T.SettingRow, { title: 'Profile backgrounds', description: 'Colors and images Premium members set on their mini profile.', control: pr.sw('styles.profileBackgrounds') })),
    h(T.SettingsSection, {
      title: 'Imported themes', description: 'Theme files (.json) exported from the old Torch theme editor. Nightango uses their accent color.',
      headerAside: h(JsonFileButton, { icon: 'upload', onFile: importFile }, 'Import file')
    },
      custom.length ? custom.map(function (t) {
        return h('div', { key: t.id, className: 'lrow' },
          h('span', { 'aria-hidden': 'true', style: { display: 'inline-flex', borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border-strong)' } }, t.colors.map(function (c, i) { return h('span', { key: i, style: { width: 18, height: 28, background: c } }); })),
          h('span', { className: 'grow' }, h('span', { className: 'lrow-title' }, t.name), h('span', { className: 'lrow-sub' }, 'Imported ' + new Date(t.at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }))),
          h(T.Button, { size: 'sm', onClick: function () { pr.set('accent', t.accent); } }, 'Apply'),
          h(T.IconButton, { icon: 'trash', label: 'Delete ' + t.name, onClick: function () { app.update(function (d) { d.prefs.customThemes = d.prefs.customThemes.filter(function (x) { return x.id !== t.id; }); }); } }));
      }) : h('p', { className: 'pal-empty' }, 'No imported themes.')));
}
