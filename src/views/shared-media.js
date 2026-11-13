/* ---------- Media and links of a conversation ---------- */
// Embed kinds by filter: YouTube and TikTok are videos as much as a video file.
var SHARED_KINDS = { image: 'images', video: 'videos', youtube: 'videos', tiktok: 'videos', audio: 'audio', x: 'posts', link: 'links' };
var SHARED_FILTERS = [['all', 'All'], ['images', 'Images'], ['videos', 'Videos'], ['audio', 'Audio'], ['posts', 'Posts'], ['links', 'Links']];
var SHARED_ICONS = { image: 'image', video: 'play', youtube: 'play', tiktok: 'play', audio: 'volume', x: 'x-logo', link: 'link' };

/**
 * Lists what the loaded messages of a conversation shared, newest first.
 * A link the message shows as a media counts once, as that media.
 * @param {Array} messages Messages of the conversation, oldest first.
 * @param {function(Object): string} authorOf Author of a message.
 * @returns {Array<{key: string, kind: string, url: ?string, msgId: string, author: string, ts: number}>} Shared items.
 */
function sharedItems(messages, authorOf) {
  var out = [];
  for (var i = messages.length - 1; i >= 0; i--) {
    var m = messages[i];
    if (m.deleted || !m.text && !(m.embeds && m.embeds.length)) continue;
    var base = { msgId: m.id, author: authorOf(m), ts: m.ts }, shown = mediaLinks(m);
    (m.embeds || []).forEach(function (e, j) {
      out.push(Object.assign({ key: m.id + ':e' + j, kind: e.kind, url: e.kind === 'youtube' ? 'https://www.youtube.com/watch?v=' + e.id : e.url }, base));
    });
    textLinks(m.text || '').forEach(function (url, j) {
      if (shown.indexOf(url) < 0) out.push(Object.assign({ key: m.id + ':l' + j, kind: 'link', url: url }, base));
    });
  }
  return out;
}

/**
 * Names a shared item as its row shows it.
 * @param {{kind: string, url: string}} it Shared item.
 */
function sharedTitle(it) {
  if (it.kind === 'youtube') return 'YouTube video';
  if (it.kind === 'tiktok') return 'TikTok video';
  if (it.kind === 'x') return 'Post on X';
  var bare = it.url.replace(/^https?:\/\//i, '');
  if (it.kind === 'link') return bare;
  // A file shows its name, without the query, and its host when the path has none.
  var path = bare.split(/[?#]/)[0], name = path.slice(path.lastIndexOf('/') + 1);
  return name || path;
}

/**
 * Media and links shared in the loaded messages of a group or a PM.
 * A click on an item closes the dialog and jumps to its message.
 * @param {{where: string, messages: Array, authorOf: Function, onJump: function(string), onClose: Function}} p Conversation name as shown, its visible messages, author of a message, jump to a message and close.
 */
function SharedMediaDialog(p) {
  var app = useApp(), safety = app.state.prefs.safety;
  var a = useState('all'), filter = a[0], setFilter = a[1];
  var r = useState(false), revealed = r[0], setRevealed = r[1];
  var items = useMemo(function () { return sharedItems(p.messages, p.authorOf); }, [p.messages]);
  var counts = {};
  items.forEach(function (it) { var k = SHARED_KINDS[it.kind]; counts[k] = (counts[k] || 0) + 1; });
  var options = SHARED_FILTERS.filter(function (f) { return f[0] === 'all' || counts[f[0]]; }).map(function (f) { return { value: f[0], label: f[1] }; });
  // A filter whose last item went away falls back to All.
  var active = filter === 'all' || counts[filter] ? filter : 'all';
  var list = active === 'all' ? items : items.filter(function (it) { return SHARED_KINDS[it.kind] === active; });
  var grid = active === 'images' && safety.embedImages;
  var held = safety.embedImages && list.some(function (it) { return it.kind === 'image' && !mediaThumbShown(safety, revealed, it.url); });
  function jump(it) { p.onClose(); p.onJump(it.msgId); }
  function meta(it) { return shownName(app.state, it.author) + ' · ' + ago(it.ts); }
  return h(Dialog, {
    title: 'Media and links', description: 'Shared in ' + p.where + ', in the messages loaded on this page.', wide: true, onClose: p.onClose,
    footer: [h(T.Button, { key: 'd', variant: 'primary', onClick: p.onClose }, 'Done')]
  },
    h('div', { className: 'dialog-body' },
      options.length > 2 ? h(T.SegmentedControl, { label: 'Show', block: true, value: active, onChange: setFilter, options: options }) : null,
      held ? h('div', null, h(T.Button, { size: 'sm', icon: 'image', onClick: function () { setRevealed(true); } }, 'Show images')) : null,
      !list.length ? h('p', { className: 'media-note' }, 'Nothing shared yet. Images, videos and links sent here show up in this list.')
        : grid ? h('ul', { className: 'media-grid', 'aria-label': 'Images' }, list.map(function (it) {
          return h('li', { key: it.key, className: 'media-item' },
            h('button', { type: 'button', className: 'media-pick', title: 'Go to the message from ' + meta(it), onClick: function () { jump(it); } },
              h(MediaThumb, { url: it.url, shown: mediaThumbShown(safety, revealed, it.url) }),
              h('span', { className: 'media-name' }, shownName(app.state, it.author))));
        }))
        : h('ul', { className: 'shared-list', 'aria-label': 'Media and links' }, list.map(function (it) {
          var thumb = it.kind === 'image' && mediaThumbShown(safety, revealed, it.url);
          return h('li', { key: it.key, className: 'shared-item' },
            h('button', { type: 'button', className: 'shared-row', onClick: function () { jump(it); } },
              h('span', { className: 'shared-lead' }, thumb ? h(MediaThumb, { url: it.url, shown: true }) : h(T.Icon, { name: SHARED_ICONS[it.kind], size: 16 })),
              h('span', { className: 'shared-text' },
                h('span', { className: 'shared-title', dir: 'auto' }, sharedTitle(it)),
                h('span', { className: 'shared-meta' }, meta(it)))),
            mediaLink(app, it.url, 'tc-ib shared-open', h(T.Icon, { name: 'external', size: 15, label: 'Open ' + sharedTitle(it) })));
        }))));
}
