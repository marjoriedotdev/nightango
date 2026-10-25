/* ---------- Envoi de fichier des composeurs ---------- */
// Types proposés par la fenêtre Upload de Torch (inject.js:7552).
var UPLOAD_TYPES = '.png, .apng, .jpg, .jpeg, .gif, .bmp, .webp, .mp3, .ogg, .wav, .mp4, .wmv, .webm';

/**
 * Permet de nommer l'envoi de fichier en cours vers un groupe ou un MP.
 * @param {{kind: string, id: string}} to Groupe (group) ou MP (dm) de destination.
 */
function uploadKey(to) { return to.kind + ':' + to.id; }

/**
 * Permet de choisir un fichier depuis un composeur puis, après confirmation, de l'envoyer par vissle.
 * @param {{kind: string, id: string, channel: ?string}} to Groupe ou MP du composeur, et canal choisi pour un groupe.
 * @returns {{onAttach: ?Function, status: ?string, input: ?Object}} Action du bouton Attach media, envoi en cours et sélecteur à rendre à côté du composeur.
 */
function useAttachMedia(to) {
  var app = useApp(), inputRef = useRef(null);
  if (!LIVE) return { onAttach: function () { app.ui.toast('Uploading media is not part of this prototype.'); }, status: null, input: null };
  var name = app.uploads[uploadKey(to)];
  function choose(e) {
    var file = e.target.files[0];
    // Champ vidé : sans cela, choisir de nouveau le même fichier ne déclenche pas change.
    e.target.value = '';
    app.ui.confirm({
      title: 'Upload ' + file.name + '?',
      body: 'vissle.me stores the file and Nightango posts its link ' + (to.kind === 'dm' ? 'to ' + to.id : 'in #' + to.id) + '. Anyone with the link can open it.',
      confirmLabel: 'Upload', onConfirm: function () { app.actions.uploadFile(to, file); }
    });
  }
  return {
    // Torch n'accepte qu'une requête à la fois : pas de second envoi depuis ce composeur avant la fin du premier.
    onAttach: name ? null : function () { inputRef.current.click(); },
    status: name ? 'Uploading ' + name : null,
    input: h('input', { ref: inputRef, type: 'file', accept: UPLOAD_TYPES, hidden: true, onChange: choose })
  };
}
