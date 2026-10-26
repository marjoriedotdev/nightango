/* ---------- Composer file upload ---------- */
// Types offered by BetterChatango's Upload window (inject.js:7552).
var UPLOAD_TYPES = '.png, .apng, .jpg, .jpeg, .gif, .bmp, .webp, .mp3, .ogg, .wav, .mp4, .wmv, .webm';

/**
 * Names the file upload in progress to a group or a PM.
 * @param {{kind: string, id: string}} to Target group (group) or PM (dm).
 */
function uploadKey(to) { return to.kind + ':' + to.id; }

/**
 * Picks a file from a composer and uploads it through vissle after confirmation.
 * @param {{kind: string, id: string, channel: ?string}} to Group or PM of the composer, and the channel chosen for a group.
 * @returns {{onAttach: ?Function, status: ?string, input: ?Object}} Attach media button action, upload in progress and picker to render next to the composer.
 */
function useAttachMedia(to) {
  var app = useApp(), inputRef = useRef(null);
  if (!LIVE) return { onAttach: function () { app.ui.toast('Uploading media is not part of this prototype.'); }, status: null, input: null };
  var name = app.uploads[uploadKey(to)];
  function choose(e) {
    var file = e.target.files[0];
    // Field cleared: otherwise picking the same file again does not fire change.
    e.target.value = '';
    app.ui.confirm({
      title: 'Upload ' + file.name + '?',
      body: 'vissle.me stores the file and Nightango posts its link ' + (to.kind === 'dm' ? 'to ' + to.id : 'in #' + to.id) + '. Anyone with the link can open it.',
      confirmLabel: 'Upload', onConfirm: function () { app.actions.uploadFile(to, file); }
    });
  }
  return {
    // BetterChatango accepts one request at a time: no second upload from this composer before the first one ends.
    onAttach: name ? null : function () { inputRef.current.click(); },
    status: name ? 'Uploading ' + name : null,
    input: h('input', { ref: inputRef, type: 'file', accept: UPLOAD_TYPES, hidden: true, onChange: choose })
  };
}
