/* ---------- BetterChatango media library ---------- */
var MEDIA_SORTS = [{ value: 'name', label: 'Name' }, { value: 'url', label: 'Link' }];
// Like BetterChatango's completion (searchMedia with auto): three media at most.
var MEDIA_SUGGESTIONS = 3;
// At the start of a word only: the ":" of a typed address offers nothing.
var MEDIA_TOKEN = /(?:^|\s):(\S+)$/;

/**
 * Tells whether a media library thumbnail may load under the message image rules.
 * @param {Object} safety Safety settings.
 * @param {boolean} revealed The user asked for "Show images".
 * @param {string} url Image address.
 */
function mediaThumbShown(safety, revealed, url) { return safety.embedImages && (revealed || !waitsForClick(safety, 'image', url)); }

/**
 * Media thumbnail without referrer, replaced by an icon while it may not load or if it fails.
 * @param {{url: string, shown: boolean}} p Image address and whether loading is allowed.
 */
function MediaThumb(p) {
  var st = useState(false), broken = st[0], setBroken = st[1];
  if (!p.shown || broken) return h('span', { className: 'media-thumb media-thumb-empty' }, h(T.Icon, { name: 'image', size: 16 }));
  return h('img', { className: 'media-thumb', src: p.url, alt: '', loading: 'lazy', referrerPolicy: 'no-referrer', onError: function () { setBroken(true); } });
}

/**
 * Star that adds an image to the media library or removes it.
 * @param {{url: string, saved: boolean}} p Image address and whether it is in the media library.
 */
function MediaStarButton(p) {
  var app = useApp();
  return h(T.IconButton, {
    icon: 'star', label: p.saved ? 'Remove from media' : 'Add to media', size: 28, iconSize: 15, className: cx('media-star', p.saved && 'media-star-saved'),
    onClick: function () { app.actions.toggleMedia(p.url, p.saved); }
  });
}

/**
 * Star of a message image, shown once the media library says whether it holds the image.
 * It is absent without a database.
 * @param {{url: string}} p Image address.
 */
function MediaStar(p) {
  var app = useApp(), rev = app.state.mediaRev;
  var st = useState(null), saved = st[0], setSaved = st[1];
  useEffect(function () {
    var current = true;
    app.actions.hasMedia(p.url).then(function (v) { if (current) setSaved(v); }, function () { if (current) setSaved(null); });
    return function () { current = false; };
  }, [p.url, rev]);
  return saved == null ? null : h(MediaStarButton, { url: p.url, saved: saved });
}

/**
 * Media tab of the picker.
 * It shows BetterChatango's media library by pages, with search by name and import and export in BetterChatango's format.
 * @param {{scrollRef: Object, onPick: function(string)}} p Scrolling area and insertion of the chosen address.
 */
function MediaPanel(p) {
  var app = useApp(), safety = app.state.prefs.safety, rev = app.state.mediaRev, toast = app.ui.toast;
  var a = useState('name'), sort = a[0], setSort = a[1];
  var b = useState(''), query = b[0], setQuery = b[1];
  var c = useState({ list: [], more: false, loading: true, failed: false }), lib = c[0], setLib = c[1];
  var r = useState(false), revealed = r[0], setRevealed = r[1];
  var sentinelRef = useRef(null), asked = useRef(0);
  var text = query.trim();
  function load(after) {
    var id = ++asked.current;
    setLib(function (x) { return { list: x.list, more: false, loading: true, failed: false }; });
    // Only the last read applies: a newer sort, search or write makes the others stale.
    app.actions.mediaPage(sort, after, text).then(function (page) {
      if (id === asked.current) setLib(function (x) { return { list: (after ? x.list : []).concat(page.list), more: page.more, loading: false, failed: false }; });
    }, function () { if (id === asked.current) setLib({ list: [], more: false, loading: false, failed: true }); });
  }
  useEffect(function () { load(null); }, [sort, text, rev]);
  useInfiniteScroll(p.scrollRef, sentinelRef, lib.more && !lib.loading, function () { load(lib.list[lib.list.length - 1]); }, LOAD_BELOW_MARGIN);
  function exportFile() {
    app.actions.exportMedia().then(function (entries) { downloadJson(app.state.me + '_media.json', entries); }, function (e) { toast(e.message); });
  }
  function importFile(file) {
    readJsonArray(file).then(function (entries) {
      if (!entries) { toast('This file is not a BetterChatango media file.'); return; }
      app.actions.importMedia(entries).then(function (res) {
        toast('Imported ' + plural(res.added, 'image', 'images') + '. ' + res.skipped + ' skipped.', { icon: res.added ? 'check' : 'info' });
      }, function (e) { toast(e.message); });
    });
  }
  if (lib.failed) return h('p', { className: 'media-note' }, 'BetterChatango could not open your media library. Reload the page and try again.');
  var grid = safety.embedImages, held = lib.list.some(function (e) { return !mediaThumbShown(safety, revealed, e.url); });
  var note = !lib.list.length ? (lib.loading ? h(T.Spinner, { label: 'Loading media' })
    : h('p', { className: 'media-note' }, text ? 'No media matches your search.' : 'No media yet. Star an image in a message to add it here.')) : null;
  return h('div', { className: 'media-panel' },
    h('div', { className: 'media-tools' },
      h(T.TextField, { type: 'search', 'aria-label': 'Search media', placeholder: 'Search media', value: query, onChange: function (e) { setQuery(e.target.value); } }),
      h('div', { className: 'media-actions' },
        h(T.SegmentedControl, { label: 'Sort media', value: sort, onChange: setSort, options: MEDIA_SORTS }),
        h('span', { className: 'grow' }),
        h(JsonFileButton, { size: 'sm', onFile: importFile }, 'Import'),
        h(T.Button, { size: 'sm', onClick: exportFile }, 'Export'))),
    grid && held ? h(T.Button, { size: 'sm', icon: 'image', onClick: function () { setRevealed(true); } }, 'Show images') : null,
    note,
    lib.list.length ? h('ul', { className: grid ? 'media-grid' : 'media-list', 'aria-label': 'Your media' }, lib.list.map(function (e) {
      return h('li', { key: e.url, className: 'media-item' },
        h('button', { type: 'button', className: 'media-pick', title: e.url, onClick: function () { p.onPick(e.url); } },
          grid ? h(MediaThumb, { url: e.url, shown: mediaThumbShown(safety, revealed, e.url) }) : null,
          h('span', { className: 'media-name' }, e.name)),
        h(MediaStarButton, { url: e.url, saved: true }));
    })) : null,
    lib.more ? h('div', { ref: sentinelRef, className: 'media-more' }, lib.loading ? h(T.Spinner, { label: 'Loading more media' }) : null) : null);
}

