  /* Diagnostic journal: connections and page lifecycle, kept in this browser only (ADR-0011). */
  (function () {
    var KEY = 'torch-skin:journal', MAX = 1000, TEXT_MAX = 300, SAVE_MS = 2000, TICK_MS = 10000, STALL_MS = 30000;
    // Session frames and server refusal frames: only their name is kept, never their arguments.
    var LIFECYCLE = ['ok', 'inited', 'denied', 'reload', 'mustlogin', 'proxybanned', 'verificationrequired', 'climited', 'OK', 'DENIED', 'kickingoff', 'lowversion', 'toofast', 'show_fw'];
    // BetterChatango connection lines (inject.js:5588, 5652, 5662, 5669, 5701). The rest of its console contains frames and PMs.
    var BETTER_CHATANGO_LINES = [/^conn closed: /, /^CONNECTION TIMED OUT: /, /^environment server error$/, /^client version out of date$/];
    var UNKNOWN_FRAME = /^\[UNKNOWN\] \(([^)]*)\)/;
    var entries = [], listeners = [], saveTimer = null, sockets = 0, accountKey = null;

    function stored(key) {
      try { var list = JSON.parse(localStorage.getItem(key)); return Array.isArray(list) ? list : null; } catch (e) { return null; }
    }
    // The log shared by every account up to 0.29.0. The Array test spares an account named journal, whose data lives under the same key.
    if (stored(KEY)) localStorage.removeItem(KEY);
    function save() {
      clearTimeout(saveTimer);
      saveTimer = null;
      // Before sign-in the events stay in memory: they join the account that signs in on this page, never the next one.
      if (!accountKey) return;
      try { localStorage.setItem(accountKey, JSON.stringify(entries)); } catch (e) { /* storage full or unavailable: the journal stays in memory */ }
    }
    function signIn(name) {
      accountKey = KEY + ':' + name;
      entries = (stored(accountKey) || []).concat(entries).slice(-MAX);
      save();
    }
    function add(kind, text) {
      entries.push({ t: Date.now(), k: kind, m: String(text).slice(0, TEXT_MAX) });
      if (entries.length > MAX) entries.splice(0, entries.length - MAX);
      if (!saveTimer) saveTimer = setTimeout(save, SAVE_MS);
      listeners.forEach(function (fn) { fn(); });
    }
    function duration(ms) {
      var s = Math.round(ms / 1000);
      if (s < 60) return s + 's';
      if (s < 3600) return Math.floor(s / 60) + 'm ' + (s % 60) + 's';
      return Math.floor(s / 3600) + 'h ' + Math.floor(s % 3600 / 60) + 'm';
    }
    function network() {
      var c = navigator.connection;
      return (navigator.onLine ? 'online' : 'offline') + (c && c.effectiveType ? ', ' + c.effectiveType : '');
    }
    function describe(v) {
      if (v instanceof Error) return v.name + ': ' + v.message;
      return typeof v === 'string' ? v : Object.prototype.toString.call(v);
    }

    /* Page lifecycle: a mobile device suspends the background tab and its sockets with it. */
    add('page', 'Page loaded (' + network() + '). ' + navigator.userAgent);
    var hiddenAt = 0, hiddenStall = 0, tick = Date.now();
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now();
        hiddenStall = 0;
        add('page', 'Page hidden');
        save();
      } else {
        add('page', 'Page visible' + (hiddenAt ? ' after ' + duration(Date.now() - hiddenAt) + (hiddenStall ? ', timers stalled up to ' + duration(hiddenStall) : '') : ''));
        hiddenAt = 0;
      }
    });
    window.addEventListener('pagehide', function (e) { add('page', e.persisted ? 'Page put in the back-forward cache' : 'Page closed or reloaded'); save(); });
    window.addEventListener('pageshow', function (e) { if (e.persisted) add('page', 'Page restored from the back-forward cache'); });
    document.addEventListener('freeze', function () { add('page', 'Page frozen by the browser'); save(); });
    document.addEventListener('resume', function () { add('page', 'Page resumed by the browser'); });
    window.addEventListener('online', function () { add('network', 'Network online (' + network() + ')'); });
    window.addEventListener('offline', function () { add('network', 'Network offline'); });
    if (navigator.connection && navigator.connection.addEventListener) navigator.connection.addEventListener('change', function () { add('network', 'Network changed (' + network() + ')'); });
    // A late timer shows that the browser slowed down or suspended the page, BetterChatango pings included.
    setInterval(function () {
      var now = Date.now(), gap = now - tick;
      tick = now;
      if (gap < STALL_MS) return;
      if (document.visibilityState === 'hidden') hiddenStall = Math.max(hiddenStall, gap);
      else add('page', 'Timers stalled for ' + duration(gap));
    }, TICK_MS);

    window.addEventListener('error', function (e) { add('error', (e.message || 'Script error') + (e.filename ? ' at ' + e.filename.split('?')[0] + ':' + e.lineno : '')); });
    window.addEventListener('unhandledrejection', function (e) { add('error', 'Unhandled rejection: ' + describe(e.reason)); });

    /* Console: our lines, BetterChatango connection lines and errors, nothing else. */
    function consoleText(args) {
      var first = args[0];
      if (typeof first === 'string') {
        if (first.indexOf('[torch-skin]') === 0) return [].map.call(args, describe).join(' ');
        if (BETTER_CHATANGO_LINES.some(function (re) { return re.test(first); })) return 'BetterChatango: ' + first;
        var frame = UNKNOWN_FRAME.exec(first);
        if (frame) return 'BetterChatango: unhandled frame ' + frame[1];
      }
      for (var i = 0; i < args.length; i++) if (args[i] instanceof Error) return describe(args[i]);
      return null;
    }
    ['log', 'info', 'warn', 'error'].forEach(function (level) {
      var native = console[level];
      console[level] = function () {
        var text = consoleText(arguments);
        if (text !== null) add('console', text);
        return native.apply(console, arguments);
      };
    });

    /* Sockets: opening, session frames, closing with its code. Sends are never observed, the authentication carries the password (ADR-0001). */
    function target(url) {
      if (/^wss:\/\/c1\.chatango\.com\b/.test(url)) return 'private messages';
      var c = window.__betterChatangoRefs && window.__betterChatangoRefs.client;
      // BetterChatango records the group in cache.connecting just before it creates its socket (inject.js:5613).
      return c && c.cache && c.cache.connecting ? '#' + c.cache.connecting : url.replace(/^wss?:\/\/([^/:]+).*$/, '$1');
    }
    function watch(socket, url) {
      var name = target(url) + ' [' + (++sockets) + ']', opened = 0, frames = 0, last = 0;
      add('socket', name + ' connecting to ' + url.replace(/^wss?:\/\/([^/]+).*$/, '$1'));
      socket.addEventListener('open', function () { opened = Date.now(); add('socket', name + ' open'); });
      socket.addEventListener('message', function (e) {
        frames++;
        last = Date.now();
        var command = typeof e.data === 'string' ? e.data.split(':', 1)[0].replace(/[\r\n\0]+$/, '') : '';
        if (LIFECYCLE.indexOf(command) >= 0) add('socket', name + ' received ' + command);
      });
      socket.addEventListener('error', function () { add('socket', name + ' error'); });
      socket.addEventListener('close', function (e) {
        var parts = [name + ' closed, code ' + e.code + (e.reason ? ' (' + e.reason + ')' : ''), e.wasClean ? 'clean' : 'not clean'];
        if (opened) parts.push('open for ' + duration(Date.now() - opened), frames + (frames === 1 ? ' frame' : ' frames') + ' received');
        if (last) parts.push('last frame ' + duration(Date.now() - last) + ' before');
        parts.push('page ' + document.visibilityState, network());
        add('socket', parts.join(', '));
      });
    }
    var NativeSocket = window.WebSocket;
    if (typeof NativeSocket === 'function') {
      var Socket = function (url, protocols) {
        var socket = arguments.length > 1 ? new NativeSocket(url, protocols) : new NativeSocket(url);
        watch(socket, String(url));
        return socket;
      };
      // The returned socket stays a native WebSocket: instanceof, readyState and constants unchanged for BetterChatango.
      Socket.prototype = NativeSocket.prototype;
      ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'].forEach(function (k) { Socket[k] = NativeSocket[k]; });
      window.WebSocket = Socket;
    }

    window.__TORCH_JOURNAL__ = {
      limit: MAX,
      add: add,
      signIn: signIn,
      entries: function () { return entries.slice(); },
      clear: function () { entries = []; save(); listeners.forEach(function (fn) { fn(); }); },
      subscribe: function (fn) { listeners.push(fn); return function () { listeners = listeners.filter(function (x) { return x !== fn; }); }; }
    };
  })();
