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
    me: me, users: users, groups: {}, dms: {}, notifyOnline: {}, friendAdds: {}, mentionLog: [], notes: {}, spaces: [], space: null, mediaRev: 0, pmHistoryRev: 0, meStatus: 'online',
    route: { view: 'discover' }, split: null, pip: null, lastChat: { view: 'discover' },
    sections: { favorites: true, groups: true, dms: true },
    groupsSeen: false, pmLoaded: false, friendsLoaded: false, pmChecked: null, pmrStatus: null, pmrDismissed: false, premium: null, retrying: {}
  };
}
// Kind of each value kept by account in this browser, the local lists from before the sync with BetterChatango included.
var LOCAL_KINDS = { hidden: 'array', channels: 'object', sendChannels: 'object', accents: 'object', notes: 'object', spaces: 'array', space: 'string', readTs: 'object', badges: 'object', unstyled: 'array', style: 'object', recentEmoji: 'array', fav: 'array', muted: 'array', ignored: 'array', premiumReminded: 'string' };
// The read position of the group in view moves with each message: its writes wait and go out together.
var READ_SAVE_MS = 2000;
var READ_POSITIONS_MAX = 100;
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
var NOTE_LABEL_MAX = 24, NOTE_TEXT_MAX = 500;
/**
 * Returns the private notes kept in this browser without the entries of another shape.
 * @param {Object} stored Notes by member name, untrusted.
 */
function storedNotes(stored) {
  var out = {};
  Object.keys(stored).forEach(function (n) {
    var x = stored[n];
    if (ACCOUNT_NAME.test(n) && kindOf(x) === 'object' && typeof x.label === 'string' && typeof x.note === 'string' && (x.label || x.note)) {
      out[n] = { label: x.label.slice(0, NOTE_LABEL_MAX), note: x.note.slice(0, NOTE_TEXT_MAX) };
    }
  });
  return out;
}
var SPACE_MEMBER = /^(group|dm):[a-z0-9_-]{1,20}$/;
/**
 * Returns the spaces kept in this browser without the entries of another shape.
 * @param {Array} stored Spaces, untrusted.
 */
function storedSpaces(stored) {
  return stored.filter(function (x) {
    return kindOf(x) === 'object' && typeof x.id === 'string' && typeof x.name === 'string' && x.name.trim() && kindOf(x.members) === 'array';
  }).slice(0, SPACE_MAX).map(function (x) {
    return { id: x.id, name: x.name.trim().slice(0, SPACE_NAME_MAX), quiet: x.quiet === true, members: x.members.filter(function (m) { return typeof m === 'string' && SPACE_MEMBER.test(m); }) };
  });
}
function blankLocal() { return { hidden: [], channels: {}, sendChannels: {}, accents: {}, notes: {}, spaces: [], space: '', readTs: {}, badges: {}, unstyled: [], style: null }; }
/**
 * Returns the most recent read positions of a map of read positions.
 * @param {Object} reads Server time of the newest read message by group.
 */
function newestReads(reads) {
  var keys = Object.keys(reads), out = {};
  if (keys.length <= READ_POSITIONS_MAX) return reads;
  keys.sort(function (a, b) { return reads[b] - reads[a]; }).slice(0, READ_POSITIONS_MAX).forEach(function (k) { out[k] = reads[k]; });
  return out;
}
/**
 * Closed conversations, hidden and sending channels, group colors, private notes, spaces, read positions, roles of group members, members with a hidden style and own style, kept by account in this browser in live.
 * @param {Object} state Application state.
 * @returns {{ref: Object, restore: function(string)}} Ref to the account data, and its reading at sign-in.
 */
