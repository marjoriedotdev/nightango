function AppearancePage() {
  var app = useApp(), pr = usePref(), prefs = app.state.prefs;
  var md = useState(function () { return LIVE ? liveBridge.setting('markdown') : null; }), markdown = md[0], setMarkdown = md[1];
  var themes = [
    ['dark', 'Dark', ['#0d1427', '#0a1020', '#34446a', '#283657', '#142039']],
    ['light', 'Light', ['#fdfcfa', '#f2f0f7', '#c6c2d1', '#d6d2df', '#ffffff']],
    ['system', 'Match system', null]
  ];
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
      app.ui.toast('Imported ' + name + '.', { tone: 'success' });
    }).catch(function () { app.ui.toast("This file isn't a BetterChatango theme. Export one from the old theme editor and try again.", { tone: 'error' }); });
  }
  var custom = prefs.customThemes || [];
  return h(Page, { title: 'Appearance', lede: 'Saved on this device.' },
    h(T.SettingsSection, { title: 'Theme', padded: true },
      h('div', { className: 'grid3', role: 'radiogroup', 'aria-label': 'Theme' }, themes.map(function (t) {
        return h('button', { key: t[0], type: 'button', role: 'radio', className: 'pick', 'aria-checked': String(prefs.theme === t[0]), onClick: function () { pr.set('theme', t[0]); } },
          thumb(t[2]), h('span', { className: 'pick-title' }, t[1]));
      }))),
    h(T.SettingsSection, { title: 'Accent color', description: 'Buttons, mentions and unread markers. Text on it stays readable.', padded: true },
      h(AccentSwatches, { label: 'Accent color', value: prefs.accent, fallback: prefs.accent, onChange: function (v) { pr.set('accent', v); } })),
    h(T.SettingsSection, { title: 'Sky', description: 'Drawn on your device. Nothing is downloaded.' },
      h(T.SettingRow, {
        title: 'Moon', description: "Next to the Nightango name. Day dividers show each night's moon.",
        control: h('select', { className: 'tc-input', style: { width: 'auto' }, value: String(prefs.sky.moon), onChange: function (e) { pr.set('sky.moon', e.target.value === 'auto' ? 'auto' : +e.target.value); } },
          h('option', { value: 'auto' }, "Auto (tonight's moon)"),
          T.moonNames.map(function (n, i) { return h('option', { key: i, value: String(i) }, n); }))
      }),
      h(T.SettingRow, { title: 'Seasonal decorations', description: "Halloween, winter, Christmas and Valentine's Day, by this device's date. Only you see them.", control: pr.sw('sky.season') }),
      h(T.SettingRow, { title: 'Calm sky', description: 'Stops clouds and seasonal decorations from moving.', control: pr.sw('sky.calm') }),
      h(T.SettingRow, { title: 'Southern hemisphere', description: 'Draws the moon as seen south of the equator and moves winter to June.', control: pr.sw('sky.south') })),
    h(T.SettingsSection, { title: 'Messages' },
      h(T.SettingRow, { asLabel: false, title: 'Density', description: 'Compact hides avatars and puts the time before the name.', control: h(T.SegmentedControl, { label: 'Density', value: prefs.density, onChange: function (v) { pr.set('density', v); }, options: [{ value: 'comfortable', label: 'Comfortable' }, { value: 'compact', label: 'Compact' }] }) }),
      h(T.SettingRow, {
        asLabel: false, title: 'Text size', description: 'Applies to message text.', control: h('div', { className: 'range-row' },
          h('span', { 'aria-hidden': 'true', style: { fontSize: 12, color: 'var(--text-3)' } }, 'A'),
          h('input', { type: 'range', min: 12, max: 18, step: 1, value: prefs.textSize, 'aria-label': 'Text size', onChange: function (e) { pr.set('textSize', +e.target.value); } }),
          h('span', { 'aria-hidden': 'true', style: { fontSize: 18, color: 'var(--text-3)' } }, 'A'),
          h('span', { className: 'tnum', style: { width: 38, textAlign: 'right', fontSize: 'var(--font-size-caption)', color: 'var(--text-2)' } }, prefs.textSize + 'px'))
      }),
      h(T.SettingRow, { title: '24-hour time', description: 'Shows 14:05 instead of 2:05 PM.', control: pr.sw('h24') }),
      h(T.SettingRow, { title: 'Show group announcements', description: 'Timed staff announcements and the banner at the top of a group.', control: pr.sw('announcements') }),
      markdown === null ? null : h(T.SettingRow, {
        title: 'Format Markdown when sending', description: '*text* sends as italic, **text** as bold and __text__ as underlined, in groups and private messages.',
        control: h(T.Switch, { checked: markdown, onChange: function (e) { var v = e.target.checked; if (saveBetterChatangoSetting(app, liveBridge.setSetting, 'markdown', v)) setMarkdown(v); } })
      })),
    h(T.SettingsSection, { title: 'Chatango styles', description: 'Styles members set on Chatango. Hard-to-read colors are corrected.' },
      h(T.SettingRow, { title: 'Name colors', control: pr.sw('styles.names') }),
      h(T.SettingRow, { title: 'Fonts and text colors', description: 'Custom typefaces, text sizes and text colors in messages.', control: pr.sw('styles.fonts') }),
      h(T.SettingRow, { title: 'Same text size for everyone', description: 'Messages use your text size. Mini profiles keep theirs.', control: pr.sw('styles.sameSize') }),
      h(T.SettingRow, { title: 'Message backgrounds', description: 'Background colors and images set by Premium members.', control: pr.sw('styles.backgrounds') }),
      h(T.SettingRow, { title: 'Profile backgrounds', description: 'Colors and images Premium members set on their mini profile.', control: pr.sw('styles.profileBackgrounds') })),
    h(T.SettingsSection, {
      title: 'Imported themes', description: 'JSON files from the old BetterChatango theme editor. Only the accent color is used.',
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
