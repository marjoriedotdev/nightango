/* ---------- Message log ---------- */
// Distance from the bottom of a log under which it stays stuck to the bottom.
var LOG_BOTTOM_SLACK = 48;

/**
 * Lets a view drive its message log (MessageLog) with a jump to a loaded message and a return to the bottom.
 * @returns {{targetId: ?string, jumpTo: function(string), follow: Function, toBottom: Function, view: Object}} Target message, jump to a message,
 *   log kept at the bottom on the next change, immediate return to the bottom, and state reserved for MessageLog.
 */
function useMessageLog() {
  var reduceMotion = useApp().state.prefs.a11y.reduceMotion;
  var logRef = useRef(null), atBottom = useRef(true);
  var a = useState(null), target = a[0], setTarget = a[1];
  var b = useState(false), below = b[0], setBelow = b[1];
  // After the render that sets the target: the target row only exists at that point, for example once the group search is closed.
  useEffect(function () {
    if (!target) return;
    var row = logRef.current.querySelector('[data-msg-id=' + JSON.stringify(target.id) + ']');
    // A busy group can trim the target between the jump and this render.
    if (!row) { setTarget(null); return; }
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
 * Message log of a group or a PM.
 * It follows the bottom while the reader is there, keeps the reading position elsewhere and loads older pages at the top.
 * @param {{log: Object, label: string, rows: Array, firstTs: ?number, changeKey: *, newBelow: string, older: ?Object}} p Driver (useMessageLog), accessible name,
 *   rows, timestamp of the first loaded message, value whose change repositions the log, reaction to a change below a scrolled-up reader
 *   (follow: back to the bottom, notify: New messages button) and log head: null, {status: 'pending'} on the first load,
 *   {status: 'start', text} at the start of the history, or {status: 'more', loading, ready, load, retry} with retry called on every scroll if given.
 */
function MessageLog(p) {
  var v = p.log.view, older = p.older, more = !!older && older.status === 'more';
  var sentinelRef = useRef(null), seenFirstTs = useRef(null);
  useInfiniteScroll(v.ref, sentinelRef, more && older.ready && !p.log.targetId, function () { older.load(); }, '200px 0px 0px 0px');
  useLayoutEffect(function () {
    var el = v.ref.current;
    // History added at the top does not move the view (.log in column-reverse), and its sort can bring a row stamped with the local clock to the end.
    var olderAdded = p.firstTs < seenFirstTs.current;
    if (v.atBottom.current || !olderAdded && p.newBelow === 'follow') el.scrollTop = 0;
    else if (!olderAdded) v.setBelow(true);
  }, [p.changeKey]);
  // After the effect above, even without a key change: older history that leaves the key alone must not hide the next message.
  useLayoutEffect(function () { seenFirstTs.current = p.firstTs; }, [p.firstTs]);
  useLogAnchor(v.ref);
  function onScroll() {
    // .log in column-reverse: scrollTop is 0 at the bottom and goes negative when scrolling up.
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
 * Keeps the reading position in a log when the content below the view changes, where the browser does not.
 * The log is in column-reverse: changes above the view already do not move it.
 * @param {Object} logRef Ref of the log (.log), whose element does not change while the component is mounted.
 */
function useLogAnchor(logRef) {
  useEffect(function () {
    var el = logRef.current;
    // Safari before 27 has no native scroll anchoring. Elsewhere, correcting here would double the offset.
    if (!el || window.CSS.supports('overflow-anchor', 'auto')) return;
    var anchor = null, anchorTop = 0;
    function pick() {
      var top = el.getBoundingClientRect().top, rows = el.firstChild.children, lo = 0, hi = rows.length - 1;
      while (lo < hi) { var mid = (lo + hi) >> 1; if (rows[mid].getBoundingClientRect().bottom > top) hi = mid; else lo = mid + 1; }
      // As native anchoring excludes the sentinel (overflow-anchor: none), the manual anchor excludes it too.
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
