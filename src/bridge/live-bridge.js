var liveBridge = (function () {
  if (!LIVE) return null;
  var refs = window.__torchRefs || {};
  var C = refs.client, CH = refs.chatango, SB = refs.sidebar;
  var ENV = refs.torch && refs.torch.environment;
  var listeners = [], queue = [];
  var GENDERS = { M: 'Male', F: 'Female' };
  var STARTUP = { joinOwned: ['groups', 'connect_own'], joinRecent: ['groups', 'connect_recent'], joinFavorites: ['groups', 'connect_favorite'], openPms: ['private_messages', 'connect_start'] };

  function emit(op) { if (listeners.length) listeners.forEach(function (f) { f(op); }); else queue.push(op); }
  function onOp(fn) { listeners.push(fn); var q = queue; queue = []; q.forEach(fn); return function () { listeners = listeners.filter(function (x) { return x !== fn; }); }; }
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
      case 'gotmore': emit({ op: 'moreLoaded', gid: room }); break;
      case 'getannc':
        if (data[0] === 'none' || data.length < 4) emit({ op: 'annc', gid: room, enabled: false, interval: 0, text: '', displayText: '', embeds: [] });
        else {
          var raw = data.slice(4).join(':'), shown = parseContent(raw, false);
          // Le style d'origine (couleurs, police) est conservé pour le prochain enregistrement, et les médias restent dans le texte renvoyé.
          emit({ op: 'annc', gid: room, enabled: data[0] !== '0', interval: parseInt(data[3], 10) || 0, text: parseContent(raw, true).text, displayText: shown.text, embeds: shown.embeds, prefix: (/^(<n[^>]*\/>)?(<f [^>]*>)?/.exec(raw) || [''])[0] });
        }
        break;
      case 'annc': {
        var posted = parseContent(data.slice(2).join(':'), false);
        emit({ op: 'anncPost', gid: room, text: posted.text, embeds: posted.embeds });
        break;
      }
      case 'bw': emit({ op: 'bw', gid: room, part: unquote(data[0]), whole: unquote(data[1]) }); break;
      case 'getratelimit': case 'ratelimitset': emit({ op: 'rate', gid: room, seconds: parseInt(data[0], 10) || 0 }); break;
      case 'blocklist': emit({ op: 'bans', gid: room, list: parseBans(data) }); break;
      case 'blocked': emit({ op: 'banned', gid: room, ban: { unid: data[0], ip: data[1], name: lower(data[2]) || '!anon', by: lower(data[3]), at: Date.now() } }); break;
      case 'unblocked': emit({ op: 'unbanned', gid: room, list: parseBans(data) }); break;
      case 'allunblocked': emit({ op: 'unbannedAll', gid: room }); break;
      case 'modactions': emit({ op: 'modlog', gid: room, list: parseModLog(data) }); break;
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
        var p2 = parseContent(data.slice(5).join(':'));
        emit({ op: 'pm', from: lower(data[0]), text: p2.text, style: p2.style, embeds: p2.embeds, ts: Math.round(parseFloat(data[3]) * 1000) || Date.now(), offline: name === 'msgoff' });
        break;
      }
      case 'wl': {
        var friends = [];
        for (var i = 0; i + 3 < data.length; i += 4) if (data[i]) friends.push(friendPresence(data[i], data[i + 2], data[i + 1], data[i + 3]));
        emit({ op: 'friends', list: friends });
        break;
      }
      case 'wladd':
        if (data[1] === 'invalid') emit({ op: 'notice', gid: 'private_message', text: 'No Chatango user named ' + lower(data[0]) + '.' });
        // Triplet : la valeur vaut des minutes d'inactivité si on, un horodatage si off ou app.
        else emit({ op: 'friends', added: true, list: [friendPresence(data[0], data[1], data[2], data[2])] });
        break;
      case 'wldelete': if (data[1] === 'deleted') emit({ op: 'unfriend', name: lower(data[0]) }); break;
      case 'wlonline': case 'wlapp': emit({ op: 'presence', name: lower(data[0]), status: 'online' }); break;
      case 'wloffline': emit({ op: 'presence', name: lower(data[0]), status: 'offline', lastOn: epochMs(data[1]) }); break;
      // La trame status ne dit pas si le compte est inactif : un état idle connu doit rester en place.
      case 'status': emit(data[2] === 'offline' ? { op: 'presence', name: lower(data[0]), status: 'offline', lastOn: epochMs(data[1]) } : { op: 'presence', name: lower(data[0]), status: 'online', keepIdle: true }); break;
      case 'idleupdate': emit({ op: 'presence', name: lower(data[0]), status: data[1] === '0' ? 'idle' : 'online' }); break;
      case 'presence': {
        var people = [];
        // Hors ligne, les minutes ne sont pas de l'inactivité : elles servent de dernière connexion approchée.
        for (var j = 0; j + 2 < data.length; j += 3) if (data[j]) {
          var on = data[j + 2] === 'online' || data[j + 2] === 'app';
          people.push({ name: lower(data[j]), status: on ? (+data[j + 1] > 0 ? 'idle' : 'online') : 'offline', lastOn: !on && +data[j + 1] ? Date.now() - data[j + 1] * MIN : 0 });
        }
        emit({ op: 'people', list: people });
        break;
      }
      case 'block_list': emit({ op: 'pmBlocked', list: data.filter(Boolean).map(lower) }); break;
      case 'unblocked': emit({ op: 'pmUnblocked', name: lower(data[0]) }); break;
      case 'OK': emit({ op: 'pmReady' }); break;
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
        if (kind === 'private' && name === 'DENIED') return;
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
    writeStyle(f, Object.assign({}, style, { strike: false, on: true, active: true }));
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
      emit({ op: 'login', me: lower(C.user.name) });
      // Groupes déjà connectés avant nous : leurs trames inited et participants sont passées.
      if (catchUp) Object.keys(C.groups || {}).forEach(function (gid) { if (gid !== ENV) emit({ op: 'group', id: gid, title: '', hidden: false, ready: true }); });
      if (typeof window.__TORCH_SHOW__ === 'function') window.__TORCH_SHOW__();
      var pmOpen = function () { return !!(C.private && C.private.socket && C.private.socket.readyState === 1); };
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
     * @param {{replyId: ?string, channel: ?string, style: ?Object}} opts Réponse, canal et style perso.
     * @returns {?Object} Style propre lu dans le corps construit par Torch, null si rien n'est parti.
     */
    send: function (gid, text, opts) {
      opts = opts || {};
      var body;
      try { applyStyle(opts.style); body = C.sendMessage(esc(text), true, gid); } catch (e) { warn(e); return null; }
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
     * @param {?Object} style Style perso.
     * @returns {?{style: Object, text: string, embeds: Array}} Corps construit par Torch analysé comme un MP reçu, null si rien n'est parti.
     */
    sendPm: function (user, text, style) {
      try {
        applyStyle(style);
        // Le premier appel construit le corps sans l'envoyer : seul le second émet la trame.
        var body = C.sendMessage(esc(text), true, 'private_message', user);
        if (typeof body !== 'string' || !body) return null;
        C.sendMessage(esc(text), false, 'private_message', user);
        var parsed = parseContent(body);
        return { style: parsed.style, text: parsed.text, embeds: parsed.embeds };
      } catch (e) { warn(e); return null; }
    },
    /**
     * Permet de lire le style que Torch enverrait sans style perso.
     */
    accountStyle: function () {
      var v = accountStyle || readStyle(styleFields());
      return { face: v.face, size: v.size, textColor: v.textColor, nameColor: v.nameColor, bold: v.bold, italic: v.italic, underline: v.underline };
    },
    applyStyle: function (style) { try { applyStyle(style); } catch (e) { warn(e); } },
    focus: function (gid) { try { C.setFocus({ group: gid }); } catch (e) { warn(e); } },
    // Torch n'archive un message privé envoyé que pour la conversation qu'il considère ouverte.
    focusPm: function (user) { try { if (C.private) C.private.focus = user || false; } catch (e) { warn(e); } },
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
        if (doc.querySelector('parsererror')) return { missing: true };
        var q = function (sel) { var el = doc.querySelector(sel); return el ? el.textContent.trim() : ''; };
        var birth = new Date(q('b')).getFullYear();
        var data = {
          missing: false, age: isNaN(birth) ? '' : String(new Date().getFullYear() - birth),
          gender: GENDERS[q('s')] || '', location: q('l'), about: unquote(q('body')),
          premium: (parseInt(q('d'), 10) || 0) * 1000 > Date.now(), mini: null
        };
        if (!data.premium) return data;
        return fetch(CH.subdomain.custom_profile(n)).then(function (r) {
          // Sans fichier de style, Chatango répond par une petite image JPEG.
          return r.ok && /^text\/css/.test(r.headers.get('content-type')) ? r.text().then(parseMiniCss) : null;
        }).catch(function (e) { warn(e); return null; }).then(function (mini) { data.mini = mini; return data; });
      }).then(function (data) {
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
     * Permet de lire les réglages de démarrage de Torch.
     * @returns {?Object} Les quatre interrupteurs, null si les réglages de Torch sont illisibles.
     */
    startupSettings: function () {
      try {
        var privacy = C.settings.privacy, out = {};
        Object.keys(STARTUP).forEach(function (k) { out[k] = !!privacy[STARTUP[k][0]][STARTUP[k][1]]; });
        return out;
      } catch (e) { warn(e); return null; }
    },
    /**
     * Permet d'enregistrer un réglage de démarrage dans les réglages de Torch.
     * @param {string} key Clé de STARTUP.
     * @param {boolean} value Nouvelle valeur.
     */
    setStartupSetting: function (key, value) {
      try {
        C.settings.privacy[STARTUP[key][0]][STARTUP[key][1]] = value;
        // Persistance identique à Torch : l'objet entier est réécrit sous la seule clé settings.
        localStorage.setItem('settings', JSON.stringify(C.settings));
        return true;
      } catch (e) { warn(e); return false; }
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
