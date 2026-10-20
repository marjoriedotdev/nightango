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

var liveBridge = (function () {
  if (!LIVE) return null;
  var refs = window.__torchRefs || {};
  var C = refs.client, CH = refs.chatango, SB = refs.sidebar;
  var ENV = refs.torch && refs.torch.environment;
  var listeners = [], queue = [];
  // Face 0 : défaut que Torch envoie sans style utilisateur - la chaîne vide efface la police fusionnée d'un message précédent.
  var FACES = ['', 'Comic Sans MS', 'Georgia', 'Lucida Handwriting', 'Impact', 'Palatino', 'Papyrus', 'Times New Roman', 'Courier New'];
  var GENDERS = { M: 'Male', F: 'Female' };
  var decoder = document.createElement('textarea');

  function emit(op) { if (listeners.length) listeners.forEach(function (f) { f(op); }); else queue.push(op); }
  function onOp(fn) { listeners.push(fn); var q = queue; queue = []; q.forEach(fn); return function () { listeners = listeners.filter(function (x) { return x !== fn; }); }; }
  function warn(e) { try { console.warn('[torch-skin]', e); } catch (x) { /* console indisponible */ } }
  function lower(v) { return String(v == null ? '' : v).toLowerCase(); }
  // Comme urllib.parse.unquote (chatango-lib) et Torch : « + » reste un « + ».
  function unquote(v) { try { return decodeURIComponent(String(v || '')); } catch (e) { return String(v || ''); } }
  /** Échappe le texte saisi : client.sendMessage attend du HTML, comme le champ de saisie de Torch. */
  function esc(text) { return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  // Références de message dans <r…/> et <e…/> : Torch retire le "=" final et protège - et _.
  function decodeRef(v) { return String(v).replace(/hypheN/g, '-').replace(/underS/g, '_') + '='; }
  function encodeRef(id) { var s = String(id); if (s.slice(-1) === '=') s = s.slice(0, -1); return s.replace(/-/g, 'hypheN').replace(/_/g, 'underS'); }

  function decodeHtml(html) { decoder.innerHTML = html; return decoder.value; }
  var IMAGE_URL = /^https:\/\/\S+\.(?:png|apng|jpe?g|gif|bmp|webp)(?:[?#]\S*)?$/i;
  function embedOf(src) {
    var yt = /^vid:\/\/yt:([\w-]{11})/.exec(src), img = /^img:\/\/(?:cam|lib):([^"&?\/\s]+)/.exec(src);
    if (yt) return { kind: 'youtube', id: yt[1] };
    if (img) return { kind: 'photo', url: 'https://chatango.com/pmmessageimg?i=' + encodeURIComponent(img[1]) };
    return IMAGE_URL.test(src) ? { kind: 'image', url: src } : null;
  }
  /* Contenu Chatango brut : balises de style, réponses, modifications, médias, entités */
  function parseContent(raw, keepMedia) {
    var style = {}, embeds = [], s = String(raw);
    var n = /<n([a-f0-9]{3}|[a-f0-9]{6})\/>/i.exec(s);
    if (n) style.nameColor = '#' + n[1];
    // Police lue sur <f x…> ou <g x…s…> seulement : les attributs w et h d'une balise <i> ne sont pas une police.
    var f = /<f x(\d{2})?([a-f0-9]{3}|[a-f0-9]{6})?=["']([^"']*)["']>/i.exec(s) || /<g x(\d{2})?s([a-f0-9]{3}|[a-f0-9]{6})?="([^"]*)">/i.exec(s);
    if (f) {
      if (f[2]) style.textColor = '#' + f[2];
      if (f[3] !== '' && FACES[+f[3]] !== undefined) style.font = FACES[+f[3]];
      else if (f[3] && isNaN(+f[3])) style.font = f[3];
    }
    var r = /<r([^\s<>"\/]+)\/>/.exec(s), e = /<e([^\s<>"\/]+)\/>/.exec(s);
    var text = decodeHtml(s
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<i s=["']?([^"'\s>]+)["']?[^>]*\/?>/gi, function (tag, src) {
        var m = embedOf(decodeHtml(src));
        if (m) embeds.push(m);
        return m && !keepMedia ? ' ' : ' ' + src + ' ';
      })
      .replace(/<[^>]+>/g, '')).replace(/\r/g, '').trim();
    (text.match(/https:\/\/\S+/g) || []).forEach(function (url) { if (IMAGE_URL.test(url)) embeds.push({ kind: 'image', url: url }); });
    return { text: text, style: style, embeds: embeds, replyId: r ? decodeRef(r[1]) : null, editId: e ? decodeRef(e[1]) : null };
  }
  function author(data) {
    if (data[1]) return lower(data[1]);
    if (data[2]) return '#' + lower(data[2]);
    try { return CH.getAnon(data[3], (/<n(\d+)\/>/.exec(data[9] || '') || [0, 3452])[1]); } catch (e) { return '!anon'; }
  }
  function toMsg(data, temp) {
    var parsed = parseContent(data.slice(9).join(':'));
    var flags = parseInt(data[7], 10) || 0;
    return {
      id: (temp ? 'k:' : '') + data[5], kind: 'msg', author: author(data), text: parsed.text, ts: Math.round(parseFloat(data[0]) * 1000) || Date.now(),
      style: parsed.style, embeds: parsed.embeds, replyId: parsed.replyId, editId: parsed.editId, unid: data[4] || '', ip: data[6] || '', channel: channelOf(flags)
    };
  }
  function parseParticipants(list) {
    var names = [], guests = 0;
    list.forEach(function (x) {
      var t = x.split(':');
      if (t.length < 4) return;
      if (t[3] && t[3] !== 'None') names.push(lower(t[3])); else guests += 1;
    });
    return { names: names.filter(function (v, i, a) { return a.indexOf(v) === i; }), guests: guests };
  }
  function parseMods(entries) {
    var mods = {};
    entries.forEach(function (x) { var p = String(x).split(','); if (p[0]) mods[lower(p[0])] = parseInt(p[1], 10) || 0; });
    return mods;
  }
  function parseBans(data) {
    var raw = data.join(':');
    if (!raw) return [];
    return raw.split(';').map(function (x) {
      var t = x.split(':');
      return { unid: t[0], ip: t[1], name: lower(t[2]) || '!anon', at: Math.round(parseFloat(t[3]) * 1000) || Date.now(), by: lower(t[4]) };
    }).filter(function (b) { return b.unid; });
  }
  function parseModLog(data) {
    var raw = data.join(':');
    if (!raw) return [];
    return raw.split(';').map(function (x) {
      var f = unquote(x).split(',');
      return { id: f[0], type: f[1], actor: lower(f[2]), target: lower(f[4]), at: Math.round(parseFloat(f[5]) * 1000) || 0, extra: f.slice(6).join(',') };
    }).filter(function (x) { return x.type; });
  }

  // Identifiants définitifs (trame u) arrivés avant le message (trame b) correspondant.
  var earlyIds = {}, waitingIds = {};
  var profileCache = {};
  function tapGroup(name, room, data) {
    if (room === ENV) return;
    switch (name) {
      case 'b': {
        var bm = toMsg(data, true), k = room + '|' + data[5];
        if (earlyIds[k]) { bm.id = earlyIds[k]; delete earlyIds[k]; } else waitingIds[k] = true;
        emit({ op: 'msg', gid: room, msg: bm });
        break;
      }
      case 'i': emit({ op: 'hist', gid: room, msg: toMsg(data, false) }); break;
      case 'u': {
        var ku = room + '|' + data[0];
        if (waitingIds[ku]) { delete waitingIds[ku]; emit({ op: 'msgid', gid: room, tmp: 'k:' + data[0], id: data[1] }); } else earlyIds[ku] = data[1];
        break;
      }
      case 'delete': emit({ op: 'del', gid: room, ids: [data[0]] }); break;
      case 'deleteall': emit({ op: 'del', gid: room, ids: data.slice() }); break;
      case 'clearall': if (data[0] === 'ok') emit({ op: 'cleared', gid: room }); else emit({ op: 'notice', gid: room, text: 'Chatango refused to clear the messages.' }); break;
      case 'g_participants': emit(Object.assign({ op: 'members', gid: room }, parseParticipants(data.join(':').split(';')))); break;
      case 'gparticipants': emit(Object.assign({ op: 'members', gid: room }, parseParticipants(data.slice(1).join(':').split(';')))); break;
      case 'participant':
        if (data[3] && data[3] !== 'None') emit({ op: 'member', gid: room, action: +data[0], name: lower(data[3]) });
        break;
      case 'n': emit({ op: 'count', gid: room, n: parseInt(data[0], 16) || 0 }); break;
      case 'ok': emit({ op: 'room', gid: room, owner: lower(data[0]), mods: parseMods(String(data[6] || '').split(';')), flags: parseInt(data[7], 10) || 0 }); break;
      case 'mods': emit({ op: 'mods', gid: room, mods: parseMods(data) }); break;
      case 'groupflagsupdate': emit({ op: 'flags', gid: room, flags: parseInt(data[0], 10) || 0 }); break;
      case 'inited': emit({ op: 'inited', gid: room }); break;
      case 'nomore': emit({ op: 'histEnd', gid: room }); break;
      case 'getannc':
        if (data[0] === 'none' || data.length < 4) emit({ op: 'annc', gid: room, enabled: false, interval: 0, text: '' });
        else {
          var raw = data.slice(4).join(':');
          // Le style d'origine (couleurs, police) est conservé pour le prochain enregistrement, et les médias restent dans le texte renvoyé.
          emit({ op: 'annc', gid: room, enabled: data[0] !== '0', interval: parseInt(data[3], 10) || 0, text: parseContent(raw, true).text, prefix: (/^(<n[^>]*\/>)?(<f [^>]*>)?/.exec(raw) || [''])[0] });
        }
        break;
      case 'annc': emit({ op: 'anncPost', gid: room, text: parseContent(data.slice(2).join(':'), true).text }); break;
      case 'bw': emit({ op: 'bw', gid: room, part: unquote(data[0]), whole: unquote(data[1]) }); break;
      case 'getratelimit': case 'ratelimitset': emit({ op: 'rate', gid: room, seconds: parseInt(data[0], 10) || 0 }); break;
      case 'blocklist': emit({ op: 'bans', gid: room, list: parseBans(data) }); break;
      case 'blocked': emit({ op: 'banned', gid: room, ban: { unid: data[0], ip: data[1], name: lower(data[2]) || '!anon', by: lower(data[3]), at: Date.now() } }); break;
      case 'unblocked': emit({ op: 'unbanned', gid: room, list: parseBans(data) }); break;
      case 'allunblocked': emit({ op: 'unbannedAll', gid: room }); break;
      case 'modactions': emit({ op: 'modlog', gid: room, list: parseModLog(data) }); break;
      case 'updgroupinfo': emit({ op: 'info', gid: room, title: unquote(data[0]), description: unquote(data.slice(1).join(':')) }); break;
      case 'denied': emit({ op: 'notice', gid: room, text: 'Chatango refused the connection to #' + room + '.' }); break;
      case 'addmoderr': emit({ op: 'notice', gid: room, text: 'Chatango refused to add this moderator.' }); break;
      case 'updatemoderr': emit({ op: 'notice', gid: room, text: "Chatango refused to change this moderator's permissions." }); break;
      case 'removemoderr': emit({ op: 'notice', gid: room, text: 'Chatango refused to remove this moderator.' }); break;
      case 'show_tb': case 'tb': emit({ op: 'notice', gid: room, text: 'You are temporarily banned from posting in #' + room + '.' }); break;
      default: break;
    }
  }
  function presenceOf(state, idle) { return state === 'on' ? (+idle ? 'idle' : 'online') : state === 'app' ? 'online' : 'offline'; }
  function tapPrivate(name, data) {
    switch (name) {
      case 'msg': case 'msgoff': {
        var p2 = parseContent(data.slice(5).join(':'));
        emit({ op: 'pm', from: lower(data[0]), text: p2.text, style: p2.style, embeds: p2.embeds, ts: Math.round(parseFloat(data[3]) * 1000) || Date.now(), offline: name === 'msgoff' });
        break;
      }
      case 'wl': {
        var friends = [];
        for (var i = 0; i + 3 < data.length; i += 4) if (data[i]) friends.push({ name: lower(data[i]), status: presenceOf(data[i + 2], data[i + 3]) });
        emit({ op: 'friends', list: friends });
        break;
      }
      case 'wladd':
        if (data[1] === 'invalid') emit({ op: 'notice', gid: 'private_message', text: 'No Chatango user named ' + lower(data[0]) + '.' });
        else emit({ op: 'friends', added: true, list: [{ name: lower(data[0]), status: presenceOf(data[1], data[2]) }] });
        break;
      case 'wldelete': if (data[1] === 'deleted') emit({ op: 'unfriend', name: lower(data[0]) }); break;
      case 'wlonline': emit({ op: 'presence', name: lower(data[0]), status: 'online' }); break;
      case 'wloffline': emit({ op: 'presence', name: lower(data[0]), status: 'offline' }); break;
      case 'idleupdate': emit({ op: 'presence', name: lower(data[0]), status: data[1] === '0' ? 'idle' : 'online' }); break;
      case 'presence': {
        var people = [];
        for (var j = 0; j + 2 < data.length; j += 3) if (data[j]) people.push({ name: lower(data[j]), status: +data[j + 1] > 0 ? 'idle' : data[j + 2] === 'online' || data[j + 2] === 'app' ? 'online' : 'offline' });
        emit({ op: 'people', list: people });
        break;
      }
      case 'block_list': emit({ op: 'pmBlocked', list: data.filter(Boolean).map(lower) }); break;
      case 'unblocked': emit({ op: 'pmUnblocked', name: lower(data[0]) }); break;
      case 'OK': emit({ op: 'pmReady' }); break;
      case 'show_fw': emit({ op: 'notice', gid: 'private_message', text: 'Flood warning: slow down or Chatango may disconnect your private messages.' }); break;
      case 'toofast': emit({ op: 'notice', gid: 'private_message', text: 'You are sending private messages too fast.' }); break;
      case 'show_offline_limit': emit({ op: 'notice', gid: 'private_message', text: 'This person has too many offline messages. Try again later.' }); break;
      default: break;
    }
  }
  // Trames que Torch n'écoute pas : on ajoute un gestionnaire, que son dispatcher appelle comme les siens.
  var EXTRA = { group: ['getratelimit', 'ratelimitset', 'addmoderr', 'updatemoderr', 'removemoderr', 'groupflagstoggled', 'show_tb', 'tb'], private: [] };
  function wrapTable(table, kind) {
    if (!table) return;
    EXTRA[kind].forEach(function (name) { if (!(name in table)) table[name] = function () { /* gestionnaire ajouté par Torch Skin */ }; });
    Object.keys(table).forEach(function (name) {
      var orig = table[name];
      if (typeof orig !== 'function' || orig.__skin) return;
      var w = function (c, socket, room, data) {
        try { if (kind === 'group') tapGroup(name, room, data || []); else tapPrivate(name, data || []); } catch (e) { warn(e); }
        return orig.apply(this, arguments);
      };
      w.__skin = true;
      table[name] = w;
    });
  }

  /* Avertissements de Torch : refus du serveur, connexion perdue, limites */
  var lastAlert = { text: '', at: 0 };
  function alertOnce(op) {
    if (op.text === lastAlert.text && Date.now() - lastAlert.at < 2500) return;
    lastAlert = { text: op.text, at: Date.now() };
    emit(op);
  }
  var QUIET = [/^Start a conversation/i, /^Private messages$/i];
  function hookNotices() {
    if (typeof C.systemMessage === 'function' && !C.systemMessage.__skin) {
      var sys = C.systemMessage;
      C.systemMessage = function (data) {
        try {
          var text = String(data && data.content || '').replace(/\r/g, ' ').trim();
          if (text && !QUIET.some(function (re) { return re.test(text); })) alertOnce({ op: 'notice', gid: (data && data.group) || C.focus, text: text });
        } catch (e) { warn(e); }
        return sys.apply(this, arguments);
      };
      C.systemMessage.__skin = true;
    }
    if (typeof C.setNotice === 'function' && !C.setNotice.__skin) {
      var notice = C.setNotice;
      C.setNotice = function (data) {
        try {
          if (data && data.icon === 'warning' && data.content) alertOnce({ op: 'alert', text: String(data.content), button: data.button || null, action: typeof data.action === 'function' ? data.action : null });
        } catch (e) { warn(e); }
        return notice.apply(this, arguments);
      };
      C.setNotice.__skin = true;
    }
  }

  /* État des connexions : Torch ne publie pas d'événement, on observe ses sockets. */
  var connState = {}, left = {};
  function stateOf(sock) { return !sock ? 'closed' : sock.readyState === 1 ? 'open' : sock.readyState === 0 ? 'connecting' : 'closed'; }
  function watchConnections() {
    setInterval(function () {
      try {
        var groups = C.groups || {};
        var seen = {};
        Object.keys(groups).forEach(function (gid) {
          if (gid === ENV) return;
          seen[gid] = true;
          var st = stateOf(groups[gid] && groups[gid].socket);
          if (connState[gid] !== st) { connState[gid] = st; if (!left[gid]) emit({ op: 'conn', gid: gid, state: st }); }
        });
        Object.keys(connState).forEach(function (gid) {
          if (!seen[gid] && connState[gid] !== 'closed') { connState[gid] = 'closed'; if (!left[gid]) emit({ op: 'conn', gid: gid, state: 'closed' }); }
        });
        var pm = C.private && C.private.socket;
        var pst = pm ? stateOf(pm) : 'closed';
        if (connState.__pm !== pst) { connState.__pm = pst; emit({ op: 'conn', gid: 'private_message', state: pst }); }
      } catch (e) { warn(e); }
    }, 2000);
  }

  function send(gid, frame, failure) {
    try { C.socket(gid, frame, failure); return true; } catch (e) { warn(e); return false; }
  }
  function post(url, fields, item) {
    if (typeof C.post !== 'function') return Promise.reject(new Error('Torch is not signed in yet.'));
    var form = new FormData();
    Object.keys(fields).forEach(function (k) { if (fields[k] !== undefined && fields[k] !== null) form.set(k, fields[k]); });
    return C.post(url, form, item || {}).then(function (r) { return typeof r === 'string' ? r : JSON.stringify(r); });
  }
  /**
   * Base d'historique privé de Torch (« <pseudo>_history »). Torch ne l'ouvre que depuis son propre écran
   * de messages privés : on l'ouvre ici avec le même schéma, puis on la lui confie pour qu'il y archive.
   */
  function openPmDb() {
    if (C.database && C.database.pm) return Promise.resolve(C.database.pm);
    return new Promise(function (resolve) {
      try {
        var req = indexedDB.open(C.user.name + '_history', 1);
        req.onupgradeneeded = function (e) {
          var st = e.target.result.createObjectStore('messages', { keyPath: 'ts' });
          st.createIndex('target_idx', 'target', { unique: false });
          st.createIndex('target_read_idx', ['target', 'unread'], { unique: false });
          st.createIndex('target_ts_idx', ['target', 'ts'], { unique: false });
        };
        req.onsuccess = function (e) {
          if (C.database && !C.database.pm) C.database.pm = e.target.result;
          resolve((C.database && C.database.pm) || e.target.result);
        };
        req.onerror = function () { resolve(null); };
      } catch (e) { warn(e); resolve(null); }
    });
  }
  function readField(sel) { var el = document.querySelector(sel); return el ? String(el.value || '') : ''; }

  /* Réponses du pont vissle du userscript, rapprochées des demandes par identifiant */
  var vissleWaits = {};
  document.addEventListener('torch-skin:vissle-response', function (e) {
    var r = JSON.parse(e.detail), wait = vissleWaits[r.id];
    if (!wait) return;
    delete vissleWaits[r.id];
    var err = r.error || r.data.error;
    if (err) wait.reject(new Error(err)); else wait.resolve(r.data.get);
  });

  if (C && C.event && typeof C.on === 'function') {
    wrapTable(C.event.group, 'group');
    wrapTable(C.event.private, 'private');
    hookNotices();
    watchConnections();
    var loggedIn = false;
    var onLogin = function (catchUp) {
      if (loggedIn) return;
      loggedIn = true;
      emit({ op: 'login', me: lower(C.user.name) });
      if (catchUp) Object.keys(C.groups || {}).forEach(function (gid) { if (gid !== ENV) emit({ op: 'group', id: gid, title: '', hidden: false }); });
      if (typeof window.__TORCH_SHOW__ === 'function') window.__TORCH_SHOW__();
      var pmOpen = function () { return !!(C.private && C.private.socket && C.private.socket.readyState === 1); };
      if (pmOpen()) {
        // Session déjà ouverte : la liste d'amis et l'historique ont été reçus avant nous, on les redemande.
        emit({ op: 'pmReady' });
        send('private_message', 'wl', '');
        send('private_message', 'getblock', '');
      } else {
        setTimeout(function () { if (!pmOpen()) { try { C.connect('private_message'); } catch (e) { warn(e); } } }, 2500);
      }
    };
    // client.on reçoit un CustomEvent du document, pas le client : on relit l'état sur C.
    C.on('clientLogin', function () { try { onLogin(false); } catch (e) { warn(e); } });
    // Filet de sécurité si l'événement est manqué : session détectée dès qu'un nom et un groupe existent.
    var sessionOpen = function () { return !!(C.user && C.user.name && C.groups && Object.keys(C.groups).length); };
    if (sessionOpen()) setTimeout(function () { onLogin(true); }, 0);
    else {
      var watch = setInterval(function () {
        if (loggedIn) return clearInterval(watch);
        if (sessionOpen()) { clearInterval(watch); try { onLogin(true); } catch (e) { warn(e); } }
      }, 1000);
    }
  } else {
    warn('Torch client not found: the overlay cannot connect.');
  }
  if (SB && typeof SB.renderGroup === 'function') {
    var renderGroup = SB.renderGroup.bind(SB);
    SB.renderGroup = function (data) {
      try { if (data && data.group && data.group !== ENV) emit({ op: 'group', id: lower(data.group), title: data.header ? String(data.header) : '', hidden: !!data.hidden }); } catch (e) { warn(e); }
      return renderGroup(data);
    };
  }

  return {
    ok: !!(C && C.event && typeof C.on === 'function'),
    onOp: onOp,
    canReply: function (id) { return !!id && String(id).indexOf('k:') !== 0; },
    /**
     * Permet d'envoyer un message de groupe.
     * @param {string} gid Groupe visé.
     * @param {string} text Texte saisi.
     * @param {{replyId: ?string, channel: ?string}} opts Réponse et canal.
     * @returns {?Object} Style propre lu dans le corps construit par Torch, null si rien n'est parti.
     */
    send: function (gid, text, opts) {
      opts = opts || {};
      var body;
      try { body = C.sendMessage(esc(text), true, gid); } catch (e) { warn(e); return null; }
      if (typeof body !== 'string' || !body) return null;
      var style = parseContent(body).style;
      if (opts.replyId) {
        var head = /^(<n[^>]*\/>)?(<f [^>]*>)?/.exec(body), cut = head ? head[0].length : 0;
        body = body.slice(0, cut) + '<r' + encodeRef(opts.replyId) + '/>' + body.slice(cut);
      }
      var user = (C.groups[gid] && C.groups[gid].user) || {};
      var flag = (CHANNEL_FLAG[opts.channel] || 0) + (parseInt(user.badge, 10) || 0);
      return send(gid, 'bm:' + Math.round(15E5 * Math.random()).toString(36) + ':' + flag + ':' + body, opts.replyId ? 'Your reply could not be sent.' : 'Your message failed to be delivered.') ? style : null;
    },
    /**
     * Permet d'envoyer un message privé.
     * @param {string} user Destinataire.
     * @param {string} text Texte saisi.
     * @returns {?Object} Style propre lu dans le corps construit par Torch, null si rien n'est parti.
     */
    sendPm: function (user, text) {
      try {
        // Le premier appel construit le corps sans l'envoyer : seul le second émet la trame.
        var body = C.sendMessage(esc(text), true, 'private_message', user);
        if (typeof body !== 'string' || !body) return null;
        C.sendMessage(esc(text), false, 'private_message', user);
        return parseContent(body).style;
      } catch (e) { warn(e); return null; }
    },
    focus: function (gid) { try { C.setFocus({ group: gid }); } catch (e) { warn(e); } },
    // Torch n'archive un message privé envoyé que pour la conversation qu'il considère ouverte.
    focusPm: function (user) { try { if (C.private) C.private.focus = user || false; } catch (e) { warn(e); } },
    join: function (gid) {
      delete left[gid];
      try { if (SB && SB.renderGroup) SB.renderGroup({ group: gid, header: gid, recent: true }); } catch (e) { warn(e); }
      try { C.connect(gid).then(function () { try { C.setFocus({ group: gid }); } catch (e) { warn(e); } }, warn); } catch (e) { warn(e); }
    },
    leave: function (gid) { left[gid] = true; try { C.disconnectFrom(gid); } catch (e) { warn(e); } },
    reconnect: function (gid) {
      try {
        var p = C.connect(gid);
        if (p && p.then) p.then(function () { if (gid !== 'private_message') { try { C.setFocus({ group: gid, reload: true }); } catch (e) { warn(e); } } }, warn);
      } catch (e) { warn(e); }
    },
    loadMore: function (gid) {
      var g = C.groups && C.groups[gid];
      if (!g || g.load === -1) return false;
      return send(gid, 'get_more:20:' + (g.load || 0), 'Earlier messages could not be loaded.');
    },
    /* Modération : trames identiques à celles de Torch */
    deleteMessage: function (gid, id) { return send(gid, 'delmsg:' + id, 'The message could not be deleted.'); },
    deleteAllFrom: function (gid, m) { return send(gid, 'delallmsg:' + m.unid + ':' + m.ip + ':' + (/^[!#]/.test(m.author) ? '' : m.author), 'The messages could not be deleted.'); },
    ban: function (gid, m) { return send(gid, 'block:' + m.unid + ':' + m.ip + ':' + (/^[!#]/.test(m.author) ? '' : m.author), 'The ban could not be sent.'); },
    unban: function (gid, b) { return send(gid, 'removeblock:' + b.unid + ':' + b.ip, 'The unban could not be sent.'); },
    unbanAll: function (gid) { return send(gid, 'unbanall', 'The unban could not be sent.'); },
    banList: function (gid) { return send(gid, 'blocklist:block:0:next:500:anons:1', 'The ban list could not be loaded.'); },
    clearAll: function (gid) { return send(gid, 'clearall', 'The messages could not be cleared.'); },
    /* Réglages de groupe : trames relevées dans chadango et chatango-lib */
    requestSettings: function (gid) {
      ['getannouncement', 'getbannedwords', 'getratelimit', 'getmodactions:prev:0:50'].forEach(function (f) { send(gid, f, 'Group settings could not be loaded.'); });
    },
    setFlags: function (gid, add, remove) { return send(gid, 'updategroupflags:' + add + ':' + remove, 'The group settings could not be saved.'); },
    setAnnouncement: function (gid, enabled, seconds, text, prefix) {
      var body = (prefix || '<n000/><f x11000="0">') + esc(text).replace(/\r?\n/g, '<br/>');
      var ok = send(gid, 'updateannouncement:' + (enabled ? 1 : 0) + ':' + seconds + ':' + body, 'The announcement could not be saved.');
      setTimeout(function () { send(gid, 'getannouncement', ''); }, 1000);
      return ok;
    },
    requestAnnouncement: function (gid) { return send(gid, 'getannouncement', ''); },
    setBannedWords: function (gid, part, whole) {
      var ok = send(gid, 'setbannedwords:' + encodeURIComponent(part) + ':' + encodeURIComponent(whole), 'Banned words could not be saved.');
      setTimeout(function () { send(gid, 'getbannedwords', ''); }, 1000);
      return ok;
    },
    setRateLimit: function (gid, seconds) { return send(gid, 'setratelimit:' + seconds, 'Slow mode could not be saved.'); },
    setMod: function (gid, name, flags) { return send(gid, 'addmod:' + name + ':' + flags, 'The moderator could not be saved.'); },
    removeMod: function (gid, name) { return send(gid, 'removemod:' + name, 'The moderator could not be removed.'); },
    roomInfo: function (gid) {
      var info = C.groups && C.groups[gid] && C.groups[gid].room && C.groups[gid].room.information;
      return info ? { title: String(info.title || ''), description: String(info.description || '') } : null;
    },
    /* Messages privés */
    setStatus: function (status) { return send('private_message', 'idle:' + (status === 'idle' ? 0 : 1), 'Your status could not be changed.'); },
    addFriend: function (name) { return send('private_message', 'wladd:' + name, 'The friend could not be added.'); },
    removeFriend: function (name) { return send('private_message', 'wldelete:' + name, 'The friend could not be removed.'); },
    block: function (name) { return send('private_message', 'block:' + name + ':' + name + ':S', 'The block could not be sent.'); },
    unblock: function (name) { return send('private_message', 'unblock:' + name, 'The unblock could not be sent.'); },
    /** Historique archivé par Torch dans IndexedDB, regroupé par interlocuteur ; lecture seule. */
    pmHistory: function (perTarget) {
      return openPmDb().then(function (db) { return new Promise(function (resolve) {
        try {
          if (!db) { resolve({}); return; }
          var out = {}, req = db.transaction(['messages'], 'readonly').objectStore('messages').openCursor();
          req.onsuccess = function (e) {
            var cur = e.target.result;
            if (!cur) {
              Object.keys(out).forEach(function (k) { out[k].sort(function (a, b) { return a.ts - b.ts; }); out[k] = out[k].slice(-(perTarget || 100)); });
              resolve(out); return;
            }
            var v = cur.value || {}, parts = String(v.data || '').split(':').slice(1), target = lower(v.target);
            if (target && parts.length > 5) {
              var body = parseContent(parts.slice(5).join(':'));
              (out[target] = out[target] || []).push({ from: lower(parts[0]), ts: Math.round(parseFloat(parts[3]) * 1000) || 0, text: body.text, style: body.style, embeds: body.embeds, unread: !!v.unread });
            }
            cur.continue();
          };
          req.onerror = function () { resolve({}); };
        } catch (e) { warn(e); resolve({}); }
      }); });
    },
    /**
     * Recherche de membres comme le fait Torch, puis demande de leur présence sur la connexion privée.
     * Filtres : sexe M, F ou les deux ; photo réelle (1), personnage (2) ou les deux (0).
     */
    searchPeople: function (o) {
      return Promise.resolve().then(function () {
        var form = new FormData();
        form.set('ami', o.ageMin || 13);
        form.set('ama', o.ageMax || 99);
        form.set('imc', o.avatar || 0);
        form.set('s', o.sex || 'B');
        if (o.query) form.set('ss', o.query);
        if (o.online) form.set('o', 1);
        form.set('h5', 1);
        form.set('f', o.from || 0);
        form.set('t', o.to || 40);
        return fetch(CH.path('search'), { method: 'POST', body: form, credentials: 'include' });
      }).then(function (r) { return r.text(); }).then(function (text) {
        if (text.indexOf('h=') === 0) {
          var names = text.slice(2).split(':').map(function (x) { return lower(x.split(';')[0]); }).filter(Boolean);
          if (names.length) send('private_message', 'getpresence:' + names.join(';'), 'Could not load people.');
          return names;
        }
        var reason = { overload: 'Chatango is overloaded. Meet people is limited to Premium members right now.', unsafe: 'Chatango does not allow this search.', None: '', unauthed: 'Your Chatango session expired. Reload the page and sign in again.' };
        if (text.trim() in reason) { if (!reason[text.trim()]) return []; throw new Error(reason[text.trim()]); }
        throw new Error('Chatango sent an unexpected reply to the search.');
      });
    },
    /** Mini profil public (mod1.xml), lu comme Torch : âge depuis la date de naissance, genre, lieu, texte. */
    fetchProfile: function (name) {
      var n = lower(name);
      if (!/^[a-z0-9_-]{1,20}$/.test(n)) return Promise.reject(new Error('Guests have no profile.'));
      var hit = profileCache[n];
      if (hit && Date.now() - hit.at < 300000) return Promise.resolve(hit.data);
      return fetch(CH.subdomain.mod1(n)).then(function (r) { return r.text(); }).then(function (xml) {
        var doc = new DOMParser().parseFromString(xml, 'text/xml');
        var data;
        if (doc.querySelector('parsererror')) data = { missing: true };
        else {
          var q = function (sel) { var el = doc.querySelector(sel); return el ? el.textContent.trim() : ''; };
          var birth = new Date(q('b')).getFullYear();
          data = {
            missing: false, age: isNaN(birth) ? '' : String(new Date().getFullYear() - birth),
            gender: GENDERS[q('s')] || '', location: q('l'), about: unquote(q('body')),
            premium: (parseInt(q('d'), 10) || 0) * 1000 > Date.now()
          };
        }
        profileCache[n] = { at: Date.now(), data: data };
        return data;
      });
    },
    /** Profil complet (mod2.xml) : HTML écrit par le membre, à n'afficher que dans un cadre isolé. */
    fetchFullProfile: function (name) {
      var n = lower(name);
      if (!/^[a-z0-9_-]{1,20}$/.test(n)) return Promise.resolve('');
      return fetch(CH.subdomain.mod2(n)).then(function (r) { return r.text(); }).then(function (xml) {
        var doc = new DOMParser().parseFromString(xml, 'text/xml'), body = doc.querySelector('body');
        return !doc.querySelector('parsererror') && body ? unquote(body.textContent) : '';
      });
    },
    /** Supprime l'historique que Torch garde dans ce navigateur ; Chatango n'en conserve pas. */
    clearPmHistory: function (target) { try { C.private.clearHistory(target); return true; } catch (e) { warn(e); return false; } },
    /* Profil : lu dans les champs que Torch remplit à la connexion, enregistré par client.post */
    readProfile: function () {
      var dir = document.querySelector('[data-setting="show_profile"] input');
      return {
        loaded: !!(C.user && C.user.avatar && typeof C.user.avatar === 'object' && document.querySelector('[data-text-field="age"]') && dir),
        age: readField('[data-text-field="age"]'), gender: readField('[data-text-field="gender"]'), location: readField('[data-text-field="location"]'),
        about: readField('[data-text-field="about"]'), full: readField('[data-text-field="full"]'), dir: !!(dir && dir.checked)
      };
    },
    saveProfile: function (p) {
      return Promise.resolve().then(function () { return saveProfileNow(p); });
    },
    /**
     * Permet de lire l'activité de son propre profil enregistrée par vissle.me.
     * @param {{page: number, order: string, get: string}} q Curseur, ordre et filtre de la page demandée.
     */
    visitors: function (q) {
      return new Promise(function (resolve, reject) {
        var id = uid();
        vissleWaits[id] = { resolve: resolve, reject: reject };
        document.dispatchEvent(new CustomEvent('torch-skin:vissle-request', { detail: JSON.stringify({ id: id, page: q.page, order: q.order, get: q.get }) }));
      });
    },
    createGroup: function (o) {
      return Promise.resolve().then(function () { return createGroupNow(o); });
    }
  };

  function saveProfileNow(p) {
      var me = lower(C.user && C.user.name);
      // Le profil complet n'est pas édité ici : on le renvoie tel quel, relu chez Chatango s'il manque.
      var full = p.full ? Promise.resolve(p.full) : fetch(CH.subdomain.mod2(me)).then(function (r) { return r.ok ? r.text() : ''; }).then(function (xml) {
        var doc = new DOMParser().parseFromString(xml || '', 'text/xml'), body = doc.querySelector('body');
        return body ? unquote(body.textContent) : '';
      }).catch(function () { return null; });
      return full.then(function (fullText) {
        if (fullText === null) throw new Error('Your full profile could not be read. Nothing was saved.');
        var fields = { auth: 'token', arch: 'h5', src: 'group', action: 'update', age: p.age, gender: p.gender, location: p.location, line: p.about, full_profile: fullText };
        if (p.dir) fields.dir = 'checked';
        return post(CH.path('updateprofile'), fields, {});
      }).then(function (resp) {
        var data = {};
        String(resp).split('&').forEach(function (kv) { var i = kv.indexOf('='); if (i > 0) data[kv.slice(0, i)] = kv.slice(i + 1); });
        if (data.error) throw new Error(unquote(data.error));
        if (!('age' in data || 'sex' in data || 'loc' in data)) throw new Error('Chatango sent an unexpected reply. Check your profile on chatango.com.');
        try { C.setProfile(data); } catch (e) { warn(e); }
        // mod1.xml peut revenir du cache HTTP sans la bio enregistrée : le cache local sert la version envoyée.
        var prev = profileCache[me] ? profileCache[me].data : {};
        profileCache[me] = { at: Date.now(), data: Object.assign({}, prev, { missing: false, age: String(p.age), gender: GENDERS[p.gender] || '', location: p.location, about: p.about }) };
        return data;
      });
  }
  /** Création de groupe par le formulaire Chatango de Torch (mêmes champs, case « discovery » comprise). */
  function createGroupNow(o) {
      var me = lower(C.user && C.user.name);
      var fields = { authType: 'cookie', uns: '0', u: o.name, n: o.title, d: o.description, owner: me };
      if (o.discovery) fields.discovery = 'on';
      return post(CH.path('script/creategrouploginjs', 'st'), fields, { cookie: true }).then(function (resp) {
        var msg = String(resp).trim();
        if (msg === 'groupcreated') return true;
        var key = msg.split('&')[0];
        var known = CH.error && CH.error.creategroup && CH.error.creategroup[key];
        throw new Error(known || 'Chatango refused to create the group (' + key + ').');
      });
  }
})();
