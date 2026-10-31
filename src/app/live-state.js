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
    me: me, users: users, groups: {}, dms: {}, notifyOnline: {}, friendAdds: {}, mentionLog: [], mediaRev: 0, pmHistoryRev: 0, meStatus: 'online',
    route: { view: 'discover' }, lastChat: { view: 'discover' },
    sections: { favorites: true, groups: true, dms: true },
    groupsSeen: false, pmLoaded: false, friendsLoaded: false, pmChecked: null, pmrStatus: null, pmrDismissed: false, retrying: {}
  };
}
// Kind of each value kept by account in this browser, the local lists from before the sync with BetterChatango included.
var LOCAL_KINDS = { hidden: 'array', channels: 'object', unstyled: 'array', style: 'object', fav: 'array', muted: 'array', ignored: 'array' };
/**
 * Returns the account data stored in this browser without the values of another kind left by an older version or corrupted.
 * @param {*} stored Content of skinKey.
 */
function storedLocal(stored) {
  var out = {};
  if (kindOf(stored) !== 'object') return out;
  Object.keys(stored).forEach(function (k) { if (!LOCAL_KINDS.hasOwnProperty(k) || kindOf(stored[k]) === LOCAL_KINDS[k]) out[k] = stored[k]; });
  return out;
}
function blankLocal() { return { hidden: [], channels: {}, unstyled: [], style: null }; }
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

// -- Members, groups and messages of the live state ---------------------------
/**
 * Changes a live group of the state, ignored once signed out or for a group the state does not know.
 * @param {Function} update State update.
 * @param {string} gid Target group.
 * @param {function(Object, Object)} fn Change of the group, with the state being modified.
 */
function groupUpdate(update, gid, fn) { update(function (d) { if (!d.auth.loggedIn) return; var g = d.groups[gid]; if (g) fn(g, d); }); }
/**
 * Returns a live group, created if needed with its BetterChatango favorite and mute and its channels hidden in this browser.
 * @param {Object} d State being modified.
 * @param {string} gid Target group.
 * @param {Object} local Account data kept in this browser.
 */
function ensureLiveGroup(d, gid, local) {
  var g = d.groups[gid];
  if (!g) {
    g = d.groups[gid] = liveGroup(gid, gid);
    g.favorite = (liveBridge.favoriteGroups() || []).indexOf(gid) >= 0;
    g.muted = (liveBridge.mutedGroups() || []).indexOf(gid) >= 0;
    g.hiddenChannels = local.channels[gid] || [];
  }
  return g;
}
/**
 * Returns a live member, created if needed with their BetterChatango ignore and their style hidden in this browser.
 * @param {Object} d State being modified.
 * @param {string} name Target member.
 * @param {Object} local Account data kept in this browser.
 */
function ensureLiveUser(d, name, local) {
  var u = d.users[name];
  if (!u) {
    u = d.users[name] = { status: 'online', about: '', style: {} };
    if ((liveBridge.ignoredUsers() || []).indexOf(name) >= 0) u.ignored = true;
    if (local.unstyled.indexOf(name) >= 0) u.unstyled = true;
  }
  return u;
}
/**
 * Adds a member the state does not know yet as offline by default while their status is unknown.
 * @param {Object} d State being modified.
 * @param {string} name Target member.
 * @param {Object} local Account data kept in this browser.
 */
function ensureUnseenUser(d, name, local) {
  if (!d.users[name]) ensureLiveUser(d, name, local).status = 'offline';
}
/**
 * Counts as online a member present in a group except a friend whose presence comes from the private connection.
 * @param {Object} d State being modified.
 * @param {string} name Target member.
 * @param {Object} local Account data kept in this browser.
 */
function ensurePresentUser(d, name, local) {
  var u = ensureLiveUser(d, name, local);
  if (u.status === 'offline' && !u.friend) u.status = 'online';
}
/**
 * Applies a presence received from the bridge to a member.
 * @param {Object} u Member in the state.
 * @param {{status: string, lastOn: number, idleSince: number}} x Received presence.
 */
function applyPresence(u, x) {
  // Before IDLE_DELAY, an idle member stays shown as online: only idleSince keeps the inactivity.
  u.idleSince = x.status === 'idle' ? x.idleSince || u.idleSince || Date.now() : 0;
  u.status = x.status === 'idle' && Date.now() - u.idleSince < IDLE_DELAY ? 'online' : x.status;
  if (x.lastOn) u.lastOn = x.lastOn;
}
/**
 * Merges the style of a message into the member's style.
 * @param {Object} u Member in the state.
 * @param {?Object} style Style read in the message.
 * @param {number} ts Message timestamp in milliseconds.
 */
