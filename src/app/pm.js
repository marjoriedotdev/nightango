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
  if (x.editId) m.edited = true;
  return m;
}
function applyEdit(o, m) { o.text = m.text; o.parts = m.parts; o.embeds = m.embeds; o.edited = true; }
/**
 * Receives a PM in its conversation: an edit applies to its original and a new message reopens the conversation.
 * @param {Object} d State being modified.
 * @param {Object} x Received message (bridge pm op, or prototype message).
 * @returns {boolean} True if the message was an applied edit.
 */
function receivePm(d, x) {
  var c = pmConversation(d, x.from, { lastReadTs: 0 }), o = pmEditTarget(c, x);
  if (o) { applyEdit(o, x); return true; }
  c.closed = false;
  c.messages.push(pmMessage(x));
  c.messages.sort(function (a, b) { return a.ts - b.ts; });
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
    if (o) { applyEdit(o, x); return; }
    var m = pmMessage(x), i = pmShownIndex(shown, m);
    if (i >= 0) { shown[i].archiveTs = m.archiveTs; shown.splice(i, 1); return; }
    c.messages.push(m);
  });
  c.messages.sort(function (a, b) { return a.ts - b.ts; });
}
