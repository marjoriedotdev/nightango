import { ACCOUNT_NAME, genderCode } from '../core/chatango.js';
import { LIVE } from '../core/env.js';
import { T, h, useEffect, useState } from '../core/globals.js';
import { RichText } from '../core/rich-text.js';
import { ROLE_LONG } from '../core/roles.js';
import { canBanMember, isNotifyingOnline, isPaneOpen, isProfilePending, miniStyleOf, roleOf, shownName, statusLabel, userOf } from '../core/selectors.js';
import { developerBadge, premiumBadge, presenceSr, useApp, useMinute, useShownUsers, youBadge } from '../core/ui.js';
import { ago, dayKey, dayLabel, elapsedShort, fmtTime, ownOf } from '../core/util.js';
import { favoriteItem } from './chrome.js';
// -- People --------------------------------------------------------------------
/**
 * Writes a member's presence with their last online time when it is known.
 * @param {Object} u Member in the state.
 */
export function presenceText(u) { return u.status === 'offline' && u.lastOn ? 'Last online ' + ago(u.lastOn) : statusLabel(u.status); }
/**
 * Writes a person's status line.
 * The line holds presence, friend and role in the group the profile is opened from.
 * @param {Object} s Application state.
 * @param {string} name Member name.
 * @param {?string} gid Group the profile is opened from.
 */
export function personStatus(s, name, gid) {
  var u = userOf(s, name), role = gid ? roleOf(s.groups[gid], name) : null;
  return [name === s.me ? statusLabel(s.meStatus) : presenceText(u), u.friend ? 'Friend' : null, role ? ROLE_LONG[role] + ' in #' + gid : null].filter(Boolean).join(' · ');
}
/**
 * Writes a person's ASL.
 * @param {Object} u Member in the state.
 */
export function personAsl(u) {
  return [u.age || null, genderCode(u.gender), u.location || null].filter(Boolean).join(' · ');
}
/**
 * Dates a friend's idle time or last online time.
 * @param {Object} u Member in the state.
 */
export function presenceSince(u) {
  if (!u.friend) return null;
  if (u.status === 'idle' && u.idleSince) return { ts: u.idleSince, text: 'Idle ' + elapsedShort(u.idleSince), title: 'Idle since ' };
  if (u.status === 'offline' && u.lastOn) return { ts: u.lastOn, text: elapsedShort(u.lastOn) + ' ago', title: 'Last online ' };
  return null;
}
/**
 * Idle or offline duration of a friend, refreshed every minute by the clock all relative times share.
 * @param {{user: Object}} p Member in the state.
 */
export function PresenceTime(p) {
  useMinute();
  var x = presenceSince(p.user);
  return x ? h('time', { className: 'tc-msg-time conv-time', dateTime: new Date(x.ts).toISOString(), title: x.title + new Date(x.ts).toLocaleString('en-GB') }, x.text) : null;
}
/**
 * Info line of a person.
 * @param {string} n Member name.
 * @param {Object} u Member in the state.
 */
export function personMetaLine(n, u) {
  return h('span', { className: 'conv-meta' }, personAsl(u), isProfilePending(n, u) ? h(T.Skeleton, { width: 72, height: 10 }) : null);
}
/**
 * Loads the mini profiles of a list of people and keeps them in the state while the list shows them.
 * @param {string[]} names People listed.
 */
export function useProfiles(names) {
  var app = useApp();
  useShownUsers(names);
  useEffect(function () { app.actions.loadProfiles(names); }, [names.join(',')]);
}
/**
 * Tracks the friend request sent from a form until Chatango answers.
 */
export function useFriendRequest() {
  var app = useApp();
  var a = useState(null), asked = a[0], setAsked = a[1];
  return {
    pending: asked && app.state.friendAdds[asked] ? asked : null,
    add: function (name) { app.actions.toggleUser(name, 'friend'); setAsked(name); }
  };
}
/**
 * Asks for confirmation before removing a friend.
 * @param {Object} app Application context.
 * @param {string} name Friend to remove.
 */