function useLocalStore(state) {
  var localRef = useRef(blankLocal()), pending = useRef(null);
  function flush() {
    var p = pending.current;
    if (!p) return;
    pending.current = null;
    clearTimeout(p.timer);
    storageMerge(skinKey(p.me), p.o);
  }
  // A reload is also how live signs out: the read position waiting to be written goes out before the page leaves or is hidden, which a phone may end without pagehide.
  useEffect(function () {
    function onHidden() { if (document.visibilityState === 'hidden') flush(); }
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onHidden);
    return function () { window.removeEventListener('pagehide', flush); document.removeEventListener('visibilitychange', onHidden); };
  }, []);
  /**
   * Reads the account data at sign-in.
   * @param {string} me Signed-in account.
   */
  function restore(me) {
    var stored = storageGet(skinKey(me)) || {}, raw = JSON.stringify(stored);
    stored = storedLocal(stored);
    var lists = { fav: liveBridge.setFavorite, muted: liveBridge.setMuted, ignored: liveBridge.setIgnored };
    // Lists from before the sync with BetterChatango: moved into its own lists, removed from local storage once all are accepted.
    Object.keys(lists).forEach(function (k) { if (stored[k] && stored[k].map(function (x) { return lists[k](x, true); }).every(Boolean)) delete stored[k]; });
    if (JSON.stringify(stored) !== raw) storageSet(skinKey(me), stored);
    localRef.current = Object.assign(blankLocal(), stored);
  }
  var me = LIVE && state.auth.loggedIn ? state.me : null;
  // Runs again only when what it keeps can change: the own style, the conversations, the groups or the members.
  useEffect(function () {
    if (!me) return;
    var prev = localRef.current, o = blankLocal();
    o.style = state.ownStyle;
    o.notes = state.notes;
    o.spaces = state.spaces;
    o.space = state.space || '';
    // Local favorites, mutes and ignored members that BetterChatango has not accepted yet: kept for the next sign-in.
    o.fav = prev.fav;
    o.muted = prev.muted;
    o.ignored = prev.ignored;
    prev.hidden.forEach(function (n) { if (!state.dms[n]) o.hidden.push(n); });
    Object.keys(state.dms).forEach(function (n) { if (state.dms[n].closed) o.hidden.push(n); });
    Object.keys(prev.channels).forEach(function (k) { if (!state.groups[k]) o.channels[k] = prev.channels[k]; });
    Object.keys(state.groups).forEach(function (k) { if (state.groups[k].hiddenChannels.length) o.channels[k] = state.groups[k].hiddenChannels; });
    Object.keys(prev.sendChannels).forEach(function (k) { if (!state.groups[k]) o.sendChannels[k] = prev.sendChannels[k]; });
    Object.keys(state.groups).forEach(function (k) { if (state.groups[k].sendChannel !== 'none') o.sendChannels[k] = state.groups[k].sendChannel; });
    Object.keys(prev.accents).forEach(function (k) { if (!state.groups[k]) o.accents[k] = prev.accents[k]; });
    Object.keys(state.groups).forEach(function (k) { if (state.groups[k].accent) o.accents[k] = state.groups[k].accent; });
    Object.keys(prev.readTs).forEach(function (k) { if (!state.groups[k]) o.readTs[k] = prev.readTs[k]; });
    Object.keys(state.groups).forEach(function (k) { if (state.groups[k].lastReadTs != null) o.readTs[k] = state.groups[k].lastReadTs; });
    o.readTs = newestReads(o.readTs);
    Object.keys(prev.badges).forEach(function (k) { if (!state.groups[k]) o.badges[k] = prev.badges[k]; });
    Object.keys(state.groups).forEach(function (k) { var r = groupRoles(state.groups[k]); if (Object.keys(r).length) o.badges[k] = r; });
    prev.unstyled.forEach(function (n) { if (!state.users[n]) o.unstyled.push(n); });
    Object.keys(state.users).forEach(function (n) { if (state.users[n].unstyled) o.unstyled.push(n); });
    if (JSON.stringify(o) === JSON.stringify(prev)) return;
    var readOnly = JSON.stringify(Object.assign({}, o, { readTs: null })) === JSON.stringify(Object.assign({}, prev, { readTs: null }));
    localRef.current = o;
    // Merged with the storage: the bridge also sets the unread migration flag there.
    if (pending.current) pending.current.o = o;
    else pending.current = { me: me, o: o, timer: setTimeout(flush, READ_SAVE_MS) };
    if (!readOnly) flush();
  }, [me, state.ownStyle, state.notes, state.spaces, state.space, state.dms, state.groups, state.users]);
  return { ref: localRef, restore: restore };
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
    id: id, title: t, topic: t, joined: true, owned: false, favorite: false, muted: false, hiddenChannels: [], sendChannel: 'none', accent: null, unread: 0, mentions: 0, lastReadTs: null,
    members: [], guestNames: [], guests: 0, liveCount: 0, messages: [], closed: false, bans: [], audit: [], dismissedAnnouncement: false,
    conn: 'open', historyDone: false, historyCapped: false, inited: false, membersLoaded: false, loadingMore: false,
    live: { flags: 0, mods: {}, badges: {}, knownBadges: {}, owner: null, rate: null, cooldown: null, tempBan: null, refused: null, bw: null, annc: null, modlog: null, modlogPage: blankBanPage(), banPage: blankBanPage(), banSearch: null, unbans: [], unbanPage: blankBanPage() },
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
 * Returns a live group, created if needed with its BetterChatango favorite and mute and its hidden and sending channels, color, read position and member roles kept in this browser.
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
    g.sendChannel = local.sendChannels[gid] || 'none';
    g.accent = hexToRgb(local.accents[gid]) ? local.accents[gid] : null;
    g.lastReadTs = local.readTs[gid] || null;
    g.live.knownBadges = local.badges[gid] || {};
    g.settings.staff = staffOf(g.live);
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
// Period on which the members nothing refers to any more leave the state.
var PRUNE_EVERY = 5 * MIN;
/**
 * Lists the members the state refers to: in a group (member, guest, author, staff), in a conversation, in Meet people, in Mentions or as a pending friend.
 * @param {Object} s Application state.
 * @param {string[]} shown Members a view shows outside the state, kept by useShownUsers.
 * @returns {Object<string, boolean>} Referenced names.
 */
