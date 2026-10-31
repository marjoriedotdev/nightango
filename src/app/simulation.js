/* ---------- Prototype simulation: activity of the sample world ---------- */
/**
 * Simulates activity in the prototype: group messages and mentions, members joining and leaving, PMs, friends going online and offline.
 * @param {{state: Object, stateRef: Object, update: Function}} store Application state, its ref and its update.
 * @param {{receiveGroup: Function, receiveDm: Function}} inbox Reception of messages.
 * @param {Function} toast Shows a notification.
 * @param {Object} actions Actions, for the Message button of a friend who comes online.
 */
function useSimulation(store, inbox, toast, actions) {
  var state = store.state, prefs = state.prefs, stateRef = store.stateRef, update = store.update, receiveGroup = inbox.receiveGroup, receiveDm = inbox.receiveDm;
  useEffect(function () {
    if (LIVE || !state.auth.loggedIn || !prefs.simulate) return;
    var timer = null, alive = true;
    function tick() {
      if (!alive) return;
      var s0 = stateRef.current, r = Math.random(), me = s0.me;
      var joined = Object.keys(s0.groups).filter(function (k) { var g = s0.groups[k]; return g.joined && !g.closed && !g.settings.announcement.broadcast; });
      if (r < 0.62 && joined.length) {
        var gid = s0.route.view === 'group' && joined.indexOf(s0.route.id) >= 0 && Math.random() < 0.55 ? s0.route.id : pick(joined);
        var g = s0.groups[gid];
        var authors = g.members.filter(function (n) { return n !== me && userOf(s0, n).status !== 'offline'; });
        if (authors.length) {
          var author = pick(authors);
          var text = Math.random() < 0.12 ? pick(MENTION_LINES).replace('%me', me) : pick(LINES[gid] || LINES.generic);
          setTimeout(function () { if (!alive) return; receiveGroup(gid, { id: uid(), kind: 'msg', author: author, text: text, ts: Date.now() }); }, 1600);
        }
      } else if (r < 0.74 && joined.length) {
        var gid2 = pick(joined), g2 = s0.groups[gid2];
        var outside = ['rook', 'tallow', 'drift', 'pixelmint', 'petrichor'].filter(function (n) { return g2.members.indexOf(n) < 0 && !g2.bans.some(function (b) { return b.name === n; }); });
        var leaving = g2.members.filter(function (n) { return n !== me && !roleOf(g2, n); });
        if (outside.length && (Math.random() < 0.6 || !leaving.length)) {
          var who = pick(outside);
          update(function (d) { d.groups[gid2].members.push(who); });
        } else if (leaving.length) {
          var who2 = pick(leaving);
          update(function (d) { var x = d.groups[gid2]; x.members = x.members.filter(function (n) { return n !== who2; }); });
        }
      } else if (r < 0.84) {
        var senders = ['kestrel', 'sable', 'quill'].filter(function (n) { var u = userOf(s0, n); return !u.blocked && u.status !== 'offline'; });
        if (senders.length) {
          var from = pick(senders);
          setTimeout(function () { if (!alive) return; receiveDm(from, pick(DM_LINES[from] || DM_LINES.default)); }, 1800);
        }
      } else if (r < 0.92) {
        var friends = Object.keys(s0.users).filter(function (n) { return s0.users[n].friend && n !== me; });
        if (friends.length) {
          var f = pick(friends), cur = s0.users[f].status, next = cur === 'offline' ? 'online' : 'offline';
          update(function (d) { var u = d.users[f]; u.status = next; u.idleSince = 0; if (next === 'offline') u.lastOn = Date.now(); });
          if (next === 'online' && (isNotifyingOnline(s0, f) || s0.prefs.notify.friendOn.app)) {
            if (s0.prefs.notify.friendOn.sound) beep(s0.prefs.volume);
            toast(f + ' is online.', { icon: 'users', action: { label: 'Message', run: function () { actions.openDm(f); } } });
          }
          if (next === 'offline' && s0.prefs.notify.friendOff.app) toast(f + ' went offline.', { icon: 'users' });
        }
      }
      timer = setTimeout(tick, 5000 + Math.random() * 5000);
    }
    timer = setTimeout(tick, 4000);
    return function () { alive = false; clearTimeout(timer); };
  }, [state.auth.loggedIn, prefs.simulate]);
}
