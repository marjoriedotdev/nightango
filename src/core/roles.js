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
var ROLE_LABEL = { owner: 'Owner', admin: 'Admin', mod: 'Mod' };
var ROLE_LONG = { owner: 'Owner', admin: 'Admin', mod: 'Moderator' };
var ROLE_DESC = {
  owner: 'Created the group. Always has every permission and cannot be removed.',
  admin: 'A moderator allowed to change group settings.',
  mod: "A moderator who can't change group settings."
};
/* Bits de droits d'un modérateur Chatango, relevés dans le client BetterChatango (chatango.flags) et recoupés avec chadango et chatango-lib. */
var PERM_FLAG = { seeCounter: 64, seeIps: 16384, staffChannel: 128, modLog: 256, broadcast: 65536, bypass: 8192, bannedWords: 8, automod: 512, unbanAll: 1048576, editGroup: 32, editAnnouncement: 1024, editRestrictions: 16, manageMods: 2, closeGroup: 32768 };
var PERM_MASK = Object.keys(PERM_FLAG).reduce(function (n, k) { return n | PERM_FLAG[k]; }, 0);
// Droits qui font d'un modérateur un administrateur dans le vocabulaire Chatango.
var ADMIN_MASK = 2 | 4 | 16 | 32 | 1024 | 32768;
function allPerms(v) { var o = {}; PERMS.forEach(function (p) { o[p.key] = v; }); return o; }
function defaultRoles() {
  var mod = allPerms(false); mod.seeCounter = mod.seeIps = mod.staffChannel = mod.modLog = mod.broadcast = true;
  var admin = allPerms(true); admin.closeGroup = false;
  return { admin: admin, mod: mod };
}
function flagsToPerms(flags) { var o = {}; Object.keys(PERM_FLAG).forEach(function (k) { o[k] = !!(flags & PERM_FLAG[k]); }); return o; }
/** Applique des permissions à un masque existant sans toucher aux bits que l'interface ne gère pas. */
function permsToFlags(perms, base) {
  var f = (base || 0) & ~PERM_MASK;
  Object.keys(PERM_FLAG).forEach(function (k) { if (perms[k]) f |= PERM_FLAG[k]; });
  return f;
}
function roleOfFlags(flags) { return flags & ADMIN_MASK ? 'admin' : 'mod'; }
function mkSettings(over) {
  var s = Object.assign({
    overview: { title: '', description: '', showInDiscovery: true, membersPublic: true, nsfw: false },
    announcement: { enabled: false, text: '', broadcast: false, interval: 0 },
    automod: { level: 'standard', filters: { nonsense: true, nonsenseMode: 'Basic', repeat: true, flood: true, caps: false, links: true, emoji: false, mentions: true }, proxies: true, advancedProxy: false, verifiedEmail: false },
    media: { links: true, images: true, videos: true },
    staff: {}
  }, over || {});
  // Comme un modérateur ajouté sur Chatango, chacun part des droits par défaut de son rôle.
  s.modFlags = {};
  Object.keys(s.staff).forEach(function (n) { if (s.staff[n] !== 'owner') s.modFlags[n] = permsToFlags(defaultRoles()[s.staff[n]], 0); });
  return s;
}
var AUTOMOD_PRESETS = {
  off: { nonsense: false, nonsenseMode: 'Basic', repeat: false, flood: false, caps: false, links: false, emoji: false, mentions: false },
  standard: { nonsense: true, nonsenseMode: 'Basic', repeat: true, flood: true, caps: false, links: true, emoji: false, mentions: true },
  strict: { nonsense: true, nonsenseMode: 'Advanced', repeat: true, flood: true, caps: true, links: true, emoji: true, mentions: true }
};
