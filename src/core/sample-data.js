var LINES = {
  community: ['Did the reconnect fix stick for everyone?', 'Theme import works on Firefox now.', 'Is there a way to pin a group to the top?', 'Welcome to the new folks.', 'The compact mode is so much easier to read.', 'Anyone tried the light theme on mobile?', 'Server s12 seems stable again.', 'How do I turn names colors back on?', 'Thanks for the quick fix.', 'Reminder: bug reports go to #torchdev.'],
  torchdev: ['Pushed a fix for the reply preview.', 'CI is green again.', 'Can someone review the AutoMod copy?', 'Safari still clips the composer on iOS 17.', 'Merged the notification matrix.'],
  trade: ['Selling a 6 month Premium gift, PM me.', 'Looking for an old 4 letter name.', 'Anyone have spare gifts?', 'Price check on a 3 letter username?'],
  retrogaming: ['Speedrun night is Friday at 21:00.', 'Just finished a Dreamcast restore.', 'Which emulator do you use for PS2?', 'Found a boxed copy at a flea market.'],
  bots: ['!help', 'Commands: !weather, !define, !roll', 'Rolled a 17.', '!roll 20'],
  artcorner: ['New palette challenge is up.', 'WIP of my pixel city.', 'Feedback welcome on the lighting.'],
  generic: ['Hi everyone.', 'Evening all.', 'That makes sense.', 'Back in a bit.', 'Nice.']
};
var MENTION_LINES = ['@%me do you have a minute to test the new build?', '@%me nice theme, can you share the file?', '@%me thanks for the help earlier.', '@%me are you joining speedrun night?'];
var DM_LINES = {
  sable: ["Logs look clean on my side. I think it's Chatango.", 'Ping me if the drops come back.', 'Sounds good.', "I'll pin it in the announcement."],
  kestrel: ['Still interested in that trade?', 'I can do two gifts for it.', 'No rush, let me know.'],
  quill: ['Thanks again for the invite.', 'The light theme is nice.', 'See you in #retrogaming.'],
  halcyon: ['Game night is still on Friday.', 'Bring snacks.'],
  default: ['Hey.', 'Sure.', 'Sounds good.', 'Talk later.']
};

