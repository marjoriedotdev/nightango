/* ---------- Formatting bar of the profile fields ---------- */

// Sizes in pixels, as BetterChatango reads them (inject.js:656).
var TEXT_SIZES = [['Small', 11], ['Large', 18], ['Huge', 24]];
// Paragraph and not div: BetterChatango removes every div tag from a bio (inject.js:660-661).
var TEXT_ALIGNMENTS = [['Left', 'left'], ['Center', 'center'], ['Right', 'right']];
// No Ctrl+K for the link: it opens the command palette across the whole application.
var MARKUP_SHORTCUTS = { b: 'b', i: 'i', u: 'u' };
// Font names written in face="…": installed font names, in the order of FONT_FACES, since the Chatango names are not fonts.
var MARKUP_FACES = ['Arial', 'Comic Sans MS', 'Georgia', 'Lucida Handwriting', 'Impact', 'Palatino', 'Papyrus', 'Times New Roman', 'Courier New'];
// Like RichText, only http(s) links are shown. With no quote or angle bracket, the URL cannot escape its attribute.
var MARKUP_URL = /^https?:\/\/[^\s"<>]+$/i;

/**
 * Wraps the selection in a tag or removes the tag if it already wraps it.
 * @param {string} value Text of the field.
 * @param {number} start Start of the selection.
 * @param {number} end End of the selection.
 * @param {string} open Opening tag.
 * @param {string} close Closing tag.
 * @returns {{from: number, to: number, text: string, selStart: number, selEnd: number}} Replaced range, inserted text and the selection that follows.
 */
function wrapMarkup(value, start, end, open, close) {
  var sel = value.slice(start, end);
  if (sel && start >= open.length && value.slice(start - open.length, start) === open && value.slice(end, end + close.length) === close)
    return { from: start - open.length, to: end + close.length, text: sel, selStart: start - open.length, selEnd: end - open.length };
  return { from: start, to: end, text: open + sel + close, selStart: start + open.length, selEnd: end + open.length };
}

var FONT_ATTRS = ['color', 'face', 'size'];
// <font> tag that ends at the start of the selection and only holds attributes the bar can rewrite.
var FONT_OPEN_BEFORE = /<font((?:\s+(?:color|face|size)="[^"<>]*")+)\s*>$/i;
var FONT_CLOSE = '</font>';

/**
 * Sets a <font> attribute on the selection inside the tag that already wraps it when possible.
 * Same value: the attribute is removed, and the tag goes with its last attribute.
 * @param {string} value Text of the field.
 * @param {number} start Start of the selection.
 * @param {number} end End of the selection.
 * @param {string} name color, face or size.
 * @param {string} val Value of the attribute.
 * @returns {{from: number, to: number, text: string, selStart: number, selEnd: number}} Replaced range, inserted text and the selection that follows.
 */
function fontMarkup(value, start, end, name, val) {
  var sel = value.slice(start, end), m = FONT_OPEN_BEFORE.exec(value.slice(0, start));
  // A font tag inside the selection could be the one the following </font> closes.
  if (!m || value.slice(end, end + FONT_CLOSE.length).toLowerCase() !== FONT_CLOSE || /<\/?font\b/i.test(sel))
    return wrapMarkup(value, start, end, '<font ' + name + '="' + val + '">', FONT_CLOSE);
  var attrs = {}, re = /(color|face|size)="([^"<>]*)"/gi, a;
  // The browser keeps the first of a duplicated attribute.
  while ((a = re.exec(m[1]))) if (!(a[1].toLowerCase() in attrs)) attrs[a[1].toLowerCase()] = a[2];
  if (attrs[name] === val) delete attrs[name]; else attrs[name] = val;
  var kept = FONT_ATTRS.filter(function (k) { return k in attrs; });
  var open = kept.length ? '<font' + kept.map(function (k) { return ' ' + k + '="' + attrs[k] + '"'; }).join('') + '>' : '';
  var from = start - m[0].length;
  return { from: from, to: end + FONT_CLOSE.length, text: open + sel + (kept.length ? FONT_CLOSE : ''), selStart: from + open.length, selEnd: from + open.length + sel.length };
}

/**
 * Applies an edit to the field and keeps the browser undo.
 * @param {HTMLTextAreaElement} el Edited field.
 * @param {{from: number, to: number, text: string, selStart: number, selEnd: number}} edit Computed edit.
 * @param {function(string)} toast Message shown when the field has no room left.
 */
function applyMarkupEdit(el, edit, toast) {
  var over = el.maxLength > 0 ? el.value.length - (edit.to - edit.from) + edit.text.length - el.maxLength : 0;
  if (over > 0) { toast('Remove ' + plural(over, 'character', 'characters') + ' to make room for this format.'); return; }
  el.focus();
  el.setSelectionRange(edit.from, edit.to);
  // insertText keeps Ctrl+Z. execCommand is deprecated: as a fallback, setRangeText inserts without undo history.
  if (!document.execCommand('insertText', false, edit.text)) {
    el.setRangeText(edit.text, edit.from, edit.to);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }
  el.setSelectionRange(edit.selStart, edit.selEnd);
}

/**
 * Dialog that asks for the address of a link or an image or for the text color.
 * @param {string} p.kind link, image or color.
 * @param {string} p.color Color offered at first.
 * @param {function(string)} p.onSubmit Receives the address or the color.
 * @param {Function} p.onClose Close without inserting anything.
 */
