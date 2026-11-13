/* ---------- Composer emoticon and media picker ---------- */
var EMOJI_SECTIONS = [{ title: 'Classic', premium: false }, { title: 'Premium', premium: true }];
var PICKER_TABS = [{ value: 'emoji', label: 'Emoji' }, { value: 'gif', label: 'GIF' }, { value: 'media', label: 'Media' }];
var RECENT_EMOJI_MAX = 16;

/**
 * Returns the names of the emoticons last picked by an account.
 * @param {string} me Signed-in account.
 */
function recentEmoji(me) {
  var list = (storageGet(skinKey(me)) || {}).recentEmoji;
  return kindOf(list) === 'array' ? list : [];
}
/**
 * Moves an emoticon to the front of the ones last picked by an account.
 * @param {string} me Signed-in account.
 * @param {string} name Emoticon name.
 */
function keepRecentEmoji(me, name) {
  var list = recentEmoji(me).filter(function (n) { return n !== name; });
  storageMerge(skinKey(me), { recentEmoji: [name].concat(list).slice(0, RECENT_EMOJI_MAX) });
}

/**
 * Opens a composer's picker and inserts the chosen shortcut or address into its field.
 * The picker has an Emoji tab, a GIF tab and a Media tab.
 * @param {Object} inputRef Ref of the composer field.
 * @param {function(string)} setValue Writes the field text.
 * @returns {{onEmoji: Function, picker: ?Object}} Emoji button action and picker to render next to the composer.
 */
function useEmojiPicker(inputRef, setValue) {
  var st = useState(false), open = st[0], setOpen = st[1];
  var tb = useState('emoji'), tab = tb[0], setTab = tb[1];
  var anchorRef = useRef(null), caret = useRef(null);
  // The controlled field gets its new value only at commit: the caret is placed after that.
  useLayoutEffect(function () {
    var at = caret.current;
    if (at == null) return;
    caret.current = null;
    inputRef.current.focus();
    inputRef.current.setSelectionRange(at, at);
  });
  function pick(key) {
    var el = inputRef.current, before = el.value.slice(0, el.selectionStart);
    var text = (/\S$/.test(before) ? ' ' : '') + key + ' ';
    caret.current = before.length + text.length;
    setValue(before + text + el.value.slice(el.selectionEnd));
    setOpen(false);
  }
  function close(e) {
    setOpen(false);
    if (e.key === 'Escape') inputRef.current.focus();
  }
  return {
    onEmoji: function (e) { anchorRef.current = e.currentTarget; setOpen(function (o) { return !o; }); },
    picker: open ? h(EmojiPicker, { anchorRef: anchorRef, premium: !LIVE || liveBridge.premium(), tab: tab, onTab: setTab, onPick: pick, onClose: close }) : null
  };
}

/**
 * Composer picker.
 * It shows BetterChatango's emoticons by their emoji, the account's recent ones first then Classic and Premium as in its picker, GIFs, and BetterChatango's media library.
 * @param {{anchorRef: Object, premium: boolean, tab: string, onTab: function(string), onPick: function(string), onClose: function(Event)}} p Emoji button, Premium section shown, open tab and its change, choice of a shortcut or an address, and closing.
 */
function EmojiPicker(p) {
  var ref = useRef(null);
  var place = useFloating(p.anchorRef, ref, true, p.onClose, { up: true, align: 'left' });
  var me = useStatePart(function (s) { return s.me; });
  var recent = useState(function () { return recentEmoji(me); })[0];
  function allowed(e) { return e && e.emoji && (p.premium || !e.premium); }
  var sections = EMOJI_SECTIONS.filter(function (s) { return p.premium || !s.premium; }).map(function (s) {
    return { title: s.title, list: EMOTICONS.filter(function (e) { return e.emoji && e.premium === s.premium; }) };
  });
  var recentList = recent.map(function (n) { return EMOTICON_BY_NAME[n]; }).filter(allowed);
  if (recentList.length) sections.unshift({ title: 'Recent', list: recentList });
  return h(Portal, null, h('div', { ref: ref, className: 'emoji-picker', role: 'dialog', 'aria-label': 'Emoji and media', style: place },
    h('div', { className: 'picker-tabs' }, h(T.SegmentedControl, { label: 'Emoji, GIF or media', block: true, value: p.tab, onChange: p.onTab, options: PICKER_TABS })),
    p.tab === 'media' ? h(MediaPanel, { scrollRef: ref, onPick: p.onPick }) : p.tab === 'gif' ? h(GifPanel, { onPick: p.onPick }) : sections.map(function (s) {
      return h(Frag, { key: s.title },
        h('h3', { className: 'mlabel' }, s.title),
        h('div', { className: 'emoji-grid' }, s.list.map(function (e) {
          return h(T.Button, { key: e.name, variant: 'ghost', className: 'emoji-btn', 'aria-label': e.name, title: e.keys[0], onClick: function () { keepRecentEmoji(me, e.name); p.onPick(e.keys[0]); } }, e.emoji);
        })));
    })));
}