export function confirmRemoveFriend(app, name) {
  var who = shownName(app.state, name);
  app.ui.confirm({ title: 'Remove ' + who + ' from friends?', body: "You'll stop seeing when " + who + ' is online. You can add them again by username.', confirmLabel: 'Remove', danger: true, onConfirm: function () { app.actions.toggleUser(name, 'friend'); } });
}
/**
 * Offers a friend's online alert as a menu or list entry.
 * @param {Object} app Application context.
 * @param {string} name Followed friend.
 */
export function notifyOnlineItem(app, name) {
  var notify = isNotifyingOnline(app.state, name);
  return { id: 'notify', label: notify ? 'Notifying when online' : 'Notify when online', short: notify ? 'Notifying' : 'Notify', icon: 'bell', pressed: notify, onSelect: function () { app.update(function (d) { d.notifyOnline[name] = !notify; }); } };
}
/**
 * Offers to open a member's profile dialog.
 * @param {Object} app Application context.
 * @param {string} name Member name.
 * @param {?string} gid Group the profile is opened from.
 */
export function viewProfileItem(app, name, gid) {
  return { label: 'View profile', icon: 'user', onSelect: function () { app.ui.openProfile(name, gid); } };
}
/**
 * Offers in live the accounts vissle links to an account, never to a guest.
 * @param {Object} app Application context.
 * @param {string} name Member name.
 */
export function whoItem(app, name) {
  return LIVE && ACCOUNT_NAME.test(name) ? { id: 'who', label: 'Who is this', icon: 'users', onSelect: function () { app.ui.openWho(name); } } : null;
}
/**
 * Offers to ignore a member or to stop ignoring them.
 * @param {Object} app Application context.
 * @param {string} name Member name.
 * @param {boolean} ignored The member is ignored.
 */
export function ignoreItem(app, name, ignored) {
  return { id: 'ignore', label: ignored ? 'Stop ignoring' : 'Ignore', icon: 'eye-off', onSelect: function () { app.actions.toggleUser(name, 'ignored'); } };
}
/**
 * Offers to hide a member's style or to show it again.
 * @param {Object} app Application context.
 * @param {string} name Member name.
 * @param {boolean} unstyled The member's style is hidden.
 * @param {string} [shown] Member's name as they spell it, for a label that names them in a message menu.
 */
export function styleItem(app, name, unstyled, shown) {
  var label = (unstyled ? 'Show ' : 'Hide ') + (shown ? shown + "'s style" : 'style');
  return { id: 'style', label: label, icon: 'type', onSelect: function () { app.actions.toggleUser(name, 'unstyled'); } };
}
/**
 * Offers to ban a member from a group.
 * @param {Object} app Application context.
 * @param {string} name Member name.
 * @param {string} gid Group.
 * @param {Object} [msg] Message the ban starts from.
 */
export function banItem(app, name, gid, msg) {
  return { id: 'ban', label: 'Ban from #' + gid + '…', icon: 'ban', danger: true, closes: true, onSelect: function () { app.ui.ban(name, gid, msg); } };
}
/**
 * Splits the actions on a person into the groups of a menu: the relation with them, then what restricts them.
 * @param {Array} actions Actions of useProfileActions.
 */
export function personActionGroups(actions) {
  function pick(ids) { return actions.filter(function (it) { return ids.indexOf(it.id) >= 0; }); }
  return [pick(['message', 'friend', 'notify', 'favorite', 'who']), pick(['style', 'ignore', 'block', 'ban'])];
}
/**
 * Lists the actions on a person shared by the profile dialog, the panel and a PM menu.
 * An entry marked closes closes the profile dialog that shows it, and buttonLabel is its label as a button.
 * @param {string} name Member name.
 * @param {?string} gid Group the profile is opened from.
 */