function MarkupDialog(p) {
  var color = p.kind === 'color';
  var v = useState(color ? p.color : ''), value = v[0], setValue = v[1];
  var e = useState(''), err = e[0], setErr = e[1];
  // Enter is prevented: the insertion gives focus back to the textarea before the default action, which would add a line break there.
  function submit() {
    var url = value.trim();
    if (!color && !MARKUP_URL.test(url)) { setErr('Enter a link that starts with https:// and has no spaces, quotes or angle brackets.'); return; }
    p.onSubmit(color ? value : url);
  }
  var title = color ? 'Text color' : p.kind === 'link' ? 'Add a link' : 'Add an image';
  return h(Dialog, {
    title: title, onClose: p.onClose,
    footer: [h(T.Button, { key: 'c', variant: 'ghost', onClick: p.onClose }, 'Cancel'), h(T.Button, { key: 's', variant: 'primary', onClick: submit }, color ? 'Apply color' : title)]
  },
    h('div', { className: 'dialog-body' },
      color ? h(ColorField, { id: 'markup-color', label: 'Color', value: value, onChange: setValue })
        : h(T.TextField, { id: 'markup-url', label: p.kind === 'link' ? 'Link' : 'Image link', placeholder: 'https://', value: value, error: err, autoComplete: 'off', onChange: function (ev) { setValue(ev.target.value); setErr(''); }, onKeyDown: function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); submit(); } } })));
}

/**
 * Formats the HTML of a profile field through a toolbar and shortcuts.
 * @param {Object} inputRef Ref of the textarea, passed to the TextField through inputRef.
 * @param {string} fieldId Id of the textarea.
 * @param {boolean} [disabled] Bar disabled along with the field.
 * @returns {{toolbar: Object, onKeyDown: Function}} Bar to pass to the TextField and shortcut handler of the textarea.
 */
function useMarkupToolbar(inputRef, fieldId, disabled) {
  var app = useApp();
  var d = useState(null), dialog = d[0], setDialog = d[1];
  var c = useState('#e5484d'), lastColor = c[0], setLastColor = c[1];
  function edit(build) {
    var el = inputRef.current;
    applyMarkupEdit(el, build(el.value, el.selectionStart, el.selectionEnd), app.ui.toast);
  }
  function wrap(open, close) { edit(function (value, start, end) { return wrapMarkup(value, start, end, open, close); }); }
  function font(name, val) { edit(function (value, start, end) { return fontMarkup(value, start, end, name, val); }); }
  function insert(kind, value) {
    if (kind === 'color') { setLastColor(value); font('color', value); return; }
    if (kind === 'image') {
      edit(function (v, start, end) { var img = '<img src="' + value + '">'; return { from: end, to: end, text: img, selStart: end + img.length, selEnd: end + img.length }; });
      return;
    }
    var open = '<a href="' + value + '">';
    edit(function (v, start, end) {
      if (start !== end) return wrapMarkup(v, start, end, open, '</a>');
      return { from: start, to: start, text: open + value + '</a>', selStart: start + open.length, selEnd: start + open.length + value.length };
    });
  }
  function tag(name) { wrap('<' + name + '>', '</' + name + '>'); }
  function onKeyDown(e) {
    if (!(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey) return;
    var name = MARKUP_SHORTCUTS[e.key.toLowerCase()];
    if (!name) return;
    e.preventDefault();
    tag(name);
  }
  function button(icon, label, onClick, keys) {
    return h(T.IconButton, { icon: icon, label: label, size: 30, iconSize: 16, disabled: disabled, 'aria-keyshortcuts': keys, onClick: onClick });
  }
  function menu(icon, label, items) {
    return h(MenuButton, { label: label, items: items, align: 'left', renderTrigger: function (t) { return h(T.IconButton, Object.assign({ icon: icon, label: label, size: 30, iconSize: 16, disabled: disabled }, t)); } });
  }
  var sep = h('span', { className: 'tc-toolbar-sep', role: 'separator', 'aria-orientation': 'vertical' });
  var toolbar = h(T.Toolbar, { label: 'Formatting', controls: fieldId },
    button('bold', 'Bold', function () { tag('b'); }, 'Control+B Meta+B'),
    button('italic', 'Italic', function () { tag('i'); }, 'Control+I Meta+I'),
    button('underline', 'Underline', function () { tag('u'); }, 'Control+U Meta+U'),
    sep,
    button('palette', 'Text color', function () { setDialog('color'); }),
    menu('type', 'Font', MARKUP_FACES.map(function (f, i) { return { label: h('span', { style: { fontFamily: FONT_STACKS[FONT_FACES[i]] } }, f), onSelect: function () { font('face', f); } }; })),
    menu('text-size', 'Text size', TEXT_SIZES.map(function (s) { return { label: s[0], onSelect: function () { font('size', String(s[1])); } }; })),
    menu('align-left', 'Alignment', TEXT_ALIGNMENTS.map(function (a) { return { label: a[0], icon: 'align-' + a[1], onSelect: function () { wrap('<p align="' + a[1] + '">', '</p>'); } }; })),
    sep,
    button('link', 'Add a link', function () { setDialog('link'); }),
    button('image', 'Add an image', function () { setDialog('image'); }),
    dialog ? h(MarkupDialog, {
      kind: dialog, color: lastColor, onClose: function () { setDialog(null); },
      onSubmit: function (value) {
        var kind = dialog;
        // Synchronous close: the dialog gives focus back to its trigger when it unmounts, then the insertion takes it again.
        // Inserting from an effect would break undo, React restores the controlled value of the field there.
        ReactDOM.flushSync(function () { setDialog(null); });
        insert(kind, value);
      }
    }) : null);
  return { toolbar: toolbar, onKeyDown: onKeyDown };
}
