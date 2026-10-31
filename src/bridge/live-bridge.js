var liveBridge = (function () {
  if (!LIVE) return null;
  var refs = window.__betterChatangoRefs || {};
  var C = refs.client, CH = refs.chatango, SB = refs.sidebar;
  var ENV = refs.torch && refs.torch.environment;
  var listeners = [], queue = [];
  var GENDERS = { M: 'Male', F: 'Female' };
  var SETTINGS = {
    joinOwned: ['privacy', 'groups', 'connect_own'], joinRecent: ['privacy', 'groups', 'connect_recent'], joinFavorites: ['privacy', 'groups', 'connect_favorite'],
    markdown: ['appearance', 'messages', 'parse_markdown'], guestMessages: ['safety', 'messages', 'show_guest'], announcements: ['appearance', 'messages', 'show_annc'],
    pmrCheck: ['privacy', 'private_messages', 'check_pmr'],
    tabTitleAlerts: ['notifications', 'display', 'tab_title'], desktopMentions: ['notifications', 'display', 'push_desktop']
  };
  var LISTS = { favorite: ['privacy', 'groups', 'favorite'], muted: ['notifications', 'muted', 'groups'], ignored: ['safety', 'users', 'ignore'], trusted: ['safety', 'whitelist', 'domain'] };
  var CONNECT_STATE = { online: 'on', app: 'app', offline: 'off' };
  // Only sound settings that BetterChatango reads, with the Audio object each one sets.
  var SOUND_KEYS = ['play_mention', 'volume_mention', 'play_online', 'volume_online'];
  var SOUND_AUDIO = { mention: 'message', online: 'play_online' };
  // Size of the ban and unban pages requested by BetterChatango.
  var BAN_PAGE = 50;

  // A message shown before its final id keeps the temporary id k:{key}, which Chatango refers to by the key alone.
  function withTempIds(ids) { return ids.concat(ids.map(function (id) { return 'k:' + id; })); }
  function emit(op) { if (listeners.length) listeners.forEach(function (f) { f(op); }); else queue.push(op); }
  function onOp(fn) { listeners.push(fn); var q = queue; queue = []; q.forEach(fn); return function () { listeners = listeners.filter(function (x) { return x !== fn; }); }; }
  function note(text) { if (JOURNAL) JOURNAL.add('app', text); }
  function connName(gid) { return gid === 'private_message' ? 'private messages' : '#' + gid; }
  /**
   * Forwards a page of the ban list (block) or the unban list (unblock).
   * @param {string} room Group.
   * @param {string} kind block or unblock.
   * @param {Array<string>} data Frame split on :.
   */
  function banPage(room, kind, data) {
    var list = parseBans(data);
    // Like BetterChatango, an incomplete page is the last one.
    emit({ op: 'bans', gid: room, kind: kind, list: list, more: list.length >= BAN_PAGE });
  }
  function author(data) {
    if (data[1]) return lower(data[1]);
    if (data[2]) return '#' + lower(data[2]);
    try { return CH.getAnon(data[3], (/<n(\d+)\/>/.exec(data[9] || '') || [0, 3452])[1]); } catch (e) { return '!anon'; }
  }
  function toMsg(room, data, temp) {
    var flags = parseInt(data[7], 10) || 0, name = author(data);
    // Like BetterChatango, messages from the group owner count as Premium.
    var premium = !!(flags & MSG_FLAG.PREMIUM) || name === lower(C.groups[room].room.owner);
    var parsed = parseContent(data.slice(9).join(':'), false, premium);
    return {
      id: (temp ? 'k:' : '') + data[5], kind: 'msg', author: name, text: parsed.text, parts: parsed.parts, ts: Math.round(parseFloat(data[0]) * 1000) || Date.now(),
      style: parsed.style, embeds: parsed.embeds, replyId: parsed.replyId, editId: parsed.editId, unid: data[4] || '', ip: data[6] || '', channel: channelOf(flags),
      bg: !!(flags & MSG_FLAG.BG_ON) && premium
    };
  }

  // Final ids (u frame) that arrived before the matching message (b frame).
  var earlyIds = {}, waitingIds = {};
  var profileCache = {}, fullProfileCache = {}, msgBgCache = {}, CACHE_MS = 300000;
  function fresh(store, n) { var hit = store[n]; return hit && Date.now() - hit.at < CACHE_MS ? hit : null; }
  function cached(store, n, load) {
    var hit = fresh(store, n);
    if (hit) return Promise.resolve(hit.data);
    return load().then(function (data) { store[n] = { at: Date.now(), data: data }; return data; });
  }
  // Like BetterChatango, only a reply of the expected type counts: without a style file, Chatango returns a small JPEG image.
  function memberFile(url, type, parse) {
    return fetch(url).then(function (r) { return r.ok && type.test(r.headers.get('content-type')) ? r.text().then(parse) : null; })
      .catch(function (e) { warn(e); return null; });
  }
  // Sessions of each group, by session timestamp like BetterChatango: { account }, { guest } or { anon: true }.
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
    // Departure of an unknown session (frame received before g_participants): only data[3] tells which account leaves.
    var before = t[ts] || (action === 0 ? sessionOf(data[3]) : {});
    if (action === 0) delete t[ts];
    // Action 2: BetterChatango tests the guest name before the account.
    else if (action === 2 && notNone(data[4])) t[ts] = sessionOf('None', data[4]);
    else t[ts] = sessionOf(data[3], data[4]);
    var after = t[ts] || {};
    // An account open in several sessions stays a member until the last one.
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
      case 'delete': emit({ op: 'del', gid: room, ids: withTempIds([data[0]]) }); break;
      case 'deleteall': emit({ op: 'del', gid: room, ids: withTempIds(data.slice()) }); break;
      case 'clearall': if (data[0] === 'ok') emit({ op: 'cleared', gid: room }); else emit({ op: 'notice', gid: room, text: 'Chatango refused to clear the messages.' }); break;
      case 'g_participants': participants(room, data.join(':').split(';')); break;
      case 'gparticipants': participants(room, data.slice(1).join(':').split(';')); break;
      case 'participant': participant(room, data); break;
      case 'n': emit({ op: 'count', gid: room, n: parseInt(data[0], 16) || 0 }); break;
      case 'ok': emit({ op: 'room', gid: room, owner: lower(data[0]), mods: parseMods(String(data[6] || '').split(';')), flags: parseInt(data[7], 10) || 0 }); break;
      case 'mods': emit({ op: 'mods', gid: room, mods: parseMods(data) }); break;
      case 'groupflagsupdate': emit({ op: 'flags', gid: room, flags: parseInt(data[0], 10) || 0 }); break;
      case 'inited':
        emit({ op: 'inited', gid: room });
        send(room, 'getannouncement', '');
        // BetterChatango loads the group title and description right after the connection.
        setTimeout(function () { var info = roomInfo(room); if (info) emit({ op: 'info', gid: room, title: info.title, description: info.description }); }, 3000);
        break;
      case 'nomore': emit({ op: 'histEnd', gid: room }); break;
      case 'gotmore': emit({ op: 'moreLoaded', gid: room }); break;
      case 'getannc':
        if (data[0] === 'none' || data.length < 4) emit({ op: 'annc', gid: room, mode: 0, enabled: false, interval: 0, text: '', displayText: '', embeds: [] });
        else {
          // Like BetterChatango, an announcement always has the Premium flag.
          var raw = data.slice(4).join(':'), shown = parseContent(raw, false, true);
          // The original style (colors, font, emphasis set by BetterChatango after <f>) is kept for the next save, and media stay in the text sent back.
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
      case 'bansearchresult': gotReply('searchban:' + room); emit({ op: 'banSearch', gid: room, ban: parseBanSearch(data) }); break;
      case 'badbansearchstring': gotReply('searchban:' + room); emit({ op: 'banSearchRefused', gid: room, code: data[0] }); break;
      case 'allunblocked': emit({ op: 'unbannedAll', gid: room }); break;
      case 'modactions': emit({ op: 'modlog', gid: room, list: parseModLog(data) }); break;
      case 'miu': delete msgBgCache[lower(data[0])]; emit({ op: 'msgBgStale', name: lower(data[0]) }); break;
      case 'updgroupinfo': emit({ op: 'info', gid: room, title: unquote(data[0]), description: unquote(data.slice(1).join(':')) }); break;
      case 'denied':
        // Neither inited nor participants will arrive: the message log and the members stop waiting.
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
        emit({ op: 'pm', from: lower(data[0]), text: p2.text, parts: p2.parts, style: p2.style, embeds: p2.embeds, key: p2.key, editId: p2.editId, replyId: p2.replyId, ts: Math.round(parseFloat(data[3]) * 1000) || Date.now(), archiveTs: parseFloat(data[3]), offline: name === 'msgoff' });
        // BetterChatango plays the sound itself for the PM of client.private.focus, reset to false on each private connection: the bridge plays it for the others, like BetterChatango, except for edits and ignored members.
        var from = lower(data[0]);
        if (name === 'msg' && !p2.editId && from !== lower(C.user.name) && from !== C.private.focus && (readList('ignored') || []).indexOf(from) < 0) {
          var sounds = readSounds();
          // Playback refused by the browser: intended silence, no toast.
          if (sounds && sounds.play_mention) playSound('mention').then(null, function () {});
        }
        break;
      }
      case 'wl': {
        var friends = [];
        for (var i = 0; i + 3 < data.length; i += 4) if (data[i]) friends.push(friendPresence(data[i], data[i + 2], data[i + 1], data[i + 3]));
        emit({ op: 'friends', list: friends });
        break;
      }
      case 'wladd':
        gotReply('wladd:' + lower(data[0]));
        if (data[1] === 'invalid') emit({ op: 'friendRefused', name: lower(data[0]) });
        // Triplet: the value is idle minutes if on, a timestamp if off or app.
        else emit({ op: 'friends', added: true, list: [friendPresence(data[0], data[1], data[2], data[2])] });
        break;
      case 'wldelete': if (data[1] === 'deleted') emit({ op: 'unfriend', name: lower(data[0]) }); break;
      case 'wlonline': case 'wlapp': emit({ op: 'presence', name: lower(data[0]), status: 'online' }); break;
      case 'wloffline': emit({ op: 'presence', name: lower(data[0]), status: 'offline', lastOn: epochMs(data[1]) }); break;
      // The status frame does not tell whether the account is idle: a known idle state must stay in place.
      case 'status': emit(data[2] === 'offline' ? { op: 'presence', name: lower(data[0]), status: 'offline', lastOn: epochMs(data[1]) } : { op: 'presence', name: lower(data[0]), status: 'online', keepIdle: true }); break;
      case 'idleupdate': emit({ op: 'presence', name: lower(data[0]), status: data[1] === '0' ? 'idle' : 'online' }); break;
      case 'connect': {
        // A reply with an empty name refuses the last name sent.
        var target = lower(data[0]) || connectTarget, state = data[0] && CONNECT_STATE[data[2]];
        if (state) emit({ op: 'people', list: [friendPresence(target, state, data[1], data[1])] });
        // Like BetterChatango, an unknown state is ignored.
        if (state || !data[0] || data[2] === 'invalid' || data[2] === 'nouser') emit({ op: 'pmChecked', name: target, found: !!state, asked: gotReply('connect:' + target) });
        break;
      }
      case 'presence': {
        var people = [];
        // When offline, the minutes are not idle time: they serve as an approximate last online time.
        for (var j = 0; j + 2 < data.length; j += 3) if (data[j]) {
          var on = data[j + 2] === 'online' || data[j + 2] === 'app', idle = on && +data[j + 1] > 0;
          people.push({ name: lower(data[j]), status: idle ? 'idle' : on ? 'online' : 'offline', lastOn: !on && +data[j + 1] ? Date.now() - data[j + 1] * MIN : 0, idleSince: idle ? Date.now() - data[j + 1] * MIN : 0 });
        }
        emit({ op: 'people', list: people });
        break;
      }
      case 'block_list': emit({ op: 'pmBlocked', list: data.filter(Boolean).map(lower) }); break;
      case 'unblocked': emit({ op: 'pmUnblocked', name: lower(data[0]) }); break;
      case 'OK':
        // Chatango forgets the connect of the previous connection, and BetterChatango builds a new client.private after this handler.
        connectTarget = '';
        setTimeout(function () { focusPm(pmFocus); }, 0);
        emit({ op: 'pmReady' });
        if (pmrConnected) pmrConnected();
        break;
      case 'kickingoff': emit({ op: 'session', reason: 'kicked' }); break;
      case 'DENIED': emit({ op: 'session', reason: 'denied' }); break;
      case 'show_fw': emit({ op: 'notice', gid: 'private_message', text: 'Flood warning: slow down or Chatango may disconnect your private messages.' }); break;
      case 'toofast': emit({ op: 'notice', gid: 'private_message', text: 'You are sending private messages too fast.' }); break;
      case 'show_offline_limit': emit({ op: 'notice', gid: 'private_message', text: 'This person has too many offline messages. Try again later.' }); break;
      default: break;
    }
  }
  // Frames that BetterChatango does not listen to: we add a handler, which its dispatcher calls like its own.
  var EXTRA = { group: ['getratelimit', 'ratelimitset', 'addmoderr', 'updatemoderr', 'removemoderr', 'groupflagstoggled', 'show_tb', 'tb'], private: [] };
  function wrapTable(table, kind) {
    if (!table) return;
    EXTRA[kind].forEach(function (name) { if (!(name in table)) table[name] = function () { /* handler added by Nightango */ }; });
    Object.keys(table).forEach(function (name) {
      var orig = table[name];
      if (typeof orig !== 'function' || orig.__skin) return;
      var w = function (c, socket, room, data) {
        try { if (kind === 'group') tapGroup(name, room, data || []); else tapPrivate(name, data || []); } catch (e) { warn(e); }
        // BetterChatango answers DENIED with a blocking alert(): the session-expired dialog replaces it.
        // Its connect handler opens its PM screen and can call api.vissle.me, outside the closed list.
        if (kind === 'private' && (name === 'DENIED' || name === 'connect')) return;
        return orig.apply(this, arguments);
      };
      w.__skin = true;
      table[name] = w;
    });
  }

  /* BetterChatango warnings: server refusals, lost connection, limits */
  var lastAlert = { text: '', at: 0 };
  function alertOnce(op) {
    if (op.text === lastAlert.text && Date.now() - lastAlert.at < 2500) return;
    lastAlert = { text: op.text, at: Date.now() };
    note('BetterChatango notice: ' + op.text);
    emit(op);
  }
  var QUIET = [/^Start a conversation/i, /^Private messages$/i, /^You have logged in to private messages elsewhere/i];
  function hookNotices() {
    if (typeof C.systemMessage === 'function' && !C.systemMessage.__skin) {
      var sys = C.systemMessage;
      C.systemMessage = function (data) {
        try {
          var text = String(data && data.content || '').replace(/\r/g, ' ').trim();
          // Friend presence (unique status): BetterChatango meant it for the open PM, with no group. The friend list already shows it.
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
          // The connection banner already shows it, and this BetterChatango Reconnect bypasses the bridge: the automatic retry would open a second socket.
          var lost = /^You have disconnected from #/.test(String(data && data.content));
          if (data && data.icon === 'warning' && data.content && !lost) alertOnce({ op: 'alert', text: String(data.content), button: data.button || null, action: typeof data.action === 'function' ? data.action : null });
        } catch (e) { warn(e); }
        return notice.apply(this, arguments);
      };
      C.setNotice.__skin = true;
    }
  }

  /* Connection state: BetterChatango publishes no event, so we watch its sockets. */
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
          if (connState[gid] !== st) { connState[gid] = st; if (!left[gid]) { note(connName(gid) + ' is ' + st); emit({ op: 'conn', gid: gid, state: st }); } }
        });
        Object.keys(connState).forEach(function (gid) {
          if (!seen[gid] && connState[gid] !== 'closed') { connState[gid] = 'closed'; if (!left[gid]) { note(connName(gid) + ' was removed by BetterChatango'); emit({ op: 'conn', gid: gid, state: 'closed' }); } }
        });
        var pm = C.private && C.private.socket;
        var pst = pm ? stateOf(pm) : 'closed';
        if (pmState !== pst) { pmState = pst; note(connName('private_message') + ' is ' + pst); emit({ op: 'conn', gid: 'private_message', state: pst }); }
      } catch (e) { warn(e); }
    }, 2000);
  }
  // BetterChatango times out only the group it recorded last in cache.connecting (inject.js:5699-5704): each attempt gets the same 10 s here.
  var CONNECT_TIMEOUT = 10000;
  /**
   * Calls client.connect and keeps the socket it opens.
   * @param {string} gid Group or private_message.
   * @returns {{done: Promise, socket: ?WebSocket}} Promise of client.connect and its new socket, null if it opened none.
   */
  function openSocket(gid) {
    // client.connect creates its socket synchronously and keeps it to itself until ok (inject.js:5631): the only handle to close it while it connects.
    var Native = window.WebSocket, out = { done: null, socket: null };
    window.WebSocket = function (url) { out.socket = new Native(url); return out.socket; };
    try { out.done = C.connect(gid); } finally { window.WebSocket = Native; }
    return out;
  }
  /**
   * Starts a BetterChatango connection.
   * @param {string} gid Group or private_message.
   * @returns {Promise} Settles with the attempt, rejected after CONNECT_TIMEOUT without an answer or when the group is left.
   */
  function connect(gid) {
    // A second PM session opened during the first would send kickingoff to ours: only one attempt at a time.
    if (attempts[gid]) return attempts[gid].done;
    var a = { socket: null, timer: null, cancel: null };
    var cancelled = new Promise(function (resolve, reject) { a.cancel = reject; });
    // BetterChatango ignores client.connect while gid stays in cache.connect: like it, we remove it around each attempt.
    function forget() { C.cache.connect = C.cache.connect.filter(function (x) { return x !== gid; }); }
    function settle() {
      clearTimeout(a.timer);
      delete attempts[gid];
      forget();
      // Without a new socket, the observed state does not change: we force it to be emitted again to leave "connecting", including for a group that BetterChatango removed.
      if (gid === 'private_message') pmState = null; else connState[gid] = 'connecting';
    }
    function attempt() {
      forget();
      var opened = openSocket(gid);
      a.socket = opened.socket;
      a.timer = setTimeout(function () { a.cancel(new Error('no answer after ' + CONNECT_TIMEOUT / 1000 + ' s')); }, CONNECT_TIMEOUT);
      return opened.done;
    }
    // Like BetterChatango, the history database opens before the private connection: the msgoff frames, delivered only once right after OK, are archived there.
    note('Connecting to ' + connName(gid));
    var sock = gid === 'private_message' ? openPmDb().then(attempt) : attempt();
    a.done = Promise.race([sock, cancelled]).then(function (s) { settle(); note('Connected to ' + connName(gid)); return s; }, function (e) {
      settle();
      // A late answer would give BetterChatango a second socket for this connection, and the frames of a left group.
      if (a.socket) a.socket.close();
      note('Could not connect to ' + connName(gid) + ': ' + (e && e.message || e));
      throw e;
    });
    attempts[gid] = a;
    return a.done;
  }
  /**
   * Starts a connection then runs its follow-up, unless the user left the group in between.
   * @param {string} gid Group or private_message.
   * @param {Function} then Follow-up of a successful attempt.
   */
  function connectThen(gid, then) {
    try {
      connect(gid).then(function () { if (!left[gid]) { try { then(); } catch (e) { warn(e); } } }, function (e) { if (!left[gid]) warn(e); });
    } catch (e) { warn(e); }
  }

  /**
   * Tells whether a BetterChatango connection can carry a frame now.
   * @param {string} gid Group or private_message.
   */
  function opened(gid) {
    var c = gid === 'private_message' ? C.private : C.groups && C.groups[gid];
    return !!(c && c.socket && c.socket.readyState === 1);
  }
  function pmOpen() { return opened('private_message'); }
  /**
   * Says what to do while a connection cannot carry a frame.
   * @param {string} gid Group or private_message.
   * @returns {string} Empty while the connection is open.
   */
  function closedHint(gid) { return opened(gid) ? '' : "Try again once you're reconnected to " + connName(gid) + '.'; }
  /**
   * Hands a frame to BetterChatango on an open connection and announces its failure otherwise.
   * @param {string} gid Group or private_message.
   * @param {string} frame Frame without its line end.
   * @param {string} failure Failure text, empty for a request the user did not make.
   * @returns {boolean} True if the frame was handed to BetterChatango.
   */
  function send(gid, frame, failure) {
    // BetterChatango's socket catches every error and only shows a line: on a connection that is not open, the frame would read as sent.
    var hint = closedHint(gid);
    if (hint) {
      if (failure) alertOnce({ op: 'notice', gid: gid, text: failure + ' ' + hint });
      return false;
    }
    try { C.socket(gid, frame, failure); return true; } catch (e) { warn(e); return false; }
  }
  // Last correspondent requested by connect, to which a reply with an empty name belongs.
  var connectTarget = '';
  // Chatango returns no request id: a reply is recognized by its key, and a newer request replaces the wait of the previous one.
  var replyWaits = {};
  var PM_CHECK_TIMEOUT = 5000;
  /**
   * Waits for the Chatango reply to a request and emits a fact if it does not come in time.
   * @param {string} key Key of the expected reply.
   * @param {number} ms Wait delay.
   * @param {Object} timeoutOp Op emitted on expiry.
   */
  function awaitReply(key, ms, timeoutOp) {
    clearTimeout(replyWaits[key]);
    replyWaits[key] = setTimeout(function () { delete replyWaits[key]; emit(timeoutOp); }, ms);
  }
  /**
   * Closes the wait for a reply that arrived.
   * @param {string} key Key of the reply.
   * @returns {boolean} True if a request was still waiting for it.
   */
  function gotReply(key) {
    var waited = key in replyWaits;
    clearTimeout(replyWaits[key]);
    delete replyWaits[key];
    return waited;
  }
  /**
   * Asks Chatango for the presence of a correspondent like BetterChatango when a PM opens.
   * @param {string} name Target correspondent.
   * @returns {boolean} True if the frame was sent.
   */
  function connectPm(name) {
    var n = lower(name);
    if (!pmOpen() || !send('private_message', 'connect:' + n, 'The conversation with ' + n + ' could not be opened.')) return false;
    connectTarget = n;
    return true;
  }
  // Correspondent of the shown conversation, false outside PMs.
  var pmFocus = false;
  /**
   * Follows the shown conversation and asks for its presence when the correspondent changes.
   * @param {string|boolean} user Shown correspondent, false outside PMs.
   */
  function focusPm(user) {
    pmFocus = user || false;
    // BetterChatango only archives a sent private message for the conversation it considers open.
    try { if (C.private) C.private.focus = pmFocus; } catch (e) { warn(e); }
    if (pmFocus && pmFocus !== connectTarget) connectPm(pmFocus);
  }
  function post(url, fields, item) {
    if (typeof C.post !== 'function') return Promise.reject(new Error('BetterChatango is not signed in yet.'));
    var form = new FormData();
    Object.keys(fields).forEach(function (k) { if (fields[k] !== undefined && fields[k] !== null) form.set(k, fields[k]); });
    return C.post(url, form, item || {}).then(function (r) { return typeof r === 'string' ? r : JSON.stringify(r); });
  }
  var pmrCheck = null, pmrConnected = null;
  /**
   * Reads the PM restriction of one's own account from vissle like BetterChatango (inject.js:10631-10643).
   * @returns {Promise<string>} restricted, ok, or unknown if the reply does not establish it.
   */
  function fetchPmr() {
    return fetch('https://api.vissle.me/v1/pmr/' + C.user.name).then(function (r) {
      if (r.status !== 200) return 'unknown';
      return r.json().then(function (data) { return data.pmr ? 'restricted' : 'ok'; });
    }).catch(function (e) { warn(e); return 'unknown'; });
  }
  /**
   * BetterChatango private history database ("<username>_history"). BetterChatango only opens it from its own private
   * messages screen: we open it here with the same schema, then hand it over so that it archives there.
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
   * Opens the private history database for the history operations that cannot run without it.
   */
  function pmDbOrFail() {
    return openPmDb().then(function (db) {
      if (!db) throw new Error('BetterChatango could not open your message history. Reload the page and try again.');
      return db;
    });
  }
  /**
   * Marks private history messages read through the BetterChatango index (markRead).
   * @param {IDBDatabase} db Private history database.
   * @param {?IDBKeyRange} range Range of target_ts_idx, null for the whole database.
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
   * Marks read once per account the messages archived before Nightango.
   * BetterChatango archived them all unread for lack of a private focus. Called by openPmDb before the private connection, it leaves that connection's msgoff unread.
   * @param {?IDBDatabase} db Private history database.
   */
  function migrateUnread(db) {
    var key = skinKey(lower(C.user.name));
    if (!db || (storageGet(key) || {}).pmReadMigrated) return db;
    return markRead(db, null).then(function () { storageMerge(key, { pmReadMigrated: true }); }, warn).then(function () { return db; });
  }
  // String upper bound like BetterChatango: in IndexedDB order, a string comes after any timestamp.
  function targetRange(target) { return IDBKeyRange.bound([target, 1], [target, '']); }
  /**
   * Tells whether a private history entry is a shown message.
   * @param {Object} x Entry read by pmRecordEntry.
   * @param {{from: string, text: string, key: ?string}} m Shown message.
   */
  function isPmOf(x, m) {
    if (x.from !== m.from) return false;
    // An applied edit changes the shown text: the PM key, when it has one, designates the original and its edits.
    return m.key ? x.key === m.key || x.editId === m.key : x.text === m.text;
  }
  /**
   * Reads by cursor at most count kept entries plus one that tells whether more remain.
   * @param {IDBRequest} req Cursor open on the private history or the media library.
   * @param {number} count Maximum number of entries.
   * @param {Function} pick Entry kept for a record, null to drop it.
   * @returns {Promise<{list: Array, more: boolean}>} Entries in cursor order, and whether more remain after them.
   */
  function cursorPage(req, count, pick) {
    return new Promise(function (resolve, reject) {
      var list = [];
      req.onsuccess = function (e) {
        var cur = e.target.result, x = cur && pick(cur.value);
        if (x) list.push(x);
        if (cur && list.length <= count) { cur.continue(); return; }
        resolve({ list: list.slice(0, count), more: list.length > count });
      };
      req.onerror = function () { reject(req.error); };
    });
  }
  /**
   * Reaches the media library object store that BetterChatango opens at sign-in (favorite_media) and without which every call fails.
   * @param {string} mode readonly or readwrite.
   * @returns {Promise<IDBObjectStore>} media object store of a new transaction, rejected without a database.
   */
  function mediaStore(mode) {
    return new Promise(function (resolve) {
      if (!C.database.media) throw new Error('BetterChatango could not open your media library. Reload the page and try again.');
      resolve(C.database.media.transaction(['media'], mode).objectStore('media'));
    });
  }
  /**
   * Waits for the result of an IndexedDB request.
   * @param {IDBRequest} req Request.
   */
  function requestResult(req) {
    return new Promise(function (resolve, reject) {
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
  }
  /**
   * Writes to the media library and settles once the transaction completes.
   * @param {function(IDBObjectStore)} write Writes made in the transaction.
   * @param {string} failure Failure text, when the transaction is aborted.
   */
  function mediaWrite(write, failure) {
    return mediaStore('readwrite').then(function (store) { return new Promise(function (resolve, reject) {
      var tx = store.transaction;
      write(store);
      tx.oncomplete = function () { resolve(); };
      tx.onabort = function () { warn(tx.error); reject(new Error(failure)); };
    }); });
  }
  /**
   * Reads the media library in the order of a BetterChatango index and drops invalid entries.
   * @param {string} index url or name.
   * @param {?{url: string, name: string}} after Last entry already read, null to start.
   * @param {string} text Search in the name, empty to read everything.
   * @param {number} count Maximum number of entries.
   * @returns {Promise<{list: Array, more: boolean}>} Entries {url, name}, and whether more remain after them.
   */
  function readMedia(index, after, text, count) {
    return mediaStore('readonly').then(function (store) {
      return cursorPage(store.index(index).openCursor(after ? IDBKeyRange.lowerBound(after[index]) : null), count, function (v) {
        return mediaEntryOk(v) && mediaMatch(index, v, after, text) ? { url: v.url, name: v.name } : null;
      });
    });
  }
  function readField(sel) { var el = document.querySelector(sel); return el ? String(el.value || '') : ''; }
  // Same persistence as BetterChatango: the whole object is rewritten under the single settings key.
  function saveSettings() { localStorage.setItem('settings', JSON.stringify(C.settings)); }
  /**
   * Reads a switch from the BetterChatango settings.
   * @param {string} key SETTINGS key.
   * @returns {?boolean} Value read, null if the BetterChatango settings are unreadable.
   */
  function readSetting(key) {
    var p = SETTINGS[key];
    try { return !!C.settings[p[0]][p[1]][p[2]]; } catch (e) { warn(e); return null; }
  }
  /**
   * Reads a list from the BetterChatango settings.
   * @param {string} kind LISTS key.
   * @returns {?Array<string>} Copy of the list, null if the BetterChatango settings are unreadable.
   */
  function roomInfo(gid) {
    var info = C.groups && C.groups[gid] && C.groups[gid].room && C.groups[gid].room.information;
    return info ? { title: String(info.title || ''), description: String(info.description || '') } : null;
  }
  function readSounds() {
    try {
      var sound = C.settings.notifications.sound, out = {};
      // The BetterChatango slider saves the volume as text.
      SOUND_KEYS.forEach(function (k) { out[k] = k.indexOf('volume_') === 0 ? parseInt(sound[k], 10) : !!sound[k]; });
      return out;
    } catch (e) { warn(e); return null; }
  }
  function playSound(kind) {
    try {
      var audio = C.sound[SOUND_AUDIO[kind]];
      audio.volume = parseInt(C.settings.notifications.sound['volume_' + kind], 10) / 100;
      return audio.play();
    } catch (e) { warn(e); return Promise.reject(e); }
  }
  function readList(kind) {
    var p = LISTS[kind];
    try { return C.settings[p[0]][p[1]][p[2]].slice(); } catch (e) { warn(e); return null; }
  }
  /**
   * Adds or removes a value in a BetterChatango settings list the way BetterChatango does with filter or a push without duplicates.
   * @param {string} kind LISTS key.
   * @param {string} value Target value.
   * @param {boolean} on True to add it.
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
   * Own style: written into the BetterChatango style form, read again by client.sendMessage on each send.
   * This form is never submitted: saving it (updatemsgstyles) transmits the password.
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
   * Applies the own style to the fields that BetterChatango reads when sending.
   * @param {?Object} style Own style, null to go back to the account style.
   */
  function applyStyle(style) {
    if (!style && !accountStyle) return;
    var f = styleFields();
    if (!style) { writeStyle(f, accountStyle); accountStyle = null; return; }
    if (!accountStyle) accountStyle = readStyle(f);
    writeStyle(f, Object.assign({}, style, { on: true, active: true }));
  }
  /**
   * Has BetterChatango build the body of a group message without sending it and with the reference and the quote that sending inserts.
   * @param {string} gid Target group.
   * @param {string} text Typed text.
   * @param {{replyId: ?string, editId: ?string, quote: ?string, style: ?Object}} opts Reply, edited original or plain-text quote, and own style.
   * @returns {?{body: string, style: Object}} Body, and the message's own style read from the BetterChatango one, null if BetterChatango builds nothing.
   */
  function groupBody(gid, text, opts) {
    applyStyle(opts.style);
    var body = C.sendMessage(esc(text), true, gid);
    if (typeof body !== 'string' || !body) return null;
    var style = parseContent(body).style;
    // Like BetterChatango, an edit never carries a reply.
    var ref = opts.editId ? '<e' + encodeRef(opts.editId) + '/>' : opts.replyId ? '<r' + encodeRef(opts.replyId) + '/>' : '';
    var head = /^(<n[^>]*\/>)?(<f [^>]*>)?/.exec(body)[0];
    body = head + ref + body.slice(head.length);
    if (opts.quote) body = withQuote(body, head.length, opts.quote, false);
    return { body: body, style: style };
  }
  /**
   * Inserts a plain-text quote where BetterChatango places it, right before the typed text.
   * @param {string} body Body built by BetterChatango.
   * @param {number} start Index of the content, after the <f …> or <g …> head and its reference.
   * @param {string} quote Plain-text quote.
   * @param {boolean} pm True for a PM, whose style also opens the strikethrough.
   */
  function withQuote(body, start, quote, pm) {
    // After the emphasis of the style, read from its checkboxes like sendMessage (inject.js:5182-5185), and before the Markdown one.
    var f = C.user.style ? styleFields() : null;
    var at = start + (f ? (f.bold.checked ? '<b>' : '') + (f.italic.checked ? '<i>' : '') + (f.underline.checked ? '<u>' : '') + (pm && f.strike.checked ? '\u2593' : '') : '').length;
    return body.slice(0, at) + esc(quote) + body.slice(at);
  }

  /* Replies from the userscript bridges (vissle, TikTok), matched to requests by id */
  var loaderWaits = {};
  function onLoaderReply(e) {
    var r = JSON.parse(e.detail), wait = loaderWaits[r.id];
    if (!wait) return;
    delete loaderWaits[r.id];
    if (r.error) wait.reject(new Error(r.error)); else wait.resolve(r);
  }
  document.addEventListener('torch-skin:vissle-response', onLoaderReply);
  document.addEventListener('torch-skin:tiktok-response', onLoaderReply);
  /**
   * Sends a request to a userscript bridge.
   * @param {string} channel Bridge name: vissle or tiktok.
   * @param {Object} q Request fields.
   * @returns {Promise<Object>} Reply of the bridge, rejected with the text to show if it carries an error.
   */
  function askLoader(channel, q) {
    return new Promise(function (resolve, reject) {
      var id = uid();
      loaderWaits[id] = { resolve: resolve, reject: reject };
      document.dispatchEvent(new CustomEvent('torch-skin:' + channel + '-request', { detail: JSON.stringify(Object.assign({ id: id }, q)) }));
    });
  }

  if (C && C.event && typeof C.on === 'function') {
    wrapTable(C.event.group, 'group');
    wrapTable(C.event.private, 'private');
    hookNotices();
    watchConnections();
    // BetterChatango holds window.onoffline and window.ononline: we listen alongside without replacing them.
    window.addEventListener('offline', function () { emit({ op: 'session', reason: 'offline' }); });
    window.addEventListener('online', function () { emit({ op: 'online' }); });
    // iOS cuts the sockets of a hidden page without notice: back to the foreground, page restored from the cache included.
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') emit({ op: 'visible' }); });
    window.addEventListener('pageshow', function (e) { if (e.persisted) emit({ op: 'visible' }); });
    var loggedIn = false;
    var onLogin = function (catchUp) {
      if (loggedIn) return;
      loggedIn = true;
      note('Signed in');
      // BetterChatango reads the YouTube oEmbed and msgbg.xml on its own, outside the Nightango media settings: disabled in memory, not in the BetterChatango settings.
      C.renderYouTube = CH.getBackground = function () {};
      emit({ op: 'login', me: lower(C.user.name) });
      // Groups already connected before us: their inited and participants frames have gone by.
      if (catchUp) Object.keys(C.groups || {}).forEach(function (gid) { if (gid !== ENV) emit({ op: 'group', id: gid, title: '', hidden: false, ready: true }); });
      if (typeof window.__TORCH_SHOW__ === 'function') window.__TORCH_SHOW__();
      if (pmOpen()) {
        // Session already open: the friend list and the history were received before us, so we request them again.
        emit({ op: 'pmReady' });
        send('private_message', 'wl', '');
        send('private_message', 'getblock', '');
      } else {
        setTimeout(function () { if (!pmOpen()) { try { connect('private_message').catch(warn); } catch (e) { warn(e); } } }, 2500);
      }
    };
    // client.on receives a CustomEvent from the document, not the client: we read the state again on C.
    C.on('clientLogin', function () { try { onLogin(false); } catch (e) { warn(e); } });
    // Safety net if the event is missed: session detected as soon as a name and a group exist.
    var sessionOpen = function () { return !!(C.user && C.user.name && C.groups && Object.keys(C.groups).length); };
    if (sessionOpen()) setTimeout(function () { onLogin(true); }, 0);
    else {
      var watch = setInterval(function () {
        if (loggedIn) return clearInterval(watch);
        if (sessionOpen()) { clearInterval(watch); try { onLogin(true); } catch (e) { warn(e); } }
      }, 1000);
    }
  } else {
    warn('BetterChatango not found: the overlay cannot connect.');
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
    note: note,
    connName: connName,
    closedHint: closedHint,
    /**
     * Tells whether a message already has the final id that replying to it or editing or deleting it waits for.
     * @param {string} id Message id in the state.
     */
    delivered: function (id) { return !!id && String(id).indexOf('k:') !== 0; },
    /**
     * Sends a group message or the edit of a message.
     * @param {string} gid Target group.
     * @param {string} text Typed text.
     * @param {{replyId: ?string, editId: ?string, quote: ?string, channel: ?string, style: ?Object}} opts Reply, edited original or plain-text quote, channel and own style.
     * @returns {?Object} The message's own style read from the body built by BetterChatango, null if nothing was sent.
     */
    send: function (gid, text, opts) {
      opts = opts || {};
      // Checked before send, which would announce it too: Root announces a message that did not leave, an upload with its link.
      if (!opened(gid)) return null;
      var built;
      try { built = groupBody(gid, text, opts); } catch (e) { warn(e); return null; }
      if (!built) return null;
      var failure = opts.editId ? 'Your message could not be edited.' : opts.replyId ? 'Your reply could not be sent.' : opts.quote ? 'Your quote could not be sent.' : 'Your message failed to be delivered.';
      var user = (C.groups[gid] && C.groups[gid].user) || {};
      var flag = (CHANNEL_FLAG[opts.channel] || 0) + (parseInt(user.badge, 10) || 0);
      return send(gid, 'bm:' + Math.round(15E5 * Math.random()).toString(36) + ':' + flag + ':' + built.body, failure) ? built.style : null;
    },
    /**
     * Measures the body that send would send without the bm prefix like the BetterChatango counter.
     * @param {string} gid Target group.
     * @param {string} text Typed text.
     * @param {{replyId: ?string, editId: ?string, quote: ?string, style: ?Object}} opts Same options as send.
     * @returns {number} Body length, 0 for an empty text.
     */
    measure: function (gid, text, opts) {
      if (!text) return 0;
      try { var built = groupBody(gid, text, opts); return built ? built.body.length : 0; } catch (e) { warn(e); return 0; }
    },
    /**
     * Sends a private message, or the reply, edit or quote of a private message.
     * @param {string} user Recipient.
     * @param {string} text Typed text.
     * @param {?Object} style Own style.
     * @param {{replyId: ?string, editId: ?string, quote: ?string}=} opts PM key of the original for a reply or an edit, or plain-text quote.
     * @returns {?{style: Object, text: string, parts: ?Array, embeds: Array, key: ?string, replyId: ?string, editId: ?string}} Body built by BetterChatango parsed like a received PM, null if nothing was sent.
     */
    sendPm: function (user, text, style, opts) {
      opts = opts || {};
      // Checked before send, like a group message.
      if (!pmOpen()) return null;
      try {
        applyStyle(style);
        // Built once and sent as is: a second build would draw another <i…/> PM key than the one shown.
        var body = C.sendMessage(esc(text), true, 'private_message', user);
        if (typeof body !== 'string' || !body) return null;
        var head = /<g [^>]*>/.exec(body), at = head.index + head[0].length;
        // Like BetterChatango, an edit never carries a reply.
        var ref = opts.editId ? '<e' + encodeRef(opts.editId) + '/>' : opts.replyId ? '<r' + encodeRef(opts.replyId) + '/>' : '';
        body = body.slice(0, at) + ref + body.slice(at);
        if (opts.quote) body = withQuote(body, at + ref.length, opts.quote, true);
        var failure = opts.editId ? 'Your message could not be edited.' : opts.replyId ? 'Your reply could not be sent.' : opts.quote ? 'Your quote could not be sent.' : 'Your message failed to be delivered.';
        if (!send('private_message', 'msg:' + user + ':' + body, failure)) return null;
        // BetterChatango only writes a Premium tag for a Premium account: every tag of this body is shown.
        var parsed = parseContent(body, false, true);
        return { style: parsed.style, text: parsed.text, parts: parsed.parts, embeds: parsed.embeds, key: parsed.key, replyId: parsed.replyId, editId: parsed.editId };
      } catch (e) { warn(e); return null; }
    },
    /**
     * Reads the style that BetterChatango would send without an own style.
     */
    accountStyle: function () {
      var v = accountStyle || readStyle(styleFields());
      return { face: v.face, size: v.size, textColor: v.textColor, nameColor: v.nameColor, bold: v.bold, italic: v.italic, underline: v.underline, strike: v.strike };
    },
    applyStyle: function (style) { try { applyStyle(style); } catch (e) { warn(e); } },
    focus: function (gid) { try { C.setFocus({ group: gid }); } catch (e) { warn(e); } },
    focusPm: focusPm,
    /**
     * Asks Chatango for the presence of correspondents with the frame BetterChatango sends for Meet people (inject.js:9387).
     * @param {string[]} names Target correspondents. The reply arrives as a people op.
     * @returns {boolean} True if the frame was sent.
     */
    refreshPresence: function (names) { return pmOpen() && send('private_message', 'getpresence:' + names.join(';'), ''); },
    /**
     * Tells whether the account is Premium like BetterChatango before writing a Premium emoticon.
     * @returns {boolean} Status 200 or 210 of the premium frame, false while the private connection is not open.
     */
    premium: function () { return !!C.private && [200, 210].indexOf(C.private.premium.status) >= 0; },
    /**
     * Checks the correspondent of a new PM with Chatango like BetterChatango before opening it.
     * @param {string} name Target correspondent. The reply arrives as a pmChecked op with asked.
     * @returns {boolean} True if the request was sent, false if the private connection is not open.
     */
    checkPm: function (name) {
      var n = lower(name);
      if (!connectPm(n)) return false;
      awaitReply('connect:' + n, PM_CHECK_TIMEOUT, { op: 'pmChecked', name: n, timeout: true });
      return true;
    },
    join: function (gid) {
      delete left[gid];
      try { if (SB && SB.renderGroup) SB.renderGroup({ group: gid, header: gid, recent: true }); } catch (e) { warn(e); }
      connectThen(gid, function () { C.setFocus({ group: gid }); });
    },
    leave: function (gid) {
      left[gid] = true;
      note('Leaving #' + gid);
      // BetterChatango only closes an open socket that it registered on ok (inject.js:5714): cancelling the attempt closes the one still connecting.
      if (attempts[gid]) attempts[gid].cancel(new Error('left the group'));
      try { C.disconnectFrom(gid); } catch (e) { warn(e); }
    },
    /**
     * Restarts a closed connection.
     * @param {string} gid Group or private_message.
     * @param {boolean=} background True for a group that is not shown: the BetterChatango focus stays on the shown group.
     */
    reconnect: function (gid, background) {
      connectThen(gid, function () { if (gid !== 'private_message' && !background) C.setFocus({ group: gid, reload: true }); });
    },
    loadMore: function (gid) {
      var g = C.groups && C.groups[gid];
      if (g && g.load === -1) return 'done';
      return send(gid, 'get_more:20:' + (g && g.load || 0), 'Earlier messages could not be loaded.') ? 'sent' : 'failed';
    },
    /* Moderation: frames identical to the BetterChatango ones */
    deleteMessage: function (gid, id) { return send(gid, 'delmsg:' + id, 'The message could not be deleted.'); },
    deleteAllFrom: function (gid, m) { return send(gid, 'delallmsg:' + m.unid + ':' + m.ip + ':' + (/^[!#]/.test(m.author) ? '' : m.author), 'The messages could not be deleted.'); },
    ban: function (gid, m) { return send(gid, 'block:' + m.unid + ':' + m.ip + ':' + (/^[!#]/.test(m.author) ? '' : m.author), 'The ban could not be sent.'); },
    unban: function (gid, b) { return send(gid, 'removeblock:' + b.unid + ':' + b.ip, 'The unban could not be sent.'); },
    unbanAll: function (gid) { return send(gid, 'unbanall', 'The unban could not be sent.'); },
    /**
     * Requests a page of bans or unbans like BetterChatango.
     * @param {string} gid Target group.
     * @param {string} kind block or unblock.
     * @param {string} ts Timestamp of the last loaded row, 0 for the first page.
     */
    banList: function (gid, kind, ts) { return send(gid, 'blocklist:' + kind + ':' + ts + ':next:' + BAN_PAGE + ':anons:1', 'The ban list could not be loaded.'); },
    searchBans: function (gid, query) {
      if (!send(gid, 'searchban:' + query, 'The search could not be sent.')) return false;
      awaitReply('searchban:' + gid, CONFIRM_TIMEOUT, { op: 'banSearchTimeout', gid: gid });
      return true;
    },
    clearAll: function (gid) { return send(gid, 'clearall', 'The messages could not be cleared.'); },
    /* Group settings: frames found in chadango and chatango-lib */
    requestSettings: function (gid) {
      ['getannouncement', 'getbannedwords', 'getratelimit', 'getmodactions:prev:0:50'].forEach(function (f) { send(gid, f, 'Group settings could not be loaded.'); });
    },
    setFlags: function (gid, add, remove) { return send(gid, 'updategroupflags:' + add + ':' + remove, 'The group settings could not be saved.'); },
    setAnnouncement: function (gid, enabled, seconds, text, read) {
      var prefix = read.prefix || '<n000/><f x11000="0">';
      var close = (prefix.match(/<[biu]>/g) || []).reverse().join('').replace(/</g, '</');
      // Mode 3: announcement enabled with the owner's message background, kept as long as the interface does not set it.
      var mode = !enabled ? 0 : read.mode === 3 ? 3 : 1;
      // Line breaks as \r like BetterChatango, whose editor strips the <br/> tags when reading back.
      var body = prefix + esc(text).replace(/\r?\n/g, '\r') + close;
      var ok = send(gid, 'updateannouncement:' + mode + ':' + seconds + ':' + body, 'The announcement could not be saved.');
      setTimeout(function () { send(gid, 'getannouncement', ''); }, 1000);
      return ok;
    },
    setBannedWords: function (gid, part, whole) {
      var ok = send(gid, 'setbannedwords:' + encodeURIComponent(part) + ':' + encodeURIComponent(whole), 'Banned words could not be saved.');
      setTimeout(function () { send(gid, 'getbannedwords', ''); }, 1000);
      return ok;
    },
    setRateLimit: function (gid, seconds) { return send(gid, 'setratelimit:' + seconds, 'Slow mode could not be saved.'); },
    setMod: function (gid, name, flags) { return send(gid, 'addmod:' + name + ':' + flags, 'The moderator could not be saved.'); },
    removeMod: function (gid, name) { return send(gid, 'removemod:' + name, 'The moderator could not be removed.'); },
    /* Private messages */
    setStatus: function (status) { return send('private_message', 'idle:' + (status === 'idle' ? 0 : 1), 'Your status could not be changed.'); },
    addFriend: function (name) {
      if (!send('private_message', 'wladd:' + name, 'The friend could not be added.')) return false;
      awaitReply('wladd:' + lower(name), CONFIRM_TIMEOUT, { op: 'friendTimeout', name: lower(name) });
      return true;
    },
    removeFriend: function (name) { return send('private_message', 'wldelete:' + name, 'The friend could not be removed.'); },
    block: function (name) { return send('private_message', 'block:' + name + ':' + name + ':S', 'The block could not be sent.'); },
    unblock: function (name) { return send('private_message', 'unblock:' + name, 'The unblock could not be sent.'); },
    /**
     * History archived by BetterChatango in IndexedDB and grouped by correspondent with the read state of each message.
     * @param {number} perTarget Number of entries kept per correspondent, the most recent ones.
     * @returns {Promise<Object>} Per correspondent, its entries from oldest to newest (list) and whether older ones remain (more).
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
            var v = cur.value || {}, target = lower(v.target), x = target && pmRecordEntry(v);
            if (x) (out[target] = out[target] || []).push(x);
            cur.continue();
          };
          req.onerror = function () { resolve({}); };
        } catch (e) { warn(e); resolve({}); }
      }); });
    },
    /** Raw private history records as BetterChatango exports them (exportMessages). */
    exportPm: function () {
      return pmDbOrFail().then(function (db) { return new Promise(function (resolve, reject) {
        var req = db.transaction(['messages'], 'readonly').objectStore('messages').getAll();
        req.onsuccess = function () { resolve(req.result); };
        req.onerror = function () { warn(req.error); reject(new Error('BetterChatango could not read your message history. Reload the page and try again.')); };
      }); });
    },
    /**
     * Adds the valid records of a BetterChatango file to the private history as read without overwriting an existing key.
     * @param {Array} records File content, untrusted.
     * @returns {Promise} Count {added, saved, skipped, foreign}, returned once the transaction completes.
     */
    importPm: function (records) {
      return pmDbOrFail().then(function (db) { return new Promise(function (resolve, reject) {
        var screened = screenPmRecords(records, C.user.name), out = { added: 0, saved: 0, skipped: screened.skipped, foreign: screened.foreign };
        var tx = db.transaction(['messages'], 'readwrite'), store = tx.objectStore('messages');
        screened.valid.forEach(function (r) {
          var req = store.add(r);
          req.onsuccess = function () { out.added++; };
          // Key already present: without preventDefault, the add failure would abort the whole transaction.
          req.onerror = function (e) { if (req.error.name === 'ConstraintError') { e.preventDefault(); out.saved++; } };
        });
        tx.oncomplete = function () { resolve(out); };
        tx.onabort = function () { warn(tx.error); reject(new Error('BetterChatango could not save these messages. Nothing was imported. Reload the page and try again.')); };
      }); });
    },
    /**
     * Reads the archived entries of a member before a key like BetterChatango on scroll (loadMessage).
     * @param {string} target Member of the conversation.
     * @param {number} before archiveTs key of the oldest entry already loaded, excluded.
     * @param {number} count Maximum number of entries.
     * @returns {Promise<{list: Array, more: boolean}>} Entries from oldest to newest, and whether older ones remain. Rejected without a database.
     */
    pmOlder: function (target, before, count) {
      return pmDbOrFail().then(function (db) {
        return cursorPage(db.transaction(['messages'], 'readonly').objectStore('messages').index('target_ts_idx')
          .openCursor(IDBKeyRange.bound([target, 0], [target, before], false, true), 'prev'), count, pmRecordEntry);
      }).then(function (page) { return { list: page.list.reverse(), more: page.more }; });
    },
    /**
     * Searches a text in the whole private history by the BetterChatango primary key from newest to oldest.
     * @param {string} query Searched text, case-insensitive.
     * @param {number} limit Maximum number of results.
     * @returns {Promise<{list: Array, more: boolean}>} Results and whether the limit cut the list. Rejected without a database.
     */
    searchPm: function (query, limit) {
      var q = lower(query), me = lower(C.user.name);
      return pmDbOrFail().then(function (db) {
        return cursorPage(db.transaction(['messages'], 'readonly').objectStore('messages').openCursor(null, 'prev'), limit, function (v) {
          var target = lower(v.target), x = target !== me && pmRecordEntry(v);
          // Key, edit reference and media let the message log find the shown message (dmHitMessage).
          return x && lower(x.text).indexOf(q) >= 0 ? { target: target, from: x.from, ts: x.ts, archiveTs: x.archiveTs, text: x.text, key: x.key, editId: x.editId, embeds: x.embeds } : null;
        });
      });
    },
    /**
     * Reads a page of the BetterChatango media library like viewMedia and loadMedia.
     * @param {string} index Order of the url or name index.
     * @param {?{url: string, name: string}} after Last entry of the previous page, null for the first one.
     * @param {string} text Search in the name, empty to read everything.
     * @returns {Promise<{list: Array, more: boolean}>} Up to 21 entries, and whether more remain. Rejected without a database.
     */
    mediaPage: function (index, after, text) { return readMedia(index, after, text, MEDIA_PAGE); },
    /**
     * Searches media by name like the BetterChatango completion (searchMedia).
     * @param {string} text Text that the name contains.
     * @param {number} count Maximum number of media.
     * @returns {Promise<Array>} Entries {url, name} in name order. Rejected without a database.
     */
    searchMedia: function (text, count) { return readMedia('name', null, text, count).then(function (r) { return r.list; }); },
    /** Tells whether an address is in the media library like checkMedia. Rejected without a database. */
    hasMedia: function (url) { return mediaStore('readonly').then(function (store) { return requestResult(store.get(url)); }).then(function (v) { return !!v; }); },
    /**
     * Adds a media item like favoriteMedia (put).
     * @param {{url: string, name: string}} e Entry written.
     */
    addMedia: function (e) {
      return mediaWrite(function (store) { store.put({ url: e.url, name: e.name }); }, 'BetterChatango could not add this image to your media. Reload the page and try again.');
    },
    /** Removes a media item by its address like unfavoriteMedia. */
    removeMedia: function (url) {
      return mediaWrite(function (store) { store.delete(url); }, 'BetterChatango could not remove this image from your media. Reload the page and try again.');
    },
    /** Raw media library entries as BetterChatango exports them (exportMedia). */
    exportMedia: function () {
      return mediaStore('readonly').then(function (store) {
        return requestResult(store.getAll()).catch(function (e) { warn(e); throw new Error('BetterChatango could not read your media library. Reload the page and try again.'); });
      });
    },
    /**
     * Writes the valid entries of a BetterChatango media library file by put like importMedia.
     * @param {Array} entries File content, untrusted.
     * @returns {Promise<{added: number, skipped: number}>} Count returned once the transaction completes.
     */
    importMedia: function (entries) {
      var screened = screenMediaEntries(entries);
      return mediaWrite(function (store) { screened.valid.forEach(function (e) { store.put(e); }); }, 'BetterChatango could not save these images. Nothing was imported. Reload the page and try again.')
        .then(function () { return { added: screened.valid.length, skipped: screened.skipped }; });
    },
    /**
     * Member search as BetterChatango does it followed by a presence request on the private connection.
     * Filters: sex M, F or both, real photo (1), character (2) or both (0).
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
    /**
     * Public mini profile (mod1.xml) read like BetterChatango.
     * Fields: age from the birth date, gender, location and text.
     */
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
     * Reads the Premium message background of a member (msgbg.xml) at most once per cache delay.
     * @param {string} name Target member.
     * @returns {Promise<?Object>} Background read by parseMsgBg, null for a guest or a member without a background.
     */
    fetchMsgBg: function (name) {
      var n = lower(name);
      if (!ACCOUNT_NAME.test(n)) return Promise.resolve(null);
      return cached(msgBgCache, n, function () {
        return memberFile(CH.subdomain.msgbg(n, 'xml'), /^text\/xml/, function (xml) { return parseMsgBg(xml, CH.subdomain.msgbg(n, 'jpg')); });
      });
    },
    /**
     * Asks vissle for the linked accounts of an account like the BetterChatango who action (inject.js:7452-7477).
     * @param {string} name Target account, never a guest.
     * @returns {Promise<?Array>} Levels read by parseWho, null for an unreadable reply, rejected if vissle is unreachable.
     */
    fetchWho: function (name) {
      var n = lower(name);
      if (!ACCOUNT_NAME.test(n)) return Promise.reject(new Error('Guests have no account.'));
      // No cache and no warn: the reply is only shown to the user, never kept or logged (ADR-0010).
      return fetch('https://vissle.me/api/v1/who/' + n).then(function (r) {
        return r.json().then(parseWho, function () { return null; });
      });
    },
    fetchFullProfile: fetchFullProfile,
    /**
     * Marks the archived messages of a member read like BetterChatango when a conversation opens.
     * @param {string} name Member of the conversation.
     */
    markPmRead: function (name) {
      // Transaction created after the current stack: BetterChatango only archives a received PM after the pm op is emitted.
      return openPmDb().then(function (db) {
        if (db) return markRead(db, targetRange(name));
      }).catch(warn);
    },
    /**
     * Counts the unread PMs of a correspondent in the private history without the edits that BetterChatango archives separately.
     * @param {string} name Correspondent.
     * @returns {Promise<number>} Unread entries.
     */
    pmUnread: function (name) {
      return openPmDb().then(function (db) { return new Promise(function (resolve, reject) {
        if (!db) { resolve(0); return; }
        var n = 0, tx = db.transaction(['messages'], 'readonly');
        tx.objectStore('messages').index('target_ts_idx').openCursor(targetRange(name)).onsuccess = function (e) {
          var cur = e.target.result;
          if (!cur) return;
          var x = cur.value.unread && pmRecordEntry(cur.value);
          if (x && !x.editId) n++;
          cur.continue();
        };
        tx.oncomplete = function () { resolve(n); };
        tx.onabort = function () { reject(tx.error); };
      }); });
    },
    /** Tells whether this browser keeps the BetterChatango private history. */
    pmArchived: function () { return openPmDb().then(function (db) { return !!db; }); },
    /** Deletes the history that BetterChatango keeps in this browser. Chatango keeps none. */
    clearPmHistory: function (target) { try { C.private.clearHistory(target); return true; } catch (e) { warn(e); return false; } },
    /**
     * Removes a PM from the private history like the BetterChatango remove entry after reading its record again.
     * @param {string} target Member of the conversation.
     * @param {{from: string, archiveTs: number, text: string, key: ?string}} entry Shown message.
     * @returns {Promise<boolean>} True at the end of the transaction that deleted it, false if the record is not this message or without a database.
     */
    removePm: function (target, entry) {
      return openPmDb().then(function (db) { return new Promise(function (resolve) {
        if (!db) { resolve(false); return; }
        var removed = false, tx = db.transaction(['messages'], 'readwrite'), store = tx.objectStore('messages');
        // ts key shared by all members: after a collision, saveMessage archives one second later and the frame key points to someone else's PM.
        store.get(entry.archiveTs).onsuccess = function (e) {
          var v = e.target.result, x = v && lower(v.target) === target && pmRecordEntry(v);
          if (!x || !isPmOf(x, entry)) return;
          store.delete(entry.archiveTs);
          removed = true;
          // The original and its edits share the PM key: a single record left behind would bring the message back on reload.
          if (entry.key) store.index('target_ts_idx').openCursor(targetRange(target)).onsuccess = function (ev) {
            var cur = ev.target.result, y = cur && pmRecordEntry(cur.value);
            if (!cur) return;
            if (y && isPmOf(y, entry)) cur.delete();
            cur.continue();
          };
        };
        tx.oncomplete = function () { resolve(removed); };
        tx.onabort = function () { resolve(false); };
      }); }).catch(function (e) { warn(e); return false; });
    },
    /* Profile: read from the fields that BetterChatango fills at sign-in, saved through client.post */
    readProfile: function () {
      var dir = document.querySelector('[data-setting="show_profile"] input');
      // BetterChatango fills this field by reading mod2.xml again after the save, sometimes from the HTTP cache.
      var sent = fresh(fullProfileCache, lower(C.user && C.user.name));
      return {
        loaded: !!(C.user && C.user.avatar && typeof C.user.avatar === 'object' && document.querySelector('[data-text-field="age"]') && dir),
        age: readField('[data-text-field="age"]'), gender: readField('[data-text-field="gender"]'), location: readField('[data-text-field="location"]'),
        about: readField('[data-text-field="about"]'), full: sent ? sent.data : readField('[data-text-field="full"]'), dir: !!(dir && dir.checked),
        // x0, y0 and ts of the last updateprofile reply, stored by BetterChatango (setProfile, inject.js:4875-4878).
        crop: C.user && C.user.avatar && typeof C.user.avatar === 'object' ? { x0: +C.user.avatar.x0, y0: +C.user.avatar.y0, ts: +C.user.avatar.ts } : null
      };
    },
    saveProfile: function (p) {
      return Promise.resolve().then(function () { return saveProfileNow(p); });
    },
    /**
     * Uploads one's profile picture like the BetterChatango avatar form (client.html:1283-1289) without progress.
     * @param {File} file Chosen image.
     * @returns {Promise} Rejected with the text to show on any reply other than pix.
     */
    uploadAvatar: function (file) {
      return post(CH.path('updateprofile'), profileForm('fullpic', { Filedata: file }), {}).then(function (resp) {
        var kind = String(resp).split(':')[0];
        // Only known success reply: the BetterChatango progress branch handles it under this name (inject.js:4788).
        if (kind === 'pix') { bumpAvatar(); return; }
        throw new Error(kind === 'unauthed' ? 'Your Chatango session expired. Reload the page and sign in again.'
          : kind === 'error' ? 'Chatango did not accept this picture. Try a smaller JPG or PNG.'
            : 'Chatango sent an unexpected reply. Check your picture on chatango.com.');
      }, busyOr('Your picture could not be uploaded. Try again.'));
    },
    /**
     * Saves the part of the picture that the thumbnail shows like the BetterChatango cropping (inject.js:1390-1406).
     * @param {{x0: number, y0: number, ts: number}} box Square in full.jpg pixels.
     */
    saveAvatarCrop: function (box) {
      return post(CH.path('updateprofile'), profileForm('thumb', { x0: Math.round(box.x0), y0: Math.round(box.y0), ts: Math.round(box.ts) }), {}).then(function (resp) {
        var data = profileReply(resp, ['x0']);
        bumpAvatar();
        return data;
      }, busyOr('Your crop could not be saved. Try again.'));
    },
    /**
     * Saves one's Premium background through the BetterChatango background form (inject.js:4900-4916 and client.html:2279-2345).
     * @param {Object} form Form as returned by miniStyleForm.
     * @param {boolean} dir "Appear in Meet people" checkbox, which BetterChatango sends with this form.
     */
    saveProfileStyle: function (form, dir) {
      var me = lower(C.user && C.user.name);
      var fields = profileForm('update', {
        body_bg_col: form.bg.slice(1), body_col: form.text.slice(1), body_a_col: form.link.slice(1), body_bg_img: form.image,
        body_tile_d: form.tileDown ? 1 : 0, body_tile_a: form.tileAcross ? 1 : 0
      });
      if (dir) fields.dir = 'checked';
      return post(CH.path('updateprofile') + '?css', fields, {}).then(function (resp) {
        var data = profileReply(resp, ['age', 'sex', 'loc']);
        // custom_profile.css can come back from the HTTP cache: the local cache serves the background sent.
        var prev = profileCache[me] ? profileCache[me].data : {};
        profileCache[me] = { at: Date.now(), data: Object.assign({}, prev, { mini: miniStyleOfForm(form) }) };
        return data;
      }, busyOr('Chatango did not save your background. Try again.'));
    },
    setting: readSetting,
    /**
     * Reads the PM restriction of one's account with at most one call per page load after the private connection opens.
     * @returns {Promise<?string>} restricted, ok or unknown, null without a call if check_pmr is off or unreadable.
     */
    pmrStatus: function () {
      if (!readSetting('pmrCheck')) return Promise.resolve(null);
      if (!pmrCheck) pmrCheck = (pmOpen() ? Promise.resolve() : new Promise(function (resolve) { pmrConnected = resolve; })).then(function () {
        if (readSetting('pmrCheck')) return fetchPmr();
        // Setting turned off while waiting for the private connection: no call, the next request starts from scratch.
        pmrCheck = null;
        return null;
      });
      return pmrCheck;
    },
    /**
     * Reads the BetterChatango startup settings.
     * @returns {?Object} The three switches, null if the BetterChatango settings are unreadable.
     */
    startupSettings: function () {
      var out = {};
      return ['joinOwned', 'joinRecent', 'joinFavorites'].every(function (k) { out[k] = readSetting(k); return out[k] !== null; }) ? out : null;
    },
    /**
     * Saves a switch in the BetterChatango settings in place and under the settings key.
     * @param {string} key SETTINGS key.
     * @param {boolean} value New value.
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
     * Reads the sound settings that BetterChatango applies.
     * @returns {?Object} Switches and volumes from 0 to 100, null if the BetterChatango settings are unreadable.
     */
    betterChatangoSounds: readSounds,
    /**
     * Saves a sound setting in the BetterChatango settings that are read again on each sound.
     * @param {string} key SOUND_KEYS key.
     * @param {boolean|number} value Switch, or volume from 0 to 100.
     */
    setBetterChatangoSound: function (key, value) {
      if (SOUND_KEYS.indexOf(key) < 0) return false;
      try {
        C.settings.notifications.sound[key] = key.indexOf('volume_') === 0 ? Math.max(0, Math.min(100, Math.round(value))) : !!value;
        saveSettings();
        return true;
      } catch (e) { warn(e); return false; }
    },
    /**
     * Plays a BetterChatango sound at its set volume like BetterChatango.
     * @param {string} kind mention or online.
     * @returns {Promise} Rejected if the browser refuses playback.
     */
    playBetterChatangoSound: playSound,
    /**
     * Reads the BetterChatango favorite groups.
     * @returns {?Array<string>} Group names, null if the BetterChatango settings are unreadable.
     */
    favoriteGroups: function () { return readList('favorite'); },
    /**
     * Adds or removes a group from the BetterChatango favorites.
     * @param {string} gid Target group.
     * @param {boolean} on True to add it.
     */
    setFavorite: function (gid, on) { return writeList('favorite', gid, on); },
    /**
     * Reads the groups muted in BetterChatango whose mentions it silences.
     * @returns {?Array<string>} Group names, null if the BetterChatango settings are unreadable.
     */
    mutedGroups: function () { return readList('muted'); },
    /**
     * Mutes or unmutes a group in BetterChatango.
     * @param {string} gid Target group.
     * @param {boolean} on True to mute it.
     */
    setMuted: function (gid, on) { return writeList('muted', gid, on); },
    /**
     * Reads the members ignored in BetterChatango whose alerts it silences.
     * @returns {?Array<string>} Lowercase names, null if the BetterChatango settings are unreadable.
     */
    ignoredUsers: function () { return readList('ignored'); },
    /**
     * Ignores or stops ignoring a member in BetterChatango.
     * @param {string} name Target member.
     * @param {boolean} on True to ignore them.
     */
    setIgnored: function (name, on) { return writeList('ignored', lower(name), on); },
    /**
     * Reads the BetterChatango trusted hosts whose links it opens without a warning.
     * @returns {?Array<string>} Lowercase hosts, null if the BetterChatango settings are unreadable.
     */
    trustedHosts: function () { var list = readList('trusted'); return list && list.map(lower); },
    /**
     * Adds a host to the BetterChatango trusted hosts or removes it.
     * @param {string} host Lowercase host, without scheme or path.
     * @param {boolean} on True to add it.
     */
    setTrustedHost: function (host, on) { return writeList('trusted', host, on); },
    /**
     * Reads the activity of one's own profile recorded by vissle.me.
     * @param {{page: number, order: string, get: string}} q Cursor, order and filter of the requested page.
     */
    visitors: function (q) {
      return askLoader('vissle', { page: q.page, order: q.order, get: q.get }).then(function (r) {
        if (r.data.error) throw new Error(r.data.error);
        return r.data.get;
      });
    },
    /**
     * Finds the TikTok post a short link leads to, through the userscript bridge.
     * @param {string} url Short TikTok link.
     * @returns {Promise<string>} Post id, rejected with the text to show if TikTok does not give it.
     */
    tiktokPost: function (url) { return askLoader('tiktok', { url: url }).then(function (r) { return r.post; }); },
    /**
     * Uploads a file to vissle like the BetterChatango Upload dialog without BetterChatango posting its link.
     * @param {File} file Chosen file.
     * @returns {Promise<string>} Link https://vissle.me/{path}, rejected with the text to show on any other reply.
     */
    uploadFile: function (file) {
      var failed = 'The file could not be uploaded. Try again.';
      // Never progress: this BetterChatango branch posts the link in client.focus itself.
      return post('https://vissle.me/chatango/upload', { filedata: file }, { key: true }).then(function (resp) {
        var path = /^data:([A-Za-z0-9._\/-]+)$/.exec(resp);
        if (path) return 'https://vissle.me/' + path[1];
        throw new Error(resp.split(':')[0] === 'unauthed' ? 'vissle did not accept your session. Reload the page and sign in again.' : failed);
      }, busyOr(failed));
    },
    createGroup: function (o) {
      return Promise.resolve().then(function () { return createGroupNow(o); });
    }
  };

  /**
   * Reads the full profile of a member (mod2.xml) as HTML to show only in an isolated frame.
   * @param {string} name Target member.
   * @returns {Promise<string>} Empty string if the file is missing, rejected on a server error.
   */
  function fetchFullProfile(name) {
      var n = lower(name);
      if (!/^[a-z0-9_-]{1,20}$/.test(n)) return Promise.resolve('');
      var hit = fresh(fullProfileCache, n);
      if (hit) return Promise.resolve(hit.data);
      return fetch(CH.subdomain.mod2(n)).then(function (r) {
        // Server error rejected: read as an empty profile, it would erase the full profile on the next save.
        if (r.status >= 500) throw new Error('Chatango returned HTTP ' + r.status + ' for mod2.xml.');
        return r.ok ? r.text() : '';
      }).then(function (xml) {
        var doc = new DOMParser().parseFromString(xml, 'text/xml'), body = doc.querySelector('body');
        return !doc.querySelector('parsererror') && body ? unquote(body.textContent) : '';
      });
  }
  /**
   * Prepares the fields shared by the BetterChatango updateprofile forms.
   * @param {string} action update, fullpic or thumb.
   * @param {Object} extra Fields specific to the form.
   */
  function profileForm(action, extra) {
    return Object.assign({ auth: 'token', arch: 'h5', src: 'group', action: action }, extra);
  }
  /**
   * Validates an updateprofile reply and hands it to BetterChatango the way it does (setProfile).
   * @param {string} resp Text returned by Chatango.
   * @param {string[]} keys Keys of which at least one proves a profile reply.
   */
  function profileReply(resp, keys) {
    var data = parseProfileReply(resp);
    if (data.error) throw new Error(unquote(data.error));
    if (!keys.some(function (k) { return k in data; })) throw new Error('Chatango sent an unexpected reply. Check your profile on chatango.com.');
    try { C.setProfile(data); } catch (e) { warn(e); }
    return data;
  }
  /**
   * Turns a client.post failure into text to show.
   * @param {string} failed Text of a network failure.
   */
  function busyOr(failed) {
    return function (e) {
      warn(e);
      // BetterChatango refuses a request while another one is in progress by rejecting with that request's URL, a string.
      throw new Error(typeof e === 'string' ? 'BetterChatango is busy with another request. Try again in a moment.' : failed);
    };
  }
  function bumpAvatar() { AVATAR_VERSION[lower(C.user && C.user.name)] = Date.now(); }
  function saveProfileNow(p) {
      var me = lower(C.user && C.user.name), sentFull;
      // Empty string sent as is: only a full profile unknown to the page is read again from Chatango.
      var full = p.full != null ? Promise.resolve(p.full) : fetchFullProfile(me).catch(function () { return null; });
      return full.then(function (fullText) {
        if (fullText === null) throw new Error('Your full profile could not be read. Nothing was saved.');
        sentFull = fullText;
        var fields = profileForm('update', { age: p.age, gender: p.gender, location: p.location, line: p.about, full_profile: fullText });
        if (p.dir) fields.dir = 'checked';
        return post(CH.path('updateprofile'), fields, {});
      }).then(function (resp) {
        var data = profileReply(resp, ['age', 'sex', 'loc']);
        // mod1.xml and mod2.xml can come back from the HTTP cache without the saved version: the local cache serves the version sent.
        var prev = profileCache[me] ? profileCache[me].data : {};
        profileCache[me] = { at: Date.now(), data: Object.assign({}, prev, { missing: false, age: String(p.age), gender: GENDERS[p.gender] || '', location: p.location, about: p.about }) };
        fullProfileCache[me] = { at: Date.now(), data: sentFull };
        return data;
      });
  }
  /** Group creation through the BetterChatango Chatango form with the same fields and the "discovery" checkbox. */
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
