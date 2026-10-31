/* ---------- PMs: conversations, unreads and private history ---------- */

/**
 * BetterChatango PM archive in live: BetterChatango writes each PM to it itself, the bridge marks it read and counts the unreads in it.
 * @returns {{record: Function, markRead: function(string): Promise, unread: function(string): Promise<number>}} Archive.
 */
function betterChatangoPmArchive() {
  return {
    record: function () {},
    markRead: function (target) { return liveBridge.markPmRead(target); },
    unread: function (target) { return liveBridge.pmUnread(target); }
  };
}
/**
 * In-memory PM archive with the unread flag of each entry: the prototype one and the live one when the BetterChatango database is missing.
 * @param {Object=} seed Starting unreads by correspondent.
 * @returns {{record: Function, markRead: function(string): Promise, unread: function(string): Promise<number>}} Archive.
 */
function memoryPmArchive(seed) {
  var entries = [];
  Object.keys(seed || {}).forEach(function (t) { for (var i = 0; i < seed[t]; i++) entries.push({ target: t, unread: true, edit: false }); });
  return {
    record: function (target, m, unread) { entries.push({ target: target, unread: !!unread, edit: !!m.editId }); },
    markRead: function (target) { entries.forEach(function (e) { if (e.target === target) e.unread = false; }); return Promise.resolve(); },
    unread: function (target) { return Promise.resolve(entries.filter(function (e) { return e.target === target && e.unread && !e.edit; }).length); }
  };
}

/**
 * Copies into the state the unreads the archive counts as the only source of these counters.
 * @param {Object} archive PM archive.
 * @param {Function} update State update.
 * @param {Array<string>} names Correspondents to read again.
 * @returns {Promise} End of the copy.
 */
function syncPmUnread(archive, update, names) {
  return Promise.all(names.map(function (n) { return archive.unread(n); })).then(function (counts) {
    update(function (d) { names.forEach(function (n, i) { if (d.dms[n]) d.dms[n].unread = counts[i]; }); });
  }, warn);
}
/**
 * Marks a conversation read in the archive and copies its counter back.
 * @param {Object} archive PM archive.
 * @param {Function} update State update.
 * @param {string} name Correspondent.
 * @returns {Promise} End of the copy.
 */
function readPm(archive, update, name) {
  return archive.markRead(name).then(function () { return syncPmUnread(archive, update, [name]); }, warn);
}

/**
 * Finds or creates the conversation of a correspondent.
 * @param {Object} d State being modified.
 * @param {string} name Correspondent.
 * @param {Object=} extra Fields of a created conversation.
 */
function pmConversation(d, name, extra) {
  return d.dms[name] || (d.dms[name] = Object.assign({ messages: [], unread: 0, lastReadTs: Date.now() }, extra));
}
/**
 * Builds the shown message of a received or archived entry.
 * @param {Object} x Entry read by the bridge, or prototype message.
 */
function pmMessage(x) {
  // Edit without a loaded original: it takes the key of the original, which the archive and later edits target.
  var m = { id: uid(), from: x.from, key: x.editId || x.key, text: x.text, parts: x.parts, embeds: x.embeds, ts: x.ts, archiveTs: x.archiveTs };
  if (x.editId) { m.edited = true; m.editKeys = x.key ? [x.key] : []; }
  if (x.replyId) m.replyTo = { key: x.replyId };
  return m;
}
function applyEdit(o, m) { o.text = m.text; o.parts = m.parts; o.embeds = m.embeds; o.edited = true; }
/**
 * Applies a PM edit to its original and counts it once.
 * @param {Object} o Original message.
 * @param {Object} x Edit, with its own PM key.
 */
function applyPmEdit(o, x) {
  // The history replays on each OK the edits already applied live: their key keeps them from counting twice.
  if (x.key && (o.editKeys || []).indexOf(x.key) < 0) o.editKeys = (o.editKeys || []).concat([x.key]);
  applyEdit(o, x);
}
/**
 * Shows a PM just sent in its conversation.
 * Chatango does not send it back: an edit applies here to its original.
 * @param {Object} d State being modified.
 * @param {string} name Correspondent.
 * @param {Object} x Sent message, with its PM key and the key of the original for an edit.
 */
function addSentPm(d, name, x) {
  var c = pmConversation(d, name), o = pmEditTarget(c, x);
  if (o) { applyPmEdit(o, x); return; }
  c.messages.push(pmMessage(x));
  trimThread(c);
}
/**
 * Receives a PM in its conversation: an edit applies to its original and a new message reopens the conversation.
 * @param {Object} d State being modified.
 * @param {Object} x Received message (bridge pm op, or prototype message).
 * @returns {boolean} True if the message was an applied edit.
 */
