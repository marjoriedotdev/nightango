/* ---------- Pont vers le client Torch réel (mode injecté uniquement) ---------- */
var LIVE = !!window.__TORCH_LIVE__;

/** URL de la photo de profil Chatango, sur le même schéma que le client Torch ; null hors mode live ou pour un anonyme. */
function avatarSrc(name, size) {
  if (!LIVE) return null;
  var n = String(name || '').toLowerCase();
  if (!/^[a-z0-9_-]+$/.test(n)) return null;
  var path = /^[_-]/.test(n) ? 'sp/sp' + n : n.charAt(0) + '/' + (n.charAt(1) || n.charAt(0)) + '/' + n;
  return 'https://ust.chatango.com/profileimg/' + path + '/' + ((size || 36) <= 24 ? 'thumb' : 'thumb_m') + '.jpg';
}

var VISIT_LABEL = { log: 'visited', like: 'liked profile', dislike: 'disliked profile', msg: 'commented on', refer: 'referred by' };
var VISIT_PAGE = 16;
/**
 * Permet de découper une page d'activité vissle.
 * @param {Array} items Éléments renvoyés par vissle, le seizième signale une page suivante.
 * @param {string} get Filtre demandé, qui sert d'action quand vissle l'omet.
 */
function visitorPage(items, get) {
  var shown = items.slice(0, VISIT_PAGE - 1);
  return {
    rows: shown.map(function (x) {
      var user = String(x.user).toLowerCase(), name = String(x.name || x.user);
      return { key: x.time + ':' + user, user: user, name: name, guest: name.charAt(0) === '!', label: VISIT_LABEL[x.action || get], ts: Math.round(x.time * 1000), msg: x.msg || '' };
    }),
    next: items.length === VISIT_PAGE ? shown[shown.length - 1].time : null
  };
}

/* Bits Chatango, relevés dans le client Torch (chatango.flags) et recoupés avec chadango et chatango-lib. */
var GROUP_FLAG = { NOANONS: 4, NOCOUNTER: 16, NOIMAGES: 32, NOLINKS: 64, NOVIDEOS: 128, CHANNELSDISABLED: 8192, NLP_SINGLEMSG: 16384, NLP_MSGQUEUE: 32768, BROADCAST_MODE: 65536, IS_CLOSED: 262144, NLP_NGRAM: 2097152, NO_PROXIES: 4194304 };
var PERM_FLAG = { seeCounter: 64, seeIps: 16384, staffChannel: 128, modLog: 256, broadcast: 65536, bypass: 8192, bannedWords: 8, automod: 512, unbanAll: 1048576, editGroup: 32, editAnnouncement: 1024, editRestrictions: 16, manageMods: 2, closeGroup: 32768 };
var PERM_MASK = Object.keys(PERM_FLAG).reduce(function (n, k) { return n | PERM_FLAG[k]; }, 0);
// Droits qui font d'un modérateur un administrateur dans le vocabulaire Chatango.
var ADMIN_MASK = 2 | 4 | 16 | 32 | 1024 | 32768;
var CHANNEL_FLAG = { red: 256, blue: 2048, mod: 32768 };

function flagsToPerms(flags) { var o = {}; Object.keys(PERM_FLAG).forEach(function (k) { o[k] = !!(flags & PERM_FLAG[k]); }); return o; }
/** Applique des permissions à un masque existant sans toucher aux bits que l'interface ne gère pas. */
function permsToFlags(perms, base) {
  var f = (base || 0) & ~PERM_MASK;
  Object.keys(PERM_FLAG).forEach(function (k) { if (perms[k]) f |= PERM_FLAG[k]; });
  return f;
}
function liveRole(flags) { return flags & ADMIN_MASK ? 'admin' : 'mod'; }
/** Permissions effectives d'un membre dans un groupe live : le propriétaire a tous les droits. */
function livePerms(g, name) {
  if (!g || !g.settings) return allPerms(false);
  if (g.settings.staff[name] === 'owner') return allPerms(true);
  return flagsToPerms((g.settings.modFlags || {})[name] || 0);
}
function channelOf(flags) { return flags & CHANNEL_FLAG.mod ? 'mod' : flags & CHANNEL_FLAG.blue ? 'blue' : flags & CHANNEL_FLAG.red ? 'red' : 'none'; }

function liveWorld(me) {
  var users = {}; users[me] = { status: 'online', self: true, about: '', style: {} };
  return {
    me: me, users: users, groups: {}, dms: {}, typing: {}, meStatus: 'online', awayText: '',
    profile: { visibility: { age: true, gender: false, location: true, meet: false, fullPage: true }, colors: { bg: '#1b1c20', text: '#e6e6e6', link: '#f27a3f' } },
    account: { email: '', verified: false },
    route: { view: 'discover' }, lastChat: { view: 'discover' },
    sections: { favorites: true, groups: true, dms: true }
  };
}
function liveGroup(id, title) {
  var t = title || id;
  return {
    id: id, title: t, topic: t, joined: true, favorite: false, muted: false, unread: 0, mentions: 0, lastReadTs: Date.now(),
    members: [], guests: 0, liveCount: 0, messages: [], closed: false, discover: null, bans: [], audit: [], dismissedAnnouncement: false,
    conn: 'open', historyDone: false,
    live: { flags: 0, mods: {}, owner: null, rate: null, bw: null, annc: null, modlog: null, bansLoaded: false },
    settings: mkSettings({ overview: { title: t, description: '', showInDiscovery: true, membersPublic: true, nsfw: false }, staff: {} })
  };
}