function seedWorld(me) {
  var now = Date.now();
  function t(m) { return now - m * MIN; }
  function msg(author, text, m, extra) { return Object.assign({ id: uid(), kind: 'msg', author: author, text: text, ts: t(m) }, extra || {}); }
  var users = {
    ember: { status: 'online', age: 31, location: 'Bristol, UK', about: "Started Torch. Breaks things on purpose so you don't have to.", style: { nameColor: '#ff5f1f', font: 'Georgia', textColor: '#ffd9c2' } },
    sable: { status: 'online', age: 24, location: 'Lyon, France', about: 'Moderator in community. Night shifts, mostly. Ask before posting links.', friend: true, style: { nameColor: '#3f7fff', textColor: '#cfe0ff' } },
    vantage: { status: 'idle', idleSince: t(40), age: 29, location: 'Oslo, Norway', about: 'Moderator. Quiet most of the time.', style: { nameColor: '#00bcd4' } },
    kestrel: { status: 'online', age: 22, location: 'Leeds, UK', about: 'Trading usernames since 2014.', style: { nameColor: '#2ecc71', font: 'Courier New' } },
    marrow: { status: 'online', age: 35, location: '', about: 'Breaks networks for a living.', style: { nameColor: '#a0522d', bg: '#3b2414' } },
    nightowl: { status: 'online', age: 26, location: 'Montréal, Canada', about: 'Themes, fonts and too much coffee.', style: { nameColor: '#9b59b6', font: 'Comic Sans MS', textColor: '#e0b0ff', bg: '#24133f' } },
    quill: { status: 'idle', idleSince: t(14), age: 23, location: 'Dublin, Ireland', about: 'Mostly in #retrogaming.', friend: true, style: { nameColor: '#e91e63' } },
    drift: { status: 'online', age: 20, location: '', about: '', style: {} },
    halcyon: { status: 'offline', lastOn: t(190), age: 28, location: 'Porto, Portugal', about: 'Runs game night.', friend: true, style: { nameColor: '#ffeb3b' } },
    petrichor: { status: 'offline', age: 33, location: '', about: '', style: {} },
    pixelmint: { status: 'online', age: 21, location: 'Gent, Belgium', about: 'Pixel artist.', style: { nameColor: '#00e5a0' } },
    rook: { status: 'online', age: 27, location: '', about: '', style: {} },
    tallow: { status: 'idle', idleSince: t(6), age: 30, location: '', about: '', style: {} }
  };
  users[me] = { status: 'online', age: 27, gender: 'Not specified', location: 'Rennes, France', about: 'Building themes for Torch. Usually in #community and #torchdev. Ping me for theme import issues.', style: {}, self: true };

  function group(id, o) {
    return Object.assign({
      id: id, title: '', topic: '', joined: false, favorite: false, muted: false, hiddenChannels: [], unread: 0, mentions: 0, lastReadTs: now,
      members: [], guests: 0, messages: [], closed: false, discover: null, bans: [], audit: [], dismissedAnnouncement: false
    }, o);
  }
  var groups = {};
  var known = msg('sable', "Known issue on server s12, it's on Chatango's side. Reconnecting twice usually sticks.", 18);
  groups.community = group('community', {
    title: 'Official Torch Client community', topic: 'Official Torch Client community. Bug reports go to #torchdev.', joined: true, favorite: true,
    members: ['ember', 'sable', 'vantage', me, 'kestrel', 'marrow', 'nightowl', 'quill', 'drift', 'halcyon', 'petrichor', 'rook', 'tallow'], guests: 12,
    discover: { official: true, topic: 'Tech', desc: 'Official Torch Client community.' },
    settings: mkSettings({
      overview: { title: 'Official Torch Client community', description: 'Help, feedback and announcements for the Torch Client. Be kind, no spam.', showInDiscovery: true, membersPublic: true, nsfw: false },
      announcement: { enabled: true, text: 'Server s12 drops connections today. If you get disconnected, reconnect twice.', broadcast: false, interval: 0 },
      staff: (function () { var s = { ember: 'owner', sable: 'mod', vantage: 'mod' }; s[me] = 'admin'; return s; })()
    }),
    bans: [
      { name: 'spamking', by: 'sable', at: t(60 * 26), reason: 'Link spam', ip: '84.12.x.x' },
      { name: '!anon4821', by: 'vantage', at: t(60 * 50), reason: 'Ban evasion', ip: '91.207.x.x' }
    ],
    audit: [
      { id: uid(), at: t(60 * 50), actor: 'vantage', text: 'Banned !anon4821 for ban evasion' },
      { id: uid(), at: t(60 * 30), actor: 'ember', text: 'Set AutoMod to Standard' },
      { id: uid(), at: t(60 * 26), actor: 'sable', text: 'Banned spamking for link spam' },
      { id: uid(), at: t(25), actor: 'sable', text: 'Updated the announcement' }
    ],
    messages: [
      msg('ember', 'Torch 0.1.0-b is out. Changelog: https://github.com/Vissle-Drissle/Torch-Client', 60 * 24 + 40),
      msg('quill', 'The new sidebar is so much calmer.', 60 * 24 + 35),
      msg('kestrel', 'Anyone else getting dropped from #trade every few minutes since this morning?', 19),
      known,
      msg('sable', "I've put a note in the group announcement until it's fixed.", 18),
      msg('quill', 'Confirmed, the second reconnect held. Thanks.', 16, { replyTo: { id: known.id } }),
      msg('marrow', "Here's what the reconnect loop looks like on my side:", 14, { embeds: [{ kind: 'image', url: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180"><rect width="320" height="180" fill="#0d0e10"/><g font-family="monospace" font-size="11" fill="#8a8e96"><text x="14" y="26">[ws] connecting s12.chatango.com:8081</text><text x="14" y="46" fill="#f08a8a">[ws] closed (1006) after 41s</text><text x="14" y="66">[ws] reconnect 1/3</text><text x="14" y="86" fill="#f08a8a">[ws] closed (1006) after 2s</text><text x="14" y="106">[ws] reconnect 2/3</text><text x="14" y="126" fill="#3fb27f">[ws] connected, joined #community</text></g></svg>') }] }),
      msg('nightowl', '@' + me + ' the theme you exported imports cleanly now, nice work.', 12),
      msg(me, "Good to hear. I'll publish the light variant tonight.", 11)
    ]
  });
  groups.torchdev = group('torchdev', {
    title: 'Bug reports and development', topic: 'Bug reports and development. One issue per message.', joined: true, favorite: true,
    members: ['ember', 'vantage', 'nightowl', 'quill', me, 'rook'], guests: 2, unread: 4, mentions: 2, lastReadTs: t(30),
    discover: { official: true, topic: 'Tech', desc: 'Bug reports and development.' },
    settings: mkSettings({ overview: { title: 'Bug reports and development', description: 'Report bugs with steps to reproduce.', showInDiscovery: true, membersPublic: true, nsfw: false }, staff: { ember: 'owner', vantage: 'mod' } }),
    messages: [
      msg('ember', 'Weekly triage starts in ten minutes.', 60 * 3),
      msg('ember', 'Pushed the theme importer fix to main.', 25),
      msg('vantage', '@' + me + ' can you check the import on Firefox?', 22),
      msg('quill', 'Firefox works here.', 20),
      msg('nightowl', '@' + me + ' Safari drops the backdrop color on import.', 8)
    ]
  });
  groups.trade = group('trade', {
    title: 'Premium and account trades', topic: 'Premium and account trades. Use the Mod channel for disputes.', joined: true,
    members: ['kestrel', 'marrow', 'drift', me, 'tallow'], guests: 9, unread: 3, lastReadTs: t(45),
    discover: { official: true, topic: 'Trade', desc: 'Premium and account trades.' },
    settings: mkSettings({ staff: { ember: 'owner' } }),
    messages: [msg('kestrel', 'Selling a 6 month Premium gift, PM me.', 40), msg('drift', 'Looking for an old 4 letter name.', 30), msg('tallow', 'Price check on a 3 letter username?', 20)]
  });
  groups.retrogaming = group('retrogaming', {
    title: 'Retro gaming', topic: 'Consoles from the 80s to the 2000s. Speedrun night on Fridays.', joined: true,
    members: ['quill', 'halcyon', 'pixelmint', me, 'rook'], guests: 30,
    discover: { topic: 'Gaming', desc: 'Consoles from the 80s to the 2000s, emulation help and weekly speedrun nights.' },
    settings: mkSettings({ staff: { halcyon: 'owner' } }),
    messages: [msg('halcyon', 'Speedrun night is Friday at 21:00.', 60 * 5), msg('quill', 'Just finished a Dreamcast restore.', 60 * 2)]
  });
  groups.bots = group('bots', {
    title: 'Verified bots and their docs', topic: 'Verified bots. Type !help for commands.', joined: true,
    members: ['rook', me, 'drift'], guests: 4,
    discover: { official: true, topic: 'Tech', desc: 'Verified bots and their docs.' },
    settings: mkSettings({ staff: { ember: 'owner' } }),
    messages: [msg('rook', '!help', 60 * 6), msg('rook', 'Commands: !weather, !define, !roll', 60 * 6)]
  });
  groups.artcorner = group('artcorner', {
    title: 'Art corner', topic: 'Share work in progress. Credit other artists.', joined: true, muted: true, unread: 6,
    members: ['pixelmint', 'nightowl', me], guests: 3,
    discover: { topic: 'Art', desc: 'Share work in progress and get feedback.' },
    settings: mkSettings({ staff: { pixelmint: 'owner' } }),
    messages: [msg('pixelmint', 'New palette challenge is up.', 60 * 4)]
  });
  [
    ['pixelforge', 'Pixel art feedback', 'Art', 'Pixel art feedback, palettes and a monthly prompt. Share work in progress.', 31],
    ['lofilounge', 'Lo-fi lounge', 'Music', 'Music sharing, mostly chill and electronic. One link per message, please.', 88],
    ['nihongo', 'Japanese practice', 'Languages', 'Japanese practice for every level. Native speakers drop in most evenings.', 19],
    ['nightdrive', 'Night drive', 'Music', 'Synthwave, retro aesthetics and late night conversation.', 42],
    ['homelab', 'Home lab', 'Tech', 'Self-hosting, home servers and networking. Questions welcome.', 27]
  ].forEach(function (r) {
    groups[r[0]] = group(r[0], {
      title: r[1], topic: r[3], discover: { topic: r[2], desc: r[3] }, guests: r[4],
      members: ['rook', 'drift', 'tallow', 'pixelmint'].slice(0, 2 + (r[4] % 3)),
      settings: mkSettings({ staff: { rook: 'owner' } }),
      messages: [msg('rook', 'Welcome. Read the topic before posting.', 60 * 8), msg('drift', pick(LINES.generic), 60 * 2)]
    });
  });

  function dm(from, text, m) { return { id: uid(), from: from, text: text, ts: t(m) }; }
  var dms = {
    sable: { messages: [dm('sable', 'Hey, saw your theme export change. Clean work.', 7), dm('sable', 'Quick question: does it keep the backdrop color, or only the palette?', 7), dm(me, 'Both. The backdrop is stored with the palette in the same JSON file.', 6), dm('sable', "Perfect. I'll check the s12 logs tonight and tell you whether it's the client or Chatango.", 5)], unread: 1, lastReadTs: t(6) },
    kestrel: { messages: [dm('kestrel', 'Did you get my trade offer?', 65)], unread: 1, lastReadTs: t(120) },
    quill: { messages: [dm('quill', 'Can you send the invite link for #retrogaming?', 60 * 3), dm(me, 'Here: retrogaming.chatango.com', 60 * 3 - 2), dm(me, 'Thanks for the invite link', 60 * 2)], unread: 0, lastReadTs: now },
    halcyon: { messages: [dm('halcyon', 'See you Friday for game night.', 60 * 26)], unread: 0, lastReadTs: now },
    pixelmint: { messages: [dm('pixelmint', 'Hi! Saw you in #retrogaming. Want to swap themes?', 50)], unread: 1, lastReadTs: t(60), request: true }
  };
  return {
    me: me, users: users, groups: groups, dms: dms, notifyOnline: {}, friendAdds: {}, typing: {}, mentionLog: [], mediaRev: 0,
    meStatus: 'online', awayText: '',
    profile: { visibility: { age: true, gender: false, location: true, meet: false, fullPage: true }, colors: { bg: '#1b1c20', text: '#e6e6e6', link: '#f27a3f' } },
    account: { email: 'orrin@example.com', verified: true },
    route: { view: 'group', id: 'community', markerTs: now },
    sections: { favorites: true, groups: true, dms: true }
  };
}

var SAMPLE_VISITS = (function () {
  var now = Date.now() / 1000, kinds = ['log', 'like', 'log', 'msg', 'log', 'refer', 'log', 'dislike'];
  var names = ['sable', 'kestrel', '!anon5681', 'nightowl', 'quill', 'pixelmint', 'drift', 'marrow', 'vantage', 'halcyon', 'ember', 'rook', 'tallow', 'petrichor', '!anon2204', 'sable', 'kestrel', 'nightowl', 'quill', 'drift'];
  return names.map(function (n, i) {
    var action = kinds[i % kinds.length];
    return { user: n, action: action, time: now - (i * 47 + 3) * 60, msg: action === 'msg' ? 'Love the new theme.' : '' };
  });
})();
/**
 * Permet de simuler une page d'activité vissle.
 * @param {{page: number, get: string}} q Curseur et filtre de la page demandée.
 */
function sampleVisits(q) {
  return SAMPLE_VISITS.filter(function (x) { return (q.get === 'all' || x.action === q.get) && (q.page === 1 || x.time < q.page); }).slice(0, VISIT_PAGE);
}

/* Médiathèque d'exemple du prototype, en mémoire, avec les appels que le pont fait sur la base de Torch. */
var sampleMedia = (function () {
  var list = ['wave', 'thumbs up', 'party', 'facepalm', 'coffee', 'cat nap', 'good night', 'popcorn'].map(function (n) {
    return { url: 'https://media.example/' + n.replace(/ /g, '-') + '.gif', name: n };
  });
  function byIndex(index) { return function (a, b) { return a[index] < b[index] ? -1 : a[index] > b[index] ? 1 : a.url < b.url ? -1 : 1; }; }
  function read(index, after, text, count) {
    var kept = list.filter(function (e) { return mediaMatch(index, e, after, text); }).sort(byIndex(index));
    return Promise.resolve({ list: kept.slice(0, count), more: kept.length > count });
  }
  function put(e) { list = list.filter(function (x) { return x.url !== e.url; }).concat([e]); }
  return {
    mediaPage: function (index, after, text) { return read(index, after, text, MEDIA_PAGE); },
    searchMedia: function (text, count) { return read('name', null, text, count).then(function (r) { return r.list; }); },
    hasMedia: function (url) { return Promise.resolve(list.some(function (e) { return e.url === url; })); },
    addMedia: function (e) { put(e); return Promise.resolve(); },
    removeMedia: function (url) { list = list.filter(function (e) { return e.url !== url; }); return Promise.resolve(); },
    exportMedia: function () { return Promise.resolve(list.slice().sort(byIndex('url'))); },
    importMedia: function (entries) {
      var screened = screenMediaEntries(entries);
      screened.valid.forEach(put);
      return Promise.resolve({ added: screened.valid.length, skipped: screened.skipped });
    }
  };
})();
