// -- Emoticons ----------------------------------------------------------------

// BetterChatango emoticons in the order of client.html: sm:// tag name, data-entity shortcuts (the first is the one BetterChatango inserts), system emoji.
export var EMOTICONS = [
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
export var EMOTICON_BY_NAME = EMOTICONS.reduce(function (o, e) { o[e.name] = e; return o; }, Object.create(null));