function referencedUsers(s, shown) {
  var names = Object.create(null);
  function add(n) { names[n] = true; }
  add(s.me);
  shown.forEach(add);
  Object.keys(s.groups).forEach(function (k) {
    var g = s.groups[k];
    g.members.concat(g.guestNames || [], Object.keys(g.settings.staff)).forEach(add);
    g.messages.forEach(function (m) { if (m.author) add(m.author); });
  });
  Object.keys(s.dms).concat(Object.keys(s.friendAdds), Object.keys(s.notifyOnline), s.meet ? s.meet.results : []).forEach(add);
  s.mentionLog.forEach(function (x) { add(x.author); });
  return names;
}
/**
 * Drops from the live state, on PRUNE_EVERY, the members nothing refers to any more: former members, authors of trimmed messages, search results.
 * Friends and the members the user ignores, blocks or shows without style stay, since their lists are read from the state.
 * The members a view shows while nothing in the state refers to them stay too: the linked accounts of Who is this, a profile opened from them.
 * @param {{stateRef: Object, update: Function}} store Ref to the application state and its update.
 * @param {boolean} loggedIn Signed in.
 * @returns {function(string[]): Function} Keeps members while a view shows them, and returns their release (useShownUsers).
 */
function usePrunedUsers(store, loggedIn) {
  // Number of views showing each member: two views can show the same one, the first to close must not release it.
  var shown = useRef(null);
  if (!shown.current) shown.current = Object.create(null);
  useEffect(function () {
    if (!LIVE || !loggedIn) return;
    var timer = setInterval(function () {
      var s = store.stateRef.current, kept = referencedUsers(s, Object.keys(shown.current));
      var gone = Object.keys(s.users).filter(function (n) { var u = s.users[n]; return !kept[n] && !u.friend && !u.ignored && !u.blocked && !u.unstyled; });
      if (gone.length) store.update(function (d) { gone.forEach(function (n) { delete d.users[n]; }); });
    }, PRUNE_EVERY);
    return function () { clearInterval(timer); };
  }, [loggedIn]);
  return useCallback(function (names) {
    var views = shown.current;
    names.forEach(function (n) { views[n] = (views[n] || 0) + 1; });
    return function () { names.forEach(function (n) { if (!--views[n]) delete views[n]; }); };
  }, []);
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
  // The time moves with the style only: a message that keeps the style leaves the member, and the users map, as they are.
  if (Object.keys(style).every(function (k) { return u.style[k] === style[k]; })) return;
  u.style = Object.assign({}, u.style, style);
  u.styleTs = ts;
}
/**
 * Keeps the spelling of a member's name carried by their most recent message that has one.
 * @param {Object} u Member in the state being modified.
 * @param {?string} spelling Name with its capitals, null for a message that carries none.
 * @param {number} ts Message timestamp.
 */
