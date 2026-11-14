/* ---------- Session loss ---------- */
var SESSION_ATTEMPTS = 3;
// A lost connection has no dialog: it shows in SessionBanner.
var SESSION_COPY = {
  kicked: { icon: 'monitor-smartphone', title: "You're signed in somewhere else", body: 'Chatango closed your private messages here because your account connected from another window or device.' },
  denied: { icon: 'lock', title: 'Your session expired', body: 'Reload the page and sign in again on the BetterChatango screen.' },
  offline: { icon: 'wifi-off', title: "You're offline", body: 'Nightango will reconnect when your connection is back.' }
};
// Texts of the official client for a connection that stays lost.
var SESSION_IDLE = 'Unable to connect, please try again in a few minutes.', SESSION_SPENT = 'Unable to connect. Please reload the page.';

/**
 * Returns the automatic attempt that comes first among the connections being retried.
 * @param {Object} retrying Automatic attempts by connection.
 * @returns {?{attempt: number, at: number}} Attempt with the time it starts, null when no attempt is scheduled.
 */
function nextRetry(retrying) {
  var next = null;
  Object.keys(retrying).forEach(function (gid) { var r = retrying[gid]; if (r.at && (!next || r.at < next.at)) next = r; });
  return next;
}
/**
 * Tells whether a live connection is connecting: the private connection or a joined group.
 * @param {Object} s Application state.
 */
function anyConnecting(s) {
  return s.pmConn === 'connecting' || Object.keys(s.groups).some(function (k) { var g = s.groups[k]; return g.joined && g.conn === 'connecting'; });
}
/**
 * Tells whether the connection to Chatango is lost, which SessionBanner shows without blocking the interface.
 * @param {Object} s Application state.
 */
function sessionLost(s) { return !!(LIVE && s.auth.loggedIn && s.session && s.session.reason === 'lost'); }
/**
 * Tells whether the session loss blocks the interface with its dialog.
 * @param {Object} s Application state.
 */
function sessionBlocks(s) { return !!(s.auth.loggedIn && s.session && s.session.reason !== 'lost'); }

/**
 * Blocking session loss dialog: signed in somewhere else, session expired, offline.
 * @param {{session: {reason: string}}} p Reason of the loss.
 */
function SessionOverlay(p) {
  var app = useApp(), s = p.session, copy = SESSION_COPY[s.reason], busy = anyConnecting(app.state);
  /**
   * Builds the Reload button.
   * @param {string} variant Button variant.
   */
  function reload(variant) { return h(T.Button, { key: 'reload', variant: variant, onClick: function () { location.reload(); } }, 'Reload'); }
  var footer = s.reason === 'kicked' ? [h(T.Button, { key: 'here', variant: 'ghost', disabled: busy, onClick: function () { app.actions.reconnect('private_message'); } }, 'Reconnect here'), reload('primary')]
    // Offline, a reload would lose the page: the automatic reconnection is the way back.
    : s.reason === 'offline' ? [reload('secondary')]
    : [reload('primary')];
  return h(Dialog, { role: 'alertdialog', label: copy.title, center: true, className: 'session', footer: footer },
    h('div', { className: 'session-head' },
      h('span', { className: 'session-icon' }, h(T.Icon, { name: copy.icon, size: 22 })),
      h('h2', null, copy.title),
      h('p', null, copy.body)),
    s.reason === 'offline' ? h('p', { className: 'session-status', role: 'status' }, h(T.Spinner, { size: 14 }), 'Waiting for your connection…') : null);
}

/**
 * Returns what the banner shows while the connection is lost.
 * The give-up waits until no automatic attempt is scheduled any more.
 * @param {Object} s Application state.
 * @param {number} now Current time.
 * @returns {string} waiting, trying, idle or spent.
 */
function lostPhase(s, now) {
  var retry = nextRetry(s.retrying);
  if (anyConnecting(s) || retry && retry.at <= now) return 'trying';
  if (retry) return 'waiting';
  return s.session.attempts >= SESSION_ATTEMPTS ? 'spent' : 'idle';
}
/**
 * Banner of a lost connection on the page in view: the seconds left before the next automatic attempt, the attempt in progress, the give-up,
 * then Reconnected before it folds away. The interface stays open meanwhile: a send fails with its notification.
 * @param {{inset: number=, className: string=}} p Side margin and class given by the page that holds it.
 */
