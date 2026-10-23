/* ---------- Style perso des messages ---------- */
var DEFAULT_MESSAGE_STYLE = { face: '0', size: 11, textColor: '#000000', nameColor: '#000000', bold: false, italic: false, underline: false, strike: false };
var MESSAGE_STYLE_SIZES = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

function MessageStyleButton() {
  var st = useState(false), open = st[0], setOpen = st[1];
  return h(Frag, null,
    h(T.IconButton, { icon: 'type', label: 'Message style', size: 30, iconSize: 16, onClick: function () { setOpen(true); } }),
    open ? h(MessageStyleDialog, { onClose: function () { setOpen(false); } }) : null);
}

/**
 * Fenêtre de réglage du style perso.
 * @param {{onClose: function}} p onClose ferme la fenêtre.
 */
function MessageStyleDialog(p) {
  var app = useApp(), s = app.state;
  var st = useState(function () { return s.ownStyle || (LIVE ? liveBridge.accountStyle() : DEFAULT_MESSAGE_STYLE); }), draft = st[0], setDraft = st[1];
  function set(k, v) { setDraft(function (d) { var n = Object.assign({}, d); n[k] = v; return n; }); }
  function save(style) { app.actions.setMessageStyle(style); p.onClose(); }
  var ms = memberStyles({ style: { nameColor: draft.nameColor, textColor: draft.textColor, font: FONT_FACES[+draft.face] } }, { names: true, fonts: true }, app.theme, false);
  var textStyle = Object.assign({}, ms.text, { fontSize: fontPercent(draft.size) + '%', fontWeight: draft.bold ? 700 : 400, fontStyle: draft.italic ? 'italic' : 'normal', textDecoration: [draft.underline && 'underline', draft.strike && 'line-through'].filter(Boolean).join(' ') || 'none' });
  return h(Dialog, {
    title: 'Message style', description: 'Applies to messages you send from Torch Skin in this browser. Your Chatango account style is not changed.', onClose: p.onClose,
    footer: [
      s.ownStyle ? h(T.Button, { key: 'r', variant: 'ghost', onClick: function () { save(null); } }, 'Use account style') : null,
      h('span', { key: 'g', className: 'grow' }),
      h(T.Button, { key: 'c', variant: 'ghost', onClick: p.onClose }, 'Cancel'),
      h(T.Button, { key: 's', variant: 'primary', onClick: function () { save(draft); } }, 'Save')
    ]
  },
    h('div', { className: 'dialog-body' },
      h('p', { style: { margin: 0, padding: '12px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)', overflowWrap: 'anywhere' } },
        h('b', { style: Object.assign({ fontWeight: 600 }, ms.name) }, s.me), ' ', h('span', { style: textStyle }, 'The quick brown fox jumps over the lazy dog.')),
      h('div', { className: 'grid2' },
        h('div', { className: 'tc-field' }, h('label', { className: 'tc-label', htmlFor: 'ms-face' }, 'Font'),
          h('select', { id: 'ms-face', className: 'tc-input', value: draft.face, onChange: function (e) { set('face', e.target.value); } },
            FONT_FACES.map(function (f, i) { return h('option', { key: f, value: String(i), style: { fontFamily: FONT_STACKS[f] } }, f); }))),
        h('div', { className: 'tc-field' }, h('label', { className: 'tc-label', htmlFor: 'ms-size' }, 'Size'),
          h('select', { id: 'ms-size', className: 'tc-input', value: draft.size, onChange: function (e) { set('size', +e.target.value); } },
            MESSAGE_STYLE_SIZES.map(function (n) { return h('option', { key: n, value: n }, n); })))),
      h('div', { className: 'grid2' },
        h(ColorField, { id: 'ms-text', label: 'Text color', value: draft.textColor, onChange: function (v) { set('textColor', v); } }),
        h(ColorField, { id: 'ms-name', label: 'Name color', value: draft.nameColor, onChange: function (v) { set('nameColor', v); } })),
      h('div', { className: 'tc-field' },
        h('div', { className: 'btnrow', style: { gap: 16 } },
          [['bold', 'Bold'], ['italic', 'Italic'], ['underline', 'Underline'], ['strike', 'Strikethrough']].map(function (x) {
            return h(T.Checkbox, { key: x[0], label: x[1], checked: draft[x[0]], 'aria-describedby': x[0] === 'strike' ? 'ms-strike-hint' : undefined, onChange: function (e) { set(x[0], e.target.checked); } });
          })),
        h('span', { id: 'ms-strike-hint', className: 'tc-hint' }, 'Strikethrough applies to private messages only.'))));
}
