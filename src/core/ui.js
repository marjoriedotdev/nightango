/* ---------- Contexte et primitives UI ---------- */
var Ctx = React.createContext(null);
function useApp() { return useContext(Ctx); }

/* Calque unique pour fenêtres, menus et notifications : hors du flux, ils ne déforment plus la mise en page. */
var layerNode = null;
function layerRoot() {
  if (layerNode && layerNode.isConnected) return layerNode;
  var mountEl = window.__TORCH_MOUNT__ || document.getElementById('app');
  layerNode = document.createElement('div');
  layerNode.id = 'layer';
  (mountEl && mountEl.parentNode ? mountEl.parentNode : document.body).appendChild(layerNode);
  return layerNode;
}
function Portal(p) { return ReactDOM.createPortal(p.children, layerRoot()); }

function useOutside(ref, open, onClose, extraRef) {
  useEffect(function () {
    if (!open) return;
    function onDown(e) {
      var path = e.composedPath ? e.composedPath() : [e.target];
      if (ref.current && path.indexOf(ref.current) < 0 && !(extraRef && extraRef.current && path.indexOf(extraRef.current) >= 0)) onClose(e);
    }
    function onKey(e) { if (e.key === 'Escape') onClose(e); }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    document.addEventListener('keydown', onKey);
    return function () { document.removeEventListener('mousedown', onDown); document.removeEventListener('touchstart', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);
}

var LOAD_BELOW_MARGIN = '0px 0px 400px 0px';

/**
 * Permet de demander la page suivante quand une sentinelle approche de la zone visible.
 * @param {Object} rootRef Référence de la zone qui défile.
 * @param {Object} sentinelRef Référence de la sentinelle.
 * @param {boolean} enabled Une page suivante peut être demandée.
 * @param {Function} onReach Demande de la page suivante.
 * @param {string} margin Marge d'approche au format rootMargin.
 */
function useInfiniteScroll(rootRef, sentinelRef, enabled, onReach, margin) {
  useEffect(function () {
    if (!enabled) return;
    var io = new IntersectionObserver(function (entries) {
      if (entries.some(function (e) { return e.isIntersecting; })) onReach();
    }, { root: rootRef.current, rootMargin: margin });
    io.observe(sentinelRef.current);
    return function () { io.disconnect(); };
  }, [enabled]);
}

var FLOAT_UNPLACED = { position: 'fixed', visibility: 'hidden', top: 0, left: 0 };
/**
 * Permet d'ancrer un calque flottant à son déclencheur, de le fermer au clic extérieur, à Escape, au défilement de la page ou d'un conteneur du déclencheur et au redimensionnement, et de donner le focus à son premier bouton.
 * @param {Object} anchorRef Référence du déclencheur.
 * @param {Object} floatRef Référence du calque.
 * @param {boolean} open Le calque est ouvert.
 * @param {function(Event)} onClose Fermeture, avec l'événement qui la provoque.
 * @param {{up: boolean, align: string, at: ?{x: number, y: number}}} o Ouverture vers le haut, alignement sur le bord gauche du déclencheur, point d'ancrage qui remplace le déclencheur.
 * @returns {Object} Style de position, masqué tant que le calque n'est pas mesuré.
 */
function useFloating(anchorRef, floatRef, open, onClose, o) {
  useOutside(anchorRef, open, onClose, floatRef);
  var ps = useState(null), place = ps[0], setPlace = ps[1];
  // Position fixe calculée sur le déclencheur, retournée si le calque sortirait de l'écran.
  useLayoutEffect(function () {
    if (!open) { setPlace(null); return; }
    if (!anchorRef.current) return;
    var r = o.at ? { top: o.at.y, bottom: o.at.y, left: o.at.x, right: o.at.x } : anchorRef.current.getBoundingClientRect(), vw = document.documentElement.clientWidth, vh = window.innerHeight;
    var mh = floatRef.current ? floatRef.current.offsetHeight : 0, up = o.up ? r.top - mh - 4 >= 8 || r.bottom + mh + 4 > vh : r.bottom + mh + 4 > vh - 8 && r.top - mh - 4 >= 8;
    var mw = floatRef.current ? floatRef.current.offsetWidth : 0, left = o.align === 'left' && r.left + mw <= vw - 8;
    var st = { position: 'fixed' };
    if (up) st.bottom = (vh - r.top + 4) + 'px'; else st.top = (r.bottom + 4) + 'px';
    if (left) st.left = Math.max(8, r.left) + 'px'; else st.right = Math.max(8, vw - r.right) + 'px';
    setPlace(st);
  }, [open, o.at]);
  useEffect(function () {
    if (!open) return;
    // Seul le défilement d'un conteneur du déclencheur déplace le calque, pas celui du fil qui reçoit un message.
    function onMove(e) { if (e.type === 'scroll' && e.target !== document && !e.target.contains(anchorRef.current)) return; onClose(e); }
    window.addEventListener('resize', onMove);
    document.addEventListener('scroll', onMove, true);
    return function () { window.removeEventListener('resize', onMove); document.removeEventListener('scroll', onMove, true); };
  }, [open]);
  // Après le placement : un calque encore en visibility hidden refuse le focus dans un vrai navigateur.
  useEffect(function () {
    if (place && floatRef.current) { var first = floatRef.current.querySelector('button:not(:disabled)'); if (first) first.focus(); }
  }, [!!place]);
  return place || FLOAT_UNPLACED;
}

// Seul seuil de la colonne de droite : app.css ne le répète pas, la colonne n'est rendue qu'au-dessus.
var NARROW_LAYOUT = '(max-width:1180px)';
/**
 * Permet de basculer la colonne de droite quand la fenêtre lui laisse la place, et sinon d'ouvrir son contenu en plein écran.
 * @param {Function} openFull Ouverture du même contenu en plein écran.
 */
function useRightColumn(openFull) {
  var a = useState(function () { return !window.matchMedia(NARROW_LAYOUT).matches; }), fits = a[0], setFits = a[1];
  var b = useState(true), shown = b[0], setShown = b[1];
  useEffect(function () {
    var mq = window.matchMedia(NARROW_LAYOUT);
    function onChange() { setFits(!mq.matches); }
    mq.addEventListener('change', onChange);
    return function () { mq.removeEventListener('change', onChange); };
  }, []);
  return { open: fits && shown, pressed: fits ? shown : null, toggle: function () { if (fits) setShown(!shown); else openFull(); } };
}

/* Bouton qui ouvre un menu d'actions. items : {label, icon, onSelect, danger, disabled, checked, divider, swatch}. open et onOpenChange le rendent contrôlé, at {x, y} l'ancre à un point */
function MenuButton(p) {
  var st = useState(false), open = p.open != null ? p.open : st[0];
  var ref = useRef(null), menuRef = useRef(null);
  function setOpen(n) { if (p.open == null) st[1](n); if (p.onOpenChange) p.onOpenChange(n); }
  function close() { setOpen(false); }
  var place = useFloating(ref, menuRef, open, close, { up: p.up, align: p.align, at: p.at });
  function toggle() { setOpen(!open); }
  function onKey(e) {
    if (!menuRef.current) return;
    var items = Array.prototype.slice.call(menuRef.current.querySelectorAll('button:not(:disabled)'));
    var i = items.indexOf(menuRef.current.getRootNode().activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
  }
  var trigger = p.renderTrigger
    ? p.renderTrigger({ onClick: toggle, 'aria-expanded': String(open), 'aria-haspopup': 'menu' })
    : h(T.IconButton, { icon: p.icon || 'more', label: p.label, size: p.size || 32, iconSize: p.iconSize, onClick: toggle, 'aria-expanded': String(open), 'aria-haspopup': 'menu' });
  return h('div', { className: 'menu-anchor', ref: ref },
    trigger,
    open ? h(Portal, null, h('div', { className: 'menu floating', role: 'menu', ref: menuRef, onKeyDown: onKey, style: place },
      p.items.filter(Boolean).map(function (it, i) {
        if (it.divider) return h('hr', { key: 'd' + i });
        return h('button', {
          key: i, type: 'button', role: it.checked != null ? 'menuitemradio' : 'menuitem', 'aria-checked': it.checked != null ? String(!!it.checked) : undefined,
          className: it.danger ? 'danger' : undefined, disabled: it.disabled,
          onClick: function () { close(); it.onSelect(); }
        },
          it.swatch ? h('span', { className: 'swatch', style: { background: it.swatch } }) : it.icon ? h(T.Icon, { name: it.icon, size: 15 }) : null,
          h('span', { className: 'grow' }, it.label),
          it.checked ? h(T.Icon, { name: 'check', size: 14 }) : null);
      }))) : null);
}

/**
 * Champ de couleur avec sa valeur hexadécimale.
 * @param {{id: string, label: string, value: string, onChange: function(string)}} p Identifiant, libellé, couleur #rrggbb et rappel de changement.
 */
function ColorField(p) {
  return h('div', { className: 'tc-field' },
    h('label', { className: 'tc-label', htmlFor: p.id }, p.label),
    h('div', { style: { display: 'flex', alignItems: 'center', gap: 8 } },
      h('input', { id: p.id, type: 'color', className: 'color-in', style: { borderRadius: 7 }, value: p.value, onChange: function (e) { p.onChange(e.target.value); } }),
      h('span', { className: 'tnum', style: { fontSize: 12.5, color: 'var(--text-2)' } }, p.value)));
}

/**
 * Bouton qui ouvre le sélecteur de fichiers JSON.
 * @param {{onFile: function(File), icon: ?string, size: ?string, children: *}} p Rappel du fichier choisi, icône, taille et libellé du bouton.
 */
function JsonFileButton(p) {
  var ref = useRef(null);
  function change(e) {
    var file = e.target.files && e.target.files[0];
    // Sélecteur vidé : choisir de nouveau le même fichier doit relancer la lecture.
    e.target.value = '';
    if (file) p.onFile(file);
  }
  return h(Frag, null,
    h('input', { ref: ref, type: 'file', accept: '.json,application/json', hidden: true, onChange: change }),
    h(T.Button, { icon: p.icon, size: p.size, onClick: function () { ref.current.click(); } }, p.children));
}

var SKELETON_WIDTHS = ['62%', '44%', '70%', '52%', '66%', '40%'];
/**
 * Lignes d'attente à la forme d'une liste.
 * @param {{count: number, avatar: number, square: boolean, twoLines: boolean, label: string}} p Nombre de lignes, taille de l'avatar, avatar de groupe, seconde ligne de texte et annonce lue par les lecteurs d'écran.
 */
function SkeletonRows(p) {
  var rows = [];
  for (var i = 0; i < p.count; i++) {
    rows.push(h('div', { key: i, className: 'skel-row' },
      h(T.Skeleton, { circle: !p.square, width: p.avatar, height: p.avatar }),
      h('span', { className: 'skel-lines' },
        h(T.Skeleton, { width: SKELETON_WIDTHS[i % SKELETON_WIDTHS.length], height: 12 }),
        p.twoLines ? h(T.Skeleton, { width: '85%', height: 10 }) : null)));
  }
  return h('div', { role: 'status' }, h('span', { className: 'tc-sr' }, p.label), rows);
}

var openDialogs = [];
function Dialog(p) {
  var ref = useRef(null);
  useEffect(function () {
    var rootNode = ref.current ? ref.current.getRootNode() : document;
    var prev = rootNode.activeElement;
    var el = ref.current && ref.current.querySelector('[data-autofocus], input, textarea, select, button');
    if (el) el.focus();
    openDialogs.push(ref);
    function onKey(e) {
      // Toutes les fenêtres écoutent document : seule celle du dessus réagit.
      if (openDialogs[openDialogs.length - 1] !== ref) return;
      if (e.key === 'Escape' && p.onClose) { e.stopPropagation(); p.onClose(); }
      if (e.key === 'Tab' && ref.current) {
        var f = ref.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        var active = rootNode.activeElement;
        if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
      }
    }
    // Fenêtre non fermable : Escape est arrêté en capture, avant les fenêtres et menus ouverts dessous qui écoutent document.
    function onEscape(e) { if (e.key === 'Escape') e.stopPropagation(); }
    var blocking = !p.onClose;
    document.addEventListener('keydown', onKey);
    if (blocking) document.addEventListener('keydown', onEscape, true);
    return function () {
      openDialogs.splice(openDialogs.indexOf(ref), 1);
      document.removeEventListener('keydown', onKey);
      if (blocking) document.removeEventListener('keydown', onEscape, true);
      if (prev && prev.focus) prev.focus();
    };
  }, []);
  return h(Portal, null, h('div', { className: cx('overlay', p.sheet && 'sheet'), onMouseDown: function (e) { if (e.target === e.currentTarget && p.onClose) p.onClose(); } },
    h('div', { className: cx('dialog', p.wide && 'wide', p.sheet && 'sheet', p.className), role: p.role || 'dialog', 'aria-modal': 'true', 'aria-label': p.label || p.title, style: p.style, ref: ref },
      p.title ? h('div', { className: 'dialog-head' }, h('h2', p.focusTitle ? { tabIndex: -1, 'data-autofocus': true } : null, p.title), p.description ? h('p', null, p.description) : null) : null,
      p.children,
      p.footer ? h('div', { className: 'dialog-foot' }, p.footer) : null)));
}

function ConfirmDialog(p) {
  var c = p.confirm;
  return h(Dialog, {
    title: c.title, description: c.body, onClose: p.onClose,
    footer: [
      h(T.Button, { key: 'c', variant: 'ghost', onClick: p.onClose }, 'Cancel'),
      h(T.Button, { key: 'o', variant: c.danger ? 'danger' : 'primary', 'data-autofocus': true, onClick: function () { p.onClose(); c.onConfirm(); } }, c.confirmLabel || 'Confirm')
    ]
  });
}

function Toasts(p) {
  return h(Portal, null, h('div', { className: 'toasts', role: 'status', 'aria-live': 'polite' },
    p.toasts.map(function (t) {
      return h('div', { key: t.id, className: 'toast' },
        t.icon ? h(T.Icon, { name: t.icon, size: 16, style: { color: 'var(--text-2)' } }) : null,
        h('span', { className: cx('grow', t.clamp && 'toast-clamp') }, t.text),
        t.action ? h(T.Button, { size: 'sm', onClick: function () { p.dismiss(t.id); t.action.run(); } }, t.action.label) : null,
        h(T.IconButton, { icon: 'x', label: 'Dismiss', size: 26, iconSize: 13, onClick: function () { p.dismiss(t.id); } }));
    })));
}

/**
 * Bannière d'une connexion live coupée ou en cours, avec Reconnect une fois fermée.
 * @param {{name: string, conn: string, onReconnect: Function, style: Object=}} p Connexion nommée (#groupe ou private messages), son état, sa relance et la marge du conteneur.
 */
function ConnectionBanner(p) {
  return h('div', { className: 'banner-wrap', style: p.style }, h(T.Banner, {
    tone: 'warning', icon: 'info', title: p.conn === 'connecting' ? 'Connecting to ' + p.name : 'Disconnected from ' + p.name,
    action: p.conn === 'closed' ? h(T.Button, { size: 'sm', onClick: p.onReconnect }, 'Reconnect') : null
  }, p.conn === 'connecting' ? 'Messages you send now may not arrive.' : 'New messages will not arrive until you reconnect.'));
}

// -- Personnes ----------------------------------------------------------------
/**
 * Permet d'afficher le rôle court d'un membre en badge, à côté de son nom.
 * @param {?string} role Rôle du membre dans le groupe.
 */
function roleBadge(role) { return role ? h(T.Badge, { icon: role === 'owner' ? 'crown' : 'shield' }, ROLE_LABEL[role]) : null; }
/**
 * Permet de marquer sa propre ligne dans une liste.
 * @param {boolean} isMe Ligne de l'utilisateur connecté.
 */
function youBadge(isMe) { return isMe ? h(T.Badge, null, 'You') : null; }
/**
 * Permet de donner la présence d'une ligne de liste aux lecteurs d'écran, le point de l'avatar restant seul à l'œil.
 * @param {string} status Présence du membre.
 */
function presenceSr(status) { return h('span', { className: 'tc-sr' }, ', ' + statusLabel(status)); }
/**
 * Avatar et nom d'une personne dans un seul bouton qui ouvre sa fiche de profil.
 * @param {{name: string, label: string, gid: string, size: number, status: string, ring: string, avatarOnly: boolean, inert: boolean}} p Nom du compte, nom affiché s'il diffère, groupe d'où la fiche s'ouvre, taille de l'avatar, présence et contour de son point, avatar sans le nom, simple texte pour qui n'a pas de compte.
 */
function Person(p) {
  var app = useApp(), label = p.label || p.name;
  var avatar = h(T.Avatar, { name: p.name, size: p.size, status: p.status, ring: p.ring }), text = p.avatarOnly ? null : h('span', { className: 'namebtn' }, label);
  if (p.inert) return h('span', { className: 'person-tag' }, avatar, text);
  return h('button', { type: 'button', className: p.avatarOnly ? 'avatar-btn' : 'person-tag', 'aria-label': 'View ' + label + "'s profile", onClick: function () { app.ui.openProfile(p.name, p.gid || null); } }, avatar, text);
}
