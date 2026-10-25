/* ---------- État live : session, monde et groupes construits pour Root ---------- */
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
    me: me, users: users, groups: {}, dms: {}, notifyOnline: {}, friendAdds: {}, typing: {}, mentionLog: [], mediaRev: 0, meStatus: 'online', awayText: '',
    profile: { visibility: { age: true, gender: false, location: true, meet: false, fullPage: true }, colors: { bg: '#1b1c20', text: '#e6e6e6', link: '#f27a3f' } },
    account: { email: '', verified: false },
    route: { view: 'discover' }, lastChat: { view: 'discover' },
    sections: { favorites: true, groups: true, dms: true },
    groupsSeen: false, pmLoaded: false, friendsLoaded: false, pmChecked: null, pmrStatus: null, pmrDismissed: false
  };
}
/** Clé d'une entrée de la liste des bannissements : unid et IP, comme removeblock. */
function banKey(b) { return b.unid + ':' + b.ip; }
function blankBanPage() { return { loaded: false, more: false, loading: false }; }
/**
 * Permet de lire une liste de Torch chargée par pages : bannissements (block) ou débannissements (unblock).
 * @param {Object} g Groupe live.
 * @param {string} kind block ou unblock.
 * @returns {{rows: Array, page: {loaded: boolean, more: boolean, loading: boolean}}} Lignes chargées et état de la liste.
 */
function banListOf(g, kind) { return kind === 'block' ? { rows: g.bans, page: g.live.banPage } : { rows: g.live.unbans, page: g.live.unbanPage }; }
function liveGroup(id, title) {
  var t = title || id;
  return {
    id: id, title: t, topic: t, joined: true, owned: false, favorite: false, muted: false, hiddenChannels: [], unread: 0, mentions: 0, lastReadTs: Date.now(),
    members: [], guestNames: [], guests: 0, liveCount: 0, messages: [], closed: false, discover: null, bans: [], audit: [], dismissedAnnouncement: false,
    conn: 'open', historyDone: false, historyCapped: false, inited: false, membersLoaded: false, loadingMore: false,
    live: { flags: 0, mods: {}, owner: null, rate: null, bw: null, annc: null, modlog: null, banPage: blankBanPage(), banSearch: null, unbans: [], unbanPage: blankBanPage() },
    settings: mkSettings({ overview: { title: t, description: '', showInDiscovery: true, membersPublic: true, nsfw: false }, staff: {} })
  };
}
