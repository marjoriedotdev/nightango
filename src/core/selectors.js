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
function userOf(state, name) { return state.users[name] || { status: 'offline', about: '', style: {} }; }
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
/**
 * Finds a loaded group message by its temporary or final id.
 * @param {Object} g Group in the state.
 * @param {string} id Message id.
 */
function findMsg(g, id) {
  if (!g || !id) return null;
  var plain = String(id).replace(/^k:/, '');
  for (var i = g.messages.length - 1; i >= 0; i--) { var x = g.messages[i]; if (x.id === plain || x.id === 'k:' + plain) return x; }
  return null;
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
 * Lists the shown conversations without closed conversations from newest to oldest.
 * @param {Object} state Application state.
 */
function listedDms(state) {
  return Object.keys(state.dms).filter(function (n) { return !state.dms[n].closed; })
    .sort(function (a, b) { return lastTs(state.dms[b]) - lastTs(state.dms[a]); });
}
/**
 * Counts the unread conversations without closed conversations.
 * @param {Object} state Application state.
 */
function unreadDmCount(state) { return listedDms(state).filter(function (n) { return state.dms[n].unread; }).length; }
/**
 * Tells whether a conversation is open in front of the user.
 * @param {Object} state Application state.
 * @param {string} name Conversation member.
 */
function isDmInView(state, name) { return state.route.view === 'dm' && state.route.id === name && document.visibilityState === 'visible'; }
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
