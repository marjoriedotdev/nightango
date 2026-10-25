/* ---------- Sélecteur d'émoticônes et de médias des composeurs ---------- */
var EMOJI_SECTIONS = [{ title: 'Classic', premium: false }, { title: 'Premium', premium: true }];
var PICKER_TABS = [{ value: 'emoji', label: 'Emoji' }, { value: 'media', label: 'Media' }];

/**
 * Permet d'ouvrir le sélecteur d'un composeur, onglets Emoji et Media, et d'insérer le raccourci ou l'adresse choisis dans son champ.
 * @param {Object} inputRef Référence du champ du composeur.
 * @param {function(string)} setValue Écrit le texte du champ.
 * @returns {{onEmoji: Function, picker: ?Object}} Action du bouton Emoji et sélecteur à rendre à côté du composeur.
 */
function useEmojiPicker(inputRef, setValue) {
  var st = useState(false), open = st[0], setOpen = st[1];
  var tb = useState('emoji'), tab = tb[0], setTab = tb[1];
  var anchorRef = useRef(null), caret = useRef(null);
  // Le champ contrôlé ne reçoit sa nouvelle valeur qu'au commit : le curseur se place après.
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
 * Sélecteur des composeurs : émoticônes de BetterChatango par leur emoji, rangées en Classic et Premium comme dans son sélecteur, et médiathèque de BetterChatango.
 * @param {{anchorRef: Object, premium: boolean, tab: string, onTab: function(string), onPick: function(string), onClose: function(Event)}} p Bouton Emoji, section Premium affichée, onglet ouvert et son changement, choix d'un raccourci ou d'une adresse et fermeture.
 */
function EmojiPicker(p) {
  var ref = useRef(null);
  var place = useFloating(p.anchorRef, ref, true, p.onClose, { up: true, align: 'left' });
  return h(Portal, null, h('div', { ref: ref, className: 'emoji-picker', role: 'dialog', 'aria-label': 'Emoji and media', style: place },
    h('div', { className: 'picker-tabs' }, h(T.SegmentedControl, { label: 'Emoji or media', block: true, value: p.tab, onChange: p.onTab, options: PICKER_TABS })),
    p.tab === 'media' ? h(MediaPanel, { scrollRef: ref, onPick: p.onPick }) : EMOJI_SECTIONS.filter(function (s) { return p.premium || !s.premium; }).map(function (s) {
      return h(Frag, { key: s.title },
        h('h3', { className: 'mlabel' }, s.title),
        h('div', { className: 'emoji-grid' }, EMOTICONS.filter(function (e) { return e.emoji && e.premium === s.premium; }).map(function (e) {
          return h(T.Button, { key: e.name, variant: 'ghost', className: 'emoji-btn', 'aria-label': e.name, title: e.keys[0], onClick: function () { p.onPick(e.keys[0]); } }, e.emoji);
        })));
    })));
}
