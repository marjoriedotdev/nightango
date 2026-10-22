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
    h(T.SettingsSection, { title: 'Chatango styles', description: 'Members can style their name, messages and mini profile on Chatango. Torch corrects colors that would be hard to read.' },
      h(T.SettingRow, { title: 'Name colors', description: 'The color each member picked for their username.', control: pr.sw('styles.names') }),
      h(T.SettingRow, { title: 'Fonts and text colors', description: 'Custom typefaces, text sizes and text colors in messages.', control: pr.sw('styles.fonts') }),
      h(T.SettingRow, { title: 'Message backgrounds', description: 'Background colors set by Premium members.', control: pr.sw('styles.backgrounds') }),
      h(T.SettingRow, { title: 'Profile backgrounds', description: 'Colors and images Premium members set on their mini profile.', control: pr.sw('styles.profileBackgrounds') })),
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
          h(T.Button, { size: 'sm', onClick: function () { pr.set('accent', t.accent); } }, 'Apply'),
          h(T.IconButton, { icon: 'trash', label: 'Delete ' + t.name, onClick: function () { app.update(function (d) { d.prefs.customThemes = d.prefs.customThemes.filter(function (x) { return x.id !== t.id; }); }); } }));
      }) : h('p', { className: 'muted', style: { margin: 0, padding: '4px 20px 18px', fontSize: 13 } }, 'No imported themes.')));
}
