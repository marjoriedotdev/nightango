/* ---------- Bridge to the real BetterChatango client (injected mode only) ---------- */
var LIVE = !!window.__TORCH_LIVE__;
// Set by the page code before BetterChatango (loader/skin-journal.js): absent from the prototype and from the suites that only read the bridge.
var JOURNAL = window.__TORCH_JOURNAL__ || null;

// Outside React state: set by the bridge after an upload or a crop, it bypasses the HTTP cache of the pictures.
var AVATAR_VERSION = {};
/**
 * Builds the URL of a Chatango profile picture.
 * @param {string} name Account name.
 * @param {string} file File without extension: thumb, thumb_m or full.
 */
function profileImgSrc(name, file) {
  if (!LIVE) return null;
  var n = String(name || '').toLowerCase();
  if (!/^[a-z0-9_-]+$/.test(n)) return null;
  var path = /^[_-]/.test(n) ? 'sp/sp' + n : n.charAt(0) + '/' + (n.charAt(1) || n.charAt(0)) + '/' + n;
  return 'https://ust.chatango.com/profileimg/' + path + '/' + file + '.jpg' + (AVATAR_VERSION[n] ? '?v=' + AVATAR_VERSION[n] : '');
}
/**
 * Builds the URL of the Chatango profile thumbnail.
 * @param {string} name Account name.
 * @param {number} [size] Display size in pixels.
 */
function avatarSrc(name, size) { return profileImgSrc(name, (size || 36) <= 24 ? 'thumb' : 'thumb_m'); }

/**
 * Names the local storage key for the data of one account.
 * @param {string} me Lowercase username.
 */
function skinKey(me) { return 'torch-skin:' + me; }

var ACCOUNT_NAME = /^[a-z0-9_-]{1,20}$/;
/**
 * Tells whether the mini profile of an account is still pending.
 * @param {string} name Member name.
 * @param {Object} u Member in the state.
 */
function isProfilePending(name, u) { return LIVE && ACCOUNT_NAME.test(name) && !u.profileLoaded && !u.profileFailed; }

var VISIT_LABEL = { log: 'visited', like: 'liked profile', dislike: 'disliked profile', msg: 'commented on', refer: 'referred by' };
var VISIT_PAGE = 16;
/**
 * Splits a page of vissle activity.
 * @param {Array} items Items returned by vissle, the sixteenth signals a next page.
 * @param {string} get Requested filter, used as the action when vissle omits it.
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

/* Chatango bits, read in the BetterChatango client (chatango.flags) and cross-checked with chadango and chatango-lib. */
var GROUP_FLAG = { NOANONS: 4, NOCOUNTER: 16, NOIMAGES: 32, NOLINKS: 64, NOVIDEOS: 128, CHANNELSDISABLED: 8192, NLP_SINGLEMSG: 16384, NLP_MSGQUEUE: 32768, BROADCAST_MODE: 65536, IS_CLOSED: 262144, NLP_NGRAM: 2097152, NO_PROXIES: 4194304 };
var CHANNEL_FLAG = { red: 256, blue: 2048, mod: 32768 };
var MSG_FLAG = { PREMIUM: 4, BG_ON: 8 };
// Chatango fonts under their Chatango name, in the order of their number (0 to 8), the one used in the <f x…="n"> and <g x…="n"> tags.
var FONT_FACES = ['Arial', 'Comic', 'Georgia', 'Handwriting', 'Impact', 'Palatino', 'Papyrus', 'Times', 'Typewriter'];

// BetterChatango emoticons in the order of client.html: sm:// tag name, data-entity shortcuts (the first is the one BetterChatango inserts), system emoji.
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
  // Parameterized flag without an emoji: it shows as text.
  { name: 'stripes', keys: ['*stripes*?red,orange,yellow,green,blue,indigo,purple:33:1', '*team*'], premium: true, emoji: null },
  { name: 'sun', keys: ['*sun*'], premium: true, emoji: '☀️' },
  { name: 'rain', keys: ['*rain*'], premium: true, emoji: '🌧️' },
  { name: 'poop', keys: ['*poop*'], premium: true, emoji: '💩' },
  { name: 'hic', keys: ['*hic*'], premium: true, emoji: '🥴' } // approximation
];
// No prototype: the name comes from the member, constructor or __proto__ must find nothing.
var EMOTICON_BY_NAME = EMOTICONS.reduce(function (o, e) { o[e.name] = e; return o; }, Object.create(null));

function channelOf(flags) { return flags & CHANNEL_FLAG.mod ? 'mod' : flags & CHANNEL_FLAG.blue ? 'blue' : flags & CHANNEL_FLAG.red ? 'red' : 'none'; }
