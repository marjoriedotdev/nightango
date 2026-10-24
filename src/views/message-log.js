/* ---------- Fil de messages ---------- */
// Distance au bas d'un fil sous laquelle il reste collé en bas.
var LOG_BOTTOM_SLACK = 48;

/**
 * Permet à une vue de piloter son fil de messages (MessageLog) : saut vers un message chargé et retour en bas.
 * @returns {{targetId: ?string, jumpTo: function(string), follow: Function, toBottom: Function, view: Object}} Message visé, saut vers un message,
 *   fil gardé en bas au prochain changement, retour immédiat en bas, et état réservé à MessageLog.
 */
function useMessageLog() {
  var reduceMotion = useApp().state.prefs.a11y.reduceMotion;
  var logRef = useRef(null), atBottom = useRef(true);
  var a = useState(null), target = a[0], setTarget = a[1];
  var b = useState(false), below = b[0], setBelow = b[1];
  // Après le rendu qui pose la cible : la ligne visée n'existe qu'à ce moment, par exemple une fois la recherche du groupe fermée.
  useEffect(function () {
    if (!target) return;
    var row = logRef.current.querySelector('[data-msg-id=' + JSON.stringify(target.id) + ']');
    var still = reduceMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    row.scrollIntoView({ block: 'center', behavior: still ? 'auto' : 'smooth' });
    row.tabIndex = -1;
    row.focus({ preventScroll: true });
    var timer = setTimeout(function () { setTarget(null); }, 1500);
    return function () { clearTimeout(timer); };
  }, [target]);
  return {
    targetId: target ? target.id : null,
    jumpTo: function (id) { setTarget({ id: id }); },
    follow: function () { atBottom.current = true; },
    toBottom: function () { atBottom.current = true; logRef.current.scrollTop = 0; setBelow(false); },
    view: { ref: logRef, atBottom: atBottom, below: below, setBelow: setBelow }
  };
}

/**
 * Fil de messages d'un groupe ou d'un MP : il suit le bas tant que le lecteur y est, garde la lecture en place ailleurs et charge les pages plus anciennes en tête.
 * @param {{log: Object, label: string, rows: Array, firstTs: ?number, changeKey: *, newBelow: string, older: ?Object}} p Pilote (useMessageLog), nom accessible,
 *   lignes, horodatage du premier message chargé, valeur dont le changement replace le fil, réaction à un changement sous un lecteur remonté
 *   (follow : retour en bas, notify : bouton New messages) et tête du fil : null, {status: 'pending'} au premier chargement,
 *   {status: 'start', text} au début de l'historique, ou {status: 'more', loading, ready, load, retry} avec retry appelé à chaque défilement s'il est donné.
 */
function MessageLog(p) {
  var v = p.log.view, older = p.older, more = !!older && older.status === 'more';
  var sentinelRef = useRef(null), seenFirstTs = useRef(null);
  useInfiniteScroll(v.ref, sentinelRef, more && older.ready && !p.log.targetId, function () { older.load(); }, '200px 0px 0px 0px');
  useLayoutEffect(function () {
    var el = v.ref.current;
    // L'historique ajouté en tête ne déplace pas la vue (.log en column-reverse) : rien à restaurer.
    var olderAdded = p.firstTs < seenFirstTs.current;
    seenFirstTs.current = p.firstTs;
    if (v.atBottom.current || !olderAdded && p.newBelow === 'follow') el.scrollTop = 0;
    else if (!olderAdded) v.setBelow(true);
  }, [p.changeKey]);
  useLogAnchor(v.ref);
  function onScroll() {
    // .log en column-reverse : scrollTop vaut 0 en bas et devient négatif en remontant.
    v.atBottom.current = v.ref.current.scrollTop > -LOG_BOTTOM_SLACK;
    if (v.atBottom.current && v.below) v.setBelow(false);
    if (older && older.retry) older.retry();
  }
  var top = !older ? null
    : older.status === 'pending' ? h(SkeletonRows, { key: 'top', count: 6, avatar: 36, twoLines: true, label: 'Loading messages' })
    : older.status === 'start' ? h('div', { key: 'top', className: 'ev' }, h(T.Icon, { name: 'info', size: 14 }), older.text)
    : h('div', { key: 'top', ref: sentinelRef, className: 'ev history-more' }, older.loading ? h(T.Spinner, { label: 'Loading earlier messages' }) : null);
  return h(Frag, null,
    h('div', { className: 'log', role: 'log', 'aria-label': p.label, ref: v.ref, onScroll: onScroll }, h('div', { className: 'log-inner' }, top ? [top].concat(p.rows) : p.rows)),
    v.below ? h('button', { type: 'button', className: 'jump', onClick: p.log.toBottom }, h(T.Icon, { name: 'chevron-down', size: 14 }), 'New messages') : null);
}

/**
 * Permet de garder la lecture en place dans un fil quand le contenu sous la vue change, là où le navigateur ne le fait pas.
 * Le fil est en column-reverse : ce qui change au-dessus de la vue ne la déplace déjà pas.
 * @param {Object} logRef Référence du fil (.log), dont l'élément ne change pas tant que le composant est monté.
 */
function useLogAnchor(logRef) {
  useEffect(function () {
    var el = logRef.current;
    // Safari avant 27 n'a pas d'ancrage natif du défilement. Ailleurs, corriger ici doublerait le décalage.
    if (!el || window.CSS.supports('overflow-anchor', 'auto')) return;
    var anchor = null, anchorTop = 0;
    function pick() {
      var top = el.getBoundingClientRect().top, rows = el.firstChild.children, lo = 0, hi = rows.length - 1;
      while (lo < hi) { var mid = (lo + hi) >> 1; if (rows[mid].getBoundingClientRect().bottom > top) hi = mid; else lo = mid + 1; }
      // Comme l'ancrage natif exclut la sentinelle (overflow-anchor: none), l'ancre manuelle l'exclut aussi.
      if (rows[lo] && rows[lo].classList.contains('history-more')) lo++;
      anchor = rows[lo] || null;
      anchorTop = anchor ? anchor.getBoundingClientRect().top : 0;
    }
    function hold() {
      if (anchor && anchor.isConnected && el.scrollTop < -LOG_BOTTOM_SLACK) {
        var delta = anchor.getBoundingClientRect().top - anchorTop;
        if (delta) el.scrollTop += delta;
      }
      pick();
    }
    var ro = new ResizeObserver(hold);
    ro.observe(el.firstChild);
    el.addEventListener('scroll', pick, { passive: true });
    pick();
    return function () { ro.disconnect(); el.removeEventListener('scroll', pick); };
  }, []);
}
