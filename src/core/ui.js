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
      if (ref.current && path.indexOf(ref.current) < 0 && !(extraRef && extraRef.current && path.indexOf(extraRef.current) >= 0)) onClose();
    }
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    document.addEventListener('keydown', onKey);
    return function () { document.removeEventListener('mousedown', onDown); document.removeEventListener('touchstart', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);
}

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

/* Bouton qui ouvre un menu d'actions. items : {label, icon, onSelect, danger, checked, divider, swatch}. open et onOpenChange le rendent contrôlé, at {x, y} l'ancre à un point */
function MenuButton(p) {
  var st = useState(false), open = p.open != null ? p.open : st[0];
  var ref = useRef(null), menuRef = useRef(null);
  function setOpen(n) { if (p.open == null) st[1](n); if (p.onOpenChange) p.onOpenChange(n); }
  function close() { setOpen(false); }
  useOutside(ref, open, close, menuRef);
  var ps = useState(null), place = ps[0], setPlace = ps[1];
  // Position fixe calculée sur le déclencheur, retournée si le menu sortirait de l'écran.
  useLayoutEffect(function () {
    if (!open || !ref.current) return;
    var r = p.at ? { top: p.at.y, bottom: p.at.y, left: p.at.x, right: p.at.x } : ref.current.getBoundingClientRect(), vw = document.documentElement.clientWidth, vh = window.innerHeight;
    var mh = menuRef.current ? menuRef.current.offsetHeight : 0, up = p.up ? r.top - mh - 4 >= 8 || r.bottom + mh + 4 > vh : r.bottom + mh + 4 > vh - 8 && r.top - mh - 4 >= 8;
    var mw = menuRef.current ? menuRef.current.offsetWidth : 0, left = p.align === 'left' && r.left + mw <= vw - 8;
    var st = { position: 'fixed' };
    if (up) st.bottom = (vh - r.top + 4) + 'px'; else st.top = (r.bottom + 4) + 'px';
    if (left) st.left = Math.max(8, r.left) + 'px'; else st.right = Math.max(8, vw - r.right) + 'px';
    setPlace(st);
  }, [open, p.at]);
  useEffect(function () {
    if (!open) return;
    function onMove(e) { if (menuRef.current && e.target && menuRef.current.contains(e.target)) return; close(); }
    window.addEventListener('resize', onMove);
    document.addEventListener('scroll', onMove, true);
    return function () { window.removeEventListener('resize', onMove); document.removeEventListener('scroll', onMove, true); };
  }, [open]);
  useEffect(function () {
    if (open && menuRef.current) { var first = menuRef.current.querySelector('button'); if (first) first.focus(); }
  }, [open]);
  function toggle() { setPlace(null); setOpen(!open); }
  function onKey(e) {
    if (!menuRef.current) return;
    var items = Array.prototype.slice.call(menuRef.current.querySelectorAll('button'));
    var i = items.indexOf(menuRef.current.getRootNode().activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
  }
  var trigger = p.renderTrigger
    ? p.renderTrigger({ onClick: toggle, 'aria-expanded': String(open), 'aria-haspopup': 'menu' })
    : h(T.IconButton, { icon: p.icon || 'more', label: p.label, size: p.size || 32, iconSize: p.iconSize, onClick: toggle, 'aria-expanded': String(open), 'aria-haspopup': 'menu' });
  return h('div', { className: 'menu-anchor', ref: ref },
    trigger,
    open ? h(Portal, null, h('div', { className: 'menu floating', role: 'menu', ref: menuRef, onKeyDown: onKey, style: place || { position: 'fixed', visibility: 'hidden', top: 0, left: 0 } },
      p.items.filter(Boolean).map(function (it, i) {
        if (it.divider) return h('hr', { key: 'd' + i });
        return h('button', {
          key: i, type: 'button', role: it.checked != null ? 'menuitemradio' : 'menuitem', 'aria-checked': it.checked != null ? String(!!it.checked) : undefined,
          className: it.danger ? 'danger' : undefined,
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
      h('span', { className: 'mono', style: { fontSize: 12.5, color: 'var(--text-2)' } }, p.value)));
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

function Dialog(p) {
  var ref = useRef(null);
  useEffect(function () {
    var rootNode = ref.current ? ref.current.getRootNode() : document;
    var prev = rootNode.activeElement;
    var el = ref.current && ref.current.querySelector('[data-autofocus], input, textarea, select, button');
    if (el) el.focus();
    function onKey(e) {
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
      document.removeEventListener('keydown', onKey);
      if (blocking) document.removeEventListener('keydown', onEscape, true);
      if (prev && prev.focus) prev.focus();
    };
  }, []);
  return h(Portal, null, h('div', { className: cx('overlay', p.sheet && 'sheet'), onMouseDown: function (e) { if (e.target === e.currentTarget && p.onClose) p.onClose(); } },
    h('div', { className: cx('dialog', p.wide && 'wide', p.sheet && 'sheet', p.className), role: p.role || 'dialog', 'aria-modal': 'true', 'aria-label': p.label || p.title, style: p.style, ref: ref },
      p.title ? h('div', { className: 'dialog-head' }, h('h2', null, p.title), p.description ? h('p', null, p.description) : null) : null,
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
        h('span', { className: 'grow' }, t.text),
        t.action ? h(T.Button, { size: 'sm', onClick: function () { p.dismiss(t.id); t.action.run(); } }, t.action.label) : null,
        h(T.IconButton, { icon: 'x', label: 'Dismiss', size: 26, iconSize: 13, onClick: function () { p.dismiss(t.id); } }));
    })));
}
