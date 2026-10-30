/* ---------- Composer emoticon picker ---------- */
var EMOJI_SECTIONS = [{ title: 'Classic', premium: false }, { title: 'Premium', premium: true }];

/**
 * Opens a composer picker and inserts the chosen text into its field.
 * Shared by the Emoji and Media pickers.
 * @param {Object} inputRef Ref of the composer field.
 * @param {function(string)} setValue Writes the field text.
 * @returns {{open: boolean, anchorRef: Object, toggle: Function, pick: function(string), dismiss: Function, close: function(Event)}} Open state, button the picker is anchored to, opening from that button, insertion that closes the picker, closing without insertion, and closing by Escape or a click outside.
 */
function useComposerPicker(inputRef, setValue) {
  var st = useState(false), open = st[0], setOpen = st[1];
  var anchorRef = useRef(null), caret = useRef(null);
  // The controlled field gets its new value only at commit: the caret is placed after that.
  useLayoutEffect(function () {
    var at = caret.current;
    if (at == null) return;
    caret.current = null;
    inputRef.current.focus();
    inputRef.current.setSelectionRange(at, at);
  });
  return {
    open: open,
    anchorRef: anchorRef,
    toggle: function (e) { anchorRef.current = e.currentTarget; setOpen(function (o) { return !o; }); },
    pick: function (key) {
      var el = inputRef.current, before = el.value.slice(0, el.selectionStart);
      var text = (/\S$/.test(before) ? ' ' : '') + key + ' ';
      caret.current = before.length + text.length;
      setValue(before + text + el.value.slice(el.selectionEnd));
      setOpen(false);
    },
    dismiss: function () { setOpen(false); },
    close: function (e) {
      setOpen(false);
      if (e.key === 'Escape') inputRef.current.focus();
    }
  };
}

/**
 * Floating layer of a composer picker, anchored above its button.
 * @param {{anchorRef: Object, onClose: function(Event), className: string, label: string, layerRef: ?Object, children: *}} p Button, closing, class and accessible name of the layer, ref that receives the layer, and content.
 */
function PickerLayer(p) {
  var own = useRef(null), ref = p.layerRef || own;
  var place = useFloating(p.anchorRef, ref, true, p.onClose, { up: true, align: 'left' });
  return h(Portal, null, h('div', { ref: ref, className: cx('picker', p.className), role: 'dialog', 'aria-label': p.label, style: place }, p.children));
}

/**
 * Opens a composer's emoticon picker and inserts the chosen shortcut into its field.
 * @param {Object} inputRef Ref of the composer field.
 * @param {function(string)} setValue Writes the field text.
 * @returns {{onEmoji: Function, picker: ?Object}} Emoji button action and picker to render next to the composer.
 */
function useEmojiPicker(inputRef, setValue) {
  var c = useComposerPicker(inputRef, setValue);
  return {
    onEmoji: c.toggle,
    picker: c.open ? h(EmojiPicker, { anchorRef: c.anchorRef, premium: !LIVE || liveBridge.premium(), onPick: c.pick, onClose: c.close }) : null
  };
}

/**
 * Composer emoticon picker.
 * It shows BetterChatango's emoticons by their emoji, sorted into Classic and Premium as in its picker.
 * @param {{anchorRef: Object, premium: boolean, onPick: function(string), onClose: function(Event)}} p Emoji button, Premium section shown, choice of a shortcut, and closing.
 */
function EmojiPicker(p) {
  return h(PickerLayer, { anchorRef: p.anchorRef, onClose: p.onClose, className: 'emoji-picker', label: 'Emoji' },
    EMOJI_SECTIONS.filter(function (s) { return p.premium || !s.premium; }).map(function (s) {
      return h(Frag, { key: s.title },
        h('h3', { className: 'mlabel' }, s.title),
        h('div', { className: 'emoji-grid' }, EMOTICONS.filter(function (e) { return e.emoji && e.premium === s.premium; }).map(function (e) {
          return h(T.Button, { key: e.name, variant: 'ghost', className: 'emoji-btn', 'aria-label': e.name, title: e.keys[0], onClick: function () { p.onPick(e.keys[0]); } }, e.emoji);
        })));
    }));
}
