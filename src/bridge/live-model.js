/* ---------- Pont vers le client Torch réel (mode injecté uniquement) ---------- */
var LIVE = !!window.__TORCH_LIVE__;

/**
 * Permet de construire l'URL d'une photo de profil Chatango.
 * @param {string} name Nom du compte.
 * @param {string} file Fichier sans extension : thumb, thumb_m ou full.
 */
function profileImgSrc(name, file) {
  if (!LIVE) return null;
  var n = String(name || '').toLowerCase();
  if (!/^[a-z0-9_-]+$/.test(n)) return null;
  var path = /^[_-]/.test(n) ? 'sp/sp' + n : n.charAt(0) + '/' + (n.charAt(1) || n.charAt(0)) + '/' + n;
  return 'https://ust.chatango.com/profileimg/' + path + '/' + file + '.jpg';
}
/**
 * Permet de construire l'URL de la miniature de profil Chatango.
 * @param {string} name Nom du compte.
 * @param {number} [size] Taille d'affichage en pixels.
 */
function avatarSrc(name, size) { return profileImgSrc(name, (size || 36) <= 24 ? 'thumb' : 'thumb_m'); }

var ACCOUNT_NAME = /^[a-z0-9_-]{1,20}$/;
/**
 * Permet de savoir si le mini profil d'un compte est encore attendu.
 * @param {string} name Nom du membre.
 * @param {Object} u Membre dans l'état.
 */
function isProfilePending(name, u) { return LIVE && ACCOUNT_NAME.test(name) && !u.profileLoaded && !u.profileFailed; }

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
// Polices Chatango dans l'ordre de leur numéro (0 à 8), celui des balises <f x…="n"> et <g x…="n">.
var FONT_FACES = ['Arial', 'Comic Sans MS', 'Georgia', 'Lucida Handwriting', 'Impact', 'Palatino', 'Papyrus', 'Times New Roman', 'Courier New'];

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

// Une session coupée ne cède la place qu'à une raison de rang égal ou supérieur.
var SESSION_RANK = { lost: 0, offline: 1, kicked: 2, denied: 3 };
/**
 * Permet de suivre la session coupée après un changement d'état d'une connexion.
 * @param {Object} d État de l'application.
 * @param {{gid: string, state: string}} op Connexion et son nouvel état.
 */
function sessionAfterConn(d, op) {
  var s = d.session;
  if (op.state === 'open') {
    if (s && s.reason === 'kicked') return op.gid === 'private_message' ? null : s;
    return s && s.reason !== 'denied' && navigator.onLine ? null : s;
  }
  // Réseau revenu : si les reconnexions lancées au retour échouent toutes, « offline » cède la place à « lost ».
  if (s && !(s.reason === 'offline' && navigator.onLine)) return s;
  var joined = Object.keys(d.groups).map(function (k) { return d.groups[k]; }).filter(function (g) { return g.joined; });
  // Sans groupe rejoint, la connexion MP encore fermée au démarrage passerait pour une coupure.
  var down = joined.length && d.pmConn === 'closed' && joined.every(function (g) { return g.conn === 'closed'; });
  return down ? { reason: 'lost', attempts: 0 } : s;
}

function liveWorld(me) {
  var users = {}; users[me] = { status: 'online', self: true, about: '', style: {} };
  return {
    me: me, users: users, groups: {}, dms: {}, notifyOnline: {}, friendAdds: {}, typing: {}, meStatus: 'online', awayText: '',
    profile: { visibility: { age: true, gender: false, location: true, meet: false, fullPage: true }, colors: { bg: '#1b1c20', text: '#e6e6e6', link: '#f27a3f' } },
    account: { email: '', verified: false },
    route: { view: 'discover' }, lastChat: { view: 'discover' },
    sections: { favorites: true, groups: true, dms: true },
    groupsSeen: false, pmLoaded: false, friendsLoaded: false, pmChecked: null
  };
}
function liveGroup(id, title) {
  var t = title || id;
  return {
    id: id, title: t, topic: t, joined: true, favorite: false, muted: false, unread: 0, mentions: 0, lastReadTs: Date.now(),
    members: [], guestNames: [], guests: 0, liveCount: 0, messages: [], closed: false, discover: null, bans: [], audit: [], dismissedAnnouncement: false,
    conn: 'open', historyDone: false, historyCapped: false, inited: false, membersLoaded: false, loadingMore: false,
    live: { flags: 0, mods: {}, owner: null, rate: null, bw: null, annc: null, modlog: null, bansLoaded: false },
    settings: mkSettings({ overview: { title: t, description: '', showInDiscovery: true, membersPublic: true, nsfw: false }, staff: {} })
  };
}
