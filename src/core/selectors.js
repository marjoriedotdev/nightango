function roleOf(group, name) { return group && group.settings && group.settings.staff ? group.settings.staff[name] || null : null; }
function isStaffRole(r) { return r === 'owner' || r === 'admin' || r === 'mod'; }
/**
 * Returns the permissions of a member in a group in live as in the prototype: the owner has every permission and a moderator those of their Chatango bits.
 * @param {Object} group Group.
 * @param {string} name Member.
 * @returns {Object} Permission by PERMS key.
 */
function groupRights(group, name) {
  var r = roleOf(group, name);
  if (r === 'owner') return allPerms(true);
  return r ? flagsToPerms(group.settings.modFlags[name] || 0) : allPerms(false);
}
/**
 * Tells whether a member can ban another: a moderator bans everyone except themselves and the owner.
 * @param {Object} group Group.
 * @param {string} me Member who bans.
 * @param {string} name Target member.
 */
function canBanMember(group, me, name) { return isStaffRole(roleOf(group, me)) && name !== me && roleOf(group, name) !== 'owner'; }
// One object for every unknown member: the rows that take its style as a prop keep the same props.
var UNKNOWN_USER = { status: 'offline', about: '', style: {} };
function userOf(state, name) { return ownOf(state.users, name) || UNKNOWN_USER; }
/**
 * Returns a member's name as they spell it, in lowercase until a message of theirs carries its capitals.
 * @param {Object} state Application state.
 * @param {string} name Member name in lowercase.
 */
function shownName(state, name) { return userOf(state, name).spelling || name; }
var PREMIUM_REMINDER_MS = 3 * 86400000;
/**
 * Tells whether the account has Premium according to the premium frame: status 200 (bought) or 210 (gifted) like BetterChatango, before its end.
 * @param {?{status: number, until: number}} p Premium of the state, null before the frame.
 * @param {number} now Current time in milliseconds.
 */
function premiumActive(p, now) { return !!p && (p.status === 200 || p.status === 210) && p.until > now; }
/**
 * Tells whether an active Premium ends within three days.
 * @param {?{status: number, until: number}} p Premium of the state, null before the frame.
 * @param {number} now Current time in milliseconds.
 */
function premiumEndsSoon(p, now) { return premiumActive(p, now) && p.until - now <= PREMIUM_REMINDER_MS; }
/**
 * Tells whether a member's messages are hidden: ignored member or blocked member when the block also applies in groups.
 * @param {Object} state Application state.
 * @param {string} name Target author.
 */
function isHiddenAuthor(state, name) { var u = userOf(state, name); return (u.ignored || (u.blocked && state.prefs.safety.syncBlocked)) && name !== state.me; }
/**
 * Tells whether a text mentions the user by @name.
 * @param {string} me User name.
 * @param {string} text Message text.
 */
function mentionsMe(me, text) { return new RegExp('@' + me + '(?![A-Za-z0-9_-])', 'i').test(text); }
function plainMsgId(id) { return String(id).replace(/^k:/, ''); }
/**
 * Finds a loaded group message by its temporary or final id.
 * @param {Object} g Group in the state.
 * @param {string} id Message id.
 */
function findMsg(g, id) {
  if (!g || !id) return null;
  var plain = plainMsgId(id), list = plainOf(g.messages);
  for (var i = list.length - 1; i >= 0; i--) { var x = list[i]; if (x.id === plain || x.id === 'k:' + plain) return g.messages[i]; }
  return null;
}
/**
 * Returns the route of a group opened at one of its loaded messages.
 * @param {Object} state Application state.
 * @param {string} gid Group.
 * @param {string} id Message id.
 */
function groupRouteAt(state, gid, id) {
  var m = findMsg(state.groups[gid], id);
  return m ? { view: 'group', id: gid, msgId: m.id } : { view: 'group', id: gid };
}
/**
 * Indexes the loaded messages of a group in one pass for repeated lookups.
 * @param {Object} g Group in the state.
 * @returns {function(?string): ?Object} Finds a message like findMsg.
 */
function msgFinder(g) {
  var byId = Object.create(null);
  g.messages.forEach(function (x) { byId[plainMsgId(x.id)] = x; });
  return function (id) { return id ? byId[plainMsgId(id)] || null : null; };
}
var THREAD_MAX = 500;
/**
 * Drops the oldest messages of a group or a private conversation beyond THREAD_MAX.
 * @param {{messages: Array, historyCapped: ?boolean}} t Group or conversation in the state being modified, messages sorted.
 */
function trimThread(t) {
  if (t.messages.length <= THREAD_MAX) return;
  t.messages.splice(0, t.messages.length - THREAD_MAX);
  // Older pages stop: a group's get_more counter would skip the removed messages, a PM page would be trimmed at once.
  t.historyCapped = true;
}
/**
 * Returns the guests of a group: names of the named guests and the total with anons included.
 * @param {Object} group Group.
 */
