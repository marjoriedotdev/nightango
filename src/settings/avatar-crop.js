/* ---------- Recadrage de la photo de profil ---------- */
// Plus petit carré en pixels de full.jpg, sauf image plus petite.
var CROP_MIN = 32;

/**
 * Permet de borner un carré de recadrage à l'image, avec les valeurs négatives que BetterChatango remplace (inject.js:8473-8476).
 * @param {{x0: number, y0: number, ts: number}} box Carré en pixels de l'image, ts nul ou négatif pour toute la largeur.
 * @param {number} w Largeur naturelle de l'image.
 * @param {number} ht Hauteur naturelle de l'image.
 * @returns {{x0: number, y0: number, ts: number}} Carré entier contenu dans l'image.
 */
function clampCrop(box, w, ht) {
  var side = Math.min(w, ht), min = Math.min(side, CROP_MIN);
  var ts = Math.round(Math.max(min, Math.min(side, box.ts > 0 ? box.ts : side)));
  return { x0: Math.round(Math.max(0, Math.min(w - ts, box.x0 > 0 ? box.x0 : 0))), y0: Math.round(Math.max(0, Math.min(ht - ts, box.y0 > 0 ? box.y0 : 0))), ts: ts };
}
/**
 * Permet de proposer le plus grand carré centré, recadrage d'une photo qui vient d'être envoyée.
 * @param {number} w Largeur naturelle de l'image.
 * @param {number} ht Hauteur naturelle de l'image.
 */
function centeredCrop(w, ht) { var side = Math.min(w, ht); return clampCrop({ x0: (w - side) / 2, y0: (ht - side) / 2, ts: side }, w, ht); }
/**
 * Permet de changer la taille d'un carré autour de son centre.
 * @param {{x0: number, y0: number, ts: number}} box Carré actuel.
 * @param {number} delta Pixels ajoutés au côté, négatif pour réduire.
 * @param {number} w Largeur naturelle de l'image.
 * @param {number} ht Hauteur naturelle de l'image.
 */
function resizeCrop(box, delta, w, ht) {
  var ts = Math.max(Math.min(Math.min(w, ht), CROP_MIN), Math.min(Math.min(w, ht), box.ts + delta));
  return clampCrop({ x0: box.x0 + (box.ts - ts) / 2, y0: box.y0 + (box.ts - ts) / 2, ts: ts }, w, ht);
}

/**
 * Aperçu rond d'un recadrage, à la taille d'un avatar.
 * @param {string} p.src Photo complète.
 * @param {{x0: number, y0: number, ts: number}} p.box Carré retenu.
 * @param {{w: number, h: number}} p.natural Taille naturelle de la photo.
 * @param {number} p.size Diamètre affiché.
 */
function CropPreview(p) {
  var k = p.size / p.box.ts;
  return h('span', { className: 'crop-preview', style: { width: p.size, height: p.size } },
    h('img', { src: p.src, alt: '', referrerPolicy: 'no-referrer', draggable: false, style: { width: p.natural.w * k, height: p.natural.h * k, left: -p.box.x0 * k, top: -p.box.y0 * k } }));
}

/**
 * Fenêtre de recadrage : le carré retenu devient la miniature de son profil, générée par Chatango.
 * @param {string} p.name Compte connecté.
 * @param {?{x0: number, y0: number, ts: number}} p.initial Recadrage enregistré, null pour centrer.
 * @param {Function} p.onClose Fermeture sans enregistrer.
 * @param {Function} p.onSaved Fermeture après l'enregistrement.
 */