/**
 * Suggests the media whose name contains the :text typed at the end of the input.
 * Tab or a click replaces that text with the chosen address.
 * Unlike BetterChatango, Enter always sends the text as is, whether suggestions are open or not.
 * @param {string} value Composer text.
 * @param {function(string)} setValue Writes the composer text.
 * @returns {{onKeyDown: Function, panel: Object}} Keys to handle before the composer's own, and suggestions to render in composer-wrap.
 */
function useMediaCompletion(value, setValue) {
  var app = useApp(), safety = app.state.prefs.safety;
  var m = MEDIA_TOKEN.exec(value), token = m ? m[1] : null;
  var st = useState(null), found = st[0], setFound = st[1];
  var closed = useRef(null);
  useEffect(function () {
    if (!token) { closed.current = null; return; }
    if (token === closed.current) return;
    closed.current = null;
    var current = true;
    app.actions.searchMedia(token, MEDIA_SUGGESTIONS).then(function (list) { if (current) setFound({ token: token, list: list, active: 0 }); }, function () { /* without a media library, no suggestion */ });
    return function () { current = false; };
  }, [token]);
  var open = !!found && found.token === token && found.list.length > 0;
  function accept(i) {
    setValue(value.slice(0, value.length - token.length - 1) + found.list[i].url + ' ');
    setFound(null);
  }
  function onKeyDown(e) {
    if (!open || e.nativeEvent.isComposing) return;
    var n = found.list.length;
    if (e.key === 'Tab' && !e.shiftKey) accept(found.active);
    else if (e.key === 'Escape') { closed.current = token; setFound(null); }
    else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') setFound(Object.assign({}, found, { active: (found.active + (e.key === 'ArrowDown' ? 1 : n - 1)) % n }));
    else return;
    e.preventDefault();
  }
  var list = open ? h('ul', { className: 'media-suggest', role: 'listbox', 'aria-label': 'Media suggestions' }, found.list.map(function (e, i) {
    return h('li', {
      key: e.url, role: 'option', 'aria-selected': String(i === found.active), className: 'media-suggest-item',
      // The field keeps focus: the click replaces the text without leaving it.
      onMouseDown: function (ev) { ev.preventDefault(); }, onClick: function () { accept(i); }
    }, h(MediaThumb, { url: e.url, shown: mediaThumbShown(safety, false, e.url) }), h('span', { className: 'media-name' }, e.name), h('span', { className: 'media-url' }, e.url));
  })) : null;
  var said = open ? found.list[found.active].name + ', ' + (found.active + 1) + ' of ' + found.list.length + '. Press Tab to insert it.' : '';
  return { onKeyDown: onKeyDown, panel: h(Frag, null, list, h('p', { className: 'tc-sr', 'aria-live': 'polite' }, said)) };
}
