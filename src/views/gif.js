/* ---------- GIF tab of the composer picker ---------- */
var RECENT_GIFS_MAX = 24;

/**
 * Lists the GIFs of the messages loaded in every group and PM, newest first, without duplicates.
 * @param {Object} s Application state.
 */
function recentGifs(s) {
  var seen = [];
  function scan(messages) {
    messages.forEach(function (m) {
      if (m.deleted) return;
      (m.embeds || []).forEach(function (e) { if (e.kind === 'image' && GIF_URL.test(e.url)) seen.push({ url: e.url, ts: m.ts }); });
    });
  }
  Object.keys(s.groups).forEach(function (k) { scan(s.groups[k].messages); });
  Object.keys(s.dms).forEach(function (k) { scan(s.dms[k].messages); });
  var urls = [];
  seen.sort(function (a, b) { return b.ts - a.ts; }).forEach(function (x) { if (urls.indexOf(x.url) < 0 && urls.length < RECENT_GIFS_MAX) urls.push(x.url); });
  return urls;
}

/**
 * GIF shown on its first frame, animated while its button is hovered or focused, never with reduced motion.
 * The file loads once: a canvas keeps the first frame and the image plays above it.
 * @param {{url: string, shown: boolean}} p GIF address and whether loading is allowed.
 */
function StillGif(p) {
  var canvasRef = useRef(null);
  var st = useState(false), broken = st[0], setBroken = st[1];
  if (!p.shown || broken) return h('span', { className: 'media-thumb media-thumb-empty' }, h(T.Icon, { name: 'image', size: 16 }));
  function onLoad(e) {
    var img = e.currentTarget, c = canvasRef.current;
    if (!c) return;
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    // A cross-origin image taints the canvas, which still shows it: nothing reads its pixels.
    c.getContext('2d').drawImage(img, 0, 0);
  }
  return h('span', { className: 'gif-still' },
    h('canvas', { ref: canvasRef, 'aria-hidden': 'true' }),
    h('img', { src: p.url, alt: '', loading: 'lazy', referrerPolicy: 'no-referrer', onLoad: onLoad, onError: function () { setBroken(true); } }));
}

/**
 * Grid of GIFs to insert, each with its media library star.
 * @param {{label: string, urls: Array<string>, names: ?Object, safety: Object, revealed: boolean, onPick: function(string)}} p List name, addresses, names by address, safety settings, Show images asked, and insertion.
 */
function GifGrid(p) {
  return h('ul', { className: 'media-grid', 'aria-label': p.label }, p.urls.map(function (url) {
    var name = p.names ? p.names[url] : null;
    return h('li', { key: url, className: 'media-item' },
      h('button', { type: 'button', className: 'media-pick', title: name || url, 'aria-label': 'Insert ' + (name || 'GIF'), onClick: function () { p.onPick(url); } },
        h(StillGif, { url: url, shown: mediaThumbShown(p.safety, p.revealed, url) }),
        name ? h('span', { className: 'media-name' }, name) : null),
      p.names ? h(MediaStarButton, { url: url, saved: true }) : h(MediaStar, { url: url }));
  }));
}

/**
 * GIF tab of the picker: a pasted link, the GIFs seen in the loaded messages and those of the media library.
 * Nothing is fetched beyond the GIFs shown under the message image rules.
 * @param {{onPick: function(string)}} p Insertion of the chosen address.
 */
function GifPanel(p) {
  var app = useApp(), s = app.state, safety = s.prefs.safety;
  var a = useState(''), link = a[0], setLink = a[1];
  var r = useState(false), revealed = r[0], setRevealed = r[1];
  var c = useState({ list: [], loading: true, failed: false }), lib = c[0], setLib = c[1];
  useEffect(function () {
    var current = true;
    app.actions.gifMedia().then(function (list) { if (current) setLib({ list: list, loading: false, failed: false }); },
      function () { if (current) setLib({ list: [], loading: false, failed: true }); });
    return function () { current = false; };
  }, [s.mediaRev]);
  var recent = useMemo(function () { return recentGifs(s); }, [s.groups, s.dms]);
  var pasted = link.trim(), valid = GIF_URL.test(pasted);
  var names = {};
  lib.list.forEach(function (e) { names[e.url] = e.name; });
  var all = recent.concat(lib.list.map(function (e) { return e.url; }), valid ? [pasted] : []);
  var held = safety.embedImages && all.some(function (url) { return !mediaThumbShown(safety, revealed, url); });
  return h('div', { className: 'media-panel' },
    h('div', { className: 'gif-paste' },
      h(T.TextField, {
        type: 'url', 'aria-label': 'GIF link', placeholder: 'Paste a GIF link', value: link, onChange: function (e) { setLink(e.target.value); },
        error: pasted && !valid ? 'Paste an https link that ends in .gif.' : null,
        onKeyDown: function (e) { if (e.key === 'Enter' && valid) { e.preventDefault(); p.onPick(pasted); } }
      }),
      valid ? h('div', { className: 'gif-paste-preview' },
        h('span', { className: 'gif-paste-thumb' },
          safety.embedImages ? h(StillGif, { url: pasted, shown: mediaThumbShown(safety, revealed, pasted) }) : null,
          h(MediaStar, { url: pasted })),
        h(T.Button, { size: 'sm', variant: 'primary', onClick: function () { p.onPick(pasted); } }, 'Insert')) : null),
    held ? h(T.Button, { size: 'sm', icon: 'image', onClick: function () { setRevealed(true); } }, 'Show images') : null,
    h('h3', { className: 'mlabel' }, 'Seen recently'),
    recent.length ? h(GifGrid, { label: 'GIFs seen recently', urls: recent, safety: safety, revealed: revealed, onPick: p.onPick })
      : h('p', { className: 'media-note' }, 'GIFs sent in your groups and private messages show up here.'),
    h('h3', { className: 'mlabel' }, 'Your GIFs'),
    lib.failed ? h('p', { className: 'media-note' }, 'BetterChatango could not open your media library. Reload the page and try again.')
      : lib.loading ? h(T.Spinner, { label: 'Loading GIFs' })
        : lib.list.length ? h(GifGrid, { label: 'Your GIFs', urls: lib.list.map(function (e) { return e.url; }), names: names, safety: safety, revealed: revealed, onPick: p.onPick })
          : h('p', { className: 'media-note' }, 'No GIF in your media yet. Star one to keep it here.'));
}