function receivePm(d, x) {
  var c = pmConversation(d, x.from, { lastReadTs: 0 }), o = pmEditTarget(c, x);
  if (o) { applyPmEdit(o, x); return true; }
  c.closed = false;
  c.messages.push(pmMessage(x));
  c.messages.sort(function (a, b) { return a.ts - b.ts; });
  trimThread(c);
  return false;
}
/**
 * Merges private history entries into a conversation without duplicating the shown messages.
 * @param {Object} c Conversation in the state being modified.
 * @param {Array} list Entries read by the bridge, from oldest to newest.
 * @param {function(Object)} onEntry Receives each entry, to keep the author's style.
 */
function mergePmHistory(c, list, onEntry) {
  // The timestamp archived by BetterChatango differs from ours: same author and same content within two minutes = same message. Each message already shown covers only one entry.
  var shown = c.messages.slice();
  list.forEach(function (x) {
    onEntry(x);
    var o = pmEditTarget(c, x);
    if (o) { applyPmEdit(o, x); return; }
    var m = pmMessage(x), i = pmShownIndex(shown, m);
    if (i >= 0) { shown[i].archiveTs = m.archiveTs; shown.splice(i, 1); return; }
    c.messages.push(m);
  });
  c.messages.sort(function (a, b) { return a.ts - b.ts; });
  trimThread(c);
}

// -- Private messages in live -------------------------------------------------
// Chatango pushes no presence for a correspondent who is neither a friend nor connected since the last private connection.
var PRESENCE_REFRESH = 5 * MIN;
// Names per presence request, the page size of BetterChatango's Meet people.
var PRESENCE_MAX = 40;
/**
 * Merges the BetterChatango private history into the conversations and keeps the presence of their correspondents up to date.
 * @param {{state: Object, stateRef: Object, update: Function}} store Application state, its ref and its update.
 * @param {Object} localRef Ref to the account data kept in this browser.
 * @param {Object} pmArchive Ref to the PM archive.
 * @returns {{loadHistory: function(boolean=), refreshPresence: function(boolean)}} Private history loading and presence refresh.
 */
function useLivePms(store, localRef, pmArchive) {
  var state = store.state, stateRef = store.stateRef, update = store.update;
  var presenceAt = useRef(0);
  /**
   * Merges the BetterChatango private history into the conversations on each OK and after an import without duplicates.
   * @param {boolean=} imported True after an import, which may have added entries older than the loaded ones.
   */
  function loadPmHistory(imported) {
    liveBridge.pmHistory(100).then(function (hist) {
      var names = Object.keys(hist).filter(function (t) { return t !== stateRef.current.me; });
      update(function (d) {
        if (!d.auth.loggedIn) return;
        d.pmLoaded = true;
        d.pmHistoryRev++;
        names.forEach(function (t) {
          ensureLiveUser(d, t, localRef.current);
          var c = pmConversation(d, t, { closed: localRef.current.hidden.indexOf(t) >= 0 });
          // Set on the first OK: on a reconnection, the last 100 entries say nothing about the older pages already loaded. An import, however, can add some.
          if (c.olderMore == null || (imported && hist[t].more)) c.olderMore = hist[t].more;
          mergePmHistory(c, hist[t].list, pmAuthor(d, localRef.current));
        });
      });
      // The conversation open in front of the user becomes read, the others take the unreads from the archive.
      names.forEach(function (t) { if (isDmInView(stateRef.current, t)) readPm(pmArchive.current, update, t); });
      syncPmUnread(pmArchive.current, update, names.filter(function (t) { return !isDmInView(stateRef.current, t); }));
    });
  }
  /**
   * Asks again for the presence of the listed correspondents who are not friends.
   * @param {boolean} ifStale Only when the last request is older than PRESENCE_REFRESH.
   */
  function refreshPmPresence(ifStale) {
    var s0 = stateRef.current;
    // Before the friend list, a friend would get the approximate last online time of presence instead of the exact one of wl.
    if (!s0.pmLoaded || !s0.friendsLoaded || (ifStale && Date.now() - presenceAt.current < PRESENCE_REFRESH)) return;
    // The shown conversation follows its presence through connect, whose last online time is exact.
    var shown = s0.route.view === 'dm' ? s0.route.id : null;
    var names = listedDms(s0).filter(function (n) { return n !== s0.me && n !== shown && !userOf(s0, n).friend; }).slice(0, PRESENCE_MAX);
    if (names.length && liveBridge.refreshPresence(names)) presenceAt.current = Date.now();
  }
  useEffect(function () { if (LIVE && state.pmHistoryRev) refreshPmPresence(false); }, [state.pmHistoryRev, state.friendsLoaded]);
  useEffect(function () {
    if (!LIVE || !state.auth.loggedIn) return;
    var timer = setInterval(function () { if (document.visibilityState === 'visible') refreshPmPresence(true); }, MIN);
    return function () { clearInterval(timer); };
  }, [state.auth.loggedIn]);
  return { loadHistory: loadPmHistory, refreshPresence: refreshPmPresence };
}
