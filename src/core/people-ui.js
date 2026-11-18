import { T, h } from './globals.js';
import { ROLE_LABEL } from './roles.js';
import { shownName, statusLabel } from './selectors.js';
import { useAppApi, useStatePart } from './ui.js';
// -- People -------------------------------------------------------------------
// Registered accounts only: a guest carries a # before their name and cannot impersonate it.
var DEVELOPERS = ['marjorie'];
/**
 * Shows the short role of a member as a badge next to their name.
 * @param {?string} role Role of the member in the group.
 */
export function roleBadge(role) { return role ? h(T.Badge, role === 'owner' ? { tone: 'moon', icon: 'crown' } : { tone: 'moon-quiet', icon: 'shield' }, ROLE_LABEL[role]) : null; }
/**
 * Marks the user's own row in a list.
 * @param {boolean} isMe Row of the signed-in user.
 */
export function youBadge(isMe) { return isMe ? h(T.Badge, null, 'You') : null; }
/**
 * Marks a Nightango developer next to their name, as an icon in lists and messages.
 * @param {string} name Member name, in lowercase.
 * @param {boolean} [full] Shows the text, in the open profile.
 */
export function developerBadge(name, full) { return DEVELOPERS.indexOf(name) !== -1 ? traitBadge('code', 'Nightango developer', full) : null; }
/**
 * Marks a Chatango Premium account next to its name, as an icon in lists.
 * @param {boolean} premium Premium active according to the mini profile.
 * @param {boolean} [full] Shows the text, in the open profile.
 */
export function premiumBadge(premium, full) { return premium ? traitBadge('gem', 'Premium', full) : null; }
/**
 * Badge of a trait of a person, icon only unless the text is asked for.
 * @param {string} icon Icon name.
 * @param {string} label Trait name.
 * @param {boolean} [full] Shows the text.
 */
function traitBadge(icon, label, full) { return full ? h(T.Badge, { tone: 'moon', icon: icon }, label) : h(T.Badge, { tone: 'moon', icon: icon, label: label }); }
/**
 * Gives the presence of a list row to screen readers while the avatar dot stays visual only.
 * @param {string} status Member presence.
 */
export function presenceSr(status) { return h('span', { className: 'tc-sr' }, ', ' + statusLabel(status)); }
/**
 * Avatar and name of a person in a single button that opens their profile card.
 * @param {{name: string, label: string, gid: string, size: number, status: string, ring: string, avatarOnly: boolean, inert: boolean}} p Account name, name to show instead of the member's spelling, group the card opens from, avatar size, presence and outline of its dot, avatar without the name, plain text for someone without an account.
 */
export function Person(p) {
  var app = useAppApi(), shown = useStatePart(function (s) { return shownName(s, p.name); }), label = p.label || shown;
  var avatar = h(T.Avatar, { name: p.name, size: p.size, status: p.status, ring: p.ring }), text = p.avatarOnly ? null : h('span', { className: 'namebtn' }, label);
  if (p.inert) return h('span', { className: 'person-tag' }, avatar, text);
  return h('button', { type: 'button', className: p.avatarOnly ? 'avatar-btn' : 'person-tag', 'aria-label': 'View ' + label + "'s profile", onClick: function () { app.ui.openProfile(p.name, p.gid || null); } }, avatar, text);
}
