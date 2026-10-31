/* ---------- Inbox: messages received and read ---------- */
var MENTION_MAX = 100;
/**
 * Records for the Mentions page a group message that mentions the user with the newest first.
 * @param {Object} d State being modified.
 * @param {string} gid Group of the message.
 * @param {Object} m Received message.
 */
function logMention(d, gid, m) {
  // An edit shown on its own joins its original when the original arrives: only the original enters the list.
  if (m.kind !== 'msg' || m.editId || m.author === d.me || userOf(d, m.author).ignored || !mentionsMe(d.me, m.text)) return;
  if (d.mentionLog.some(function (x) { return x.gid === gid && x.id === m.id; })) return;
  d.mentionLog.push({ gid: gid, id: m.id, author: m.author, text: messagePreview(m), ts: m.ts });
  d.mentionLog.sort(function (a, b) { return b.ts - a.ts; });
  d.mentionLog.splice(MENTION_MAX);
}
/**
 * Removes the messages of a group from the Mentions page.
 * @param {Object} d State being modified.
 * @param {string} gid Target group.
 * @param {?string[]} ids Removed messages, null for the whole group.
 */
function dropMentions(d, gid, ids) {
  d.mentionLog = d.mentionLog.filter(function (x) { return x.gid !== gid || (ids && ids.indexOf(x.id) < 0); });
}