function SessionBanner(p) {
  var app = useApp(), s = app.state, now = Date.now();
  var lost = sessionLost(s) ? lostPhase(s, now) : null;
  var st = useState(lost), phase = st[0], setPhase = st[1];
  var tick = useState(0), setTick = tick[1];
  // Reconnected only for a session that came back: another loss shows its dialog instead.
  var next = lost || (s.session ? null : phase && phase !== 'leaving' ? 'done' : phase);
  if (next !== phase) setPhase(next);
  useEffect(function () {
    if (phase !== 'waiting') return;
    var timer = setInterval(function () { setTick(function (n) { return n + 1; }); }, 1000);
    return function () { clearInterval(timer); };
  }, [phase]);
  useEffect(function () {
    if (phase !== 'done' && phase !== 'leaving') return;
    var timer = setTimeout(function () { setPhase(phase === 'done' ? 'leaving' : null); }, phase === 'done' ? CONN_DONE_MS : CONN_LEAVE_MS);
    return function () { clearTimeout(timer); };
  }, [phase]);
  if (!next) return null;
  var shown = next === 'leaving' ? 'done' : next, retry = lost ? nextRetry(s.retrying) : null;
  var attempt = retry && retry.attempt ? 'Attempt ' + retry.attempt + ' of ' + RECONNECT_DELAYS.length + '.' : null;
  var title, text = null, action = null, icon;
  /**
   * Builds the Reload button.
   * @param {string} variant Button variant.
   */
  function reload(variant) { return h(T.Button, { key: 'reload', size: 'sm', variant: variant, onClick: function () { location.reload(); } }, 'Reload'); }
  if (shown === 'waiting') {
    title = 'Connection lost';
    text = ['Reconnecting in ' + Math.ceil((retry.at - now) / 1000) + ' s.', attempt].filter(Boolean).join(' ');
    icon = h(CountdownRing, { left: retry.at - now, total: RECONNECT_DELAYS[retry.attempt - 1] });
    // Ember only once Nightango has stopped trying: until then the automatic attempts are the way back.
    action = [reload('ghost'), h(T.Button, { key: 'now', size: 'sm', onClick: app.actions.reconnectSession }, 'Reconnect now')];
  } else if (shown === 'trying') {
    title = 'Connection lost'; text = ['Reconnecting…', attempt].filter(Boolean).join(' '); icon = h(T.Spinner, { size: 16 });
  } else if (shown === 'idle') {
    title = "Couldn't reconnect"; text = SESSION_IDLE; icon = h(T.Icon, { name: 'unplug', size: 16 });
    action = [reload('ghost'), h(T.Button, { key: 'now', size: 'sm', variant: 'primary', onClick: app.actions.reconnectSession }, 'Reconnect')];
  } else if (shown === 'spent') {
    title = 'Connection lost'; text = SESSION_SPENT; icon = h(T.Icon, { name: 'unplug', size: 16 });
    action = [reload('primary')];
  } else {
    title = 'Reconnected'; icon = h(T.Icon, { name: 'check', size: 16 });
  }
  var style = p.inset != null ? { marginLeft: p.inset, marginRight: p.inset } : null;
  return h('div', { className: cx('conn-banner', 'session-banner', next === 'leaving' && 'conn-banner-leaving', p.className), 'data-phase': shown === 'idle' || shown === 'spent' ? 'failed' : shown, style: style },
    // Only the title is announced: a live region around the countdown would speak every second.
    h('span', { className: 'tc-sr', role: 'status' }, title),
    h('div', { className: 'conn-banner-clip' }, h(T.Banner, {
      icon: h('span', { key: shown, className: 'conn-fade', style: { display: 'inline-flex' } }, icon),
      title: h('span', { key: shown, className: 'conn-fade' }, title),
      action: action ? h('span', { className: 'conn-banner-actions conn-fade' }, action) : null
    }, text ? h('span', { key: shown, className: 'conn-fade' }, text) : null)));
}
/**
 * Ring that empties until the next automatic attempt.
 * @param {{left: number, total: number}} p Time left and whole delay, in milliseconds.
 */
function CountdownRing(p) {
  var lit = Math.max(0, Math.min(1, p.left / p.total));
  return h('svg', { className: 'countdown-ring', width: 16, height: 16, viewBox: '0 0 16 16', 'aria-hidden': 'true' },
    h('circle', { className: 'countdown-ring-track', cx: 8, cy: 8, r: 6.5 }),
    h('circle', { className: 'countdown-ring-arc', cx: 8, cy: 8, r: 6.5, pathLength: 100, strokeDasharray: 100, strokeDashoffset: 100 * (1 - lit) }));
}
