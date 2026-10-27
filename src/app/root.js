/* ---------- Root ---------- */
var THREAD_MAX = 500;
var MENTION_MAX = 100;
var IDLE_DELAY = 3 * MIN;
// Chatango pushes no presence for a correspondent who is neither a friend nor connected since the last private connection.
var PRESENCE_REFRESH = 5 * MIN;
// Names per presence request, the page size of BetterChatango's Meet people.
var PRESENCE_MAX = 40;
// Delays of the attempts that follow a connection loss: a Chatango restart makes an immediate retry fail.
var RECONNECT_DELAYS = [3000, 10000, 30000];
var RELEASES_URL = 'https://github.com/marjoriedotdev/nightango/releases/';

/**
 * Reads the version of the latest Nightango release published on GitHub.
 * @returns {Promise<?string>} Version without its v, null if the reply does not give one.
 */
function fetchLatestVersion() {
  return fetch('https://api.github.com/repos/marjoriedotdev/nightango/releases/latest').then(function (r) {
    if (!r.ok) return null;
    return r.json().then(function (data) { var m = /^v(\d+\.\d+\.\d+)$/.exec(data && data.tag_name); return m ? m[1] : null; });
  });
}

function Root(props) {
  var st = useState(function () { return props.boot && props.boot.auth ? props.boot : initialState(); }), state = st[0], setState = st[1];
  var stateRef = useRef(state); stateRef.current = state;
  // Only source of PM unreads: the BetterChatango database in live, an in-memory archive in the prototype or when that database is missing.
  var pmArchive = useRef(null);
  if (!pmArchive.current) pmArchive.current = LIVE ? betterChatangoPmArchive() : memoryPmArchive();
  var update = useCallback(function (fn) { setState(function (prev) { var d = JSON.parse(JSON.stringify(prev)); fn(d); return d; }); }, []);
  var u1 = useState([]), toasts = u1[0], setToasts = u1[1];
  var u2 = useState(null), confirmCfg = u2[0], setConfirm = u2[1];
  var u3 = useState(null), profile = u3[0], setProfile = u3[1];
  var u4 = useState(null), linkUrl = u4[0], setLinkUrl = u4[1];
  var u5 = useState(false), palette = u5[0], setPalette = u5[1];
  var u6 = useState(null), create = u6[0], setCreate = u6[1];
  var u7 = useState(false), newDm = u7[0], setNewDm = u7[1];
  var u8 = useState(null), banCfg = u8[0], setBan = u8[1];
  var u9 = useState(false), navOpen = u9[0], setNavOpen = u9[1];
  var u11 = useState(null), fullProfile = u11[0], setFullProfile = u11[1];
  var u12 = useState(null), profileLink = u12[0], setProfileLink = u12[1];
  var u13 = useState({}), uploads = u13[0], setUploads = u13[1];
  var u14 = useState(null), who = u14[0], setWho = u14[1];
  var u10 = useState(0), themeTick = u10[1];
  var prefs = state.prefs;

  useEffect(function () {
    var hot = window.claude && window.claude.hot;
    if (hot && hot.snapshot) hot.snapshot(function () { return { state: stateRef.current }; });
  }, []);

  /* Theme, accent and display preferences applied to the root */
  useEffect(function () {
    var root = ROOT_EL;
    if (prefs.theme === 'dark' || prefs.theme === 'light') root.setAttribute('data-theme', prefs.theme);
    else if (VIEWER_THEME) root.setAttribute('data-theme', VIEWER_THEME);
    else root.removeAttribute('data-theme');
    var acc = hexToRgb(prefs.accent) ? prefs.accent : '#f27a3f';
    root.style.setProperty('--accent', acc);
    root.style.setProperty('--on-accent', contrast(hexToRgb(acc), [15, 16, 18]) >= 4.5 ? '#0f1012' : '#ffffff');
    root.style.setProperty('--accent-text-d', ensureContrast(acc, SURFACE.dark.selected, 4.5));
    root.style.setProperty('--accent-text-l', ensureContrast(acc, SURFACE.light.selected, 4.5));
    root.style.setProperty('--accent-soft-d', rgba(acc, 0.12));
    root.style.setProperty('--accent-soft-l', rgba(acc, 0.14));
    root.style.setProperty('--msg-size', prefs.textSize + 'px');
    root.classList.toggle('reduce-motion', !!prefs.a11y.reduceMotion);
    root.classList.toggle('underline-links', !!prefs.a11y.underlineLinks);
    root.classList.toggle('calm-sky', !!prefs.sky.calm);
    root.classList.toggle('moon-south', !!prefs.sky.south);
    storageSet(PREFS_KEY, prefs);
  }, [prefs]);
  useEffect(function () {
    var mq; try { mq = window.matchMedia('(prefers-color-scheme: light)'); } catch (e) { return; }
    function onChange() { themeTick(function (n) { return n + 1; }); }
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    return function () { if (mq.removeEventListener) mq.removeEventListener('change', onChange); };
  }, []);

  /* Switch to idle for members inactive for IDLE_DELAY */
  useEffect(function () {
    if (!state.users) return;
    var next = Infinity;
    Object.keys(state.users).forEach(function (n) { var u = state.users[n]; if (u.idleSince && u.status === 'online') next = Math.min(next, u.idleSince + IDLE_DELAY); });
    if (next === Infinity) return;
    var timer = setTimeout(function () {
      update(function (d) { Object.keys(d.users).forEach(function (n) { var u = d.users[n]; if (u.idleSince && u.status === 'online' && Date.now() - u.idleSince >= IDLE_DELAY) u.status = 'idle'; }); });
    }, Math.max(0, next - Date.now()));
    return function () { clearTimeout(timer); };
  }, [state.users]);

  /* Tab title */
  useEffect(function () {
    if (!state.auth.loggedIn) { document.title = 'Nightango'; return; }
    var n = unreadDmCount(state);
    Object.keys(state.groups).forEach(function (k) { n += state.groups[k].mentions || 0; });
    document.title = (prefs.tabTitle && n ? '(' + n + ') ' : '') + (prefs.privacy.usernameInTitle ? state.me + ' | ' : '') + 'Nightango';
  });

  /* Global keyboard shortcuts */
  useEffect(function () {
    function onKey(e) {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K') && stateRef.current.auth.loggedIn) { e.preventDefault(); setPalette(true); }
    }
    document.addEventListener('keydown', onKey);
    return function () { document.removeEventListener('keydown', onKey); };
  }, []);

  var toast = useCallback(function (text, opts) {
    var id = uid(), t = Object.assign({ id: id, text: text }, opts || {});
    setToasts(function (list) { return list.concat([t]).slice(-4); });
    setTimeout(function () { setToasts(function (list) { return list.filter(function (x) { return x.id !== id; }); }); }, t.action ? 7000 : 4500);
  }, []);
  function dismissToast(id) { setToasts(function (list) { return list.filter(function (x) { return x.id !== id; }); }); }

  /* Newer release, checked once per page at sign-in */
  var updateChecked = useRef(false);
  useEffect(function () {
    if (!LIVE || !state.auth.loggedIn || updateChecked.current) return;
    updateChecked.current = true;
    fetchLatestVersion().then(function (v) {
      if (v && isNewerVersion(v, APP_VERSION)) toast('Nightango ' + v + ' is available.', { icon: 'info', action: { label: 'Download', run: function () { window.open(RELEASES_URL + 'tag/v' + v, '_blank', 'noopener'); } } });
    }).catch(function () { if (JOURNAL) JOURNAL.add('app', 'Update check failed'); });
  }, [state.auth.loggedIn]);

  function nav(route) {
    update(function (d) {
      var cur = d.route;
      // Going back to the message log does not jump again to the message opened from Mentions or the PM search.
      if (cur && (cur.view === 'group' || cur.view === 'dm' || cur.view === 'discover' || cur.view === 'mentions')) { d.lastChat = cur; delete cur.msgId; delete cur.seek; }
      var r = Object.assign({}, route);
      if (r.view === 'group' && d.groups[r.id]) { var g = d.groups[r.id]; r.markerTs = g.lastReadTs; g.lastReadTs = Date.now(); g.unread = 0; g.mentions = 0; }
      if (r.view === 'dm' && r.id && d.dms[r.id]) { d.dms[r.id].lastReadTs = Date.now(); d.dms[r.id].closed = false; }
      d.route = r;
    });
    setNavOpen(false);
    if (route.view === 'dm' && route.id) readPm(pmArchive.current, update, route.id);
    if (LIVE) {
      if (route.view === 'group' && route.id) liveBridge.focus(route.id);
      liveBridge.focusPm(route.view === 'dm' && route.id ? route.id : false);
    }
  }

  /* Notifications of an incoming event, after the state update */
  function notify(kind, info) {
    var p = stateRef.current.prefs, n = p.notify[kind];
    if (!n) return;
    var focused = document.visibilityState === 'visible' && (typeof document.hasFocus !== 'function' || document.hasFocus());
    if (n.sound && (!p.soundFocusOnly || focused)) beep(p.volume);
    if (n.app && info.toast) toast(info.toast, info.action ? { action: info.action, icon: info.icon, clamp: kind === 'pm' } : { icon: info.icon, clamp: kind === 'pm' });
    if (n.desktop && !focused) {
      try { if (window.Notification && window.Notification.permission === 'granted') new window.Notification('Nightango', { body: info.toast }); } catch (e) { /* system notifications unavailable */ }
    }
  }

  function trimThread(g) {
    if (g.messages.length <= THREAD_MAX) return;
    g.messages.splice(0, g.messages.length - THREAD_MAX);
    // The BetterChatango get_more counter ignores the trim: resuming would skip the removed messages.
    g.historyCapped = true;
  }
  /**
   * Records for the Mentions page a group message that mentions the user with the newest first.
   * @param {Object} d State being modified.
   * @param {string} gid Group of the message.
   * @param {Object} m Received message.
   */
  function logMention(d, gid, m) {
    // An edit shown on its own joins its original when the original arrives: only the original enters the list.
    if (m.kind !== 'msg' || m.editId || m.author === d.me || userOf(d, m.author).ignored || !mentionsMe(d.me, m.text)) return;
    if (d.mentionLog.some(function (x) { return x.gid === gid && x.id === m.id; })) return;
    d.mentionLog.push({ gid: gid, id: m.id, author: m.author, text: messagePreview(m), ts: m.ts });
    d.mentionLog.sort(function (a, b) { return b.ts - a.ts; });
    d.mentionLog.splice(MENTION_MAX);
  }
  /**
   * Removes the messages of a group from the Mentions page.
   * @param {Object} d State being modified.
   * @param {string} gid Target group.
   * @param {?string[]} ids Removed messages, null for the whole group.
   */
  function dropMentions(d, gid, ids) {
    d.mentionLog = d.mentionLog.filter(function (x) { return x.gid !== gid || (ids && ids.indexOf(x.id) < 0); });
  }
  /**
   * Sets the sample world of the prototype with its mentions recorded like those of the live history.
   * @param {Object} d State being modified.
   * @param {string} me User name.
   */
  /**
   * Creates the sample world of the prototype with the PM archive that holds its unreads.
   * @param {string} me Signed-in account.
   */
  function sampleWorld(me) {
    var world = seedWorld(me);
    pmArchive.current = memoryPmArchive(Object.keys(world.dms).reduce(function (o, n) { o[n] = world.dms[n].unread; return o; }, {}));
    return world;
  }
  function seedState(d, world) {
    Object.assign(d, world);
    Object.keys(d.groups).forEach(function (gid) { d.groups[gid].messages.forEach(function (m) { logMention(d, gid, m); }); });
  }
  function receiveGroup(gid, msg) {
    var s0 = stateRef.current, me = s0.me;
    var mention = msg.kind === 'msg' && mentionsMe(me, msg.text);
    // Like in BetterChatango, a mention in a muted group or from an ignored author does not alert, and the counters still change.
    var quiet = !!(s0.groups[gid] && s0.groups[gid].muted) || !!userOf(s0, msg.author).ignored;
    var focused = s0.route.view === 'group' && s0.route.id === gid && document.visibilityState === 'visible';
    update(function (d) {
      var g = d.groups[gid]; if (!g) return;
      // The reply is resolved on the up-to-date state: the final id of the original can arrive just before.
      if (LIVE && msg.replyId) withReply(g, msg);
      g.messages.push(msg);
      trimThread(g);
      logMention(d, gid, msg);
      if (msg.kind === 'msg' && !focused) { g.unread += 1; if (mention) g.mentions += 1; }
      if (focused) g.lastReadTs = Date.now();
    });
    if (mention && !quiet && !(s0.route.view === 'group' && s0.route.id === gid)) {
      notify('mentions', { toast: msg.author + ' mentioned you in #' + gid, icon: 'at-sign', action: { label: 'Open', run: function () { nav({ view: 'group', id: gid }); } } });
    }
  }
  function receiveDm(from, text) {
    var s0 = stateRef.current, m = { from: from, text: text, ts: Date.now() };
    var focused = isDmInView(s0, from);
    update(function (d) {
      receivePm(d, m);
      var c = d.dms[from];
      if (focused) c.lastReadTs = Date.now();
    });
    pmArchive.current.record(from, m, !focused);
    syncPmUnread(pmArchive.current, update, [from]);
    if (!focused && !userOf(s0, from).ignored) notify('pm', { toast: s0.prefs.pmPreview ? from + ': ' + text : 'New message from ' + from, icon: 'message', action: { label: 'Reply', run: function () { nav({ view: 'dm', id: from }); } } });
  }
  /**
   * Announces the toggle of a member mark in the prototype as in live.
   * @param {string} name Target member.
   * @param {string} key Toggled mark (friend, ignored, blocked or unstyled).
   * @param {boolean} was Mark before the toggle.
   */
  function toggleUserText(name, key, was) {
    return {
      friend: name + ' removed from friends.',
      ignored: was ? 'You no longer ignore ' + name + '.' : 'Ignoring ' + name + '.',
      blocked: was ? name + ' unblocked.' : name + ' blocked.',
      unstyled: was ? name + "'s style shown again." : name + "'s style hidden."
    }[key];
  }
  /**
   * Removes from the message log a PM removed from this browser and says so.
   * @param {string} name Correspondent.
   * @param {string} id Message id in the state.
   */
  function dropDmMessage(name, id) {
    update(function (d) { var c = d.dms[name]; c.messages = c.messages.filter(function (x) { return x.id !== id; }); });
    toast('Message removed from this browser.');
  }

  var mediaLib = LIVE ? liveBridge : sampleMedia;
  // The stars and the Media tab read the media library again when this counter changes.
  function mediaChanged() { update(function (d) { d.mediaRev++; }); }

  var actions = {
    login: function (name) { var world = sampleWorld(name); update(function (d) { seedState(d, world); d.auth = { loggedIn: true }; d.lastChat = { view: 'group', id: 'community' }; }); },
    logout: function () { update(function (d) { d.auth = { loggedIn: false }; }); setNavOpen(false); },
    resetDemo: function () { var world = sampleWorld(stateRef.current.me); update(function (d) { seedState(d, world); }); toast('Sample data restored.'); },
    backToChat: function () { nav(stateRef.current.lastChat || { view: 'group', id: 'community' }); },
    setStatus: function (st2) { update(function (d) { d.meStatus = st2; }); },
    setMessageStyle: function (style) { update(function (d) { d.ownStyle = style; }); },
    sendGroup: function (gid, text, opts) {
      var me = stateRef.current.me;
      text = (opts.quote || '') + text;
      update(function (d) { d.groups[gid].messages.push({ id: uid(), kind: 'msg', author: me, text: text, ts: Date.now(), replyTo: opts.replyTo || null, channel: opts.channel || 'none' }); d.groups[gid].lastReadTs = Date.now(); });
      var g = stateRef.current.groups[gid];
      if (gid === 'bots' && text.charAt(0) === '!') {
        var cmd = text.slice(1).split(/\s+/)[0].toLowerCase();
        var reply = cmd === 'roll' ? 'Rolled a ' + (1 + Math.floor(Math.random() * (parseInt(text.split(/\s+/)[1], 10) || 20))) + '.' : cmd === 'help' ? 'Commands: !weather, !define, !roll' : cmd === 'weather' ? 'Rennes: 14°C, light rain.' : 'Unknown command. Try !help.';
        setTimeout(function () { receiveGroup(gid, { id: uid(), kind: 'msg', author: 'rook', text: '@' + me + ' ' + reply, ts: Date.now() }); }, 900);
        return;
      }
      var m = /@([a-z0-9_-]+)/i.exec(text);
      if (m && g && g.members.indexOf(m[1].toLowerCase()) >= 0 && m[1].toLowerCase() !== me && userOf(stateRef.current, m[1].toLowerCase()).status !== 'offline') {
        var who = m[1].toLowerCase();
        setTimeout(function () { receiveGroup(gid, { id: uid(), kind: 'msg', author: who, text: '@' + me + ' ' + pick(['On it.', 'Sure, give me a minute.', 'Thanks, checking now.', 'Good point.']), ts: Date.now() }); }, 3400);
      }
    },
    sendDm: function (name, text) {
      var me = stateRef.current.me;
      update(function (d) { d.dms[name].messages.push({ id: uid(), from: me, text: text, ts: Date.now() }); });
      var u = userOf(stateRef.current, name);
      if (u.status === 'offline' || u.blocked) return;
      setTimeout(function () { receiveDm(name, pick(DM_LINES[name] || DM_LINES.default)); }, 2400 + Math.random() * 1500);
    },
    openDm: function (name, tab) { update(function (d) { pmConversation(d, name); }); nav({ view: 'dm', id: name, tab: tab }); },
    loadProfile: function () { /* prototype: profiles already present in the sample data */ },
    loadProfiles: function () { /* same */ },
    searchPeople: function (f) {
      // Prototype: search among the sample members who are not friends yet.
      var s0 = stateRef.current, q = String(f.query || '').toLowerCase();
      var list = Object.keys(s0.users).filter(function (n) { var u = s0.users[n]; return !u.friend && (!q || n.indexOf(q) >= 0 || String(u.location || '').toLowerCase().indexOf(q) >= 0) && (!f.online || u.status !== 'offline'); });
      update(function (d) { d.meet = { results: list, loading: false, error: null, done: true, filters: f }; });
    },
    /**
     * Loads the activity of the user's own profile recorded by vissle.me.
     * @param {string} get vissle filter (all, log, like, dislike, msg or refer).
     * @param {boolean} more True to append the next page to the rows already shown.
     */
    loadVisitors: function (get, more) {
      var req = uid(), q = { page: more ? stateRef.current.visitors.next : 1, order: 'desc', get: get };
      update(function (d) { d.visitors = Object.assign({ rows: [], next: null }, more ? d.visitors : null, { get: get, loading: true, error: null, req: req }); });
      // Only the last request applies: a filter change makes the previous responses obsolete.
      // React can apply the response to a state that does not have the request above yet, then replay it in order.
      (LIVE ? liveBridge.visitors(q) : Promise.resolve(sampleVisits(q))).then(function (items) {
        var pg = visitorPage(items, get);
        update(function (d) { if (d.visitors && d.visitors.req === req) d.visitors = { get: get, rows: (more ? d.visitors.rows : []).concat(pg.rows), next: pg.next, loading: false, error: null, req: req }; });
      }, function (e) {
        update(function (d) { if (d.visitors && d.visitors.req === req) Object.assign(d.visitors, { loading: false, error: e.message }); });
      });
    },
    closeDm: function (name) {
      update(function (d) { d.dms[name].closed = true; });
      readPm(pmArchive.current, update, name);
      var r = stateRef.current.route;
      if (r.view === 'dm' && r.id === name) nav({ view: 'dm', id: null });
    },
    deleteDm: function (name) { actions.closeDm(name); update(function (d) { d.dms[name].messages = []; }); },
    /**
     * Removes a PM from its conversation.
     * @param {string} name Correspondent.
     * @param {Object} m Removed message.
     */
    removeDmMessage: function (name, m) { dropDmMessage(name, m.id); },
    deleteAllDms: function () { update(function (d) { d.dms = {}; }); },
    /** Sample messages in the BetterChatango private history format with the ts key in seconds. */
    exportDms: function () {
      var s0 = stateRef.current, out = [];
      Object.keys(s0.dms).forEach(function (t) {
        var c = s0.dms[t];
        c.messages.forEach(function (m) {
          var ts = m.ts / 1000;
          out.push({ target: t, ts: ts, data: ['msg', m.from, s0.me, 'unknown', ts, 0, esc(m.text)].join(':'), unread: m.from !== s0.me && m.ts > c.lastReadTs ? 1 : 0 });
        });
      });
      return Promise.resolve(out.sort(function (a, b) { return a.ts - b.ts; }));
    },
    /**
     * Adds the valid records of a private history to the conversations like the live import.
     * @param {Array} records File content, untrusted.
     */
    importDms: function (records) {
      var s0 = stateRef.current, screened = screenPmRecords(records, s0.me), keys = {}, added = [];
      Object.keys(s0.dms).forEach(function (t) { s0.dms[t].messages.forEach(function (m) { keys[m.ts / 1000] = true; }); });
      screened.valid.forEach(function (r) { if (!keys[r.ts]) { keys[r.ts] = true; added.push(r); } });
      update(function (d) {
        added.forEach(function (r) {
          var t = lower(r.target), c = d.dms[t] || (d.dms[t] = { messages: [], unread: 0, lastReadTs: Date.now() });
          c.messages.push(pmMessage(pmRecordEntry(r)));
          c.messages.sort(function (a, b) { return a.ts - b.ts; });
        });
      });
      return Promise.resolve({ added: added.length, saved: screened.valid.length - added.length, skipped: screened.skipped, foreign: screened.foreign });
    },
    mediaPage: function (index, after, text) { return mediaLib.mediaPage(index, after, text); },
    searchMedia: function (text, count) { return mediaLib.searchMedia(text, count); },
    hasMedia: function (url) { return mediaLib.hasMedia(url); },
    /**
     * Adds an image to the media library under the name BetterChatango gives it or removes it.
     * @param {string} url Image URL.
     * @param {boolean} saved The image is already in the media library.
     */
    toggleMedia: function (url, saved) {
      (saved ? mediaLib.removeMedia(url) : mediaLib.addMedia({ url: url, name: mediaName(url) })).then(function () {
        mediaChanged();
        toast(saved ? 'Removed from your media.' : 'Added to your media.', { icon: 'check' });
      }, function (e) { toast(e.message); });
    },
    exportMedia: function () { return mediaLib.exportMedia(); },
    importMedia: function (entries) { return mediaLib.importMedia(entries).then(function (r) { mediaChanged(); return r; }); },
    toggleUser: function (name, key) {
      var was = !!userOf(stateRef.current, name)[key];
      update(function (d) { if (!d.users[name]) d.users[name] = { status: 'offline', about: '', style: {} }; d.users[name][key] = !was; });
      if (key === 'friend' && !was) return;
      toast(toggleUserText(name, key, was), { action: { label: 'Undo', run: function () { update(function (d) { d.users[name][key] = was; }); } } });
    },
    toggleMute: function (gid) { update(function (d) { d.groups[gid].muted = !d.groups[gid].muted; }); },
    toggleHiddenChannel: function (gid, k) {
      update(function (d) { var l = d.groups[gid].hiddenChannels, i = l.indexOf(k); if (i >= 0) l.splice(i, 1); else l.push(k); });
    },
    toggleFavorite: function (gid) { update(function (d) { d.groups[gid].favorite = !d.groups[gid].favorite; }); },
    /**
     * Adds a trusted host without duplicates or removes it.
     * @param {string} host Lowercase host without scheme or path.
     * @param {boolean} on True to add it.
     * @returns {boolean} True if the list is saved.
     */
    setTrustedHost: function (host, on) {
      update(function (d) { var l = d.prefs.safety.trustedHosts, i = l.indexOf(host); if (!on && i >= 0) l.splice(i, 1); else if (on && i < 0) l.push(host); });
      return true;
    },
    joinGroup: function (gid) {
      var me = stateRef.current.me;
      update(function (d) {
        var g = d.groups[gid];
        if (!g.joined) { g.joined = true; if (g.members.indexOf(me) < 0) g.members.push(me); }
      });
      nav({ view: 'group', id: gid });
    },
    leaveGroup: function (gid) {
      var me = stateRef.current.me;
      update(function (d) { var g = d.groups[gid]; g.joined = false; g.favorite = false; g.members = g.members.filter(function (n) { return n !== me; }); dropMentions(d, gid, null); });
      var next = Object.keys(stateRef.current.groups).filter(function (k) { return k !== gid && stateRef.current.groups[k].joined; })[0];
      nav(next ? { view: 'group', id: next } : { view: 'discover' });
    },
    createGroup: function (name, title, desc) {
      var me = stateRef.current.me, now = Date.now();
      update(function (d) {
        var staff = {}; staff[me] = 'owner';
        d.groups[name] = {
          id: name, title: title, topic: desc || title, joined: true, favorite: false, muted: false, hiddenChannels: [], unread: 0, mentions: 0, lastReadTs: now,
          members: [me], guests: 0, closed: false, dismissedAnnouncement: false, bans: [],
          settings: mkSettings({ overview: { title: title, description: desc }, staff: staff }),
          audit: [{ id: uid(), at: now, actor: me, text: 'Created the group' }],
          messages: [{ id: uid(), kind: 'system', text: 'You created #' + name + '. Share ' + name + '.chatango.com to invite people.', ts: now }]
        };
      });
      nav({ view: 'group', id: name });
      return true;
    },
    editMessage: function (gid, m, text) {
      update(function (d) { var g = d.groups[gid]; g.messages.forEach(function (o) { if (o.id === m.id) applyGroupEdit(o, { id: uid(), text: text, embeds: o.embeds }); }); });
    },
    deleteMessage: function (gid, mid) {
      var me = stateRef.current.me, author = null;
      update(function (d) {
        var g = d.groups[gid];
        g.messages.forEach(function (m) { if (m.id === mid) { m.deleted = { by: me }; author = m.author; } });
        if (author && author !== me) g.audit.push({ id: uid(), at: Date.now(), actor: me, text: 'Deleted a message from ' + author });
        dropMentions(d, gid, [mid]);
      });
      toast('Message deleted.');
    },
    ban: function (gid, name) {
      var me = stateRef.current.me, now = Date.now();
      update(function (d) {
        var g = d.groups[gid];
        g.bans.unshift({ name: name, by: me, at: now, ip: (40 + Math.floor(Math.random() * 180)) + '.' + Math.floor(Math.random() * 255) + '.x.x' });
        g.members = g.members.filter(function (n) { return n !== name; });
        if (g.settings.staff[name]) delete g.settings.staff[name];
        g.messages.push({ id: uid(), kind: 'ban', user: name, ts: now });
        g.audit.push({ id: uid(), at: now, actor: me, text: 'Banned ' + name });
      });
      toast(name + ' was banned from #' + gid + '.', { action: { label: 'Undo', run: function () { actions.unban(gid, name, true); } } });
    },
    unban: function (gid, name, quiet) {
      var me = stateRef.current.me;
      update(function (d) { var g = d.groups[gid]; g.bans = g.bans.filter(function (b) { return b.name !== name; }); g.audit.push({ id: uid(), at: Date.now(), actor: me, text: 'Unbanned ' + name }); });
      if (!quiet) toast(name + ' can join #' + gid + ' again.');
    },
    unbanAll: function (gid) {
      var me = stateRef.current.me, n = stateRef.current.groups[gid].bans.length;
      update(function (d) { var g = d.groups[gid]; g.bans = []; g.audit.push({ id: uid(), at: Date.now(), actor: me, text: 'Unbanned everyone (' + n + ')' }); });
    },
    setClosed: function (gid, closed) {
      var me = stateRef.current.me;
      update(function (d) {
        var g = d.groups[gid]; g.closed = closed;
        g.audit.push({ id: uid(), at: Date.now(), actor: me, text: closed ? 'Closed the group' : 'Reopened the group' });
        g.messages.push({ id: uid(), kind: 'system', text: closed ? me + ' closed the group. Nobody can post until it reopens.' : me + ' reopened the group.', ts: Date.now() });
      });
      toast(closed ? '#' + gid + ' is closed.' : '#' + gid + ' is open again.');
    },
    saveGroupSettings: function (gid, draft) {
      var me = stateRef.current.me, old = stateRef.current.groups[gid].settings, now = Date.now();
      var labels = { announcement: 'Updated the announcement', automod: 'Changed AutoMod settings', media: 'Changed media and link rules' };
      update(function (d) {
        var g = d.groups[gid];
        Object.keys(labels).forEach(function (k) { if (JSON.stringify(old[k]) !== JSON.stringify(draft[k])) g.audit.push({ id: uid(), at: now, actor: me, text: labels[k] }); });
        Object.keys(Object.assign({}, old.staff, draft.staff)).forEach(function (n) {
          if (old.staff[n] !== draft.staff[n]) g.audit.push({ id: uid(), at: now, actor: me, text: draft.staff[n] ? 'Made ' + n + ' ' + ROLE_LONG[draft.staff[n]].toLowerCase() : 'Removed ' + n + ' from staff' });
          // Like the Chatango log (emod): permissions changed without a role change.
          else if (draft.staff[n] && old.modFlags[n] !== draft.modFlags[n]) g.audit.push({ id: uid(), at: now, actor: me, text: "Changed " + n + "'s permissions" });
        });
        if (old.announcement.text !== draft.announcement.text || (!old.announcement.enabled && draft.announcement.enabled)) g.dismissedAnnouncement = false;
        g.settings = JSON.parse(JSON.stringify(draft));
      });
      toast('Changes to #' + gid + ' saved.', { icon: 'check' });
    }
  };

  /* Activity simulator */
  useEffect(function () {
    if (LIVE || !state.auth.loggedIn || !prefs.simulate) return;
    var timer = null, alive = true;
    function tick() {
      if (!alive) return;
      var s0 = stateRef.current, r = Math.random(), me = s0.me;
      var joined = Object.keys(s0.groups).filter(function (k) { var g = s0.groups[k]; return g.joined && !g.closed && !g.settings.announcement.broadcast; });
      if (r < 0.62 && joined.length) {
        var gid = s0.route.view === 'group' && joined.indexOf(s0.route.id) >= 0 && Math.random() < 0.55 ? s0.route.id : pick(joined);
        var g = s0.groups[gid];
        var authors = g.members.filter(function (n) { return n !== me && userOf(s0, n).status !== 'offline'; });
        if (authors.length) {
          var author = pick(authors);
          var text = Math.random() < 0.12 ? pick(MENTION_LINES).replace('%me', me) : pick(LINES[gid] || LINES.generic);
          setTimeout(function () { if (!alive) return; receiveGroup(gid, { id: uid(), kind: 'msg', author: author, text: text, ts: Date.now() }); }, 1600);
        }
      } else if (r < 0.74 && joined.length) {
        var gid2 = pick(joined), g2 = s0.groups[gid2];
        var outside = ['rook', 'tallow', 'drift', 'pixelmint', 'petrichor'].filter(function (n) { return g2.members.indexOf(n) < 0 && !g2.bans.some(function (b) { return b.name === n; }); });
        var leaving = g2.members.filter(function (n) { return n !== me && !roleOf(g2, n); });
        if (outside.length && (Math.random() < 0.6 || !leaving.length)) {
          var who = pick(outside);
          update(function (d) { d.groups[gid2].members.push(who); });
        } else if (leaving.length) {
          var who2 = pick(leaving);
          update(function (d) { var x = d.groups[gid2]; x.members = x.members.filter(function (n) { return n !== who2; }); });
        }
      } else if (r < 0.84) {
        var senders = ['kestrel', 'sable', 'quill'].filter(function (n) { var u = userOf(s0, n); return !u.blocked && u.status !== 'offline'; });
        if (senders.length) {
          var from = pick(senders);
          setTimeout(function () { if (!alive) return; receiveDm(from, pick(DM_LINES[from] || DM_LINES.default)); }, 1800);
        }
      } else if (r < 0.92) {
        var friends = Object.keys(s0.users).filter(function (n) { return s0.users[n].friend && n !== me; });
        if (friends.length) {
          var f = pick(friends), cur = s0.users[f].status, next = cur === 'offline' ? 'online' : 'offline';
          update(function (d) { var u = d.users[f]; u.status = next; u.idleSince = 0; if (next === 'offline') u.lastOn = Date.now(); });
          if (next === 'online' && (isNotifyingOnline(s0, f) || s0.prefs.notify.friendOn.app)) {
            if (s0.prefs.notify.friendOn.sound) beep(s0.prefs.volume);
            toast(f + ' is online.', { icon: 'users', action: { label: 'Message', run: function () { actions.openDm(f); } } });
          }
          if (next === 'offline' && s0.prefs.notify.friendOff.app) toast(f + ' went offline.', { icon: 'users' });
        }
      }
      timer = setTimeout(tick, 5000 + Math.random() * 5000);
    }
    timer = setTimeout(tick, 4000);
    return function () { alive = false; clearTimeout(timer); };
  }, [state.auth.loggedIn, prefs.simulate]);

  /* ---------- Live mode: actions passed to Chatango by the BetterChatango client ---------- */
  var localRef = useRef(blankLocal());
  var profilePending = useRef({}), msgBgPending = useRef({});
  // Name checked by New private message: its refusal shows in the dialog, not as a toast.
  var offlineCount = useRef(0);
  // Automatic reconnections in progress, by connection: attempts made and timer of the next one.
  var retries = useRef({});
  var presenceAt = useRef(0);
  function blankLocal() { return { hidden: [], channels: {}, unstyled: [], style: null }; }
  function lastMessageOf(g, name) {
    for (var i = g.messages.length - 1; i >= 0; i--) { var m = g.messages[i]; if (m.kind === 'msg' && m.author === name && m.unid) return m; }
    return null;
  }
  function wordList(v) { return String(v || '').split(/[,\n]/).map(function (x) { return x.trim(); }).filter(Boolean).join(','); }

  /**
   * Sends only what the user changed compared with the version they opened
   * applied on the current server state: changes made by another moderator in the meantime are kept.
   */
  function saveLiveSettings(g, draft, base) {
    var F = GROUP_FLAG, sent = 0, failed = 0;
    function count(ok) { if (ok) sent++; else failed++; }
    function flagsOf(x) {
      var f = 0, am = x.automod, fl = am.filters;
      if (!x.media.links) f |= F.NOLINKS;
      if (!x.media.images) f |= F.NOIMAGES;
      if (!x.media.videos) f |= F.NOVIDEOS;
      if (fl.nonsense && fl.nonsenseMode !== 'Advanced') f |= F.NLP_SINGLEMSG;
      if (fl.nonsense && fl.nonsenseMode === 'Advanced') f |= F.NLP_NGRAM;
      if (fl.repeat) f |= F.NLP_MSGQUEUE;
      if (am.proxies) f |= F.NO_PROXIES;
      if (x.announcement.broadcast) f |= F.BROADCAST_MODE;
      return f;
    }
    var cur = g.live.flags, wanted = flagsOf(draft), changed = wanted ^ flagsOf(base);
    var add = wanted & changed & ~cur, rem = ~wanted & changed & cur;
    if (add || rem) count(liveBridge.setFlags(g.id, add, rem));
    var a0 = base.announcement, a1 = draft.announcement;
    if (g.live.annc && (a0.enabled !== a1.enabled || a0.text !== a1.text || a0.interval !== a1.interval)) {
      // Interval unchanged: send back the exact value in seconds rather than the rounded value shown.
      var seconds = a1.interval === a0.interval && a0.intervalSec ? a0.intervalSec : a1.interval * 60;
      count(liveBridge.setAnnouncement(g.id, a1.enabled, seconds, a1.text, g.live.annc));
    }
    var b0 = base.automod.banned, b1 = draft.automod.banned;
    if (b0 && b1 && (wordList(b0.part) !== wordList(b1.part) || wordList(b0.whole) !== wordList(b1.whole))) count(liveBridge.setBannedWords(g.id, wordList(b1.part), wordList(b1.whole)));
    if (base.automod.slowMode != null && draft.automod.slowMode !== base.automod.slowMode) count(liveBridge.setRateLimit(g.id, draft.automod.slowMode));
    var m0 = base.modFlags || {}, m1 = draft.modFlags || {};
    Object.keys(m1).forEach(function (n) { if (m0[n] !== m1[n]) count(liveBridge.setMod(g.id, n, m1[n])); });
    Object.keys(m0).forEach(function (n) { if (!(n in m1)) count(liveBridge.removeMod(g.id, n)); });
    if (failed) toast(failed + (failed > 1 ? ' changes' : ' change') + " could not be sent. Check the connection to #" + g.id + '.');
    else toast(sent ? 'Changes sent to Chatango.' : 'Nothing to save.', { icon: sent ? 'check' : 'info' });
    return sent;
  }
  /**
   * Toggles a group flag held by a BetterChatango list without changing anything if BetterChatango does not save it.
   * @param {string} gid Target group.
   * @param {string} key favorite or muted.
   * @param {function(string, boolean): boolean} save Bridge write.
   * @param {string} failure Toast shown if BetterChatango does not save.
   */
  function toggleBetterChatangoList(gid, key, save, failure) {
    var on = !stateRef.current.groups[gid][key];
    if (!save(gid, on)) { toast(failure); return; }
    update(function (d) { d.groups[gid][key] = on; });
  }
  /**
   * Sends a group message built by BetterChatango with the own style and keeps its style.
   * @param {string} gid Target group.
   * @param {string} text Typed text.
   * @param {{replyId: ?string, editId: ?string, quote: ?string, channel: ?string}} opts Reply, edited original or quote, and channel.
   * @param {?string} failure Toast shown if nothing was sent, null when the caller announces it itself.
   * @returns {boolean} True if the bridge emitted the frame.
   */
  function sendStyled(gid, text, opts, failure) {
    var style = liveBridge.send(gid, text, Object.assign({ style: stateRef.current.ownStyle }, opts));
    if (style) setOwnStyle(style); else if (failure) toast(failure);
    return !!style;
  }
  /**
   * Records the file being sent to a group or a PM.
   * @param {{kind: string, id: string}} to Destination of the send.
   * @param {?string} name File name, null once the send is done.
   */
  function setUpload(to, name) {
    setUploads(function (u) { var o = Object.assign({}, u); if (name) o[uploadKey(to)] = name; else delete o[uploadKey(to)]; return o; });
  }

  if (LIVE) {
    actions.logout = function () { location.reload(); };
    actions.setStatus = function (st2) { if (liveBridge.setStatus(st2)) update(function (d) { d.meStatus = st2; }); };
    actions.sendGroup = function (gid, text, opts) {
      opts = opts || {};
      var replyId = opts.replyTo && opts.replyTo.id;
      if (replyId && !liveBridge.delivered(replyId)) { toast('Wait until this message is delivered before replying to it.'); return false; }
      return sendStyled(gid, text, { replyId: replyId, quote: opts.quote, channel: opts.channel }, opts.quiet ? null : 'Message not sent. BetterChatango rejected it.');
    };
    // Editing an edit shown on its own targets its original, the only message visible to other members.
    actions.editMessage = function (gid, m, text) { sendStyled(gid, text, { editId: editedId(m), channel: m.channel }, 'Message not edited. BetterChatango rejected it.'); };
    actions.sendDm = function (name, text, opts) {
      var me = stateRef.current.me;
      var sent = liveBridge.sendPm(name, text, stateRef.current.ownStyle);
      if (!sent) { if (!(opts && opts.quiet)) toast('Private message not sent.'); return false; }
      update(function (d) { var c = pmConversation(d, name); c.messages.push({ id: uid(), from: me, text: sent.text, parts: sent.parts, embeds: sent.embeds, ts: Date.now() }); });
      setOwnStyle(sent.style);
      return true;
    };
    /**
     * Uploads a file through vissle and posts its link in the chosen group or PM and never in client.focus.
     * @param {{kind: string, id: string, channel: ?string}} to Destination fixed when the file is chosen.
     * @param {File} file Chosen file.
     */
    actions.uploadFile = function (to, file) {
      setUpload(to, file.name);
      liveBridge.uploadFile(file).then(function (link) {
        var sent = to.kind === 'dm' ? actions.sendDm(to.id, link, { quiet: true }) : actions.sendGroup(to.id, link, { channel: to.channel, quiet: true });
        if (sent) { toast('File sent.', { icon: 'check' }); return; }
        toast('The file was uploaded, but its link was not sent.', { action: { label: 'Copy link', run: function () {
          copyText(link, function (ok) { toast(ok ? 'Link copied.' : 'Copy failed. The link is ' + link); });
        } } });
      }, function (e) { toast(e.message); }).then(function () { setUpload(to, null); });
    };
    actions.setMessageStyle = function (style) {
      liveBridge.applyStyle(style);
      update(function (d) { d.ownStyle = style; });
    };
    actions.joinGroup = function (gid) {
      update(function (d) { ensureLiveGroup(d, gid).joined = true; });
      liveBridge.join(gid);
      nav({ view: 'group', id: gid });
    };
    actions.toggleFavorite = function (gid) { toggleBetterChatangoList(gid, 'favorite', liveBridge.setFavorite, 'BetterChatango could not save this favorite. Reload the page and try again.'); };
    actions.toggleMute = function (gid) { toggleBetterChatangoList(gid, 'muted', liveBridge.setMuted, 'BetterChatango could not save the mute for #' + gid + '. Reload the page and try again.'); };
    actions.setTrustedHost = function (host, on) {
      if (!liveBridge.setTrustedHost(host, on)) { toast(BETTER_CHATANGO_SAVE_FAILED); return false; }
      update(function (d) { d.prefs.safety.trustedHosts = liveBridge.trustedHosts(); });
      return true;
    };
    actions.leaveGroup = function (gid) {
      liveBridge.leave(gid);
      var kept = !!(stateRef.current.groups[gid] && stateRef.current.groups[gid].favorite) && !liveBridge.setFavorite(gid, false);
      if (kept) toast('BetterChatango could not remove #' + gid + ' from favorites. Reload the page and try again.');
      update(function (d) { if (d.groups[gid]) { d.groups[gid].joined = false; d.groups[gid].favorite = kept; } dropMentions(d, gid, null); });
      var next = Object.keys(stateRef.current.groups).filter(function (k) { return k !== gid && stateRef.current.groups[k].joined; })[0];
      nav(next ? { view: 'group', id: next } : { view: 'discover' });
    };
    actions.reconnect = function (gid, background) {
      liveBridge.reconnect(gid, background);
      update(function (d) { var g = d.groups[gid]; if (g) g.conn = 'connecting'; if (gid === 'private_message') d.pmConn = 'connecting'; });
    };
    actions.reconnectSession = function () {
      reconnectClosed();
      update(function (d) { if (d.session) d.session.attempts += 1; });
    };
    actions.loadProfile = function (name) {
      var pending = profilePending.current;
      // true marks a profile queued by loadProfiles: it has no request to share yet.
      if (pending[name] && pending[name] !== true) return pending[name];
      var run = liveBridge.fetchProfile(name).then(function (pr) {
        update(function (d) {
          var u = ensureLiveUser(d, name);
          u.profileLoaded = true; u.profileMissing = !!pr.missing;
          if (!pr.missing) { u.age = pr.age; u.gender = pr.gender; u.location = pr.location; u.aboutHtml = pr.about; u.premium = pr.premium; u.miniStyle = pr.mini; }
        });
      }, function () {
        // The card keeps what is already known: only an explicit opening requests it again.
        update(function (d) { ensureLiveUser(d, name).profileFailed = true; });
      }).then(function () { delete pending[name]; });
      pending[name] = run;
      return run;
    };
    /**
     * Reads the Premium message background of a member and keeps it in the state until it changes.
     * @param {string} name Target member.
     */
    actions.loadMsgBg = function (name) {
      var pending = msgBgPending.current;
      if (pending[name]) return;
      pending[name] = true;
      liveBridge.fetchMsgBg(name).then(function (bg) {
        delete pending[name];
        update(function (d) { ensureLiveUser(d, name).msgBg = bg; });
      });
    };
    /** Mini profiles of a result list with four requests at a time to spare Chatango. */
    actions.loadProfiles = function (names) {
      var pending = profilePending.current;
      var queue = names.filter(function (n) { var u = stateRef.current.users[n]; return ACCOUNT_NAME.test(n) && !(u && (u.profileLoaded || u.profileFailed)) && !pending[n]; });
      queue.forEach(function (n) { pending[n] = true; });
      function next() {
        var n = queue.shift();
        if (!n) return;
        actions.loadProfile(n).then(next);
      }
      for (var k = 0; k < 4; k++) next();
    };
    /**
     * Checks the correspondent of a new PM with Chatango like BetterChatango does before opening it.
     * @param {string} name Target correspondent.
     * @returns {boolean} True if the request was sent, false if the private connection is not open.
     */
    actions.checkPm = function (name) { return liveBridge.checkPm(name); };
    actions.searchPeople = function (f, more) {
      var cur = stateRef.current.meet, from = more && cur ? cur.next : 0, token = (cur && cur.token || 0) + 1;
      update(function (d) { d.meet = Object.assign({ results: [] }, more ? d.meet : null, { loading: true, error: null, filters: f, token: token }); });
      liveBridge.searchPeople(Object.assign({}, f, { from: from, to: from + 40 })).then(function (names) {
        update(function (d) {
          if (d.meet.token !== token) return;
          var prev = more ? d.meet.results : [];
          var fresh = names.filter(function (n) { return prev.indexOf(n) < 0; });
          fresh.forEach(function (n) { ensureUnseenUser(d, n); });
          d.meet = { results: prev.concat(fresh), next: from + names.length, loading: false, error: null, done: names.length < 40, filters: f, token: token };
        });
      }, function (e) {
        update(function (d) { if (d.meet.token === token) Object.assign(d.meet, { loading: false, error: e && e.message ? e.message : 'The search failed.' }); });
      });
    };
    /**
     * Loads the private messages archived before the oldest loaded message of a conversation.
     * @param {string} name Conversation member.
     */
    actions.loadOlderDm = function (name) {
      var keys = stateRef.current.dms[name].messages.map(function (m) { return m.archiveTs; }).filter(Boolean);
      update(function (d) { Object.assign(d.dms[name], { loadingOlder: true, olderFailed: false }); });
      liveBridge.pmOlder(name, Math.min.apply(null, keys), 50).then(function (page) {
        // An older page changes no unread counter.
        update(function (d) { var c = d.dms[name]; mergePmHistory(c, page.list, pmAuthor(d)); c.olderMore = page.more; c.loadingOlder = false; });
      }, function (e) {
        warn(e);
        update(function (d) { Object.assign(d.dms[name], { loadingOlder: false, olderFailed: true }); });
        toast('Earlier messages could not be loaded.');
      });
    };
    actions.loadMore = function (gid) {
      var result = liveBridge.loadMore(gid);
      // Failure: the bridge announces it and the sentinel stays in place to retry.
      if (result === 'failed') return;
      update(function (d) { var g = d.groups[gid]; if (!g) return; if (result === 'sent') g.loadingMore = true; else g.historyDone = true; });
    };
    actions.toggleUser = function (name, key) {
      var was = !!userOf(stateRef.current, name)[key];
      if (key === 'friend' && !was) {
        if (liveBridge.addFriend(name)) update(function (d) { d.friendAdds[name] = true; });
        return;
      }
      if (key === 'friend' && !liveBridge.removeFriend(name)) return;
      if (key === 'blocked' && !(was ? liveBridge.unblock(name) : liveBridge.block(name))) return;
      if (key === 'ignored' && !liveBridge.setIgnored(name, !was)) { toast('BetterChatango could not save its ignore list. Reload the page and try again.'); return; }
      update(function (d) { ensureLiveUser(d, name)[key] = !was; });
      toast(toggleUserText(name, key, was), { action: { label: 'Undo', run: function () { actions.toggleUser(name, key); } } });
    };
    actions.deleteDm = function (name) {
      liveBridge.clearPmHistory(name);
      actions.closeDm(name);
      update(function (d) { d.dms[name].messages = []; d.dms[name].olderMore = false; });
    };
    actions.removeDmMessage = function (name, m) {
      liveBridge.removePm(name, m).then(function (ok) {
        if (!ok) { toast('This message could not be removed. Reload the page and try again.'); return; }
        dropDmMessage(name, m.id);
        syncPmUnread(pmArchive.current, update, [name]);
      });
    };
    actions.deleteAllDms = function () {
      Object.keys(stateRef.current.dms).forEach(function (n) { liveBridge.clearPmHistory(n); actions.closeDm(n); });
      update(function (d) { Object.keys(d.dms).forEach(function (n) { d.dms[n].messages = []; d.dms[n].olderMore = false; }); });
    };
    actions.checkPmr = function () {
      liveBridge.pmrStatus().then(function (st) { update(function (d) { if (d.auth.loggedIn) d.pmrStatus = st; }); });
    };
    actions.dismissPmr = function () { update(function (d) { d.pmrDismissed = true; }); };
    actions.exportDms = function () { return liveBridge.exportPm(); };
    actions.importDms = function (records) { return liveBridge.importPm(records).then(function (r) { loadPmHistory(true); return r; }); };
    actions.createGroup = function (name, title, desc, listed) {
      return liveBridge.createGroup({ name: name, title: title, description: desc, discovery: listed }).then(function () {
        actions.joinGroup(name);
        return true;
      }, function (e) { toast(e && e.message ? e.message : 'Chatango refused to create the group.'); return false; });
    };
    actions.deleteMessage = function (gid, mid) {
      if (!liveBridge.delivered(mid)) { toast('This message is still being delivered. Try again in a moment.'); return; }
      var m = findMsg(stateRef.current.groups[gid], mid);
      // Like BetterChatango: the original, then each of its edits whose final id Chatango has given.
      [mid].concat((m && m.editIds) || []).filter(liveBridge.delivered).forEach(function (id) { liveBridge.deleteMessage(gid, id); });
    };
    actions.deleteAllFrom = function (gid, name, msg) {
      var g = stateRef.current.groups[gid], m = msg && msg.unid ? msg : g && lastMessageOf(g, name);
      if (!m) { toast('No recent message from ' + name + ' in #' + gid + '.'); return; }
      liveBridge.deleteAllFrom(gid, m);
    };
    actions.ban = function (gid, name, reason, opts) {
      var g = stateRef.current.groups[gid], m = opts && opts.msg && opts.msg.unid ? opts.msg : null;
      // Guests and anons can share a name: they are only banned from the chosen message.
      if (!m && /^[!#]/.test(name)) { toast('Ban guests from one of their messages.'); return false; }
      m = m || (g && lastMessageOf(g, name));
      if (!m) { toast('No recent message from ' + name + ' in #' + gid + '. Chatango bans someone from one of their messages.'); return false; }
      if (!liveBridge.ban(gid, m)) return false;
      if (opts && opts.deleteAll) liveBridge.deleteAllFrom(gid, m);
      return true;
    };
    actions.unban = function (gid, name) {
      var g = stateRef.current.groups[gid], b = g && g.bans.filter(function (x) { return x.name === name; })[0];
      if (!b) { toast(name + ' is not in the ban list.'); return; }
      liveBridge.unban(gid, b);
    };
    actions.unbanEntry = function (gid, b) { liveBridge.unban(gid, b); };
    actions.unbanAll = function (gid) { liveBridge.unbanAll(gid); };
    actions.setClosed = function (gid, closed) { liveBridge.setFlags(gid, closed ? GROUP_FLAG.IS_CLOSED : 0, closed ? 0 : GROUP_FLAG.IS_CLOSED); };
    actions.clearGroup = function (gid) { liveBridge.clearAll(gid); };
    actions.requestGroupSettings = function (gid) { liveBridge.requestSettings(gid); };
    actions.requestBans = function (gid) {
      // The response to the first page replaces the list, even if a next page was awaited.
      groupUpdate(gid, function (g) { g.live.banPage.loading = false; g.live.banSearch = null; });
      liveBridge.banList(gid, 'block', '0');
    };
    actions.requestUnbans = function (gid) { liveBridge.banList(gid, 'unblock', '0'); };
    actions.moreBans = function (gid, kind) {
      var rows = banListOf(stateRef.current.groups[gid], kind).rows, last = rows[rows.length - 1];
      // A row added live has no Chatango timestamp: the page then starts again from the newest.
      if (liveBridge.banList(gid, kind, last && last.ts || '0')) groupUpdate(gid, function (g) { banListOf(g, kind).page.loading = true; });
    };
    actions.searchBans = function (gid, query) {
      if (liveBridge.searchBans(gid, query)) groupUpdate(gid, function (g) { g.live.banSearch = { query: query, status: 'pending', ban: null, code: '' }; });
    };
    actions.clearBanSearch = function (gid) { groupUpdate(gid, function (g) { g.live.banSearch = null; }); };
    actions.saveGroupSettings = function (gid, draft, base) { return saveLiveSettings(stateRef.current.groups[gid], draft, base || stateRef.current.groups[gid].settings); };
  }

  function ensureLiveGroup(d, gid) {
    var g = d.groups[gid];
    if (!g) {
      g = d.groups[gid] = liveGroup(gid, gid);
      g.favorite = (liveBridge.favoriteGroups() || []).indexOf(gid) >= 0;
      g.muted = (liveBridge.mutedGroups() || []).indexOf(gid) >= 0;
      g.hiddenChannels = localRef.current.channels[gid] || [];
    }
    return g;
  }
  function ensureLiveUser(d, name) {
    var u = d.users[name];
    if (!u) {
      u = d.users[name] = { status: 'online', about: '', style: {} };
      if ((liveBridge.ignoredUsers() || []).indexOf(name) >= 0) u.ignored = true;
      if (localRef.current.unstyled.indexOf(name) >= 0) u.unstyled = true;
    }
    return u;
  }
  /**
   * Adds a member the state does not know yet as offline by default while their status is unknown.
   * @param {Object} d State being modified.
   * @param {string} name Target member.
   */
  function ensureUnseenUser(d, name) {
    if (!d.users[name]) ensureLiveUser(d, name).status = 'offline';
  }
  /**
   * Counts as online a member present in a group except a friend whose presence comes from the private connection.
   * @param {Object} d State being modified.
   * @param {string} name Target member.
   */
  function ensurePresentUser(d, name) {
    var u = ensureLiveUser(d, name);
    if (u.status === 'offline' && !u.friend) u.status = 'online';
  }
  /**
   * Applies a presence received from the bridge to a member.
   * @param {Object} u Member in the state.
   * @param {{status: string, lastOn: number, idleSince: number}} x Received presence.
   */
  function applyPresence(u, x) {
    // Before IDLE_DELAY, an idle member stays shown as online: only idleSince keeps the inactivity.
    u.idleSince = x.status === 'idle' ? x.idleSince || u.idleSince || Date.now() : 0;
    u.status = x.status === 'idle' && Date.now() - u.idleSince < IDLE_DELAY ? 'online' : x.status;
    if (x.lastOn) u.lastOn = x.lastOn;
  }
  /**
   * Merges the style of a message into the member's style.
   * @param {Object} u Member in the state.
   * @param {?Object} style Style read in the message.
   * @param {number} ts Message timestamp in milliseconds.
   */
  function mergeStyle(u, style, ts) {
    if (!style || ts <= u.styleTs) return;
    u.style = Object.assign({}, u.style, style);
    u.styleTs = ts;
  }
  function setOwnStyle(style) {
    update(function (d) {
      var u = ensureLiveUser(d, d.me);
      // Merged without mergeStyle: the local clock can lag behind the server timestamp of received messages.
      u.style = Object.assign({}, u.style, style);
      u.styleTs = Math.max(u.styleTs || 0, Date.now());
    });
  }
  /** Translates the Chatango state of a group (flags, moderators, announcement) into the interface model. */
  function deriveLive(g) {
    var L = g.live, F = GROUP_FLAG, f = L.flags, s = g.settings, staff = {};
    if (L.owner) staff[L.owner] = 'owner';
    Object.keys(L.mods).forEach(function (n) { if (n !== L.owner) staff[n] = roleOfFlags(L.mods[n]); });
    s.staff = staff;
    s.modFlags = Object.assign({}, L.mods);
    if (L.owner) delete s.modFlags[L.owner];
    s.media = { links: !(f & F.NOLINKS), images: !(f & F.NOIMAGES), videos: !(f & F.NOVIDEOS) };
    s.automod = Object.assign({}, s.automod, {
      filters: Object.assign({}, s.automod.filters, { nonsense: !!(f & (F.NLP_SINGLEMSG | F.NLP_NGRAM)), nonsenseMode: f & F.NLP_NGRAM ? 'Advanced' : 'Basic', repeat: !!(f & F.NLP_MSGQUEUE) }),
      proxies: !!(f & F.NO_PROXIES),
      slowMode: L.rate,
      banned: L.bw ? { part: L.bw.part, whole: L.bw.whole } : null
    });
    s.announcement = Object.assign({}, s.announcement, { broadcast: !!(f & F.BROADCAST_MODE) },
      L.annc ? { enabled: L.annc.enabled, text: L.annc.text, displayText: L.annc.displayText, embeds: L.annc.embeds, interval: Math.round(L.annc.interval / 60), intervalSec: L.annc.interval } : null);
    g.closed = !!(f & F.IS_CLOSED);
  }
  function withReply(g, m) {
    if (m.replyId) { var o = findMsg(g, m.replyId); m.replyTo = { id: o ? o.id : m.replyId }; }
    delete m.replyId;
    return m;
  }
  function editTarget(g, m) { var o = m.editId ? findMsg(g, m.editId) : null; return o && o.author === m.author ? o : null; }
  /**
   * Applies a group edit to the original while keeping its count and its ids.
   * @param {Object} o Original message.
   * @param {{id: string, text: string, parts: ?Array, embeds: ?Array}} m Edit message.
   * @param {boolean=} keepText True to count the edit without replacing the text.
   */
  function applyGroupEdit(o, m, keepText) {
    o.editCount = (o.editCount || 0) + 1;
    o.editIds = (o.editIds || []).concat([m.id]);
    if (!keepText) applyEdit(o, m);
  }
  /**
   * Folds into an original that arrived after them its edits shown on their own with the newest last.
   * @param {Object} g Group in the state.
   * @param {Object} o Original message, not in the message log yet.
   */
  function mergeEdits(g, o) {
    var edits = g.messages.filter(function (x) { return x.editId === o.id && x.author === o.author; });
    if (!edits.length) return;
    edits.sort(function (a, b) { return a.ts - b.ts; }).forEach(function (e) { applyGroupEdit(o, e); });
    g.messages = g.messages.filter(function (x) { return edits.indexOf(x) < 0; });
  }
  /**
   * Adds a page of bans or unbans to its list.
   * @param {{rows: Array, page: Object}} list List read by banListOf, updated in place.
   * @param {{list: Array, more: boolean}} op Page received from the bridge.
   */
  function receiveBanPage(list, op) {
    // Only the next page requested by Nightango is appended: a BetterChatango reload starts again from the first page.
    var next = list.page.loading, known = {};
    if (!next) list.rows.splice(0);
    list.rows.forEach(function (b) { known[banKey(b)] = true; });
    var fresh = op.list.filter(function (b) { return !known[banKey(b)]; });
    list.rows.push.apply(list.rows, fresh);
    list.page.more = op.more && (!next || fresh.length > 0);
    list.page.loaded = true;
    list.page.loading = false;
  }
  /**
   * Keeps the author's style of each merged private history entry.
   * @param {Object} d State being modified.
   */
  function pmAuthor(d) { return function (x) { mergeStyle(ensureLiveUser(d, x.from), x.style, x.ts); }; }
  /**
   * Merges the BetterChatango private history into the conversations on each OK and after an import without duplicates.
   * @param {boolean=} imported True after an import, which may have added entries older than the loaded ones.
   */
  function loadPmHistory(imported) {
    liveBridge.pmHistory(100).then(function (hist) {
      var names = Object.keys(hist).filter(function (t) { return t !== stateRef.current.me; });
      update(function (d) {
        if (!d.auth.loggedIn) return;
        d.pmLoaded = true;
        d.pmHistoryRev++;
        names.forEach(function (t) {
          ensureLiveUser(d, t);
          var c = pmConversation(d, t, { closed: localRef.current.hidden.indexOf(t) >= 0 });
          // Set on the first OK: on a reconnection, the last 100 entries say nothing about the older pages already loaded. An import, however, can add some.
          if (c.olderMore == null || (imported && hist[t].more)) c.olderMore = hist[t].more;
          mergePmHistory(c, hist[t].list, pmAuthor(d));
        });
      });
      // The conversation open in front of the user becomes read, the others take the unreads from the archive.
      names.forEach(function (t) { if (isDmInView(stateRef.current, t)) readPm(pmArchive.current, update, t); });
      syncPmUnread(pmArchive.current, update, names.filter(function (t) { return !isDmInView(stateRef.current, t); }));
    });
  }
  /**
   * Asks again for the presence of the listed correspondents who are not friends.
   * @param {boolean} ifStale Only when the last request is older than PRESENCE_REFRESH.
   */
  function refreshPmPresence(ifStale) {
    var s0 = stateRef.current;
    // Before the friend list, a friend would get the approximate last online time of presence instead of the exact one of wl.
    if (!s0.pmLoaded || !s0.friendsLoaded || (ifStale && Date.now() - presenceAt.current < PRESENCE_REFRESH)) return;
    // The shown conversation follows its presence through connect, whose last online time is exact.
    var shown = s0.route.view === 'dm' ? s0.route.id : null;
    var names = listedDms(s0).filter(function (n) { return n !== s0.me && n !== shown && !userOf(s0, n).friend; }).slice(0, PRESENCE_MAX);
    if (names.length && liveBridge.refreshPresence(names)) presenceAt.current = Date.now();
  }
  function groupUpdate(gid, fn) { update(function (d) { if (!d.auth.loggedIn) return; var g = d.groups[gid]; if (g) fn(g, d); }); }
  /**
   * Restarts the closed connections with automatic attempts for each one that fails.
   */
  function reconnectClosed() {
    var s0 = stateRef.current, held = s0.session && SESSION_RANK[s0.session.reason] >= SESSION_RANK.kicked;
    if (!s0.auth.loggedIn) return;
    var gids = Object.keys(s0.groups).filter(function (gid) { var g = s0.groups[gid]; return g.joined && g.conn === 'closed'; });
    if (s0.pmConn === 'closed' && !held) gids.push('private_message');
    gids.forEach(function (gid) { stopRetry(gid); retries.current[gid] = { tries: 0, timer: null }; reconnectAuto(gid); });
  }

  // -- Automatic reconnection ---------------------------------------------------
  /**
   * Returns the state of a tracked connection: the private connection or a joined group.
   * @param {Object} s Application state.
   * @param {string} gid Group or private_message.
   * @returns {?string} open, connecting or closed, null for a left or unknown group.
   */
  function connOf(s, gid) {
    if (gid === 'private_message') return s.pmConn || null;
    var g = s.groups[gid];
    return g && g.joined ? g.conn : null;
  }
  /**
   * Tells whether an automatic retry makes sense: visible page, network present, session neither kicked elsewhere, expired nor offline.
   * @param {Object} s Application state.
   */
  function canRetry(s) { return (!s.session || s.session.reason === 'lost') && document.visibilityState === 'visible' && navigator.onLine; }
  /**
   * Restarts a connection without moving the BetterChatango focus when its group is not shown.
   * @param {string} gid Group or private_message.
   */
  function reconnectAuto(gid) {
    var r = stateRef.current.route;
    actions.reconnect(gid, gid !== 'private_message' && !(r.view === 'group' && r.id === gid));
  }
  function stopRetry(gid) {
    var r = retries.current[gid];
    if (r) { clearTimeout(r.timer); delete retries.current[gid]; }
  }
  /**
   * Schedules the next attempt of a lost connection until RECONNECT_DELAYS runs out.
   * @param {string} gid Group or private_message.
   * @param {boolean} fresh True for a connection loss, false after a failed attempt.
   */
  function scheduleRetry(gid, fresh) {
    var prev = retries.current[gid], tries = fresh ? 0 : prev.tries;
    stopRetry(gid);
    if (!canRetry(stateRef.current)) return;
    if (tries >= RECONNECT_DELAYS.length) { liveBridge.note('Stopped reconnecting to ' + liveBridge.connName(gid) + ' after ' + tries + ' attempts'); return; }
    var delay = RECONNECT_DELAYS[tries];
    liveBridge.note('Reconnecting to ' + liveBridge.connName(gid) + ' in ' + delay / 1000 + ' s, attempt ' + (tries + 1) + ' of ' + RECONNECT_DELAYS.length);
    retries.current[gid] = { tries: tries + 1, timer: setTimeout(function () {
      var s0 = stateRef.current, conn = connOf(s0, gid);
      // Attempt already started elsewhere (Reconnect, network back): its failure resumes the sequence.
      if (conn === 'connecting') return;
      if (conn !== 'closed' || !canRetry(s0)) { stopRetry(gid); return; }
      reconnectAuto(gid);
    }, delay) };
  }

  function handleLiveOp(op) {
    switch (op.op) {
      case 'login': {
        var stored = storageGet(skinKey(op.me)) || {}, raw = JSON.stringify(stored);
        var lists = { fav: liveBridge.setFavorite, muted: liveBridge.setMuted, ignored: liveBridge.setIgnored };
        // Lists from before the sync with BetterChatango: moved into its own lists, removed from local storage once all are accepted.
        Object.keys(lists).forEach(function (k) { if (stored[k] && stored[k].map(function (x) { return lists[k](x, true); }).every(Boolean)) delete stored[k]; });
        if (JSON.stringify(stored) !== raw) storageSet(skinKey(op.me), stored);
        localRef.current = Object.assign(blankLocal(), stored);
        update(function (d) {
          Object.assign(d, liveWorld(op.me)); d.ownStyle = localRef.current.style && Object.assign({}, DEFAULT_MESSAGE_STYLE, localRef.current.style); d.auth = { loggedIn: true };
          (liveBridge.ignoredUsers() || []).forEach(function (n) { ensureUnseenUser(d, n); });
          Object.keys(BETTER_CHATANGO_PREFS).forEach(function (path) { var v = liveBridge.setting(BETTER_CHATANGO_PREFS[path]); if (v !== null) setIn(d.prefs, path, v); });
          d.prefs.safety.trustedHosts = liveBridge.trustedHosts();
        });
        // An account with no joined group receives no group frame.
        setTimeout(function () { update(function (d) { d.groupsSeen = true; }); }, 10000);
        break;
      }
      case 'group': {
        update(function (d) {
          if (!d.auth.loggedIn) return;
          var g = ensureLiveGroup(d, op.id);
          d.groupsSeen = true;
          if (op.ready) { g.inited = true; g.membersLoaded = true; }
          if (op.title) { g.title = op.title; g.topic = op.title; }
          // Joining calls renderGroup again with recent: true, so owned never goes back to false.
          if (op.owned) g.owned = true;
          g.joined = !op.hidden;
          if (g.joined && !d.liveFocused && d.route.view === 'discover') { d.liveFocused = true; d.route = { view: 'group', id: op.id, markerTs: Date.now() }; }
        });
        if (!op.hidden && !stateRef.current.liveFocused) setTimeout(function () { var r = stateRef.current.route; if (r.view === 'group' && r.id === op.id) liveBridge.focus(op.id); }, 50);
        break;
      }
      case 'msg': {
        var m = Object.assign({}, op.msg), style = m.style; delete m.style;
        if (m.editId) {
          // Edit: applied to the original if it is loaded, otherwise shown as an edited message that keeps its reference.
          update(function (d) {
            if (!d.auth.loggedIn) return;
            var g = ensureLiveGroup(d, op.gid), u = ensureLiveUser(d, m.author), o = editTarget(g, m);
            mergeStyle(u, style, m.ts);
            if (o) { applyGroupEdit(o, m); return; }
            m.edited = true;
            g.messages.push(withReply(g, m));
          });
          break;
        }
        delete m.editId;
        update(function (d) { if (!d.auth.loggedIn) return; ensureLiveGroup(d, op.gid); mergeStyle(ensureLiveUser(d, m.author), style, m.ts); });
        receiveGroup(op.gid, m);
        break;
      }
      case 'hist': {
        var hm = Object.assign({}, op.msg), hs = hm.style; delete hm.style;
        update(function (d) {
          if (!d.auth.loggedIn) return;
          var g = ensureLiveGroup(d, op.gid), u = ensureLiveUser(d, hm.author);
          mergeStyle(u, hs, hm.ts);
          if (g.messages.some(function (x) { return x.id === hm.id || (x.editIds || []).indexOf(hm.id) >= 0; })) return;
          var o = editTarget(g, hm);
          // History received from newest to oldest: like BetterChatango, an original already edited keeps its text.
          if (o) { applyGroupEdit(o, hm, o.edited); return; }
          if (hm.editId) hm.edited = true;
          else { delete hm.editId; mergeEdits(g, hm); }
          g.messages.push(withReply(g, hm));
          g.messages.sort(function (a, b) { return a.ts - b.ts; });
          trimThread(g);
          logMention(d, op.gid, hm);
        });
        break;
      }
      case 'msgid': groupUpdate(op.gid, function (g, d) {
        g.messages.forEach(function (x) {
          if (x.id === op.tmp) x.id = op.id;
          if (x.replyTo && x.replyTo.id === op.tmp) x.replyTo.id = op.id;
          if (x.editIds) x.editIds = x.editIds.map(function (id) { return id === op.tmp ? op.id : id; });
        });
        d.mentionLog.forEach(function (x) { if (x.gid === op.gid && x.id === op.tmp) x.id = op.id; });
      }); break;
      case 'del': groupUpdate(op.gid, function (g, d) {
        // An edit shown on its own disappears with its original, even when the original is not loaded.
        g.messages = g.messages.filter(function (x) { return !(x.editId && op.ids.indexOf(x.editId) >= 0); });
        g.messages.forEach(function (x) { if (op.ids.indexOf(x.id) >= 0) x.deleted = { by: 'staff' }; });
        dropMentions(d, op.gid, op.ids);
      }); break;
      case 'cleared': groupUpdate(op.gid, function (g, d) {
        g.messages = [{ id: uid(), kind: 'system', text: 'All messages in #' + g.id + ' were cleared.', ts: Date.now() }];
        dropMentions(d, op.gid, null);
      }); break;
      case 'members': groupUpdate(op.gid, function (g, d) {
        var list = op.names.slice(); if (list.indexOf(d.me) < 0) list.push(d.me);
        g.members = list; g.membersLoaded = true;
        list.forEach(function (n) { ensurePresentUser(d, n); });
      }); break;
      case 'guests': groupUpdate(op.gid, function (g, d) {
        g.guestNames = op.names; g.guests = op.anons;
        op.names.forEach(function (n) { ensurePresentUser(d, n); });
      }); break;
      case 'member': groupUpdate(op.gid, function (g, d) {
        if (op.action === 1 && g.members.indexOf(op.name) < 0) { g.members.push(op.name); ensurePresentUser(d, op.name); }
        if (op.action === 0 && op.name !== d.me) g.members = g.members.filter(function (n) { return n !== op.name; });
      }); break;
      case 'count': groupUpdate(op.gid, function (g) { g.liveCount = op.n; }); break;
      case 'room': update(function (d) {
        if (!d.auth.loggedIn) return;
        var g = ensureLiveGroup(d, op.gid);
        g.live.owner = op.owner; g.live.mods = op.mods; g.live.flags = op.flags;
        deriveLive(g);
      }); break;
      case 'mods': groupUpdate(op.gid, function (g) { g.live.mods = op.mods; deriveLive(g); }); break;
      case 'flags': groupUpdate(op.gid, function (g) { g.live.flags = op.flags; deriveLive(g); }); break;
      case 'inited':
        groupUpdate(op.gid, function (g) { g.inited = true; });
        break;
      case 'info': groupUpdate(op.gid, function (g) {
        if (op.title) { g.title = op.title; g.topic = op.description && op.description !== 'No description' ? op.description : op.title; }
        g.settings.overview.title = op.title || g.settings.overview.title;
        g.settings.overview.description = op.description && op.description !== 'No description' ? op.description : '';
      }); break;
      case 'denied': groupUpdate(op.gid, function (g) { g.inited = true; g.membersLoaded = true; }); break;
      case 'histEnd': groupUpdate(op.gid, function (g) { g.historyDone = true; g.loadingMore = false; }); break;
      case 'moreLoaded': groupUpdate(op.gid, function (g) { g.loadingMore = false; }); break;
      case 'annc': groupUpdate(op.gid, function (g) { g.live.annc = { mode: op.mode, enabled: op.enabled, interval: op.interval, text: op.text, displayText: op.displayText, embeds: op.embeds, prefix: op.prefix || '' }; deriveLive(g); }); break;
      case 'anncPost': if (op.text || op.embeds.length) groupUpdate(op.gid, function (g) { g.messages.push({ id: uid(), kind: 'system', annc: true, text: 'Announcement: ' + op.text, embeds: op.embeds, ts: Date.now() }); }); break;
      case 'bw': groupUpdate(op.gid, function (g) { g.live.bw = { part: op.part, whole: op.whole }; deriveLive(g); }); break;
      case 'rate': groupUpdate(op.gid, function (g) { g.live.rate = op.seconds; deriveLive(g); }); break;
      case 'bans': groupUpdate(op.gid, function (g) { receiveBanPage(banListOf(g, op.kind), op); }); break;
      case 'banned': {
        var mine = op.ban.by === stateRef.current.me;
        groupUpdate(op.gid, function (g) {
          if (!g.bans.some(function (b) { return b.unid === op.ban.unid && b.ip === op.ban.ip; })) g.bans.unshift(op.ban);
          g.messages.push({ id: uid(), kind: 'ban', user: op.ban.name, ts: Date.now() });
        });
        if (mine) toast(op.ban.name + ' was banned from #' + op.gid + '.', { action: { label: 'Undo', run: function () { liveBridge.unban(op.gid, op.ban); } } });
        break;
      }
      case 'unbanned': groupUpdate(op.gid, function (g) {
        function gone(b) { return op.list.some(function (x) { return x.unid === b.unid && x.ip === b.ip; }); }
        g.bans = g.bans.filter(function (b) { return !gone(b); });
        var s = g.live.banSearch;
        if (s && s.ban && gone(s.ban)) s.ban = null;
        if (g.live.unbanPage.loaded) g.live.unbans = op.list.concat(g.live.unbans.filter(function (b) { return !gone(b); }));
      }); break;
      // A response that arrives after the timeout stays valid, but not after Clear search.
      case 'banSearch': groupUpdate(op.gid, function (g) { var s = g.live.banSearch; if (s) { s.status = 'done'; s.ban = op.ban; } }); break;
      case 'banSearchRefused': groupUpdate(op.gid, function (g) { var s = g.live.banSearch; if (s) { s.status = 'refused'; s.code = op.code; } }); break;
      case 'banSearchTimeout': groupUpdate(op.gid, function (g) { var s = g.live.banSearch; if (s && s.status === 'pending') s.status = 'timeout'; }); break;
      // BetterChatango only logs allunblocked: the unban list is requested again the next time it is shown.
      case 'unbannedAll': groupUpdate(op.gid, function (g) { g.bans = []; g.live.banPage.more = false; g.live.unbans = []; g.live.unbanPage = blankBanPage(); }); break;
      case 'modlog': groupUpdate(op.gid, function (g) {
        var known = {}, list = (g.live.modlog || []).slice();
        list.forEach(function (x) { known[x.id] = true; });
        op.list.forEach(function (x) { if (!known[x.id]) list.push(x); });
        list.sort(function (a, b) { return b.at - a.at; });
        g.live.modlog = list;
      }); break;
      case 'conn':
        // Only an open connection that closes starts the sequence: a failure at startup or a left group does not.
        var was = connOf(stateRef.current, op.gid);
        if (op.state === 'open') stopRetry(op.gid);
        else if (op.state === 'closed' && (was === 'open' || was === 'connecting' && retries.current[op.gid])) scheduleRetry(op.gid, was === 'open');
        update(function (d) {
          if (op.gid === 'private_message') d.pmConn = op.state;
          if (!d.auth.loggedIn) return;
          var g = d.groups[op.gid];
          // A pending history request gets no response on a closed socket.
          if (g && g.joined) { g.conn = op.state; if (op.state !== 'open') { g.loadingMore = false; g.live.banPage.loading = false; g.live.unbanPage.loading = false; } }
          d.session = sessionAfterConn(d, op);
        }); break;
      case 'session': update(function (d) {
        if (!d.session || SESSION_RANK[op.reason] >= SESSION_RANK[d.session.reason]) d.session = { reason: op.reason, attempts: 0 };
      }); break;
      case 'visible': if (navigator.onLine) reconnectClosed(); refreshPmPresence(true); break;
      case 'online':
        reconnectClosed();
        update(function (d) {
          if (!d.auth.loggedIn) return;
          var open = d.pmConn === 'open' || Object.keys(d.groups).some(function (k) { return d.groups[k].joined && d.groups[k].conn === 'open'; });
          // Short loss: the sockets that stayed open do not change state, no conn frame would lift the overlay.
          if (d.session && d.session.reason === 'offline' && open) d.session = null;
        });
        break;
      // BetterChatango addresses its notices to the group it believes is open: a toast avoids writing them in the wrong message log.
      case 'notice': toast(op.text, { icon: 'info' }); break;
      case 'alert': if (!stateRef.current.session) toast(op.text, op.button && op.action ? { icon: 'info', action: { label: op.button, run: op.action } } : { icon: 'info' }); break;
      case 'pm': {
        var s0 = stateRef.current;
        var focused = isDmInView(s0, op.from);
        // Like in BetterChatango, the PM of an ignored member is received and archived without an alert.
        var ignored = !!userOf(s0, op.from).ignored;
        var edit = !!(s0.dms[op.from] && pmEditTarget(s0.dms[op.from], op));
        update(function (d) {
          if (!d.auth.loggedIn) return;
          mergeStyle(ensureLiveUser(d, op.from), op.style, op.ts);
          receivePm(d, op);
        });
        pmArchive.current.record(op.from, op, true);
        // Read created after the current stack: BetterChatango archives a received PM only after pm is emitted.
        if (focused) readPm(pmArchive.current, update, op.from); else syncPmUnread(pmArchive.current, update, [op.from]);
        if (edit) break;
        if (!focused && !op.offline && !ignored) notify('pm', { toast: s0.prefs.pmPreview ? op.from + ': ' + messagePreview(op) : 'New message from ' + op.from, icon: 'message', action: { label: 'Reply', run: function () { nav({ view: 'dm', id: op.from }); } } });
        // msgoff frames arrive in a burst right after the connection: a single notification for the whole burst.
        if (op.offline && !ignored && !offlineCount.current++) setTimeout(function () {
          var n = offlineCount.current;
          offlineCount.current = 0;
          notify('pm', { toast: plural(n, 'message', 'messages') + ' received while you were away.', icon: 'message', action: { label: 'Open', run: function () { nav({ view: 'dm', id: null }); } } });
        }, 1500);
        break;
      }
      case 'pmReady':
        liveBridge.pmArchived().then(function (saved) {
          if (!saved && !stateRef.current.pmUnsaved) {
            pmArchive.current = memoryPmArchive();
            update(function (d) { d.pmUnsaved = true; });
            if (JOURNAL) JOURNAL.add('app', 'Private message history is not available in this browser');
          }
          loadPmHistory();
        });
        actions.checkPmr();
        break;
      case 'friends':
        update(function (d) {
          if (!op.added) d.friendsLoaded = true;
          op.list.forEach(function (f) { var u = ensureLiveUser(d, f.name); u.friend = true; applyPresence(u, f); delete d.friendAdds[f.name]; });
        });
        break;
      case 'friendTimeout':
        if (!stateRef.current.friendAdds[op.name]) break;
        update(function (d) { delete d.friendAdds[op.name]; });
        toast("Chatango didn't confirm adding " + op.name + ' to friends.');
        break;
      case 'friendRefused':
        update(function (d) { delete d.friendAdds[op.name]; });
        toast(unknownUserText(op.name), { icon: 'info' });
        break;
      case 'pmChecked': {
        update(function (d) { d.pmChecked = { name: op.name, found: !!op.found, timeout: !!op.timeout, ts: Date.now() }; });
        if (!op.found && !op.timeout && !op.asked && stateRef.current.dms[op.name]) toast(unknownUserText(op.name), { icon: 'info' });
        break;
      }
      case 'unfriend': update(function (d) { if (d.users[op.name]) d.users[op.name].friend = false; }); break;
      case 'presence': {
        var before = stateRef.current.users[op.name];
        var status = op.keepIdle && before && before.idleSince ? 'idle' : op.status;
        update(function (d) {
          var u = ensureLiveUser(d, op.name);
          applyPresence(u, { status: status, lastOn: op.lastOn });
          if (status === 'offline' && !op.lastOn && before && before.status !== 'offline') u.lastOn = Date.now();
        });
        if (before && before.friend && before.status !== status) {
          var openDm = { label: 'Message', run: function () { actions.openDm(op.name); } };
          if (status === 'online' && before.status === 'offline') {
            if (isNotifyingOnline(stateRef.current, op.name)) toast(op.name + ' is online.', { icon: 'users', action: openDm });
            else notify('friendOn', { toast: op.name + ' is online.', icon: 'users', action: openDm });
          } else if (status === 'offline') notify('friendOff', { toast: op.name + ' went offline.', icon: 'users' });
        }
        break;
      }
      case 'pmBlocked': update(function (d) {
        Object.keys(d.users).forEach(function (n) { if (d.users[n].blocked && op.list.indexOf(n) < 0) d.users[n].blocked = false; });
        op.list.forEach(function (n) { ensureLiveUser(d, n).blocked = true; });
      }); break;
      case 'msgBgStale': update(function (d) { if (d.users[op.name]) delete d.users[op.name].msgBg; }); break;
      case 'people': update(function (d) { op.list.forEach(function (x) { applyPresence(ensureLiveUser(d, x.name), x); }); }); break;
      case 'pmUnblocked': update(function (d) { if (d.users[op.name]) d.users[op.name].blocked = false; }); break;
      default: break;
    }
  }
  /* Closed conversations, hidden channels, members with a hidden style and own style, kept by account in this browser */
  useEffect(function () {
    if (!LIVE || !state.auth.loggedIn || !state.me) return;
    var prev = localRef.current, o = blankLocal();
    o.style = state.ownStyle;
    // Local favorites, mutes and ignored members that BetterChatango has not accepted yet: kept for the next sign-in.
    o.fav = prev.fav;
    o.muted = prev.muted;
    o.ignored = prev.ignored;
    prev.hidden.forEach(function (n) { if (!state.dms[n]) o.hidden.push(n); });
    Object.keys(state.dms).forEach(function (n) { if (state.dms[n].closed) o.hidden.push(n); });
    Object.keys(prev.channels).forEach(function (k) { if (!state.groups[k]) o.channels[k] = prev.channels[k]; });
    Object.keys(state.groups).forEach(function (k) { if (state.groups[k].hiddenChannels.length) o.channels[k] = state.groups[k].hiddenChannels; });
    prev.unstyled.forEach(function (n) { if (!state.users[n]) o.unstyled.push(n); });
    Object.keys(state.users).forEach(function (n) { if (state.users[n].unstyled) o.unstyled.push(n); });
    // Merged with the storage: the bridge also sets the unread migration flag there.
    if (JSON.stringify(o) !== JSON.stringify(prev)) { localRef.current = o; storageMerge(skinKey(state.me), o); }
  });
  useEffect(function () { if (LIVE && liveBridge) return liveBridge.onOp(handleLiveOp); }, []);
  useEffect(function () { if (LIVE && state.pmHistoryRev) refreshPmPresence(false); }, [state.pmHistoryRev, state.friendsLoaded]);
  useEffect(function () {
    if (!LIVE || !state.auth.loggedIn) return;
    var timer = setInterval(function () { if (document.visibilityState === 'visible') refreshPmPresence(true); }, MIN);
    return function () { clearInterval(timer); };
  }, [state.auth.loggedIn]);

  var ui = {
    toast: toast,
    confirm: setConfirm,
    openProfile: function (name, gid) { setProfile({ name: name, gid: gid }); },
    openFullProfile: function (name) { setFullProfile(name); },
    openWho: setWho,
    openLink: setLinkUrl,
    openProfileLink: setProfileLink,
    openPalette: function () { setPalette(true); setNavOpen(false); },
    openCreate: function (prefill) { setCreate({ prefill: prefill || '' }); setNavOpen(false); },
    openNewDm: function () { setNewDm(true); setNavOpen(false); },
    ban: function (name, gid, msg) { setBan({ name: name, gid: gid, msg: msg || null }); },
    openNav: function () { setNavOpen(true); },
    closeNav: function () { setNavOpen(false); }
  };
  var app = { state: state, update: update, nav: nav, actions: actions, ui: ui, navOpen: navOpen, uploads: uploads, theme: resolvedTheme(prefs, VIEWER_THEME) };

  return h(Ctx.Provider, { value: app },
    state.auth.loggedIn ? h(Shell, null) : LIVE ? null : h(Login, null),
    state.auth.loggedIn && profile ? h(ProfileDialog, { name: profile.name, gid: profile.gid, onClose: function () { setProfile(null); } }) : null,
    state.auth.loggedIn && banCfg ? h(BanDialog, { name: banCfg.name, gid: banCfg.gid, msg: banCfg.msg, onClose: function () { setBan(null); } }) : null,
    state.auth.loggedIn && fullProfile ? h(FullProfileDialog, { name: fullProfile, onClose: function () { setFullProfile(null); } }) : null,
    state.auth.loggedIn && who ? h(WhoDialog, { key: who, name: who, onClose: function () { setWho(null); }, onDone: function () { setWho(null); setProfile(null); } }) : null,
    linkUrl ? h(LinkDialog, { url: linkUrl, onClose: function () { setLinkUrl(null); } }) : null,
    profileLink ? h(ProfileLinkDialog, { link: profileLink, onClose: function () { setProfileLink(null); } }) : null,
    state.auth.loggedIn && palette ? h(Palette, { onClose: function () { setPalette(false); } }) : null,
    state.auth.loggedIn && create ? h(CreateGroupDialog, { prefill: create.prefill, onClose: function () { setCreate(null); } }) : null,
    state.auth.loggedIn && newDm ? h(NewDmDialog, { onClose: function () { setNewDm(false); } }) : null,
    confirmCfg ? h(ConfirmDialog, { confirm: confirmCfg, onClose: function () { setConfirm(null); } }) : null,
    state.auth.loggedIn && state.session ? h(SessionOverlay, { session: state.session }) : null,
    h(Toasts, { toasts: toasts, dismiss: dismissToast }));
}