export function useProfileActions(name, gid) {
  var app = useApp(), s = app.state, u = userOf(s, name), busy = !!ownOf(s.friendAdds, name);
  var g = gid ? s.groups[gid] : null;
  var inDm = isPaneOpen(s, 'dm', name);
  var friendLabel = busy ? 'Adding friend' : u.friend ? 'Remove friend' : 'Add friend';
  return [
    inDm ? null : { id: 'message', label: 'Message', icon: 'message', disabled: u.blocked, closes: true, onSelect: function () { app.actions.openDm(name); } },
    {
      id: 'friend', label: u.friend ? friendLabel + '…' : friendLabel, buttonLabel: friendLabel, icon: u.friend ? 'user-minus' : 'user-plus', disabled: busy,
      onSelect: function () { if (u.friend) confirmRemoveFriend(app, name); else app.actions.toggleUser(name, 'friend'); }
    },
    u.friend ? notifyOnlineItem(app, name) : null,
    favoriteItem(app, { view: 'dm', id: name }, u.favorite),
    whoItem(app, name),
    styleItem(app, name, u.unstyled),
    ignoreItem(app, name, u.ignored),
    {
      id: 'block', label: u.blocked ? 'Unblock' : 'Block…', icon: 'user-x', danger: !u.blocked, onSelect: function () {
        if (u.blocked) app.actions.toggleUser(name, 'blocked');
        else app.ui.confirm({ title: 'Block ' + shownName(app.state, name) + '?', body: shownName(app.state, name) + " won't be able to message you, and their messages are hidden in groups.", confirmLabel: 'Block', danger: true, onConfirm: function () { app.actions.toggleUser(name, 'blocked'); } });
      }
    },
    g && canBanMember(g, s.me, name) ? banItem(app, name, gid) : null
  ].filter(Boolean);
}
/**
 * Person card in Meet people.
 * @param {Object} s Application state.
 * @param {string} n Member name.
 * @param {string} theme Resolved theme.
 * @param {Function} onClick Opens the card.
 * @param {boolean} [noStatus] True where Nightango has no presence for the account: no dot, neither online nor offline.
 */
export function personCard(s, n, theme, onClick, noStatus) {
  var u = userOf(s, n), isMe = n === s.me, status = noStatus ? null : isMe ? s.meStatus : u.status, mini = miniStyleOf(s.prefs, u, theme);
  var about = u.aboutHtml ? h(RichText, { html: u.aboutHtml, inline: true, bg: mini ? mini.bg : null }) : u.about || null;
  return h('button', { key: n, type: 'button', className: 'conv person' + (mini ? ' mini-bg' : ''), style: mini ? { backgroundColor: mini.bg, color: mini.text } : null, onClick: onClick },
    h(T.Avatar, { name: n, size: 44, status: status, ring: mini ? mini.bg : 'var(--panel)' }),
    h('span', { className: 'conv-main' },
      h('span', { className: 'conv-top' }, h('span', { className: 'conv-name' }, shownName(s, n)), status ? presenceSr(status) : null, youBadge(isMe), developerBadge(n), premiumBadge(u.premium)),
      personMetaLine(n, u),
      isProfilePending(n, u) ? h('span', { className: 'conv-about skel-about' }, h('span', { className: 'tc-sr' }, 'Loading profile'), h(T.Skeleton, { width: 220, height: 10 }), h(T.Skeleton, { width: 130, height: 10 }))
        : h('span', { className: 'conv-about' }, about || (u.profileMissing ? 'No public profile.' : null))));
}
/**
 * Message outside its log that opens the log on click.
 * It is a mention on the Mentions page or a PM search result.
 * @param {{name: string, ts: number, meta: ?string, text: *, onClick: Function}} p Shown member, timestamp, optional context line, text and opening.
 */
export function MessageEntry(p) {
  var s = useApp().state, h24 = s.prefs.h24;
  return h('button', { type: 'button', className: 'conv person', onClick: p.onClick },
    h(T.Avatar, { name: p.name, size: 28 }),
    h('span', { className: 'conv-main' },
      h('span', { className: 'conv-top' },
        h('span', { className: 'conv-name' }, shownName(s, p.name)),
        h('time', { className: 'tc-msg-time', dateTime: new Date(p.ts).toISOString(), title: new Date(p.ts).toLocaleString('en-GB') }, entryTime(p.ts, h24))),
      p.meta ? h('span', { className: 'conv-meta' }, p.meta) : null,
      h('span', { className: 'conv-about', dir: 'auto' }, p.text)));
}
/**
 * Dates a message outside its log with the time, preceded by the day unless it is today.
 * @param {number} ts Message timestamp.
 * @param {boolean} h24 24-hour format.
 */
function entryTime(ts, h24) { return (dayKey(ts) === dayKey(Date.now()) ? '' : dayLabel(ts) + ', ') + fmtTime(ts, h24); }
