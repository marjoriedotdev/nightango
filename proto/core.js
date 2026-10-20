var React = window.React, ReactDOM = window.ReactDOM, h = React.createElement;
// En mode live, chaque avatar reçoit la photo Chatango du compte ou du groupe qu'il représente.
var T = Object.assign({}, window.Torch, {
  Avatar: function (p) { return h(window.Torch.Avatar, p.src !== undefined ? p : Object.assign({}, p, { src: avatarSrc(p.name, p.size) })); }
});
var useState = React.useState, useEffect = React.useEffect, useLayoutEffect = React.useLayoutEffect, useRef = React.useRef,
  useMemo = React.useMemo, useCallback = React.useCallback, useContext = React.useContext, Frag = React.Fragment;

/* ---------- Utilitaires ---------- */
var APP_VERSION = window.__TORCH_SKIN_VERSION__ || '0.1.0-b';
var MIN = 60000;
function cx() { var o = []; for (var i = 0; i < arguments.length; i++) if (arguments[i]) o.push(arguments[i]); return o.join(' '); }
function uid() { return Math.random().toString(36).slice(2, 10); }
function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
function pad(n) { return n < 10 ? '0' + n : String(n); }
function fmtTime(ts, h24) {
  var d = new Date(ts), H = d.getHours(), M = d.getMinutes();
  if (h24) return pad(H) + ':' + pad(M);
  return (H % 12 || 12) + ':' + pad(M) + ' ' + (H >= 12 ? 'PM' : 'AM');
}
function dayKey(ts) { var d = new Date(ts); return d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate(); }
function dayLabel(ts) {
  var d = new Date(ts), n = new Date();
  var a = new Date(d.getFullYear(), d.getMonth(), d.getDate()), b = new Date(n.getFullYear(), n.getMonth(), n.getDate());
  var diff = Math.round((b - a) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}
function shortWhen(ts, h24) {
  var diff = Math.round((new Date().setHours(0, 0, 0, 0) - new Date(ts).setHours(0, 0, 0, 0)) / 86400000);
  if (diff <= 0) return fmtTime(ts, h24);
  if (diff < 7) return new Date(ts).toLocaleDateString('en-GB', { weekday: 'short' });
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
function ago(ts) {
  var m = Math.round((Date.now() - ts) / MIN);
  if (m < 1) return 'just now';
  if (m < 60) return m + ' min ago';
  var hrs = Math.round(m / 60);
  if (hrs < 24) return hrs + (hrs === 1 ? ' hour ago' : ' hours ago');
  var days = Math.round(hrs / 24);
  return days + (days === 1 ? ' day ago' : ' days ago');
}
function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }
function storageGet(key) { try { var v = window.localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
function storageSet(key, value) { try { window.localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* stockage indisponible : préférence non conservée */ } }
function copyText(text, onDone) {
  function fallback() {
    var ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); onDone(true); } catch (e) { onDone(false); }
    document.body.removeChild(ta);
  }
  try { navigator.clipboard.writeText(text).then(function () { onDone(true); }, fallback); } catch (e) { fallback(); }
}

/* ---------- Couleurs ---------- */
function hexToRgb(hex) {
  var m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(hex || '').trim());
  if (!m) return null;
  var s = m[1].length === 3 ? m[1].split('').map(function (c) { return c + c; }).join('') : m[1];
  var n = parseInt(s, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex(c) { return '#' + c.map(function (v) { return ('0' + Math.max(0, Math.min(255, Math.round(v))).toString(16)).slice(-2); }).join(''); }
function lum(c) {
  var a = c.map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}
function contrast(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
function mix(a, b, t) { return [0, 1, 2].map(function (i) { return a[i] + (b[i] - a[i]) * t; }); }
function ensureContrast(hex, bgHex, min) {
  var c = hexToRgb(hex), bg = hexToRgb(bgHex);
  if (!c || !bg) return undefined;
  var target = lum(bg) > 0.4 ? [0, 0, 0] : [255, 255, 255], t = 0, cur = c;
  while (contrast(cur, bg) < min && t < 1) { t += 0.05; cur = mix(c, target, t); }
  return rgbToHex(cur);
}
function rgba(hex, a) { var c = hexToRgb(hex) || [242, 122, 63]; return 'rgba(' + c[0] + ', ' + c[1] + ', ' + c[2] + ', ' + a + ')'; }
function darken(hex, f) { var c = hexToRgb(hex) || [242, 122, 63]; return rgbToHex(c.map(function (v) { return v * f; })); }

var SURFACE = { dark: { bg: '#16171a', body: '#d6d8dc' }, light: { bg: '#ffffff', body: '#2a2c31' } };
var FONT_STACKS = { 'Arial': 'Arial, sans-serif', 'Georgia': 'Georgia, serif', 'Courier New': 'Typewriter, "Courier New", monospace', 'Comic Sans MS': '"Comic Sans MS", "Comic Sans", cursive', 'Lucida Handwriting': '"Lucida Handwriting", Zapfino, Chalkduster, cursive', 'Palatino': 'Palatino, serif', 'Impact': 'Impact, sans-serif', 'Papyrus': 'Papyrus, cursive', 'Times New Roman': 'Times, serif' };
var CHANNELS = { none: { label: 'No channel', color: null }, red: { label: 'Red', color: '#e5484d' }, blue: { label: 'Blue', color: '#3e8bd8' }, mod: { label: 'Staff', color: '#8a8e96' } };

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
  function ev(type, user, m) { return { id: uid(), kind: 'event', type: type, user: user, ts: t(m) }; }
  var users = {
    ember: { status: 'online', age: 31, location: 'Bristol, UK', about: "Started Torch. Breaks things on purpose so you don't have to.", style: { nameColor: '#ff5f1f', font: 'Georgia', textColor: '#ffd9c2' } },
    sable: { status: 'online', age: 24, location: 'Lyon, France', about: 'Moderator in community. Night shifts, mostly. Ask before posting links.', friend: true, style: { nameColor: '#3f7fff', textColor: '#cfe0ff' } },
    vantage: { status: 'idle', age: 29, location: 'Oslo, Norway', about: 'Moderator. Quiet most of the time.', style: { nameColor: '#00bcd4' } },
    kestrel: { status: 'online', age: 22, location: 'Leeds, UK', about: 'Trading usernames since 2014.', style: { nameColor: '#2ecc71', font: 'Courier New' } },
    marrow: { status: 'online', age: 35, location: '', about: 'Breaks networks for a living.', style: { nameColor: '#a0522d', bg: '#3b2414' } },
    nightowl: { status: 'online', age: 26, location: 'Montréal, Canada', about: 'Themes, fonts and too much coffee.', style: { nameColor: '#9b59b6', font: 'Comic Sans MS', textColor: '#e0b0ff', bg: '#24133f' } },
    quill: { status: 'idle', age: 23, location: 'Dublin, Ireland', about: 'Mostly in #retrogaming.', friend: true, style: { nameColor: '#e91e63' } },
    drift: { status: 'online', age: 20, location: '', about: '', style: {} },
    halcyon: { status: 'offline', age: 28, location: 'Porto, Portugal', about: 'Runs game night.', friend: true, style: { nameColor: '#ffeb3b' } },
    petrichor: { status: 'offline', age: 33, location: '', about: '', style: {} },
    pixelmint: { status: 'online', age: 21, location: 'Gent, Belgium', about: 'Pixel artist.', style: { nameColor: '#00e5a0' } },
    rook: { status: 'online', age: 27, location: '', about: '', style: {} },
    tallow: { status: 'idle', age: 30, location: '', about: '', style: {} }
  };
  users[me] = { status: 'online', age: 27, gender: 'Not specified', location: 'Rennes, France', about: 'Building themes for Torch. Usually in #community and #torchdev. Ping me for theme import issues.', style: {}, self: true };

  function group(id, o) {
    return Object.assign({
      id: id, title: '', topic: '', joined: false, favorite: false, muted: false, unread: 0, mentions: 0, lastReadTs: now,
      members: [], guests: 0, messages: [], closed: false, discover: null, bans: [], audit: [], dismissedAnnouncement: false
    }, o);
  }
  var groups = {};
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
      msg('sable', "Known issue on server s12, it's on Chatango's side. Reconnecting twice usually sticks.", 18),
      msg('sable', "I've put a note in the group announcement until it's fixed.", 18),
      ev('join', 'drift', 17), ev('join', 'rook', 17), ev('join', 'tallow', 16), ev('leave', 'petrichor', 16),
      msg('quill', 'Confirmed, the second reconnect held. Thanks.', 16, { replyTo: { author: 'sable', text: "Known issue on server s12, it's on Chatango's side." } }),
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
    me: me, users: users, groups: groups, dms: dms, typing: {},
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

function defaultPrefs() {
  return {
    theme: 'system', accent: '#f27a3f', density: 'comfortable', textSize: 14, h24: true,
    styles: { names: true, fonts: true, backgrounds: false },
    notify: {
      mentions: { app: true, sound: true, desktop: true, email: null },
      pm: { app: true, sound: true, desktop: true, email: false },
      friendOn: { app: true, sound: false, desktop: false, email: null },
      friendOff: { app: false, sound: false, desktop: false, email: null },
      gift: { app: null, sound: null, desktop: null, email: true },
      account: { app: null, sound: null, desktop: null, email: true },
      updates: { app: true, sound: null, desktop: null, email: null }
    },
    volume: 70, soundFocusOnly: true, tabTitle: true, markNew: true, pmPreview: true, featureHints: true,
    privacy: { pmFrom: 'everyone', showIdle: true, joinOwned: true, joinRecent: true, joinFavorites: true, meet: false, usernameInTitle: false },
    safety: { embedImages: true, embedVideos: true, proxyMedia: true, warnLinks: true, showGuests: true, syncBlocked: true, ignoreMode: 'collapse' },
    a11y: { reduceMotion: false, underlineLinks: false },
    language: 'en-US', simulate: true
  };
}

/* ---------- Contexte et primitives UI ---------- */
var Ctx = React.createContext(null);
function useApp() { return useContext(Ctx); }

/* Calque unique pour fenêtres, menus et notifications : hors du flux, ils ne déforment plus la mise en page. */
var layerNode = null;
function layerRoot() {
  if (layerNode && layerNode.isConnected) return layerNode;
  var mountEl = window.__TORCH_MOUNT__ || document.getElementById('app');
  layerNode = document.createElement('div');
  layerNode.id = 'layer';
  (mountEl && mountEl.parentNode ? mountEl.parentNode : document.body).appendChild(layerNode);
  return layerNode;
}
function Portal(p) { return ReactDOM.createPortal(p.children, layerRoot()); }

function useOutside(ref, open, onClose, extraRef) {
  useEffect(function () {
    if (!open) return;
    function onDown(e) {
      var path = e.composedPath ? e.composedPath() : [e.target];
      if (ref.current && path.indexOf(ref.current) < 0 && !(extraRef && extraRef.current && path.indexOf(extraRef.current) >= 0)) onClose();
    }
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    document.addEventListener('keydown', onKey);
    return function () { document.removeEventListener('mousedown', onDown); document.removeEventListener('touchstart', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);
}

/* Bouton qui ouvre un menu d'actions ; items : {label, icon, onSelect, danger, checked, divider, swatch} */
function MenuButton(p) {
  var st = useState(false), open = st[0], setOpen = st[1];
  var ref = useRef(null), menuRef = useRef(null);
  function close() { setOpen(false); if (p.onOpenChange) p.onOpenChange(false); }
  useOutside(ref, open, close, menuRef);
  var ps = useState(null), place = ps[0], setPlace = ps[1];
  // Position fixe calculée sur le déclencheur, retournée si le menu sortirait de l'écran.
  useLayoutEffect(function () {
    if (!open || !ref.current) return;
    var r = ref.current.getBoundingClientRect(), vw = document.documentElement.clientWidth, vh = window.innerHeight;
    var mh = menuRef.current ? menuRef.current.offsetHeight : 0, up = p.up ? r.top - mh - 4 >= 8 || r.bottom + mh + 4 > vh : r.bottom + mh + 4 > vh - 8 && r.top - mh - 4 >= 8;
    var st = { position: 'fixed' };
    if (up) st.bottom = (vh - r.top + 4) + 'px'; else st.top = (r.bottom + 4) + 'px';
    if (p.align === 'left') st.left = Math.max(8, r.left) + 'px'; else st.right = Math.max(8, vw - r.right) + 'px';
    setPlace(st);
  }, [open]);
  useEffect(function () {
    if (!open) return;
    function onMove(e) { if (menuRef.current && e.target && menuRef.current.contains(e.target)) return; close(); }
    window.addEventListener('resize', onMove);
    document.addEventListener('scroll', onMove, true);
    return function () { window.removeEventListener('resize', onMove); document.removeEventListener('scroll', onMove, true); };
  }, [open]);
  useEffect(function () {
    if (open && menuRef.current) { var first = menuRef.current.querySelector('button'); if (first) first.focus(); }
  }, [open]);
  function toggle() { var n = !open; setPlace(null); setOpen(n); if (p.onOpenChange) p.onOpenChange(n); }
  function onKey(e) {
    if (!menuRef.current) return;
    var items = Array.prototype.slice.call(menuRef.current.querySelectorAll('button'));
    var i = items.indexOf(menuRef.current.getRootNode().activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
  }
  var trigger = p.renderTrigger
    ? p.renderTrigger({ onClick: toggle, 'aria-expanded': String(open), 'aria-haspopup': 'menu' })
    : h(T.IconButton, { icon: p.icon || 'more', label: p.label, size: p.size || 32, iconSize: p.iconSize, onClick: toggle, 'aria-expanded': String(open), 'aria-haspopup': 'menu' });
  return h('div', { className: 'menu-anchor', ref: ref },
    trigger,
    open ? h(Portal, null, h('div', { className: 'menu floating', role: 'menu', ref: menuRef, onKeyDown: onKey, style: place || { position: 'fixed', visibility: 'hidden', top: 0, left: 0 } },
      p.items.filter(Boolean).map(function (it, i) {
        if (it.divider) return h('hr', { key: 'd' + i });
        return h('button', {
          key: i, type: 'button', role: it.checked != null ? 'menuitemradio' : 'menuitem', 'aria-checked': it.checked != null ? String(!!it.checked) : undefined,
          className: it.danger ? 'danger' : undefined,
          onClick: function () { close(); it.onSelect(); }
        },
          it.swatch ? h('span', { className: 'swatch', style: { background: it.swatch } }) : it.icon ? h(T.Icon, { name: it.icon, size: 15 }) : null,
          h('span', { className: 'grow' }, it.label),
          it.checked ? h(T.Icon, { name: 'check', size: 14 }) : null);
      }))) : null);
}

function Dialog(p) {
  var ref = useRef(null);
  useEffect(function () {
    var rootNode = ref.current ? ref.current.getRootNode() : document;
    var prev = rootNode.activeElement;
    var el = ref.current && ref.current.querySelector('[data-autofocus], input, textarea, select, button');
    if (el) el.focus();
    function onKey(e) {
      if (e.key === 'Escape') { e.stopPropagation(); p.onClose(); }
      if (e.key === 'Tab' && ref.current) {
        var f = ref.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        var active = rootNode.activeElement;
        if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
      }
    }
    document.addEventListener('keydown', onKey);
    return function () { document.removeEventListener('keydown', onKey); if (prev && prev.focus) prev.focus(); };
  }, []);
  return h(Portal, null, h('div', { className: 'overlay', onMouseDown: function (e) { if (e.target === e.currentTarget) p.onClose(); } },
    h('div', { className: cx('dialog', p.wide && 'wide', p.className), role: 'dialog', 'aria-modal': 'true', 'aria-label': p.label || p.title, ref: ref },
      p.title ? h('div', { className: 'dialog-head' }, h('h2', null, p.title), p.description ? h('p', null, p.description) : null) : null,
      p.children,
      p.footer ? h('div', { className: 'dialog-foot' }, p.footer) : null)));
}

function ConfirmDialog(p) {
  var c = p.confirm;
  return h(Dialog, {
    title: c.title, description: c.body, onClose: p.onClose,
    footer: [
      h(T.Button, { key: 'c', variant: 'ghost', onClick: p.onClose }, 'Cancel'),
      h(T.Button, { key: 'o', variant: c.danger ? 'danger' : 'primary', 'data-autofocus': true, onClick: function () { p.onClose(); c.onConfirm(); } }, c.confirmLabel || 'Confirm')
    ]
  });
}

function Toasts(p) {
  return h(Portal, null, h('div', { className: 'toasts', role: 'status', 'aria-live': 'polite' },
    p.toasts.map(function (t) {
      return h('div', { key: t.id, className: 'toast' },
        t.icon ? h(T.Icon, { name: t.icon, size: 16, style: { color: 'var(--text-2)' } }) : null,
        h('span', { className: 'grow' }, t.text),
        t.action ? h(T.Button, { size: 'sm', onClick: function () { p.dismiss(t.id); t.action.run(); } }, t.action.label) : null,
        h(T.IconButton, { icon: 'x', label: 'Dismiss', size: 26, iconSize: 13, onClick: function () { p.dismiss(t.id); } }));
    })));
}

var EMBED_LABEL = { youtube: 'Video', image: 'Image', photo: 'Photo' };
function messagePreview(m) { var e = m.embeds && m.embeds[0]; return m.text || (e ? EMBED_LABEL[e.kind] : ''); }
function warnOnLink(app, url) { return function (e) { if (app.state.prefs.safety.warnLinks) { e.preventDefault(); app.ui.openLink(url); } }; }

/* Texte de message : mentions et liens */
function MessageText(p) {
  var app = useApp();
  var parts = String(p.text).split(/(@[A-Za-z0-9_!-]+|https?:\/\/[^\s]+)/g);
  return h('p', { className: 'tc-msg-text', style: p.style }, parts.map(function (s, i) {
    if (!s) return null;
    if (s.charAt(0) === '@' && s.length > 1) return h('span', { key: i, className: 'tc-mention' }, s);
    if (/^https?:\/\//.test(s)) return h('a', { key: i, href: s, target: '_blank', rel: 'noopener noreferrer', className: 'msg-link', onClick: warnOnLink(app, s) }, s);
    return s;
  }));
}

/* ---------- HTML de profil écrit par les membres ----------
   Jamais injecté : le texte est relu par le parseur du navigateur, puis seules quelques balises
   de mise en forme sont reconstruites en éléments React. Scripts, styles libres et attributs disparaissent. */
var RICH_TAGS = { b: 'b', strong: 'b', i: 'i', em: 'i', u: 'u', s: 's', strike: 's', br: 'br', p: 'p', div: 'div', span: 'span', font: 'span', center: 'div', a: 'a', img: 'img' };
var RICH_DROP = { script: 1, style: 1, iframe: 1, object: 1, embed: 1, noscript: 1, template: 1, svg: 1, math: 1, form: 1, input: 1, button: 1, textarea: 1, select: 1, link: 1, meta: 1, title: 1, head: 1 };
var FONT_SIZES = [0, 10, 12, 13, 15, 18, 22, 28];
function richStyle(el, tag, ctx) {
  var st = {}, css = String(el.getAttribute('style') || '');
  var color = el.getAttribute('color') || (/(?:^|;)\s*color\s*:\s*([^;]+)/i.exec(css) || [])[1];
  if (color && /^#?[0-9a-f]{3}([0-9a-f]{3})?$/i.test(color.trim())) {
    var hex = color.trim().charAt(0) === '#' ? color.trim() : '#' + color.trim();
    st.color = ctx.bg ? ensureContrast(hex, ctx.bg, 4.5) : hex;
  }
  var size = el.getAttribute('size'), px = (/font-size\s*:\s*(\d+)px/i.exec(css) || [])[1];
  if (size && FONT_SIZES[+size]) st.fontSize = FONT_SIZES[+size];
  else if (px) st.fontSize = Math.max(10, Math.min(30, +px));
  var face = el.getAttribute('face');
  if (face && /^[\w ,'-]{1,40}$/.test(face)) st.fontFamily = face;
  var align = el.getAttribute('align') || (/text-align\s*:\s*(\w+)/i.exec(css) || [])[1];
  if (tag === 'center') st.textAlign = 'center';
  else if (align && /^(left|right|center|justify)$/i.test(align)) st.textAlign = align.toLowerCase();
  return Object.keys(st).length ? st : null;
}
function richNodes(node, ctx, key) {
  var out = [];
  Array.prototype.forEach.call(node.childNodes, function (c, i) {
    var k = key + '.' + i;
    if (c.nodeType === 3) { if (c.nodeValue) out.push(c.nodeValue); return; }
    if (c.nodeType !== 1) return;
    var tag = c.tagName.toLowerCase();
    if (RICH_DROP[tag]) return;
    var as = RICH_TAGS[tag];
    if (!as) { out = out.concat(richNodes(c, ctx, k)); return; }
    if (as === 'br') { out.push(h('br', { key: k })); return; }
    if (as === 'img') {
      var src = String(c.getAttribute('src') || '');
      if (!/^https?:\/\//i.test(src)) return;
      if (!ctx.images) { out.push(h('a', { key: k, href: src, target: '_blank', rel: 'noopener noreferrer nofollow', className: 'msg-link', onClick: ctx.onLink(src) }, 'Image')); return; }
      if (ctx.blocked) { out.push(h('button', { key: k, type: 'button', className: 'linkbtn', onClick: ctx.reveal }, 'Show image')); return; }
      out.push(h('img', { key: k, src: src, alt: '', loading: 'lazy', referrerPolicy: 'no-referrer', style: { maxWidth: '100%', height: 'auto', verticalAlign: 'middle' } }));
      return;
    }
    var children = richNodes(c, ctx, k);
    if (as === 'a') {
      var href = String(c.getAttribute('href') || '');
      if (!/^https?:\/\//i.test(href)) { out = out.concat(children); return; }
      out.push(h('a', { key: k, href: href, target: '_blank', rel: 'noopener noreferrer nofollow', className: 'msg-link', onClick: ctx.onLink(href) }, children.length ? children : href));
      return;
    }
    out.push(h.apply(null, [as, { key: k, style: richStyle(c, tag, ctx) }].concat(children)));
  });
  return out;
}
/** Texte de profil Chatango (mini profil) rendu sans jamais injecter de HTML. */
function RichText(p) {
  var app = useApp(), safety = app.state.prefs.safety;
  var r = useState(false), revealed = r[0], setRevealed = r[1];
  var html = String(p.html || '').replace(/\r\n|\r|\n/g, '<br>');
  var doc;
  try { doc = new DOMParser().parseFromString('<!doctype html><body>' + html, 'text/html'); } catch (e) { return h('p', { className: 'about' }, p.html); }
  var ctx = {
    bg: SURFACE[app.theme] ? SURFACE[app.theme].bg : null,
    images: safety.embedImages, blocked: safety.proxyMedia && !revealed,
    reveal: function () { setRevealed(true); },
    onLink: function (url) { return function (e) { if (safety.warnLinks) { e.preventDefault(); app.ui.openLink(url); } }; }
  };
  return h.apply(null, ['div', { className: 'about rich' }].concat(richNodes(doc.body, ctx, 'r')));
}
/** Document isolé pour un profil complet : pas de script, pas de formulaire, médias seulement si autorisés. */
function fullProfileDoc(html, allowMedia) {
  var csp = allowMedia
    ? "default-src 'none'; img-src https: http: data:; style-src 'unsafe-inline' https: http:; font-src https: http: data:; media-src https:"
    : "default-src 'none'; img-src data:; style-src 'unsafe-inline'; font-src data:";
  return '<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="' + csp + '"><base target="_blank">' +
    '<style>body{margin:16px;font:14px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;color:#1f2024;background:#fff;overflow-wrap:anywhere}img,video{max-width:100%;height:auto}</style>' +
    '</head><body>' + html + '</body></html>';
}

function roleOf(group, name) { return group && group.settings && group.settings.staff ? group.settings.staff[name] || null : null; }
function isStaffRole(r) { return r === 'owner' || r === 'coowner' || r === 'admin' || r === 'mod'; }
function canManage(group, me) { var r = roleOf(group, me); return r === 'owner' || r === 'coowner' || r === 'admin'; }
function userOf(state, name) { return state.users[name] || { status: 'offline', about: '', style: {} }; }
function resolvedTheme(prefs, viewerTheme) {
  if (prefs.theme === 'dark' || prefs.theme === 'light') return prefs.theme;
  if (viewerTheme === 'dark' || viewerTheme === 'light') return viewerTheme;
  try { return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'; } catch (e) { return 'dark'; }
}
function dmUnreadTotal(state) { var n = 0; for (var k in state.dms) n += state.dms[k].unread || 0; return n; }
function statusLabel(s) { return s === 'online' ? 'Online' : s === 'idle' ? 'Idle' : 'Offline'; }
