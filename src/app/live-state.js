/* ---------- Live state: session, world and groups built for Root ---------- */
// A session loss only gives way to a reason of equal or higher rank.
var SESSION_RANK = { lost: 0, offline: 1, kicked: 2, denied: 3 };
/**
 * Tracks the session loss after a connection state change.
 * @param {Object} d Application state.
 * @param {{gid: string, state: string}} op Connection and its new state.
 */
function sessionAfterConn(d, op) {
  var s = d.session;
  if (op.state === 'open') {
    if (s && s.reason === 'kicked') return op.gid === 'private_message' ? null : s;
    return s && s.reason !== 'denied' && navigator.onLine ? null : s;
  }
  // Network back: if the reconnections started on its return all fail, "offline" gives way to "lost".
  if (s && !(s.reason === 'offline' && navigator.onLine)) return s;
  var joined = Object.keys(d.groups).map(function (k) { return d.groups[k]; }).filter(function (g) { return g.joined; });
  // Without a joined group, the PM connection still closed at startup would pass for a session loss.
  var down = joined.length && d.pmConn === 'closed' && joined.every(function (g) { return g.conn === 'closed'; });
  return down ? { reason: 'lost', attempts: 0 } : s;
}

function liveWorld(me) {
  var users = {}; users[me] = { status: 'online', self: true, about: '', style: {} };
  return {
    me: me, users: users, groups: {}, dms: {}, notifyOnline: {}, friendAdds: {}, mentionLog: [], mediaRev: 0, meStatus: 'online',
    route: { view: 'discover' }, lastChat: { view: 'discover' },
    sections: { favorites: true, groups: true, dms: true },
    groupsSeen: false, pmLoaded: false, friendsLoaded: false, pmChecked: null, pmrStatus: null, pmrDismissed: false
  };
}
/** Key of a ban list entry: unid and IP, like removeblock. */
function banKey(b) { return b.unid + ':' + b.ip; }
function blankBanPage() { return { loaded: false, more: false, loading: false }; }
/**
 * Returns a BetterChatango list loaded by pages: bans (block) or unbans (unblock).
 * @param {Object} g Live group.
 * @param {string} kind block or unblock.
 * @returns {{rows: Array, page: {loaded: boolean, more: boolean, loading: boolean}}} Loaded rows and list state.
 */
function banListOf(g, kind) { return kind === 'block' ? { rows: g.bans, page: g.live.banPage } : { rows: g.live.unbans, page: g.live.unbanPage }; }
function liveGroup(id, title) {
  var t = title || id;
  return {
    id: id, title: t, topic: t, joined: true, owned: false, favorite: false, muted: false, hiddenChannels: [], unread: 0, mentions: 0, lastReadTs: Date.now(),
    members: [], guestNames: [], guests: 0, liveCount: 0, messages: [], closed: false, bans: [], audit: [], dismissedAnnouncement: false,
    conn: 'open', historyDone: false, historyCapped: false, inited: false, membersLoaded: false, loadingMore: false,
    live: { flags: 0, mods: {}, owner: null, rate: null, bw: null, annc: null, modlog: null, banPage: blankBanPage(), banSearch: null, unbans: [], unbanPage: blankBanPage() },
    settings: mkSettings({ overview: { title: t, description: '' }, staff: {} })
  };
}
