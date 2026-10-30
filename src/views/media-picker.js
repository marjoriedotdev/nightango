/* ---------- Composer media picker ---------- */
var MEDIA_TABS = [{ value: 'upload', label: 'Upload' }, { value: 'library', label: 'Library' }, { value: 'memes', label: 'Memes' }];
var MEMES_URL = 'https://api.imgflip.com/get_memes';
var MEME_IMAGE = /^https:\/\/i\.imgflip\.com\/[A-Za-z0-9]+\.(?:jpg|png|gif)$/;
// One request per page while it succeeds: a failure lets the next opening ask again.
var memeRequest = null;

/**
 * Reads the blank templates of an Imgflip get_memes reply.
 * @param {*} data Parsed reply.
 * @returns {?Array<{url: string, name: string}>} Templates with an i.imgflip.com image, null if the reply is not a list of templates.
 */
function parseMemeTemplates(data) {
  var memes = data && data.success === true && data.data && data.data.memes;
  if (!Array.isArray(memes)) return null;
  return memes.filter(function (m) { return m && typeof m.name === 'string' && !!m.name.trim() && typeof m.url === 'string' && MEME_IMAGE.test(m.url); })
    .map(function (m) { return { url: m.url, name: m.name.trim() }; });
}

/**
 * Reads Imgflip's popular blank templates, the sample ones in the prototype.
 * @returns {Promise<Array<{url: string, name: string}>>} Templates in Imgflip's order, rejected if Imgflip does not send them.
 */
function memeTemplates() {
  if (!LIVE) return Promise.resolve(SAMPLE_MEMES);
  if (!memeRequest) {
    memeRequest = fetch(MEMES_URL, { referrerPolicy: 'no-referrer' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (data) {
      var list = parseMemeTemplates(data);
      if (!list) throw new Error('Imgflip sent an unexpected reply.');
      return list;
    });
    memeRequest.catch(function () { memeRequest = null; });
  }
  return memeRequest;
}

/**
 * Opens a composer's media picker and inserts the chosen address into its field.
 * @param {Object} inputRef Ref of the composer field.
 * @param {function(string)} setValue Writes the field text.
 * @param {?Object} attach File upload of the composer (useAttachMedia), null when the send cannot carry a file.
 * @returns {{onMedia: Function, picker: ?Object}} Media button action and picker to render next to the composer.
 */
function useMediaPicker(inputRef, setValue, attach) {
  var c = useComposerPicker(inputRef, setValue);
  var tb = useState('upload'), tab = tb[0], setTab = tb[1];
  return {
    onMedia: c.toggle,
    picker: c.open ? h(MediaPicker, { anchorRef: c.anchorRef, attach: attach, tab: tab, onTab: setTab, onPick: c.pick, onDone: c.dismiss, onClose: c.close }) : null
  };
}

/**
 * Composer media picker, with an Upload tab, BetterChatango's media library and Imgflip's blank templates.
 * @param {{anchorRef: Object, attach: ?Object, tab: string, onTab: function(string), onPick: function(string), onDone: Function, onClose: function(Event)}} p Media button, file upload of the composer, chosen tab and its change, insertion of an address, closing after a file is picked, and closing.
 */
function MediaPicker(p) {
  var ref = useRef(null);
  var tabs = p.attach ? MEDIA_TABS : MEDIA_TABS.filter(function (t) { return t.value !== 'upload'; });
  var tab = tabs.some(function (t) { return t.value === p.tab; }) ? p.tab : tabs[0].value;
  return h(PickerLayer, { anchorRef: p.anchorRef, onClose: p.onClose, className: 'media-picker', label: 'Media', layerRef: ref },
    h('div', { className: 'picker-tabs' }, h(T.SegmentedControl, { label: 'Media source', block: true, value: tab, onChange: p.onTab, options: tabs })),
    tab === 'upload' ? h(UploadPanel, { attach: p.attach, onDone: p.onDone })
      : tab === 'library' ? h(MediaPanel, { scrollRef: ref, onPick: p.onPick })
      : h(MemePanel, { onPick: p.onPick }));
}

/**
 * Upload tab of the Media picker: the picked file waits in the composer until the next send.
 * @param {{attach: Object, onDone: Function}} p File upload of the composer and closing of the picker.
 */
function UploadPanel(p) {
  var a = p.attach;
  return h('div', { className: 'media-panel' },
    h('p', { className: 'media-note' }, 'Pick an image, a video or a sound. It leaves with your next message. vissle.me hosts it, and anyone with the link can open it.'),
    a.onAttach
      ? h(T.Button, { icon: 'upload', onClick: function () { a.onAttach(); p.onDone(); } }, a.file ? 'Choose another file' : 'Choose a file')
      : h('p', { className: 'media-note', role: 'status' }, a.status + '. You can pick another file once it is sent.'));
}

/**
 * Memes tab of the Media picker: Imgflip's popular blank templates, with search by name.
 * @param {{onPick: function(string)}} p Insertion of the chosen address.
 */
function MemePanel(p) {
  var b = useState(''), query = b[0], setQuery = b[1];
  var c = useState({ list: [], loading: true, failed: false }), memes = c[0], setMemes = c[1];
  var t = useState(0), attempt = t[0], setAttempt = t[1];
  useEffect(function () {
    var current = true;
    setMemes({ list: [], loading: true, failed: false });
    memeTemplates().then(function (list) { if (current) setMemes({ list: list, loading: false, failed: false }); },
      function () { if (current) setMemes({ list: [], loading: false, failed: true }); });
    return function () { current = false; };
  }, [attempt]);
  if (memes.failed) return h('div', { className: 'media-panel' },
    h('p', { className: 'media-note' }, 'Imgflip did not send its templates. Check your connection and try again.'),
    h(T.Button, { size: 'sm', onClick: function () { setAttempt(attempt + 1); } }, 'Try again'));
  var text = query.trim().toLowerCase();
  var shown = text ? memes.list.filter(function (e) { return e.name.toLowerCase().indexOf(text) >= 0; }) : memes.list;
  var note = memes.loading ? h(T.Spinner, { label: 'Loading templates' })
    : !shown.length ? h('p', { className: 'media-note' }, text ? 'No template matches your search.' : 'Imgflip sent no templates.') : null;
  return h('div', { className: 'media-panel' },
    h(T.TextField, { type: 'search', 'aria-label': 'Search templates', placeholder: 'Search templates', value: query, onChange: function (e) { setQuery(e.target.value); } }),
    note,
    h(MediaGrid, { list: shown, label: 'Meme templates', onPick: p.onPick }),
    memes.loading ? null : h('p', { className: 'media-note' }, 'Popular blank templates from imgflip.com.'));
}
