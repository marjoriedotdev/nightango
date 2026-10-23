var liveBridge = (function () {
  if (!LIVE) return null;
  var refs = window.__torchRefs || {};
  var C = refs.client, CH = refs.chatango, SB = refs.sidebar;
  var ENV = refs.torch && refs.torch.environment;
  var listeners = [], queue = [];
  var GENDERS = { M: 'Male', F: 'Female' };
  var SETTINGS = {
    joinOwned: ['privacy', 'groups', 'connect_own'], joinRecent: ['privacy', 'groups', 'connect_recent'], joinFavorites: ['privacy', 'groups', 'connect_favorite'],
    markdown: ['appearance', 'messages', 'parse_markdown'], guestMessages: ['safety', 'messages', 'show_guest'], announcements: ['appearance', 'messages', 'show_annc'],
    pmrCheck: ['privacy', 'private_messages', 'check_pmr']
  };
  var LISTS = { favorite: ['privacy', 'groups', 'favorite'], muted: ['notifications', 'muted', 'groups'], ignored: ['safety', 'users', 'ignore'] };
  var CONNECT_STATE = { online: 'on', app: 'app', offline: 'off' };
  // Seuls réglages de son que Torch lit, avec l'objet Audio que chacun règle.
  var SOUND_KEYS = ['play_mention', 'volume_mention', 'play_online', 'volume_online'];
  var SOUND_AUDIO = { mention: 'message', online: 'play_online' };
  // Taille des pages de bannissements et de débannissements demandées par Torch.
  var BAN_PAGE = 50;

  function emit(op) { if (listeners.length) listeners.forEach(function (f) { f(op); }); else queue.push(op); }
  function onOp(fn) { listeners.push(fn); var q = queue; queue = []; q.forEach(fn); return function () { listeners = listeners.filter(function (x) { return x !== fn; }); }; }
  /**
   * Permet de transmettre une page de la liste des bannissements (block) ou des débannissements (unblock).
   * @param {string} room Groupe.
   * @param {string} kind block ou unblock.
   * @param {Array<string>} data Trame découpée sur :.
   */
  function banPage(room, kind, data) {
    var list = parseBans(data);
    // Comme Torch, une page incomplète est la dernière.
    emit({ op: 'bans', gid: room, kind: kind, list: list, more: list.length >= BAN_PAGE });
  }
  function author(data) {
    if (data[1]) return lower(data[1]);
    if (data[2]) return '#' + lower(data[2]);
    try { return CH.getAnon(data[3], (/<n(\d+)\/>/.exec(data[9] || '') || [0, 3452])[1]); } catch (e) { return '!anon'; }
  }
  function toMsg(room, data, temp) {
    var flags = parseInt(data[7], 10) || 0, name = author(data);
    // Comme Torch, les messages du propriétaire du groupe comptent comme Premium.
    var premium = !!(flags & MSG_FLAG.PREMIUM) || name === lower(C.groups[room].room.owner);
    var parsed = parseContent(data.slice(9).join(':'), false, premium);
    return {
      id: (temp ? 'k:' : '') + data[5], kind: 'msg', author: name, text: parsed.text, parts: parsed.parts, ts: Math.round(parseFloat(data[0]) * 1000) || Date.now(),
      style: parsed.style, embeds: parsed.embeds, replyId: parsed.replyId, editId: parsed.editId, unid: data[4] || '', ip: data[6] || '', channel: channelOf(flags),
      bg: !!(flags & MSG_FLAG.BG_ON) && premium
    };
  }

  // Identifiants définitifs (trame u) arrivés avant le message (trame b) correspondant.
  var earlyIds = {}, waitingIds = {};
  var profileCache = {}, fullProfileCache = {}, msgBgCache = {}, CACHE_MS = 300000;
  function fresh(store, n) { var hit = store[n]; return hit && Date.now() - hit.at < CACHE_MS ? hit : null; }
  function cached(store, n, load) {
    var hit = fresh(store, n);
    if (hit) return Promise.resolve(hit.data);
    return load().then(function (data) { store[n] = { at: Date.now(), data: data }; return data; });
  }
  // Comme Torch, seule une réponse du type attendu compte : sans fichier de style, Chatango renvoie une petite image JPEG.
  function memberFile(url, type, parse) {
    return fetch(url).then(function (r) { return r.ok && type.test(r.headers.get('content-type')) ? r.text().then(parse) : null; })
      .catch(function (e) { warn(e); return null; });
  }
  // Sessions de chaque groupe, par horodatage de session comme Torch : { account }, { guest } ou { anon: true }.
  var sessions = {};
  function emitGuests(room) {
    var t = sessions[room], names = [], anons = 0;
    Object.keys(t).forEach(function (k) {
      if (t[k].anon) anons += 1;
      else if (t[k].guest && names.indexOf(t[k].guest) < 0) names.push(t[k].guest);
    });
    emit({ op: 'guests', gid: room, names: names.sort(), anons: anons });
  }
  function participants(room, list) {
    var p = parseParticipants(list);
    sessions[room] = p.sessions;
    emit({ op: 'members', gid: room, names: p.names });
    emitGuests(room);
  }
  function holders(t, name) { return Object.keys(t).filter(function (k) { return t[k].account === name; }).length; }
  function participant(room, data) {
    var t = sessions[room] || (sessions[room] = {}), ts = data[6], action = +data[0];
    // Départ d'une session inconnue (trame reçue avant g_participants) : seul data[3] dit quel compte part.
    var before = t[ts] || (action === 0 ? sessionOf(data[3]) : {});
    if (action === 0) delete t[ts];
    // Action 2 : Torch teste le nom d'invité avant le compte.
    else if (action === 2 && notNone(data[4])) t[ts] = sessionOf('None', data[4]);
    else t[ts] = sessionOf(data[3], data[4]);
    var after = t[ts] || {};
    // Un compte ouvert dans plusieurs sessions reste membre jusqu'à la dernière.
    if (before.account && before.account !== after.account && !holders(t, before.account)) emit({ op: 'member', gid: room, action: 0, name: before.account });
    if (after.account && after.account !== before.account && holders(t, after.account) === 1) emit({ op: 'member', gid: room, action: 1, name: after.account });
    emitGuests(room);
  }
  function tapGroup(name, room, data) {
    if (room === ENV) return;
    switch (name) {
      case 'b': {
        var bm = toMsg(room, data, true), k = room + '|' + data[5];
        if (earlyIds[k]) { bm.id = earlyIds[k]; delete earlyIds[k]; } else waitingIds[k] = true;
        emit({ op: 'msg', gid: room, msg: bm });
        break;
      }
      case 'i': emit({ op: 'hist', gid: room, msg: toMsg(room, data, false) }); break;
      case 'u': {
        var ku = room + '|' + data[0];
        if (waitingIds[ku]) { delete waitingIds[ku]; emit({ op: 'msgid', gid: room, tmp: 'k:' + data[0], id: data[1] }); } else earlyIds[ku] = data[1];
        break;
      }
      case 'delete': emit({ op: 'del', gid: room, ids: [data[0]] }); break;
      case 'deleteall': emit({ op: 'del', gid: room, ids: data.slice() }); break;
      case 'clearall': if (data[0] === 'ok') emit({ op: 'cleared', gid: room }); else emit({ op: 'notice', gid: room, text: 'Chatango refused to clear the messages.' }); break;
      case 'g_participants': participants(room, data.join(':').split(';')); break;
      case 'gparticipants': participants(room, data.slice(1).join(':').split(';')); break;
      case 'participant': participant(room, data); break;
      case 'n': emit({ op: 'count', gid: room, n: parseInt(data[0], 16) || 0 }); break;
      case 'ok': emit({ op: 'room', gid: room, owner: lower(data[0]), mods: parseMods(String(data[6] || '').split(';')), flags: parseInt(data[7], 10) || 0 }); break;
      case 'mods': emit({ op: 'mods', gid: room, mods: parseMods(data) }); break;
      case 'groupflagsupdate': emit({ op: 'flags', gid: room, flags: parseInt(data[0], 10) || 0 }); break;
      case 'inited': emit({ op: 'inited', gid: room }); break;
      case 'nomore': emit({ op: 'histEnd', gid: room }); break;
      case 'gotmore': emit({ op: 'moreLoaded', gid: room }); break;
      case 'getannc':
        if (data[0] === 'none' || data.length < 4) emit({ op: 'annc', gid: room, mode: 0, enabled: false, interval: 0, text: '', displayText: '', embeds: [] });
        else {
          // Comme Torch, une annonce a d'office le drapeau Premium.
          var raw = data.slice(4).join(':'), shown = parseContent(raw, false, true);
          // Le style d'origine (couleurs, police, emphase posée par Torch après <f>) est conservé pour le prochain enregistrement, et les médias restent dans le texte renvoyé.
          emit({ op: 'annc', gid: room, mode: parseInt(data[0], 10) || 0, enabled: data[0] !== '0', interval: parseInt(data[3], 10) || 0, text: parseContent(raw, true).text, displayText: shown.text, embeds: shown.embeds, prefix: (/^(<n[^>]*\/>)?(<f [^>]*>(<b>)?(<i>)?(<u>)?)?/.exec(raw) || [''])[0] });
        }
        break;
      case 'annc': {
        var posted = parseContent(data.slice(2).join(':'), false, true);
        emit({ op: 'anncPost', gid: room, text: posted.text, embeds: posted.embeds });
        break;
      }
      case 'bw': emit({ op: 'bw', gid: room, part: unquote(data[0]), whole: unquote(data[1]) }); break;
      case 'getratelimit': case 'ratelimitset': emit({ op: 'rate', gid: room, seconds: parseInt(data[0], 10) || 0 }); break;
      case 'blocklist': banPage(room, 'block', data); break;
      case 'unblocklist': banPage(room, 'unblock', data); break;
      case 'blocked': emit({ op: 'banned', gid: room, ban: { unid: data[0], ip: data[1], name: lower(data[2]) || '!anon', guest: !data[2], by: lower(data[3]), at: Date.now() } }); break;
      case 'unblocked': emit({ op: 'unbanned', gid: room, list: parseUnbanned(data) }); break;
      case 'bansearchresult': emit({ op: 'banSearch', gid: room, ban: parseBanSearch(data) }); break;
      case 'badbansearchstring': emit({ op: 'banSearchRefused', gid: room, code: data[0] }); break;
      case 'allunblocked': emit({ op: 'unbannedAll', gid: room }); break;
      case 'modactions': emit({ op: 'modlog', gid: room, list: parseModLog(data) }); break;
      case 'miu': delete msgBgCache[lower(data[0])]; emit({ op: 'msgBgStale', name: lower(data[0]) }); break;
      case 'updgroupinfo': emit({ op: 'info', gid: room, title: unquote(data[0]), description: unquote(data.slice(1).join(':')) }); break;
      case 'denied':
        // Ni inited ni participants n'arriveront : le fil et les membres quittent l'attente.
        emit({ op: 'denied', gid: room });
        emit({ op: 'notice', gid: room, text: 'Chatango refused the connection to #' + room + '.' });
        break;
      case 'addmoderr': emit({ op: 'notice', gid: room, text: 'Chatango refused to add this moderator.' }); break;
      case 'updatemoderr': emit({ op: 'notice', gid: room, text: "Chatango refused to change this moderator's permissions." }); break;
      case 'removemoderr': emit({ op: 'notice', gid: room, text: 'Chatango refused to remove this moderator.' }); break;
      case 'show_tb': case 'tb': emit({ op: 'notice', gid: room, text: 'You are temporarily banned from posting in #' + room + '.' }); break;
      default: break;
    }
  }
  function tapPrivate(name, data) {
    switch (name) {
      case 'msg': case 'msgoff': {
        var p2 = parsePm(data);
        emit({ op: 'pm', from: lower(data[0]), text: p2.text, parts: p2.parts, style: p2.style, embeds: p2.embeds, key: p2.key, editId: p2.editId, ts: Math.round(parseFloat(data[3]) * 1000) || Date.now(), offline: name === 'msgoff' });
        break;
      }
      case 'wl': {
        var friends = [];
        for (var i = 0; i + 3 < data.length; i += 4) if (data[i]) friends.push(friendPresence(data[i], data[i + 2], data[i + 1], data[i + 3]));
        emit({ op: 'friends', list: friends });
        break;
      }
      case 'wladd':
        if (data[1] === 'invalid') emit({ op: 'friendRefused', name: lower(data[0]) });
        // Triplet : la valeur vaut des minutes d'inactivité si on, un horodatage si off ou app.
        else emit({ op: 'friends', added: true, list: [friendPresence(data[0], data[1], data[2], data[2])] });
        break;
      case 'wldelete': if (data[1] === 'deleted') emit({ op: 'unfriend', name: lower(data[0]) }); break;
      case 'wlonline': case 'wlapp': emit({ op: 'presence', name: lower(data[0]), status: 'online' }); break;
      case 'wloffline': emit({ op: 'presence', name: lower(data[0]), status: 'offline', lastOn: epochMs(data[1]) }); break;
      // La trame status ne dit pas si le compte est inactif : un état idle connu doit rester en place.
      case 'status': emit(data[2] === 'offline' ? { op: 'presence', name: lower(data[0]), status: 'offline', lastOn: epochMs(data[1]) } : { op: 'presence', name: lower(data[0]), status: 'online', keepIdle: true }); break;
      case 'idleupdate': emit({ op: 'presence', name: lower(data[0]), status: data[1] === '0' ? 'idle' : 'online' }); break;
      case 'connect': {
        // Une réponse à nom vide refuse le dernier nom envoyé.
        var target = lower(data[0]) || connectTarget, state = data[0] && CONNECT_STATE[data[2]];
        if (state) emit({ op: 'people', list: [friendPresence(target, state, data[1], data[1])] });
        // Comme Torch, un état inconnu est ignoré.
        if (state || !data[0] || data[2] === 'invalid' || data[2] === 'nouser') emit({ op: 'pmChecked', name: target, found: !!state });
        break;
      }
      case 'presence': {
        var people = [];
        // Hors ligne, les minutes ne sont pas de l'inactivité : elles servent de dernière connexion approchée.
        for (var j = 0; j + 2 < data.length; j += 3) if (data[j]) {
          var on = data[j + 2] === 'online' || data[j + 2] === 'app', idle = on && +data[j + 1] > 0;
          people.push({ name: lower(data[j]), status: idle ? 'idle' : on ? 'online' : 'offline', lastOn: !on && +data[j + 1] ? Date.now() - data[j + 1] * MIN : 0, idleSince: idle ? Date.now() - data[j + 1] * MIN : 0 });
        }
        emit({ op: 'people', list: people });
        break;
      }
      case 'block_list': emit({ op: 'pmBlocked', list: data.filter(Boolean).map(lower) }); break;
      case 'unblocked': emit({ op: 'pmUnblocked', name: lower(data[0]) }); break;
      case 'OK': emit({ op: 'pmReady' }); if (pmrConnected) pmrConnected(); break;
      case 'kickingoff': emit({ op: 'session', reason: 'kicked' }); break;
      case 'DENIED': emit({ op: 'session', reason: 'denied' }); break;
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
        // Torch répond à DENIED par un alert() bloquant : la fenêtre de session expirée le remplace.
        // Son gestionnaire connect ouvre son écran de MP et peut appeler api.vissle.me, hors de la liste fermée.
        if (kind === 'private' && (name === 'DENIED' || name === 'connect')) return;
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
  var QUIET = [/^Start a conversation/i, /^Private messages$/i, /^You have logged in to private messages elsewhere/i];
  function hookNotices() {
    if (typeof C.systemMessage === 'function' && !C.systemMessage.__skin) {
      var sys = C.systemMessage;
      C.systemMessage = function (data) {
        try {
          var text = String(data && data.content || '').replace(/\r/g, ' ').trim();
          // Présence d'un ami (unique status) : Torch la destine au MP ouvert, sans groupe. La liste d'amis la montre déjà.
          var presence = data && data.unique === 'status';
          if (text && !presence && !QUIET.some(function (re) { return re.test(text); })) alertOnce({ op: 'notice', gid: (data && data.group) || C.focus, text: text });
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
  var connState = {}, pmState = null, left = {}, attempts = {};
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
        if (pmState !== pst) { pmState = pst; emit({ op: 'conn', gid: 'private_message', state: pst }); }
      } catch (e) { warn(e); }
    }, 2000);
  }
  /**
   * Permet de lancer une connexion de Torch.
   * @param {string} gid Groupe ou private_message.
   */
  function connect(gid) {
    // Une seconde session MP ouverte pendant la première ferait renvoyer kickingoff à la nôtre : une seule tentative à la fois.
    if (attempts[gid]) return attempts[gid];
    // Torch ignore client.connect tant que gid reste dans cache.connect : comme lui, on l'en retire autour de chaque tentative.
    function forget() { C.cache.connect = C.cache.connect.filter(function (x) { return x !== gid; }); }
    function settle() {
      delete attempts[gid];
      forget();
      // Sans nouveau socket, l'état observé ne change pas : on force sa réémission pour sortir de « connecting », y compris pour un groupe que Torch a retiré.
      if (gid === 'private_message') pmState = null; else connState[gid] = 'connecting';
    }
    function attempt() { forget(); return C.connect(gid); }
    // Comme Torch, la base d'historique s'ouvre avant la connexion privée : les msgoff, livrés une seule fois juste après OK, y sont archivés.
    var sock = gid === 'private_message' ? openPmDb().then(attempt) : attempt();
    attempts[gid] = sock.then(function (s) { settle(); return s; }, function (e) { settle(); throw e; });
    return attempts[gid];
  }

  function send(gid, frame, failure) {
    try { C.socket(gid, frame, failure); return true; } catch (e) { warn(e); return false; }
  }
  function pmOpen() { return !!(C.private && C.private.socket && C.private.socket.readyState === 1); }
  // Dernier correspondant demandé par connect, auquel se rattache une réponse à nom vide.
  var connectTarget = '';
  /**
   * Permet de demander à Chatango la présence d'un correspondant, comme Torch à l'ouverture d'un MP.
   * @param {string} name Correspondant visé.
   * @returns {boolean} Vrai si la trame est partie.
   */
  function connectPm(name) {
    var n = lower(name);
    if (!pmOpen() || !send('private_message', 'connect:' + n, 'The conversation with ' + n + ' could not be opened.')) return false;
    connectTarget = n;
    return true;
  }
  function post(url, fields, item) {
    if (typeof C.post !== 'function') return Promise.reject(new Error('Torch is not signed in yet.'));
    var form = new FormData();
    Object.keys(fields).forEach(function (k) { if (fields[k] !== undefined && fields[k] !== null) form.set(k, fields[k]); });
    return C.post(url, form, item || {}).then(function (r) { return typeof r === 'string' ? r : JSON.stringify(r); });
  }
  var pmrCheck = null, pmrConnected = null;
  /**
   * Permet de lire chez vissle la restriction des MP de son propre compte, comme Torch (inject.js:10631-10643).
   * @returns {Promise<string>} restricted, ok, ou unknown si la réponse ne l'établit pas.
   */
  function fetchPmr() {
    return fetch('https://api.vissle.me/v1/pmr/' + C.user.name).then(function (r) {
      if (r.status !== 200) return 'unknown';
      return r.json().then(function (data) { return data.pmr ? 'restricted' : 'ok'; });
    }).catch(function (e) { warn(e); return 'unknown'; });
  }
  /**
   * Base d'historique privé de Torch (« <pseudo>_history »). Torch ne l'ouvre que depuis son propre écran
   * de messages privés : on l'ouvre ici avec le même schéma, puis on la lui confie pour qu'il y archive.
   */
  function openPmDb() {
    var open = C.database && C.database.pm ? Promise.resolve(C.database.pm) : new Promise(function (resolve) {
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
    return open.then(migrateUnread);
  }
  /**
   * Permet de marquer lus des messages de l'historique privé, par l'index de Torch (markRead).
   * @param {IDBDatabase} db Base d'historique privé.
   * @param {?IDBKeyRange} range Plage de target_ts_idx, null pour toute la base.
   */
  function markRead(db, range) {
    return new Promise(function (resolve, reject) {
      var tx = db.transaction(['messages'], 'readwrite');
      tx.objectStore('messages').index('target_ts_idx').openCursor(range).onsuccess = function (e) {
        var cur = e.target.result;
        if (!cur) return;
        if (cur.value.unread) cur.update(Object.assign(cur.value, { unread: 0 }));
        cur.continue();
      };
      tx.oncomplete = function () { resolve(); };
      tx.onabort = function () { reject(tx.error); };
    });
  }
  /**
   * Permet de marquer lus, une fois par compte, les messages archivés avant Torch Skin, que Torch a tous archivés
   * non lus faute de focus privé. Appelée par openPmDb avant la connexion privée, elle laisse non lus les msgoff de celle-ci.
   * @param {?IDBDatabase} db Base d'historique privé.
   */
  function migrateUnread(db) {
    var key = skinKey(lower(C.user.name));
    if (!db || (storageGet(key) || {}).pmReadMigrated) return db;
    return markRead(db, null).then(function () { storageMerge(key, { pmReadMigrated: true }); }, warn).then(function () { return db; });
  }
  /**
   * Permet de lire un enregistrement de l'historique privé au format des messages du pont.
   * @param {Object} v Enregistrement de Torch (saveMessage).
   * @returns {?Object} Entrée avec sa clé archiveTs, null pour une trame illisible.
   */
  function pmEntry(v) {
    var parts = String(v.data || '').split(':').slice(1);
    if (parts.length <= 5) return null;
    var body = parsePm(parts);
    return { from: lower(parts[0]), ts: Math.round(parseFloat(parts[3]) * 1000) || 0, archiveTs: v.ts, text: body.text, parts: body.parts, style: body.style, embeds: body.embeds, key: body.key, editId: body.editId, unread: !!v.unread };
  }
  function readField(sel) { var el = document.querySelector(sel); return el ? String(el.value || '') : ''; }
  // Persistance identique à Torch : l'objet entier est réécrit sous la seule clé settings.
  function saveSettings() { localStorage.setItem('settings', JSON.stringify(C.settings)); }
  /**
   * Permet de lire un interrupteur des réglages de Torch.
   * @param {string} key Clé de SETTINGS.
   * @returns {?boolean} Valeur lue, null si les réglages de Torch sont illisibles.
   */
  function readSetting(key) {
    var p = SETTINGS[key];
    try { return !!C.settings[p[0]][p[1]][p[2]]; } catch (e) { warn(e); return null; }
  }
  /**
   * Permet de lire une liste des réglages de Torch.
   * @param {string} kind Clé de LISTS.
   * @returns {?Array<string>} Copie de la liste, null si les réglages de Torch sont illisibles.
   */
  function readList(kind) {
    var p = LISTS[kind];
    try { return C.settings[p[0]][p[1]][p[2]].slice(); } catch (e) { warn(e); return null; }
  }
  /**
   * Permet d'ajouter ou de retirer une valeur d'une liste des réglages de Torch, comme lui : filter ou push sans doublon.
   * @param {string} kind Clé de LISTS.
   * @param {string} value Valeur visée.
   * @param {boolean} on Vrai pour l'ajouter.
   */
  function writeList(kind, value, on) {
    var p = LISTS[kind];
    try {
      var owner = C.settings[p[0]][p[1]];
      if (!on) owner[p[2]] = owner[p[2]].filter(function (x) { return x !== value; });
      else if (owner[p[2]].indexOf(value) < 0) owner[p[2]].push(value);
      saveSettings();
      return true;
    } catch (e) { warn(e); return false; }
  }

  /*
   * Style perso : écrit dans le formulaire de style de Torch, relu par client.sendMessage à chaque envoi.
   * Ce formulaire n'est jamais soumis : son enregistrement (updatemsgstyles) transmet le mot de passe.
   */
  var accountStyle = null;
  function styleFields() {
    var fonts = document.querySelector('[data-preload="fonts"]');
    function emphasis(icon) { return fonts.querySelector(icon).previousElementSibling; }
    return {
      bold: emphasis('.fa-bold'), italic: emphasis('.fa-italic'), underline: emphasis('.fa-underline'), strike: emphasis('.fa-strikethrough'),
      face: document.querySelector('.font-face').firstElementChild, size: document.querySelector('.font-size .text-input'),
      textColor: fonts.querySelector('[data-color="fontColor"]'), nameColor: fonts.querySelector('[data-color="nameColor"]'), on: fonts.querySelector('[name="stylesOn"]')
    };
  }
  function readStyle(f) {
    return {
      face: f.face.value, size: +f.size.value, textColor: f.textColor.value, nameColor: f.nameColor.value,
      bold: f.bold.checked, italic: f.italic.checked, underline: f.underline.checked, strike: f.strike.checked, on: f.on.checked, active: !!C.user.style
    };
  }
  function writeStyle(f, v) {
    f.face.value = v.face; f.size.value = String(v.size); f.textColor.value = v.textColor; f.nameColor.value = v.nameColor;
    f.bold.checked = v.bold; f.italic.checked = v.italic; f.underline.checked = v.underline; f.strike.checked = v.strike; f.on.checked = v.on;
    C.user.style = v.active;
  }
  /**
   * Permet d'appliquer le style perso aux champs que Torch lit à l'envoi.
   * @param {?Object} style Style perso, null pour revenir au style du compte.
   */
  function applyStyle(style) {
    if (!style && !accountStyle) return;
    var f = styleFields();
    if (!style) { writeStyle(f, accountStyle); accountStyle = null; return; }
    if (!accountStyle) accountStyle = readStyle(f);
    writeStyle(f, Object.assign({}, style, { on: true, active: true }));
  }
  /**
   * Permet de faire construire par Torch le corps d'un message de groupe, sans l'envoyer, avec la référence et la citation que l'envoi insère.
   * @param {string} gid Groupe visé.
   * @param {string} text Texte saisi.
   * @param {{replyId: ?string, editId: ?string, quote: ?string, style: ?Object}} opts Réponse, original modifié ou citation en texte brut, et style perso.
   * @returns {?{body: string, style: Object}} Corps, et style propre lu dans celui de Torch, null si Torch ne construit rien.
   */
  function groupBody(gid, text, opts) {
    applyStyle(opts.style);
    var body = C.sendMessage(esc(text), true, gid);
    if (typeof body !== 'string' || !body) return null;
    var style = parseContent(body).style;
    // Comme Torch, une modification ne porte jamais de réponse.
    var ref = opts.editId ? '<e' + encodeRef(opts.editId) + '/>' : opts.replyId ? '<r' + encodeRef(opts.replyId) + '/>' : '';
    var head = /^(<n[^>]*\/>)?(<f [^>]*>)?/.exec(body)[0];
    body = head + ref + body.slice(head.length);
    if (opts.quote) {
      // Torch place la citation juste avant le texte saisi : après l'emphase de son style, lue dans ses cases, et avant celle du Markdown.
      var f = C.user.style ? styleFields() : null;
      var at = head.length + (f ? (f.bold.checked ? '<b>' : '') + (f.italic.checked ? '<i>' : '') + (f.underline.checked ? '<u>' : '') : '').length;
      body = body.slice(0, at) + esc(opts.quote) + body.slice(at);
    }
    return { body: body, style: style };
  }

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
    // Torch occupe window.onoffline et window.ononline : on écoute à côté sans les remplacer.
    window.addEventListener('offline', function () { emit({ op: 'session', reason: 'offline' }); });
    window.addEventListener('online', function () { emit({ op: 'online' }); });
    var loggedIn = false;
    var onLogin = function (catchUp) {
      if (loggedIn) return;
      loggedIn = true;
      // Torch lit seul l'oEmbed YouTube et msgbg.xml, hors des réglages de médias de Torch Skin : neutralisés en mémoire, pas dans les réglages de Torch.
      C.renderYouTube = CH.getBackground = function () {};
      emit({ op: 'login', me: lower(C.user.name) });
      // Groupes déjà connectés avant nous : leurs trames inited et participants sont passées.
      if (catchUp) Object.keys(C.groups || {}).forEach(function (gid) { if (gid !== ENV) emit({ op: 'group', id: gid, title: '', hidden: false, ready: true }); });
      if (typeof window.__TORCH_SHOW__ === 'function') window.__TORCH_SHOW__();
      if (pmOpen()) {
        // Session déjà ouverte : la liste d'amis et l'historique ont été reçus avant nous, on les redemande.
        emit({ op: 'pmReady' });
        send('private_message', 'wl', '');
        send('private_message', 'getblock', '');
      } else {
        setTimeout(function () { if (!pmOpen()) { try { connect('private_message').catch(warn); } catch (e) { warn(e); } } }, 2500);
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
      try { if (data && data.group && data.group !== ENV) emit({ op: 'group', id: lower(data.group), title: data.header ? String(data.header) : '', hidden: !!data.hidden, owned: data.recent === false }); } catch (e) { warn(e); }
      return renderGroup(data);
    };
  }

  return {
    ok: !!(C && C.event && typeof C.on === 'function'),
    onOp: onOp,
    canReply: function (id) { return !!id && String(id).indexOf('k:') !== 0; },
    /**
     * Permet d'envoyer un message de groupe, ou la modification d'un message.
     * @param {string} gid Groupe visé.
     * @param {string} text Texte saisi.
     * @param {{replyId: ?string, editId: ?string, quote: ?string, channel: ?string, style: ?Object}} opts Réponse, original modifié ou citation en texte brut, canal et style perso.
     * @returns {?Object} Style propre lu dans le corps construit par Torch, null si rien n'est parti.
     */
    send: function (gid, text, opts) {
      opts = opts || {};
      var built;
      try { built = groupBody(gid, text, opts); } catch (e) { warn(e); return null; }
      if (!built) return null;
      var failure = opts.editId ? 'Your message could not be edited.' : opts.replyId ? 'Your reply could not be sent.' : opts.quote ? 'Your quote could not be sent.' : 'Your message failed to be delivered.';
      var user = (C.groups[gid] && C.groups[gid].user) || {};
      var flag = (CHANNEL_FLAG[opts.channel] || 0) + (parseInt(user.badge, 10) || 0);
      return send(gid, 'bm:' + Math.round(15E5 * Math.random()).toString(36) + ':' + flag + ':' + built.body, failure) ? built.style : null;
    },
    /**
     * Permet de mesurer, comme le compteur de Torch, le corps qu'enverrait send, sans le préfixe bm.
     * @param {string} gid Groupe visé.
     * @param {string} text Texte saisi.
     * @param {{replyId: ?string, editId: ?string, quote: ?string, style: ?Object}} opts Mêmes options que send.
     * @returns {number} Longueur du corps, 0 pour un texte vide.
     */
    measure: function (gid, text, opts) {
      if (!text) return 0;
      try { var built = groupBody(gid, text, opts); return built ? built.body.length : 0; } catch (e) { warn(e); return 0; }
    },
    /**
     * Permet d'envoyer un message privé.
     * @param {string} user Destinataire.
     * @param {string} text Texte saisi.
     * @param {?Object} style Style perso.
     * @returns {?{style: Object, text: string, parts: ?Array, embeds: Array}} Corps construit par Torch analysé comme un MP reçu, null si rien n'est parti.
     */
    sendPm: function (user, text, style) {
      try {
        applyStyle(style);
        // Le premier appel construit le corps sans l'envoyer : seul le second émet la trame.
        var body = C.sendMessage(esc(text), true, 'private_message', user);
        if (typeof body !== 'string' || !body) return null;
        C.sendMessage(esc(text), false, 'private_message', user);
        // Torch n'écrit une balise Premium que pour un compte Premium : chaque balise de ce corps s'affiche.
        var parsed = parseContent(body, false, true);
        return { style: parsed.style, text: parsed.text, parts: parsed.parts, embeds: parsed.embeds };
      } catch (e) { warn(e); return null; }
    },
    /**
     * Permet de lire le style que Torch enverrait sans style perso.
     */
    accountStyle: function () {
      var v = accountStyle || readStyle(styleFields());
      return { face: v.face, size: v.size, textColor: v.textColor, nameColor: v.nameColor, bold: v.bold, italic: v.italic, underline: v.underline, strike: v.strike };
    },
    applyStyle: function (style) { try { applyStyle(style); } catch (e) { warn(e); } },
    focus: function (gid) { try { C.setFocus({ group: gid }); } catch (e) { warn(e); } },
    /**
     * Permet de suivre la conversation affichée, et d'en demander la présence quand elle change de correspondant.
     * @param {string|boolean} user Correspondant affiché, false hors des MP.
     */
    focusPm: function (user) {
      // Torch n'archive un message privé envoyé que pour la conversation qu'il considère ouverte.
      try { if (C.private) C.private.focus = user || false; } catch (e) { warn(e); }
      if (user && user !== connectTarget) connectPm(user);
    },
    /**
     * Permet de lire le MP que Torch considère ouvert, dont il joue lui-même le son.
     * @returns {string|boolean|undefined} Membre de client.private.focus, false ou undefined sans MP ouvert pour Torch.
     */
    focusedPm: function () { return C.private.focus; },
    /**
     * Permet de savoir si le compte est Premium, comme Torch avant d'écrire une émoticône Premium.
     * @returns {boolean} Statut 200 ou 210 de la trame premium, faux tant que la connexion privée n'est pas ouverte.
     */
    premium: function () { return !!C.private && [200, 210].indexOf(C.private.premium.status) >= 0; },
    connectPm: connectPm,
    join: function (gid) {
      delete left[gid];
      try { if (SB && SB.renderGroup) SB.renderGroup({ group: gid, header: gid, recent: true }); } catch (e) { warn(e); }
      try { connect(gid).then(function () { try { C.setFocus({ group: gid }); } catch (e) { warn(e); } }, warn); } catch (e) { warn(e); }
    },
    leave: function (gid) { left[gid] = true; try { C.disconnectFrom(gid); } catch (e) { warn(e); } },
    reconnect: function (gid) {
      try {
        connect(gid).then(function () { if (gid !== 'private_message') { try { C.setFocus({ group: gid, reload: true }); } catch (e) { warn(e); } } }, warn);
      } catch (e) { warn(e); }
    },
    loadMore: function (gid) {
      var g = C.groups && C.groups[gid], failure = 'Earlier messages could not be loaded.';
      if (g && g.load === -1) return 'done';
      if (g && send(gid, 'get_more:20:' + (g.load || 0), failure)) return 'sent';
      emit({ op: 'notice', gid: gid, text: failure });
      return 'failed';
    },
    /* Modération : trames identiques à celles de Torch */
    deleteMessage: function (gid, id) { return send(gid, 'delmsg:' + id, 'The message could not be deleted.'); },
    deleteAllFrom: function (gid, m) { return send(gid, 'delallmsg:' + m.unid + ':' + m.ip + ':' + (/^[!#]/.test(m.author) ? '' : m.author), 'The messages could not be deleted.'); },
    ban: function (gid, m) { return send(gid, 'block:' + m.unid + ':' + m.ip + ':' + (/^[!#]/.test(m.author) ? '' : m.author), 'The ban could not be sent.'); },
    unban: function (gid, b) { return send(gid, 'removeblock:' + b.unid + ':' + b.ip, 'The unban could not be sent.'); },
    unbanAll: function (gid) { return send(gid, 'unbanall', 'The unban could not be sent.'); },
    /**
     * Permet de demander une page de bannissements ou de débannissements, comme Torch.
     * @param {string} gid Groupe visé.
     * @param {string} kind block ou unblock.
     * @param {string} ts Horodatage de la dernière ligne chargée, 0 pour la première page.
     */
    banList: function (gid, kind, ts) { return send(gid, 'blocklist:' + kind + ':' + ts + ':next:' + BAN_PAGE + ':anons:1', 'The ban list could not be loaded.'); },
    searchBans: function (gid, query) { return send(gid, 'searchban:' + query, 'The search could not be sent.'); },
    clearAll: function (gid) { return send(gid, 'clearall', 'The messages could not be cleared.'); },
    /* Réglages de groupe : trames relevées dans chadango et chatango-lib */
    requestSettings: function (gid) {
      ['getannouncement', 'getbannedwords', 'getratelimit', 'getmodactions:prev:0:50'].forEach(function (f) { send(gid, f, 'Group settings could not be loaded.'); });
    },
    setFlags: function (gid, add, remove) { return send(gid, 'updategroupflags:' + add + ':' + remove, 'The group settings could not be saved.'); },
    setAnnouncement: function (gid, enabled, seconds, text, read) {
      var prefix = read.prefix || '<n000/><f x11000="0">';
      var close = (prefix.match(/<[biu]>/g) || []).reverse().join('').replace(/</g, '</');
      // Mode 3 : annonce activée avec le fond de message du propriétaire, gardé tant que l'interface ne le règle pas.
      var mode = !enabled ? 0 : read.mode === 3 ? 3 : 1;
      // Sauts de ligne en \r comme Torch, dont l'éditeur retire les <br/> à la relecture.
      var body = prefix + esc(text).replace(/\r?\n/g, '\r') + close;
      var ok = send(gid, 'updateannouncement:' + mode + ':' + seconds + ':' + body, 'The announcement could not be saved.');
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
    /**
     * Historique archivé par Torch dans IndexedDB, regroupé par interlocuteur, avec l'état lu de chaque message.
     * @param {number} perTarget Nombre d'entrées gardées par interlocuteur, les plus récentes.
     * @returns {Promise<Object>} Par interlocuteur, ses entrées de la plus ancienne à la plus récente (list) et s'il en reste de plus anciennes (more).
     */
    pmHistory: function (perTarget) {
      return openPmDb().then(function (db) { return new Promise(function (resolve) {
        try {
          if (!db) { resolve({}); return; }
          var out = {}, req = db.transaction(['messages'], 'readonly').objectStore('messages').openCursor();
          req.onsuccess = function (e) {
            var cur = e.target.result;
            if (!cur) {
              Object.keys(out).forEach(function (k) {
                var list = out[k].sort(function (a, b) { return a.archiveTs - b.archiveTs; });
                out[k] = { list: list.slice(-perTarget), more: list.length > perTarget };
              });
              resolve(out); return;
            }
            var v = cur.value || {}, target = lower(v.target), x = target && pmEntry(v);
            if (x) (out[target] = out[target] || []).push(x);
            cur.continue();
          };
          req.onerror = function () { resolve({}); };
        } catch (e) { warn(e); resolve({}); }
      }); });
    },
    /**
     * Permet de lire les entrées archivées d'un membre avant une clé, comme Torch au défilement (loadMessage).
     * @param {string} target Membre de la conversation.
     * @param {number} before Clé archiveTs de l'entrée la plus ancienne déjà chargée, exclue.
     * @param {number} count Nombre d'entrées au plus.
     * @returns {Promise<{list: Array, more: boolean}>} Entrées de la plus ancienne à la plus récente, et s'il en reste de plus anciennes. Rejetée sans base.
     */
    pmOlder: function (target, before, count) {
      return openPmDb().then(function (db) { return new Promise(function (resolve, reject) {
        if (!db) throw new Error('The private history of this browser could not be opened.');
        var list = [], req = db.transaction(['messages'], 'readonly').objectStore('messages').index('target_ts_idx')
          .openCursor(IDBKeyRange.bound([target, 0], [target, before], false, true), 'prev');
        req.onsuccess = function (e) {
          var cur = e.target.result, x = cur && pmEntry(cur.value);
          if (x) list.push(x);
          // Une entrée de plus que demandé dit s'il en reste.
          if (cur && list.length <= count) { cur.continue(); return; }
          resolve({ list: list.slice(0, count).reverse(), more: list.length > count });
        };
        req.onerror = function () { reject(req.error); };
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
      return cached(profileCache, n, function () {
        return fetch(CH.subdomain.mod1(n)).then(function (r) { return r.text(); }).then(function (xml) {
          var doc = new DOMParser().parseFromString(xml, 'text/xml');
          if (doc.querySelector('parsererror')) return { missing: true };
          var q = function (sel) { var el = doc.querySelector(sel); return el ? el.textContent.trim() : ''; };
          var birth = new Date(q('b')).getFullYear();
          var data = {
            missing: false, age: isNaN(birth) ? '' : String(new Date().getFullYear() - birth),
            gender: GENDERS[q('s')] || '', location: q('l'), about: unquote(q('body')),
            premium: (parseInt(q('d'), 10) || 0) * 1000 > Date.now(), mini: null
          };
          if (!data.premium) return data;
          return memberFile(CH.subdomain.custom_profile(n), /^text\/css/, parseMiniCss).then(function (mini) { data.mini = mini; return data; });
        });
      });
    },
    /**
     * Permet de lire le fond de message Premium d'un membre (msgbg.xml), au plus une fois par délai de cache.
     * @param {string} name Membre visé.
     * @returns {Promise<?Object>} Fond lu par parseMsgBg, null pour un invité ou un membre sans fond.
     */
    fetchMsgBg: function (name) {
      var n = lower(name);
      if (!ACCOUNT_NAME.test(n)) return Promise.resolve(null);
      return cached(msgBgCache, n, function () {
        return memberFile(CH.subdomain.msgbg(n, 'xml'), /^text\/xml/, function (xml) { return parseMsgBg(xml, CH.subdomain.msgbg(n, 'jpg')); });
      });
    },
    fetchFullProfile: fetchFullProfile,
    /**
     * Permet de marquer lus les messages archivés d'un membre, comme Torch à l'ouverture d'une conversation.
     * @param {string} name Membre de la conversation.
     */
    markPmRead: function (name) {
      // Transaction créée après la pile en cours : Torch n'archive un MP reçu qu'après l'émission de pm.
      openPmDb().then(function (db) {
        // Borne haute en chaîne comme Torch : dans l'ordre IndexedDB, une chaîne passe après tout horodatage.
        if (db) return markRead(db, IDBKeyRange.bound([name, 1], [name, '']));
      }).catch(warn);
    },
    /** Supprime l'historique que Torch garde dans ce navigateur ; Chatango n'en conserve pas. */
    clearPmHistory: function (target) { try { C.private.clearHistory(target); return true; } catch (e) { warn(e); return false; } },
    /* Profil : lu dans les champs que Torch remplit à la connexion, enregistré par client.post */
    readProfile: function () {
      var dir = document.querySelector('[data-setting="show_profile"] input');
      // Torch remplit ce champ en relisant mod2.xml après l'enregistrement, parfois depuis le cache HTTP.
      var sent = fresh(fullProfileCache, lower(C.user && C.user.name));
      return {
        loaded: !!(C.user && C.user.avatar && typeof C.user.avatar === 'object' && document.querySelector('[data-text-field="age"]') && dir),
        age: readField('[data-text-field="age"]'), gender: readField('[data-text-field="gender"]'), location: readField('[data-text-field="location"]'),
        about: readField('[data-text-field="about"]'), full: sent ? sent.data : readField('[data-text-field="full"]'), dir: !!(dir && dir.checked)
      };
    },
    saveProfile: function (p) {
      return Promise.resolve().then(function () { return saveProfileNow(p); });
    },
    setting: readSetting,
    /**
     * Permet de lire la restriction des MP de son compte, un appel au plus par chargement de la page, après l'ouverture de la connexion privée.
     * @returns {Promise<?string>} restricted, ok ou unknown, null sans appel si check_pmr est coupé ou illisible.
     */
    pmrStatus: function () {
      if (!readSetting('pmrCheck')) return Promise.resolve(null);
      if (!pmrCheck) pmrCheck = (pmOpen() ? Promise.resolve() : new Promise(function (resolve) { pmrConnected = resolve; })).then(function () {
        if (readSetting('pmrCheck')) return fetchPmr();
        // Réglage coupé en attendant la connexion privée : aucun appel, la demande suivante repart de zéro.
        pmrCheck = null;
        return null;
      });
      return pmrCheck;
    },
    /**
     * Permet de lire les réglages de démarrage de Torch.
     * @returns {?Object} Les trois interrupteurs, null si les réglages de Torch sont illisibles.
     */
    startupSettings: function () {
      var out = {};
      return ['joinOwned', 'joinRecent', 'joinFavorites'].every(function (k) { out[k] = readSetting(k); return out[k] !== null; }) ? out : null;
    },
    /**
     * Permet d'enregistrer un interrupteur dans les réglages de Torch, en place puis sous la clé settings.
     * @param {string} key Clé de SETTINGS.
     * @param {boolean} value Nouvelle valeur.
     */
    setSetting: function (key, value) {
      var p = SETTINGS[key];
      try {
        C.settings[p[0]][p[1]][p[2]] = value;
        saveSettings();
        return true;
      } catch (e) { warn(e); return false; }
    },
    /**
     * Permet de lire les réglages de son que Torch applique.
     * @returns {?Object} Interrupteurs et volumes de 0 à 100, null si les réglages de Torch sont illisibles.
     */
    torchSounds: function () {
      try {
        var sound = C.settings.notifications.sound, out = {};
        // Le curseur de Torch enregistre le volume en texte.
        SOUND_KEYS.forEach(function (k) { out[k] = k.indexOf('volume_') === 0 ? parseInt(sound[k], 10) : !!sound[k]; });
        return out;
      } catch (e) { warn(e); return null; }
    },
    /**
     * Permet d'enregistrer un réglage de son dans les réglages de Torch, relus à chaque son.
     * @param {string} key Clé de SOUND_KEYS.
     * @param {boolean|number} value Interrupteur, ou volume de 0 à 100.
     */
    setTorchSound: function (key, value) {
      if (SOUND_KEYS.indexOf(key) < 0) return false;
      try {
        C.settings.notifications.sound[key] = key.indexOf('volume_') === 0 ? Math.max(0, Math.min(100, Math.round(value))) : !!value;
        saveSettings();
        return true;
      } catch (e) { warn(e); return false; }
    },
    /**
     * Permet de jouer un son de Torch à son volume réglé, comme Torch.
     * @param {string} kind mention ou online.
     * @returns {Promise} Rejetée si le navigateur refuse la lecture.
     */
    playTorchSound: function (kind) {
      try {
        var audio = C.sound[SOUND_AUDIO[kind]];
        audio.volume = parseInt(C.settings.notifications.sound['volume_' + kind], 10) / 100;
        return audio.play();
      } catch (e) { warn(e); return Promise.reject(e); }
    },
    /**
     * Permet de lire les groupes favoris de Torch.
     * @returns {?Array<string>} Noms des groupes, null si les réglages de Torch sont illisibles.
     */
    favoriteGroups: function () { return readList('favorite'); },
    /**
     * Permet d'ajouter ou de retirer un groupe des favoris de Torch.
     * @param {string} gid Groupe visé.
     * @param {boolean} on Vrai pour l'ajouter.
     */
    setFavorite: function (gid, on) { return writeList('favorite', gid, on); },
    /**
     * Permet de lire les groupes coupés dans Torch, dont il tait les mentions.
     * @returns {?Array<string>} Noms des groupes, null si les réglages de Torch sont illisibles.
     */
    mutedGroups: function () { return readList('muted'); },
    /**
     * Permet de couper ou de rétablir un groupe dans Torch.
     * @param {string} gid Groupe visé.
     * @param {boolean} on Vrai pour le couper.
     */
    setMuted: function (gid, on) { return writeList('muted', gid, on); },
    /**
     * Permet de lire les membres ignorés dans Torch, dont il tait les alertes.
     * @returns {?Array<string>} Noms en minuscules, null si les réglages de Torch sont illisibles.
     */
    ignoredUsers: function () { return readList('ignored'); },
    /**
     * Permet d'ignorer un membre dans Torch ou de ne plus l'ignorer.
     * @param {string} name Membre visé.
     * @param {boolean} on Vrai pour l'ignorer.
     */
    setIgnored: function (name, on) { return writeList('ignored', lower(name), on); },
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

  /**
   * Permet de lire le profil complet d'un membre (mod2.xml), HTML à n'afficher que dans un cadre isolé.
   * @param {string} name Membre visé.
   * @returns {Promise<string>} Chaîne vide si le fichier manque, rejetée sur une erreur serveur.
   */
  function fetchFullProfile(name) {
      var n = lower(name);
      if (!/^[a-z0-9_-]{1,20}$/.test(n)) return Promise.resolve('');
      var hit = fresh(fullProfileCache, n);
      if (hit) return Promise.resolve(hit.data);
      return fetch(CH.subdomain.mod2(n)).then(function (r) {
        // Erreur serveur rejetée : lue comme profil vide, elle effacerait le profil complet au prochain enregistrement.
        if (r.status >= 500) throw new Error('Chatango returned HTTP ' + r.status + ' for mod2.xml.');
        return r.ok ? r.text() : '';
      }).then(function (xml) {
        var doc = new DOMParser().parseFromString(xml, 'text/xml'), body = doc.querySelector('body');
        return !doc.querySelector('parsererror') && body ? unquote(body.textContent) : '';
      });
  }
  function saveProfileNow(p) {
      var me = lower(C.user && C.user.name), sentFull;
      // Chaîne vide envoyée telle quelle : seul un profil complet inconnu de la page est relu chez Chatango.
      var full = p.full != null ? Promise.resolve(p.full) : fetchFullProfile(me).catch(function () { return null; });
      return full.then(function (fullText) {
        if (fullText === null) throw new Error('Your full profile could not be read. Nothing was saved.');
        sentFull = fullText;
        var fields = { auth: 'token', arch: 'h5', src: 'group', action: 'update', age: p.age, gender: p.gender, location: p.location, line: p.about, full_profile: fullText };
        if (p.dir) fields.dir = 'checked';
        return post(CH.path('updateprofile'), fields, {});
      }).then(function (resp) {
        var data = {};
        String(resp).split('&').forEach(function (kv) { var i = kv.indexOf('='); if (i > 0) data[kv.slice(0, i)] = kv.slice(i + 1); });
        if (data.error) throw new Error(unquote(data.error));
        if (!('age' in data || 'sex' in data || 'loc' in data)) throw new Error('Chatango sent an unexpected reply. Check your profile on chatango.com.');
        try { C.setProfile(data); } catch (e) { warn(e); }
        // mod1.xml et mod2.xml peuvent revenir du cache HTTP sans la version enregistrée : le cache local sert la version envoyée.
        var prev = profileCache[me] ? profileCache[me].data : {};
        profileCache[me] = { at: Date.now(), data: Object.assign({}, prev, { missing: false, age: String(p.age), gender: GENDERS[p.gender] || '', location: p.location, about: p.about }) };
        fullProfileCache[me] = { at: Date.now(), data: sentFull };
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