function guestsOf(group) {
  // The prototype has no guestNames: all its guests are anons.
  var names = group.guestNames || [];
  return { names: names, count: names.length + group.guests };
}
function resolvedTheme(prefs, viewerTheme) {
  if (prefs.theme === 'dark' || prefs.theme === 'light') return prefs.theme;
  if (viewerTheme === 'dark' || viewerTheme === 'light') return viewerTheme;
  try { return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'; } catch (e) { return 'dark'; }
}
/**
 * Tells whether the user is alerted when a member comes online.
 * @param {Object} state Application state.
 * @param {string} name Watched member.
 */
function isNotifyingOnline(state, name) { return !!state.notifyOnline[name]; }
/**
 * Lists the joined groups a member belongs to.
 * @param {Object} state Application state.
 * @param {string} name Member name.
 */
function commonGroups(state, name) {
  return Object.keys(state.groups).filter(function (k) { var g = state.groups[k]; return g.joined && g.members.indexOf(name) >= 0; });
}
function lastTs(c) { return c.messages.length ? c.messages[c.messages.length - 1].ts : 0; }
/**
 * Returns the read position of a group once its loaded messages are read.
 * @param {Object} g Group in the state.
 */
function readThrough(g) {
  // Only member messages carry the server time: event rows are stamped with the local clock.
  for (var i = g.messages.length - 1; i >= 0; i--) if (g.messages[i].kind === 'msg') return Math.max(g.lastReadTs || 0, g.messages[i].ts);
  return g.lastReadTs;
}
/**
 * Lists the shown conversations without closed conversations from newest to oldest.
 * @param {Object} state Application state.
 */
function listedDms(state) {
  return Object.keys(state.dms).filter(function (n) { return !state.dms[n].closed; })
    .sort(function (a, b) { return lastTs(state.dms[b]) - lastTs(state.dms[a]); });
}
/**
 * Lists the favorite people by name.
 * @param {Object} state Application state.
 */
function favoritePeople(state) {
  return Object.keys(state.users).filter(function (n) { return state.users[n].favorite; }).sort();
}
/**
 * Counts the unread conversations without closed conversations.
 * @param {Object} state Application state.
 */
function unreadDmCount(state) { return listedDms(state).filter(function (n) { return state.dms[n].unread; }).length; }
/**
 * Counts what waits for the user: the unread conversations and the mentions of every group.
 * @param {Object} state Application state.
 */
function unreadTotal(state) {
  return Object.keys(state.groups).reduce(function (n, k) { return n + (state.groups[k].mentions || 0); }, unreadDmCount(state));
}
/**
 * Tells whether a conversation is shown, in the main pane, side by side or in the floating window.
 * @param {Object} state Application state.
 * @param {string} view group or dm.
 * @param {string} id Group or conversation member.
 */
function isPaneOpen(state, view, id) {
  return isTarget(state.route, view, id) || isTarget(state.split, view, id) || isTarget(state.pip, view, id);
}
function isTarget(r, view, id) { return !!r && r.view === view && r.id === id; }
/**
 * Tells whether a conversation is in front of the user: shown in this tab while it is visible, or in the floating window, which stays on top.
 * @param {Object} state Application state.
 * @param {string} view group or dm.
 * @param {string} id Group or conversation member.
 */
function isInView(state, view, id) {
  return isTarget(state.pip, view, id) || ((isTarget(state.route, view, id) || isTarget(state.split, view, id)) && document.visibilityState === 'visible');
}
function isDmInView(state, name) { return isInView(state, 'dm', name); }
function isGroupInView(state, gid) { return isInView(state, 'group', gid); }
// Words and media as a sorted set: BetterChatango archives an image URL typed in the text as an <i s> tag.
function pmContentKey(m) {
  var media = (m.embeds || []).map(function (e) { return e.kind === 'youtube' ? 'yt:' + e.id : e.url; });
  return String(m.text).split(/\s+/).concat(media).filter(Boolean).sort().filter(function (v, i, a) { return v !== a[i - 1]; }).join(' ');
}
function pmEditTarget(c, m) { return m.editId ? c.messages.find(function (x) { return x.key === m.editId && x.from === m.from; }) : null; }
/**
 * Finds the shown message that covers a private history entry other than an applied edit.
 * @param {Array} list Shown messages.
 * @param {Object} x History entry with its archiveTs key.
 * @returns {number} Position of the message in list, -1 if none covers it.
 */
function pmShownIndex(list, x) {
  // An edit without a loaded original is shown under the key of the original.
  var key = x.editId || x.key, k = pmContentKey(x), i = list.findIndex(function (y) { return y.archiveTs === x.archiveTs; });
  // A message that already carries an archive key is another entry. Same PM key = same message, even if an edit changed its text.
  return i >= 0 ? i : list.findIndex(function (y) { return !y.archiveTs && (key && y.key ? y.key === key : y.from === x.from && pmContentKey(y) === k && Math.abs(y.ts - x.ts) < 120000); });
}
function statusLabel(s) { return s === 'online' ? 'Online' : s === 'idle' ? 'Idle' : 'Offline'; }
var GENDER_LABEL = { M: 'Male', F: 'Female' };
/**
 * Abbreviates the gender of a profile.
 * @param {string} g Gender in full.
 */
function genderShort(g) { return g === 'Male' ? 'M' : g === 'Female' ? 'F' : null; }
/**
 * Returns the readable colors of the Premium background of a mini profile.
 * @param {Object} prefs User preferences.
 * @param {Object} u Member in the state.
 * @param {string} theme Resolved theme.
 */
function miniStyleOf(prefs, u, theme) {
  var m = u.miniStyle;
  if (!prefs.styles.profileBackgrounds || !m || !m.bg) return null;
  var text = ensureContrast(m.text || SURFACE[theme].body, m.bg, 4.5);
  return { bg: m.bg, text: text, link: m.link ? ensureContrast(m.link, m.bg, 4.5) : text, image: m.image, repeat: m.repeat };
}