function AvatarCropDialog(p) {
  var app = useApp(), src = useMemo(function () { return profileImgSrc(p.name, 'full'); }, []);
  var a = useState(null), natural = a[0], setNatural = a[1];
  var b = useState(null), box = b[0], setBox = b[1];
  var c = useState(false), failed = c[0], setFailed = c[1];
  var sv = useState(false), saving = sv[0], setSaving = sv[1];
  var drag = useRef(null);
  function loaded(e) {
    var w = e.target.naturalWidth, ht = e.target.naturalHeight;
    setNatural({ w: w, h: ht });
    setBox(p.initial ? clampCrop(p.initial, w, ht) : centeredCrop(w, ht));
  }
  function start(mode) {
    return function (e) {
      if (saving) return;
      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);
      var rect = e.currentTarget.closest('.crop-stage').querySelector('img').getBoundingClientRect();
      drag.current = { mode: mode, x: e.clientX, y: e.clientY, box: box, k: natural.w / rect.width };
    };
  }
  function move(e) {
    var d = drag.current;
    if (!d) return;
    var dx = (e.clientX - d.x) * d.k, dy = (e.clientY - d.y) * d.k;
    // Poignée en bas à droite : le coin opposé reste en place.
    setBox(d.mode === 'move' ? clampCrop({ x0: d.box.x0 + dx, y0: d.box.y0 + dy, ts: d.box.ts }, natural.w, natural.h)
      : clampCrop({ x0: d.box.x0, y0: d.box.y0, ts: Math.min(d.box.ts + Math.max(dx, dy), natural.w - d.box.x0, natural.h - d.box.y0) }, natural.w, natural.h));
  }
  function end() { drag.current = null; }
  function key(e) {
    var side = Math.min(natural.w, natural.h), step = Math.max(1, Math.round(side * (e.shiftKey ? 0.1 : 0.01))), grow = Math.max(1, Math.round(side * 0.05));
    var moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }, mv = moves[e.key];
    if (mv) setBox(clampCrop({ x0: box.x0 + mv[0], y0: box.y0 + mv[1], ts: box.ts }, natural.w, natural.h));
    // Pas fixe pour + : il demande Maj sur bien des claviers.
    else if (e.key === '+' || e.key === '=') setBox(resizeCrop(box, grow, natural.w, natural.h));
    else if (e.key === '-') setBox(resizeCrop(box, -grow, natural.w, natural.h));
    else return;
    e.preventDefault();
  }
  function save() {
    setSaving(true);
    liveBridge.saveAvatarCrop(box).then(p.onSaved, function (e) {
      setSaving(false);
      app.ui.toast(e.message);
    });
  }
  var pct = natural && box ? { left: box.x0 / natural.w * 100 + '%', top: box.y0 / natural.h * 100 + '%', width: box.ts / natural.w * 100 + '%', height: box.ts / natural.h * 100 + '%' } : null;
  return h(Dialog, {
    title: 'Crop your picture', description: 'Your avatar and mini profile show the area inside the square.', onClose: p.onClose,
    footer: [
      h(T.Button, { key: 'c', variant: 'ghost', disabled: saving, onClick: p.onClose }, 'Cancel'),
      h(T.Button, { key: 's', variant: 'primary', disabled: !box || saving, onClick: save }, saving ? 'Saving' : 'Save crop')
    ]
  },
    h('div', { className: 'dialog-body crop-body' },
      failed ? h('p', { className: 'muted', style: { margin: 0 } }, 'Chatango did not return your picture. Try again later.')
        : h(Frag, null,
          h('div', { className: 'crop-stage' },
            h('img', { src: src, alt: 'Your profile picture', referrerPolicy: 'no-referrer', draggable: false, onLoad: loaded, onError: function () { setFailed(true); } }),
            pct ? h('div', { className: 'crop-box', style: pct, tabIndex: 0, role: 'group', 'aria-label': 'Crop area', 'aria-describedby': 'crop-hint', onKeyDown: key, onPointerDown: start('move'), onPointerMove: move, onPointerUp: end, onPointerCancel: end },
              // Déplacement et relâchement de la poignée remontent jusqu'au carré.
              h('span', { className: 'crop-handle', 'aria-hidden': 'true', onPointerDown: start('resize') })) : null),
          natural ? null : h(T.Spinner, { size: 24, label: 'Loading photo' }),
          h('p', { id: 'crop-hint', className: 'tc-hint', style: { margin: 0 } }, 'Drag the square or its corner. With the keyboard, use the arrow keys to move it, Shift for bigger steps, and + or - to resize it.'),
          natural && box ? h('div', { className: 'btnrow', style: { alignItems: 'center' } },
            h(CropPreview, { src: src, box: box, natural: natural, size: 96 }),
            h(CropPreview, { src: src, box: box, natural: natural, size: 36 })) : null)));
}
