/* ---------- Reconnection of the live connections ---------- */
// Delays of the attempts that follow a connection loss: a Chatango restart makes an immediate retry fail.
var RECONNECT_DELAYS = [3000, 10000, 30000];
/**
 * Returns the state of a tracked connection: the private connection or a joined group.
 * @param {Object} s Application state.
 * @param {string} gid Group or private_message.
 * @returns {?string} open, connecting or closed, null for a left or unknown group.
 */
function connOf(s, gid) {
  if (gid === 'private_message') return s.pmConn || null;
  var g = s.groups[gid];
  return g && g.joined ? g.conn : null;
}
/**
 * Tells whether an automatic retry makes sense: visible page, network present, session neither kicked elsewhere, expired nor offline.
 * @param {Object} s Application state.
 */
function canRetry(s) { return (!s.session || s.session.reason === 'lost') && document.visibilityState === 'visible' && navigator.onLine; }

/**
 * Reconnects the groups and the private connection on demand, and automatically after a loss with RECONNECT_DELAYS between attempts.
 * @param {Object} stateRef Ref to the application state.
 * @param {Function} update State update.
 * @returns {{reconnect: function(string, boolean), startRetries: function(string), reconnectClosed: Function, follow: function(Object)}} Reconnections and the follow-up of a connection state.
 */
function useReconnection(stateRef, update) {
  // Automatic reconnections in progress, by connection: attempts made and timer of the next one.
  var retries = useRef({});
  /**
   * Restarts a connection and shows it connecting.
   * @param {string} gid Group or private_message.
   * @param {boolean} background True to leave the BetterChatango focus where it is.
   */
  function reconnect(gid, background) {
    liveBridge.reconnect(gid, background);
    update(function (d) { var g = d.groups[gid]; if (g) g.conn = 'connecting'; if (gid === 'private_message') d.pmConn = 'connecting'; });
  }
  /**
   * Restarts the closed connections with automatic attempts for each one that fails.
   */
  function reconnectClosed() {
    var s0 = stateRef.current, held = s0.session && SESSION_RANK[s0.session.reason] >= SESSION_RANK.kicked;
    if (!s0.auth.loggedIn) return;
    var gids = Object.keys(s0.groups).filter(function (gid) { var g = s0.groups[gid]; return g.joined && g.conn === 'closed'; });
    if (s0.pmConn === 'closed' && !held) gids.push('private_message');
    gids.forEach(startRetries);
  }
  /**
   * Restarts a connection without moving the BetterChatango focus when its group is not shown.
   * @param {string} gid Group or private_message.
   */
  function reconnectAuto(gid) {
    var r = stateRef.current.route;
    reconnect(gid, gid !== 'private_message' && !(r.view === 'group' && r.id === gid));
  }
  /**
   * Starts a sequence of automatic attempts with an immediate first one.
   * @param {string} gid Group or private_message.
   */
  function startRetries(gid) {
    stopRetry(gid);
    trackRetry(gid, { tries: 0, timer: null });
    reconnectAuto(gid);
  }
  /**
   * Records the sequence of a connection and copies its presence into the state, which the connection banner reads.
   * @param {string} gid Group or private_message.
   * @param {?{tries: number, timer: ?number}} r Sequence in progress, null when it ends.
   */
  function trackRetry(gid, r) {
    if (r) retries.current[gid] = r; else delete retries.current[gid];
    update(function (d) { if (!d.auth.loggedIn) return; if (r) d.retrying[gid] = true; else delete d.retrying[gid]; });
  }
  function stopRetry(gid) {
    var r = retries.current[gid];
    if (r) { clearTimeout(r.timer); trackRetry(gid, null); }
  }
  /**
   * Schedules the next attempt of a lost connection until RECONNECT_DELAYS runs out.
   * @param {string} gid Group or private_message.
   * @param {boolean} fresh True for a connection loss, false after a failed attempt.
   */
  function scheduleRetry(gid, fresh) {
    var prev = retries.current[gid], tries = fresh ? 0 : prev.tries;
    stopRetry(gid);
    if (!canRetry(stateRef.current)) return;
    if (tries >= RECONNECT_DELAYS.length) { liveBridge.note('Stopped reconnecting to ' + liveBridge.connName(gid) + ' after ' + tries + ' attempts'); return; }
    var delay = RECONNECT_DELAYS[tries];
    liveBridge.note('Reconnecting to ' + liveBridge.connName(gid) + ' in ' + delay / 1000 + ' s, attempt ' + (tries + 1) + ' of ' + RECONNECT_DELAYS.length);
    trackRetry(gid, { tries: tries + 1, timer: setTimeout(function () {
      var s0 = stateRef.current, conn = connOf(s0, gid);
      // Attempt already started elsewhere (Reconnect, network back): its failure resumes the sequence.
      if (conn === 'connecting') return;
      if (conn !== 'closed' || !canRetry(s0)) { stopRetry(gid); return; }
      reconnectAuto(gid);
    }, delay) });
  }
  /**
   * Starts or stops the automatic attempts of a connection whose state changes.
   * @param {{gid: string, state: string}} op Connection and its new state.
   */
  function follow(op) {
    // Only an open connection that closes starts the sequence: a failure at startup or a left group does not.
    var was = connOf(stateRef.current, op.gid);
    if (op.state === 'open') stopRetry(op.gid);
    else if (op.state === 'closed' && (was === 'open' || was === 'connecting' && retries.current[op.gid])) scheduleRetry(op.gid, was === 'open');
  }
  return { reconnect: reconnect, startRetries: startRetries, reconnectClosed: reconnectClosed, follow: follow };
}
