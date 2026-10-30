/* ---------- Composer file upload ---------- */
// Types offered by BetterChatango's Upload window (inject.js:7552).
var UPLOAD_TYPES = '.png, .apng, .jpg, .jpeg, .gif, .bmp, .webp, .mp3, .ogg, .wav, .mp4, .wmv, .webm';
var UPLOAD_ICONS = { image: 'image', video: 'play', audio: 'volume' };

/**
 * Names the file upload in progress to a group or a PM.
 * @param {{kind: string, id: string}} to Target group (group) or PM (dm).
 */
function uploadKey(to) { return to.kind + ':' + to.id; }

/**
 * Keeps the file picked in a composer until the next send, which uploads it through vissle and posts its link after the typed text.
 * @param {{kind: string, id: string}} to Group or PM of the composer.
 * @param {Function} setDraft Draft setter of the composer, which gets the text back if the send fails.
 * @returns {{onAttach: ?Function, status: ?string, busy: boolean, attachment: ?Object, file: ?File, send: Function, input: ?Object}} Opening of the file picker (Upload tab of the Media picker), null while a file is being sent, upload in progress, Composer attachment, picked file, send of the file with the text, and file field to render next to the composer.
 */
function useAttachMedia(to, setDraft) {
  var app = useApp(), inputRef = useRef(null), key = uploadKey(to);
  var st = useState(null), staged = st[0], setStaged = st[1];
  var pv = useState(null), preview = pv[0], setPreview = pv[1];
  // The DM composer stays mounted from one conversation to the next: a file picked for one never goes to another.
  var file = staged && staged.key === key ? staged.file : null;
  useEffect(function () {
    if (!file || !/^image\//.test(file.type)) return;
    var url = URL.createObjectURL(file);
    setPreview(url);
    return function () { URL.revokeObjectURL(url); setPreview(null); };
  }, [file]);
  if (!LIVE) return { onAttach: function () { app.ui.toast('Uploading media is not part of this prototype.'); }, status: null, busy: false, attachment: null, file: null, send: null, input: null };
  var name = app.uploads[key];
  function choose(e) {
    var picked = e.target.files[0];
    // Field cleared: otherwise picking the same file again does not fire change.
    e.target.value = '';
    if (picked) setStaged({ key: key, file: picked });
  }
  function restore(text) { if (text) setDraft(function (v) { return v ? text + ' ' + v : text; }); }
  return {
    // BetterChatango accepts one request at a time: no second upload from this composer before the first one ends.
    onAttach: name ? null : function () { inputRef.current.click(); },
    status: name ? 'Uploading ' + name : null,
    busy: !!name,
    attachment: file ? {
      name: file.name, preview: preview, icon: UPLOAD_ICONS[file.type.split('/')[0]] || 'paperclip',
      note: name ? null : 'vissle.me hosts it when you send. Anyone with the link can open it.',
      onRemove: name ? null : function () { setStaged(null); }
    } : null,
    file: file,
    /**
     * Uploads the picked file then posts the typed text followed by its link.
     * @param {string} text Typed text, possibly empty.
     * @param {Object} opts Reply, quote and channel of the message.
     * @param {Function} onSent Called once the message has left.
     */
    send: function (text, opts, onSent) {
      var sending = file;
      app.actions.uploadFile(to, sending, text, opts).then(function (unsent) {
        setStaged(function (x) { return x && x.file === sending ? null : x; });
        if (unsent) restore(unsent); else onSent();
      }, function () { restore(text); });
    },
    input: h('input', { ref: inputRef, type: 'file', accept: UPLOAD_TYPES, hidden: true, onChange: choose })
  };
}