function mergeStyle(u, style, ts) {
  if (!style || ts <= u.styleTs) return;
  u.style = Object.assign({}, u.style, style);
  u.styleTs = ts;
}
/**
 * Keeps the author's style of each merged private history entry.
 * @param {Object} d State being modified.
 * @param {Object} local Account data kept in this browser.
 */
function pmAuthor(d, local) { return function (x) { mergeStyle(ensureLiveUser(d, x.from, local), x.style, x.ts); }; }
/** Translates the Chatango state of a group (flags, moderators, announcement) into the interface model. */
function deriveLive(g) {
  var L = g.live, F = GROUP_FLAG, f = L.flags, s = g.settings, staff = {};
  if (L.owner) staff[L.owner] = 'owner';
  Object.keys(L.mods).forEach(function (n) { if (n !== L.owner) staff[n] = roleOfFlags(L.mods[n]); });
  s.staff = staff;
  s.modFlags = Object.assign({}, L.mods);
  if (L.owner) delete s.modFlags[L.owner];
  s.media = { links: !(f & F.NOLINKS), images: !(f & F.NOIMAGES), videos: !(f & F.NOVIDEOS) };
  s.automod = Object.assign({}, s.automod, {
    filters: Object.assign({}, s.automod.filters, { nonsense: !!(f & (F.NLP_SINGLEMSG | F.NLP_NGRAM)), nonsenseMode: f & F.NLP_NGRAM ? 'Advanced' : 'Basic', repeat: !!(f & F.NLP_MSGQUEUE) }),
    proxies: !!(f & F.NO_PROXIES),
    slowMode: L.rate,
    banned: L.bw ? { part: L.bw.part, whole: L.bw.whole } : null
  });
  s.announcement = Object.assign({}, s.announcement, { broadcast: !!(f & F.BROADCAST_MODE) },
    L.annc ? { enabled: L.annc.enabled, text: L.annc.text, displayText: L.annc.displayText, embeds: L.annc.embeds, interval: Math.round(L.annc.interval / 60), intervalSec: L.annc.interval } : null);
  g.closed = !!(f & F.IS_CLOSED);
}
function withReply(g, m) {
  if (m.replyId) { var o = findMsg(g, m.replyId); m.replyTo = { id: o ? o.id : m.replyId }; }
  delete m.replyId;
  return m;
}
function editTarget(g, m) { var o = m.editId ? findMsg(g, m.editId) : null; return o && o.author === m.author ? o : null; }
/**
 * Applies a group edit to the original while keeping its count and its ids.
 * @param {Object} o Original message.
 * @param {{id: string, text: string, parts: ?Array, embeds: ?Array}} m Edit message.
 * @param {boolean=} keepText True to count the edit without replacing the text.
 */
function applyGroupEdit(o, m, keepText) {
  o.editCount = (o.editCount || 0) + 1;
  o.editIds = (o.editIds || []).concat([m.id]);
  if (!keepText) applyEdit(o, m);
}
/**
 * Folds into an original that arrived after them its edits shown on their own with the newest last.
 * @param {Object} g Group in the state.
 * @param {Object} o Original message, not in the message log yet.
 */
function mergeEdits(g, o) {
  var edits = g.messages.filter(function (x) { return x.editId === o.id && x.author === o.author; });
  if (!edits.length) return;
  edits.sort(function (a, b) { return a.ts - b.ts; }).forEach(function (e) { applyGroupEdit(o, e); });
  g.messages = g.messages.filter(function (x) { return edits.indexOf(x) < 0; });
}
/**
 * Adds a page of bans or unbans to its list.
 * @param {{rows: Array, page: Object}} list List read by banListOf, updated in place.
 * @param {{list: Array, more: boolean}} op Page received from the bridge.
 */
function receiveBanPage(list, op) {
  // Only the next page requested by Nightango is appended: a BetterChatango reload starts again from the first page.
  var next = list.page.loading, known = {};
  if (!next) list.rows.splice(0);
  list.rows.forEach(function (b) { known[banKey(b)] = true; });
  var fresh = op.list.filter(function (b) { return !known[banKey(b)]; });
  list.rows.push.apply(list.rows, fresh);
  list.page.more = op.more && (!next || fresh.length > 0);
  list.page.loaded = true;
  list.page.loading = false;
}
