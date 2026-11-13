/* ---------- Session loss ---------- */
var SESSION_ATTEMPTS = 3;
var SESSION_COPY = {
  kicked: { icon: 'monitor-smartphone', title: "You're signed in somewhere else", body: 'Chatango closed your private messages here because your account connected from another window or device.' },
  denied: { icon: 'lock', title: 'Your session expired', body: 'Reload the page and sign in again on the BetterChatango screen.' },
  offline: { icon: 'wifi-off', title: "You're offline", body: 'Nightango will reconnect when your connection is back.' },
  lost: { icon: 'alert', title: 'Connection lost', body: 'Unable to connect, please try again in a few minutes.' }
};
// Texts of the official client, except the one shown while the automatic attempts run, which it does not have.
var SESSION_RETRYING = 'Nightango lost its connection to Chatango and keeps trying.', SESSION_SPENT = 'Unable to connect. Please reload the page.';

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
 * Blocking session loss dialog. It says what the automatic reconnection is doing: the attempt in progress, or the seconds left before the next one.
 * @param {{session: {reason: string, attempts: number}}} p Reason of the loss and number of reconnection attempts.
 */
function SessionOverlay(p) {
  var app = useApp(), s = p.session, copy = SESSION_COPY[s.reason];
  var spent = s.reason === 'lost' && s.attempts >= SESSION_ATTEMPTS;
  var busy = app.state.pmConn === 'connecting' || Object.keys(app.state.groups).some(function (k) { var g = app.state.groups[k]; return g.joined && g.conn === 'connecting'; });
  var retry = s.reason === 'lost' && !spent ? nextRetry(app.state.retrying) : null;
  var seconds = retry ? Math.ceil((retry.at - Date.now()) / 1000) : 0, waiting = !busy && seconds > 0;
  var tick = useState(0), setTick = tick[1];
  useEffect(function () {
    if (!waiting) return;
    var timer = setInterval(function () { setTick(function (n) { return n + 1; }); }, 1000);
    return function () { clearInterval(timer); };
  }, [waiting]);
  var body = spent ? SESSION_SPENT : retry ? SESSION_RETRYING : copy.body;
  var attempt = retry && retry.attempt ? h('span', { className: 'session-attempt' }, 'Attempt ' + retry.attempt + ' of ' + RECONNECT_DELAYS.length) : null;
  var status = s.reason === 'denied' || spent ? null
    : busy ? h('p', { key: 'busy', className: 'session-status', role: 'status' }, h(T.Spinner, { size: 14 }), 'Reconnecting…', attempt)
    // No live region on the countdown: a screen reader would read every second.
    : waiting ? h('p', { key: 'wait', className: 'session-status' }, h(T.Icon, { name: 'rotate-cw', size: 14 }), h('span', null, 'Next attempt in ', h('b', null, seconds + ' s')), attempt)
    : s.reason === 'offline' ? h('p', { key: 'offline', className: 'session-status', role: 'status' }, h(T.Spinner, { size: 14 }), 'Waiting for your connection…')
    : null;
  /**
   * Builds the Reload button.
   * @param {string} variant Button variant.
   */
  function reload(variant) { return h(T.Button, { key: 'reload', variant: variant, onClick: function () { location.reload(); } }, 'Reload'); }
  var footer = s.reason === 'kicked' ? [h(T.Button, { key: 'here', variant: 'ghost', disabled: busy, onClick: function () { app.actions.reconnect('private_message'); } }, 'Reconnect here'), reload('primary')]
    : s.reason === 'lost' && !spent ? [reload('ghost'), h(T.Button, { key: 'retry', variant: 'primary', disabled: busy, onClick: function () { app.actions.reconnectSession(); } }, waiting ? 'Reconnect now' : 'Reconnect')]
    // Offline, a reload would lose the page: the automatic reconnection is the way back.
    : s.reason === 'offline' ? [reload('secondary')]
    : [reload('primary')];
  return h(Dialog, { role: 'alertdialog', label: copy.title, center: true, className: 'session', footer: footer },
    h('div', { className: 'session-head' },
      h('span', { className: cx('session-icon', s.reason === 'lost' && 'session-icon-warning') }, h(T.Icon, { name: copy.icon, size: 22 })),
      h('h2', null, copy.title),
      h('p', null, body)),
    status);
}