function mergeSpelling(u, spelling, ts) {
  // Like the style, the time moves with the spelling only: a message that keeps it leaves the member as they are.
  if (!spelling || ts <= u.spellingTs || spelling === u.spelling) return;
  u.spelling = spelling;
  u.spellingTs = ts;
}
/**
 * Keeps the author's style and spelling of each merged private history entry.
 * @param {Object} d State being modified.
 * @param {Object} local Account data kept in this browser.
 */
function pmAuthor(d, local) {
  return function (x) { var u = ensureLiveUser(d, x.from, local); mergeStyle(u, x.style, x.ts); mergeSpelling(u, x.spelling, x.ts); };
}
/**
 * Records the role shown by the badge of a group message, the highest seen during the session.
 * @param {Object} g Group being modified.
 * @param {string} name Message author.
 * @param {?string} badge Role of the badge, as returned by badgeRoleOf.
 */
function noteBadge(g, name, badge) {
  var seen = g.live.badges[name];
  if (!badge || seen === badge || seen === 'admin') return;
  g.live.badges[name] = badge;
  deriveLive(g);
}
/**
 * Returns the role of each staff member of a live group.
 * @param {Object} L Chatango state of the group.
 */
function staffOf(L) {
  var staff = {}, badges = Object.assign({}, L.knownBadges, L.badges);
  if (L.owner) staff[L.owner] = 'owner';
  Object.keys(L.mods).forEach(function (n) { if (n !== L.owner) staff[n] = roleOfFlags(L.mods[n]); });
  // Chatango sends the moderator list to staff only: other members learn roles from the badges on messages, those of earlier sessions included.
  if (!Object.keys(L.mods).length) Object.keys(badges).forEach(function (n) { if (n !== L.owner) staff[n] = badges[n]; });
  return staff;
}
/**
 * Returns the roles of a group kept in this browser, the owner left out since the ok frame names them on each join.
 * @param {Object} g Live group.
 */
function groupRoles(g) {
  var r = Object.assign({}, g.settings.staff);
  delete r[g.live.owner];
  return r;
}
/** Translates the Chatango state of a group (flags, moderators, announcement) into the interface model. */
function deriveLive(g) {
  var L = g.live, F = GROUP_FLAG, f = L.flags, s = g.settings;
  s.staff = staffOf(L);
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
  function isEdit(x) { return x.editId === o.id && x.author === o.author; }
  var edits = plainOf(g.messages).filter(isEdit);
  if (!edits.length) return;
  edits.sort(function (a, b) { return a.ts - b.ts; }).forEach(function (e) { applyGroupEdit(o, e); });
  g.messages = g.messages.filter(function (x) { return !isEdit(x); });
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
