/* ---------- Pont vers le client Torch réel (mode injecté uniquement) ---------- */
var LIVE = !!window.__TORCH_LIVE__;
// Posé par le code page avant Torch (loader/skin-journal.js) : absent du prototype et des suites qui ne lisent que le pont.
var JOURNAL = window.__TORCH_JOURNAL__ || null;

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

/**
 * Permet de nommer la clé de stockage local des données propres à un compte.
 * @param {string} me Pseudo en minuscules.
 */
function skinKey(me) { return 'torch-skin:' + me; }

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
var CHANNEL_FLAG = { red: 256, blue: 2048, mod: 32768 };
var MSG_FLAG = { PREMIUM: 4, BG_ON: 8 };
// Polices Chatango dans l'ordre de leur numéro (0 à 8), celui des balises <f x…="n"> et <g x…="n">.
var FONT_FACES = ['Arial', 'Comic Sans MS', 'Georgia', 'Lucida Handwriting', 'Impact', 'Palatino', 'Papyrus', 'Times New Roman', 'Courier New'];

// Émoticônes de Torch dans l'ordre de client.html : nom de la balise sm://, raccourcis de data-entity (le premier est celui que Torch insère), emoji système.
var EMOTICONS = [
  { name: 'smile', keys: [':)', ':-)', '=]'], premium: false, emoji: '🙂' },
  { name: 'sad', keys: [':('], premium: false, emoji: '🙁' },
  { name: 'straight', keys: [':|'], premium: false, emoji: '😐' },
  { name: 'grin', keys: [':D', '=D', '<>'], premium: false, emoji: '😀' },
  { name: 'lol', keys: ['*lol*'], premium: false, emoji: '😂' },
  { name: 'angry', keys: [':@'], premium: false, emoji: '😡' },
  { name: 'tongue', keys: [':P'], premium: false, emoji: '😛' },
  { name: 'kiss', keys: [':x'], premium: false, emoji: '😚' },
  { name: 'surprise', keys: [':o'], premium: false, emoji: '😮' },
  { name: 'cry', keys: [';('], premium: false, emoji: '😢' },
  { name: 'wink', keys: [';)'], premium: false, emoji: '😉' },
  { name: 'cool', keys: ['8)'], premium: false, emoji: '😎' },
  { name: 'wrong', keys: ['(:'], premium: false, emoji: '🙃' },
  { name: 'pukes', keys: ['*pukes*'], premium: false, emoji: '🤮' },
  { name: 'sleep', keys: ['zzzz'], premium: false, emoji: '😴' },
  { name: 'heart', keys: ['*h*'], premium: false, emoji: '❤️' },
  { name: 'heartbreak', keys: ['*hb*'], premium: false, emoji: '💔' },
  { name: 'blush', keys: ['*blush*'], premium: false, emoji: '😊' },
  { name: 'waves', keys: ['*waves*'], premium: false, emoji: '👋' }, // approximation
  { name: 'peace', keys: ['~V'], premium: false, emoji: '✌️' }, // approximation
  { name: 'cell', keys: ['o_o)'], premium: false, emoji: '📱' }, // approximation
  { name: 'shhh', keys: ['_shhh'], premium: false, emoji: '🤫' },
  { name: 'bored', keys: ['*bored*'], premium: false, emoji: '🥱' }, // approximation
  { name: 'hamburger', keys: ['*burger*'], premium: false, emoji: '🍔' },
  { name: 'rolleyes', keys: ['*rolleyes*'], premium: false, emoji: '🙄' },
  { name: 'stop', keys: ['*stop*'], premium: false, emoji: '🛑' },
  { name: 'star', keys: ['*star*'], premium: false, emoji: '⭐' },
  { name: 'gift', keys: ['[~]'], premium: true, emoji: '🎁' }, // approximation
  { name: 'ninja', keys: ['(=)'], premium: true, emoji: '🥷' }, // approximation
  { name: 'pirate', keys: ['{b)'], premium: true, emoji: '🏴‍☠️' }, // approximation
  { name: 'clapping', keys: ['(~)'], premium: true, emoji: '👏' }, // approximation
  { name: 'whisper', keys: ['(o_o'], premium: true, emoji: '🤭' }, // approximation
  { name: 'hmmm', keys: ['_hmmm'], premium: true, emoji: '🤔' }, // approximation
  { name: 'thumbsdown', keys: ['~p'], premium: true, emoji: '👎' }, // approximation
  { name: 'twothumbsup', keys: ['~dd'], premium: true, emoji: '👍👍' }, // approximation
  { name: 'thumbsup', keys: ['~d'], premium: true, emoji: '👍' }, // approximation
  { name: 'nospeak', keys: [':*'], premium: true, emoji: '🙊' }, // approximation
  { name: 'nosee', keys: ['=_='], premium: true, emoji: '🙈' }, // approximation
  { name: 'nohear', keys: ['(o_o)'], premium: true, emoji: '🙉' }, // approximation
  { name: 'nerd', keys: ['-O_O-'], premium: true, emoji: '🤓' }, // approximation
  { name: 'idea', keys: ['*:)'], premium: true, emoji: '💡' }, // approximation
  { name: 'saint', keys: ['0:)'], premium: true, emoji: '😇' },
  { name: 'evil', keys: [']:)'], premium: true, emoji: '😈' },
  { name: 'dead', keys: ['x_x'], premium: true, emoji: '😵' },
  { name: 'basketball', keys: ['*bball*'], premium: true, emoji: '🏀' },
  { name: 'soccer', keys: ['*soccer*'], premium: true, emoji: '⚽' },
  { name: 'donut', keys: ['(o)'], premium: true, emoji: '🍩' }, // approximation
  { name: 'chocdonut', keys: ['*chocdonut*'], premium: true, emoji: '🍩' },
  { name: 'dollar', keys: ['*$*'], premium: true, emoji: '💲' },
  { name: 'warning', keys: ['*warning*'], premium: true, emoji: '⚠️' },
  { name: 'cat', keys: ['*cat*'], premium: true, emoji: '🐱' },
  { name: 'dog', keys: ['*dog*'], premium: true, emoji: '🐶' },
  { name: 'monkey', keys: ['*monkey*'], premium: true, emoji: '🐵' },
  { name: 'panda', keys: ['*panda*'], premium: true, emoji: '🐼' },
  { name: 'vampire', keys: ['*vampire*'], premium: true, emoji: '🧛' },
  { name: 'warewolf', keys: ['*werewolf*'], premium: true, emoji: '🐺' }, // approximation
  { name: 'ghost', keys: ['*ghost*'], premium: true, emoji: '👻' },
  { name: 'skull', keys: ['*skull*'], premium: true, emoji: '☠️' },
  { name: 'zombie', keys: ['*zombie*'], premium: true, emoji: '🧟' },
  { name: 'mummy', keys: ['*mummy*'], premium: true, emoji: '🤕' }, // approximation
  { name: 'troll', keys: ['*troll*'], premium: true, emoji: '👹' }, // approximation
  // Drapeau paramétré sans emoji : il s'affiche en texte.
  { name: 'stripes', keys: ['*stripes*?red,orange,yellow,green,blue,indigo,purple:33:1', '*team*'], premium: true, emoji: null },
  { name: 'sun', keys: ['*sun*'], premium: true, emoji: '☀️' },
  { name: 'rain', keys: ['*rain*'], premium: true, emoji: '🌧️' },
  { name: 'poop', keys: ['*poop*'], premium: true, emoji: '💩' },
  { name: 'hic', keys: ['*hic*'], premium: true, emoji: '🥴' } // approximation
];
// Sans prototype : le nom vient du membre, constructor ou __proto__ ne doivent rien trouver.
var EMOTICON_BY_NAME = EMOTICONS.reduce(function (o, e) { o[e.name] = e; return o; }, Object.create(null));

function channelOf(flags) { return flags & CHANNEL_FLAG.mod ? 'mod' : flags & CHANNEL_FLAG.blue ? 'blue' : flags & CHANNEL_FLAG.red ? 'red' : 'none'; }
