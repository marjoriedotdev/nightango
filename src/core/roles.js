/* ---------- Données ---------- */
var PERMS = [
  { key: 'seeCounter', group: 'Visibility', title: 'See the member count', desc: 'Shows how many people are in the group, guests included.' },
  { key: 'seeIps', group: 'Visibility', title: 'See IP addresses', desc: 'Shows the IP behind each message. Needed to ban evaders.', sensitive: true },
  { key: 'staffChannel', group: 'Visibility', title: 'Access the staff channel', desc: 'Read and post in the channel only staff can see.' },
  { key: 'modLog', group: 'Visibility', title: 'See the moderation log', desc: 'Who deleted, banned or unbanned whom, and when.' },
  { key: 'broadcast', group: 'Moderation', title: 'Post in broadcast mode', desc: 'Keep posting while the group is limited to staff.' },
  { key: 'bypass', group: 'Moderation', title: 'Bypass AutoMod and rate limits', desc: 'Messages are never filtered or slowed down.' },
  { key: 'bannedWords', group: 'Moderation', title: 'Edit banned words', desc: 'Add or remove words that are blocked in the group.' },
  { key: 'automod', group: 'Moderation', title: 'Configure AutoMod', desc: 'Change filters and the protection level.' },
  { key: 'unbanAll', group: 'Moderation', title: 'Unban everyone', desc: 'Lift every ban at once from the Bans page.' },
  { key: 'editGroup', group: 'Administration', title: 'Edit group info', desc: 'Name, title, description and icon.' },
  { key: 'editAnnouncement', group: 'Administration', title: 'Edit the announcement', desc: 'Text, style and how often it is posted.' },
  { key: 'editRestrictions', group: 'Administration', title: 'Edit restrictions', desc: 'Media, links, proxies and verified email rules.' },
  { key: 'manageMods', group: 'Administration', title: 'Manage moderators', desc: 'Add and remove moderators and their permissions.' },
  { key: 'closeGroup', group: 'Administration', title: 'Close the group', desc: 'Stop everyone from posting until it reopens.' }
];
var ROLE_LOCKS = {
  mod: ['editGroup', 'editAnnouncement', 'editRestrictions', 'manageMods', 'closeGroup'],
  admin: ['closeGroup'],
  coowner: []
};
var ROLE_LABEL = { owner: 'Owner', coowner: 'Co-owner', admin: 'Admin', mod: 'Mod' };
var ROLE_LONG = { owner: 'Owner', coowner: 'Co-owner', admin: 'Admin', mod: 'Moderator' };
var ROLE_DESC = {
  owner: 'Created the group. Always has every permission and cannot be removed.',
  coowner: 'Runs the group with the owner. Can manage admins and close the group.',
  admin: 'Manages settings and moderators. Cannot close the group.',
  mod: "Keeps conversations on track. Can't change group settings."
};
function allPerms(v) { var o = {}; PERMS.forEach(function (p) { o[p.key] = v; }); return o; }
function defaultRoles() {
  var mod = allPerms(false); mod.seeCounter = mod.seeIps = mod.staffChannel = mod.modLog = mod.broadcast = true;
  var admin = allPerms(true); admin.closeGroup = false;
  return { coowner: allPerms(true), admin: admin, mod: mod };
}
function mkSettings(over) {
  return Object.assign({
    overview: { title: '', description: '', showInDiscovery: true, membersPublic: true, nsfw: false },
    announcement: { enabled: false, text: '', broadcast: false, interval: 0 },
    automod: { level: 'standard', filters: { nonsense: true, nonsenseMode: 'Basic', repeat: true, flood: true, caps: false, links: true, emoji: false, mentions: true }, proxies: true, advancedProxy: false, verifiedEmail: false },
    media: { links: true, images: true, videos: true },
    roles: defaultRoles(),
    staff: {}
  }, over || {});
}
var AUTOMOD_PRESETS = {
  off: { nonsense: false, nonsenseMode: 'Basic', repeat: false, flood: false, caps: false, links: false, emoji: false, mentions: false },
  standard: { nonsense: true, nonsenseMode: 'Basic', repeat: true, flood: true, caps: false, links: true, emoji: false, mentions: true },
  strict: { nonsense: true, nonsenseMode: 'Advanced', repeat: true, flood: true, caps: true, links: true, emoji: true, mentions: true }
};
