/* ---------- Root ---------- */
var IDLE_DELAY = 3 * MIN;
var RELEASES_URL = REPO_URL + '/releases/';

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

/**
 * Application state, with a ref that handlers read and an update that clones it.
 * @param {?Object} boot State handed by the prototype hook.
 * @returns {{state: Object, stateRef: Object, update: function(function(Object))}} State of this render, its ref and its update.
 */
function useAppState(boot) {
  var st = useState(function () { return boot && boot.auth ? boot : initialState(); }), state = st[0], setState = st[1];
  var stateRef = useRef(state); stateRef.current = state;
  var update = useCallback(function (fn) { setState(function (prev) { var d = JSON.parse(JSON.stringify(prev)); fn(d); return d; }); }, []);
  /*PROTOTYPE*/
  useEffect(function () {
    var hot = window.claude && window.claude.hot;
    if (hot && hot.snapshot) hot.snapshot(function () { return { state: stateRef.current }; });
  }, []);
  /*END PROTOTYPE*/
  return { state: state, stateRef: stateRef, update: update };
}

/**
 * Applies the theme, accent and display preferences to the root, keeps the preferences in this browser and follows the system theme.
 * @param {Object} prefs Preferences.
 */
function useDisplayPrefs(prefs) {
  var rerender = useState(0)[1];
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
    function onChange() { rerender(function (n) { return n + 1; }); }
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    return function () { if (mq.removeEventListener) mq.removeEventListener('change', onChange); };
  }, []);
}

/**
 * Switches to idle the members inactive for IDLE_DELAY.
 * @param {?Object} users Members of the state.
 * @param {Function} update State update.
 */
function useIdleStatus(users, update) {
  useEffect(function () {
    if (!users) return;
    var next = Infinity;
    Object.keys(users).forEach(function (n) { var u = users[n]; if (u.idleSince && u.status === 'online') next = Math.min(next, u.idleSince + IDLE_DELAY); });
    if (next === Infinity) return;
    var timer = setTimeout(function () {
      update(function (d) { Object.keys(d.users).forEach(function (n) { var u = d.users[n]; if (u.idleSince && u.status === 'online' && Date.now() - u.idleSince >= IDLE_DELAY) u.status = 'idle'; }); });
    }, Math.max(0, next - Date.now()));
    return function () { clearTimeout(timer); };
  }, [users]);
}

/**
 * Shows the unread count and the account in the tab title.
 * @param {Object} state Application state.
 */
function useTabTitle(state) {
  useEffect(function () {
    if (!state.auth.loggedIn) { document.title = 'Nightango'; return; }
    var n = unreadDmCount(state);
    Object.keys(state.groups).forEach(function (k) { n += state.groups[k].mentions || 0; });
    document.title = (state.prefs.tabTitle && n ? '(' + n + ') ' : '') + (state.prefs.privacy.usernameInTitle ? state.me + ' | ' : '') + 'Nightango';
  });
}

/**
 * Opens the command palette with Ctrl K or Cmd K once signed in.
 * @param {Object} stateRef Ref to the application state.
 * @param {function(boolean)} setPalette Opens the palette.
 */
function useShortcuts(stateRef, setPalette) {
  useEffect(function () {
    function onKey(e) {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K') && stateRef.current.auth.loggedIn) { e.preventDefault(); setPalette(true); }
    }
    document.addEventListener('keydown', onKey);
    return function () { document.removeEventListener('keydown', onKey); };
  }, []);
}

/**
 * Checks for a newer release once per page at sign-in and offers its download.
 * @param {boolean} loggedIn Signed in.
 * @param {Function} toast Shows a notification.
 */
function useUpdateCheck(loggedIn, toast) {
  var updateChecked = useRef(false);
  useEffect(function () {
    if (!LIVE || !loggedIn || updateChecked.current) return;
    updateChecked.current = true;
    fetchLatestVersion().then(function (v) {
      if (v && isNewerVersion(v, APP_VERSION)) toast('Nightango ' + v + ' is available.', { icon: 'info', action: { label: 'Download', run: function () { window.open(RELEASES_URL + 'tag/v' + v, '_blank', 'noopener'); } } });
    }).catch(function () { if (JOURNAL) JOURNAL.add('app', 'Update check failed'); });
  }, [loggedIn]);
}

function Root(props) {
  var store = useAppState(props.boot), state = store.state, stateRef = store.stateRef, update = store.update;
  // Composer drafts by conversation, in memory only: a reload, which is also how live signs out, drops every draft.
  var drafts = useRef({});
  var o = useOverlays(), toast = o.toast, setNavOpen = o.setNavOpen;
  var inbox = useInbox(stateRef, update, toast, setNavOpen), pmArchive = inbox.pmArchive, nav = inbox.nav, notify = inbox.notify, receiveGroup = inbox.receiveGroup, receiveDm = inbox.receiveDm;
  var prefs = state.prefs;
  useDisplayPrefs(prefs);
  useIdleStatus(state.users, update);
  useTabTitle(state);
  useShortcuts(stateRef, o.setPalette);
  useUpdateCheck(state.auth.loggedIn, toast);
  var local = useLocalStore(state), localRef = local.ref;
  var reconnection = useReconnection(stateRef, update);
  var pms = useLivePms(store, localRef, pmArchive);
  var act = useActions({ store: store, toast: toast, setNavOpen: setNavOpen, inbox: inbox, drafts: drafts, localRef: localRef, reconnection: reconnection, pms: pms }), actions = act.actions;
  useSimulation(store, inbox, toast, actions);

  // Name checked by New private message: its refusal shows in the dialog, not as a toast.
  var offlineCount = useRef(0);
  function handleLiveOp(op) {
    switch (op.op) {
      case 'login': {
        local.restore(op.me);
        // BetterChatango's "Mentioned in #g" title would come back 5 s later without the Nightango counter.
        if (liveBridge.setting('tabTitleAlerts')) liveBridge.setSetting('tabTitleAlerts', false);
        update(function (d) {
          Object.assign(d, liveWorld(op.me)); d.ownStyle = localRef.current.style && Object.assign({}, DEFAULT_MESSAGE_STYLE, localRef.current.style); d.auth = { loggedIn: true };
          (liveBridge.ignoredUsers() || []).forEach(function (n) { ensureUnseenUser(d, n, localRef.current); });
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
          var g = ensureLiveGroup(d, op.id, localRef.current);
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
            var g = ensureLiveGroup(d, op.gid, localRef.current), u = ensureLiveUser(d, m.author, localRef.current), o = editTarget(g, m);
            mergeStyle(u, style, m.ts);
            if (o) { applyGroupEdit(o, m); return; }
            m.edited = true;
            g.messages.push(withReply(g, m));
          });
          break;
        }
        delete m.editId;
        update(function (d) { if (!d.auth.loggedIn) return; ensureLiveGroup(d, op.gid, localRef.current); mergeStyle(ensureLiveUser(d, m.author, localRef.current), style, m.ts); });
        receiveGroup(op.gid, m);
        break;
      }
      case 'hist': {
        var hm = Object.assign({}, op.msg), hs = hm.style; delete hm.style;
        update(function (d) {
          if (!d.auth.loggedIn) return;
          var g = ensureLiveGroup(d, op.gid, localRef.current), u = ensureLiveUser(d, hm.author, localRef.current);
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
      case 'msgid': groupUpdate(update, op.gid, function (g, d) {
        g.messages.forEach(function (x) {
          if (x.id === op.tmp) x.id = op.id;
          if (x.replyTo && x.replyTo.id === op.tmp) x.replyTo.id = op.id;
          if (x.editIds) x.editIds = x.editIds.map(function (id) { return id === op.tmp ? op.id : id; });
        });
        d.mentionLog.forEach(function (x) { if (x.gid === op.gid && x.id === op.tmp) x.id = op.id; });
      }); break;
      case 'del': groupUpdate(update, op.gid, function (g, d) {
        // An edit shown on its own disappears with its original, even when the original is not loaded.
        g.messages = g.messages.filter(function (x) { return !(x.editId && op.ids.indexOf(x.editId) >= 0); });
        g.messages.forEach(function (x) { if (op.ids.indexOf(x.id) >= 0) x.deleted = { by: 'staff' }; });
        dropMentions(d, op.gid, op.ids);
      }); break;
      case 'cleared': groupUpdate(update, op.gid, function (g, d) {
        g.messages = [{ id: uid(), kind: 'system', text: 'All messages in #' + g.id + ' were cleared.', ts: Date.now() }];
        dropMentions(d, op.gid, null);
      }); break;
      case 'members': groupUpdate(update, op.gid, function (g, d) {
        var list = op.names.slice(); if (list.indexOf(d.me) < 0) list.push(d.me);
        g.members = list; g.membersLoaded = true;
        list.forEach(function (n) { ensurePresentUser(d, n, localRef.current); });
      }); break;
      case 'guests': groupUpdate(update, op.gid, function (g, d) {
        g.guestNames = op.names; g.guests = op.anons;
        op.names.forEach(function (n) { ensurePresentUser(d, n, localRef.current); });
      }); break;
      case 'member': groupUpdate(update, op.gid, function (g, d) {
        if (op.action === 1 && g.members.indexOf(op.name) < 0) { g.members.push(op.name); ensurePresentUser(d, op.name, localRef.current); }
        if (op.action === 0 && op.name !== d.me) g.members = g.members.filter(function (n) { return n !== op.name; });
      }); break;
      case 'count': groupUpdate(update, op.gid, function (g) { g.liveCount = op.n; }); break;
      case 'room': update(function (d) {
        if (!d.auth.loggedIn) return;
        var g = ensureLiveGroup(d, op.gid, localRef.current);
        g.live.owner = op.owner; g.live.mods = op.mods; g.live.flags = op.flags;
        deriveLive(g);
      }); break;
      case 'mods': groupUpdate(update, op.gid, function (g) { g.live.mods = op.mods; deriveLive(g); }); break;
      case 'flags': groupUpdate(update, op.gid, function (g) { g.live.flags = op.flags; deriveLive(g); }); break;
      case 'inited':
        groupUpdate(update, op.gid, function (g) { g.inited = true; });
        break;
      case 'info': groupUpdate(update, op.gid, function (g) {
        if (op.title) { g.title = op.title; g.topic = op.description && op.description !== 'No description' ? op.description : op.title; }
        g.settings.overview.title = op.title || g.settings.overview.title;
        g.settings.overview.description = op.description && op.description !== 'No description' ? op.description : '';
      }); break;
      case 'denied': groupUpdate(update, op.gid, function (g) { g.inited = true; g.membersLoaded = true; }); break;
      case 'histEnd': groupUpdate(update, op.gid, function (g) { g.historyDone = true; g.loadingMore = false; }); break;
      case 'moreLoaded': groupUpdate(update, op.gid, function (g) { g.loadingMore = false; }); break;
      case 'annc': groupUpdate(update, op.gid, function (g) { g.live.annc = { mode: op.mode, enabled: op.enabled, interval: op.interval, text: op.text, displayText: op.displayText, embeds: op.embeds, prefix: op.prefix || '' }; deriveLive(g); }); break;
      case 'anncPost': if (op.text || op.embeds.length) groupUpdate(update, op.gid, function (g) { g.messages.push({ id: uid(), kind: 'system', annc: true, text: 'Announcement: ' + op.text, embeds: op.embeds, ts: Date.now() }); }); break;
      case 'bw': groupUpdate(update, op.gid, function (g) { g.live.bw = { part: op.part, whole: op.whole }; deriveLive(g); }); break;
      case 'rate': groupUpdate(update, op.gid, function (g) { g.live.rate = op.seconds; deriveLive(g); }); break;
      case 'bans': groupUpdate(update, op.gid, function (g) { receiveBanPage(banListOf(g, op.kind), op); }); break;
      case 'banned': {
        var mine = op.ban.by === stateRef.current.me;
        groupUpdate(update, op.gid, function (g) {
          if (!g.bans.some(function (b) { return b.unid === op.ban.unid && b.ip === op.ban.ip; })) g.bans.unshift(op.ban);
          g.messages.push({ id: uid(), kind: 'ban', user: op.ban.name, ts: Date.now() });
        });
        if (mine) toast(op.ban.name + ' was banned from #' + op.gid + '.', { action: { label: 'Undo', run: function () { liveBridge.unban(op.gid, op.ban); } } });
        break;
      }
      case 'unbanned': groupUpdate(update, op.gid, function (g) {
        function gone(b) { return op.list.some(function (x) { return x.unid === b.unid && x.ip === b.ip; }); }
        g.bans = g.bans.filter(function (b) { return !gone(b); });
        var s = g.live.banSearch;
        if (s && s.ban && gone(s.ban)) s.ban = null;
        if (g.live.unbanPage.loaded) g.live.unbans = op.list.concat(g.live.unbans.filter(function (b) { return !gone(b); }));
      }); break;
      // A response that arrives after the timeout stays valid, but not after Clear search.
      case 'banSearch': groupUpdate(update, op.gid, function (g) { var s = g.live.banSearch; if (s) { s.status = 'done'; s.ban = op.ban; } }); break;
      case 'banSearchRefused': groupUpdate(update, op.gid, function (g) { var s = g.live.banSearch; if (s) { s.status = 'refused'; s.code = op.code; } }); break;
      case 'banSearchTimeout': groupUpdate(update, op.gid, function (g) { var s = g.live.banSearch; if (s && s.status === 'pending') s.status = 'timeout'; }); break;
      // BetterChatango only logs allunblocked: the unban list is requested again the next time it is shown.
      case 'unbannedAll': groupUpdate(update, op.gid, function (g) { g.bans = []; g.live.banPage.more = false; g.live.unbans = []; g.live.unbanPage = blankBanPage(); }); break;
      case 'modlog': groupUpdate(update, op.gid, function (g) {
        var known = {}, list = (g.live.modlog || []).slice();
        list.forEach(function (x) { known[x.id] = true; });
        op.list.forEach(function (x) { if (!known[x.id]) list.push(x); });
        list.sort(function (a, b) { return b.at - a.at; });
        g.live.modlog = list;
      }); break;
      case 'conn':
        reconnection.follow(op);
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
      case 'visible': if (navigator.onLine) reconnection.reconnectClosed(); pms.refreshPresence(true); break;
      case 'online':
        reconnection.reconnectClosed();
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
          mergeStyle(ensureLiveUser(d, op.from, localRef.current), op.style, op.ts);
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
          pms.loadHistory();
        });
        actions.checkPmr();
        break;
      case 'friends':
        update(function (d) {
          if (!op.added) d.friendsLoaded = true;
          op.list.forEach(function (f) { var u = ensureLiveUser(d, f.name, localRef.current); u.friend = true; applyPresence(u, f); delete d.friendAdds[f.name]; });
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
          var u = ensureLiveUser(d, op.name, localRef.current);
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
        op.list.forEach(function (n) { ensureLiveUser(d, n, localRef.current).blocked = true; });
      }); break;
      case 'msgBgStale': update(function (d) { if (d.users[op.name]) delete d.users[op.name].msgBg; }); break;
      case 'people': update(function (d) { op.list.forEach(function (x) { applyPresence(ensureLiveUser(d, x.name, localRef.current), x); }); }); break;
      case 'pmUnblocked': update(function (d) { if (d.users[op.name]) d.users[op.name].blocked = false; }); break;
      default: break;
    }
  }
  useBridgeOps(handleLiveOp, state.auth.loggedIn);

  var app = { state: state, update: update, nav: nav, actions: actions, ui: o.ui, navOpen: o.navOpen, uploads: act.uploads, drafts: drafts, theme: resolvedTheme(prefs, VIEWER_THEME) };

  return h(Layers, null, h(Ctx.Provider, { value: app },
    state.auth.loggedIn ? h(Shell, null) : LIVE ? null : h(Login, null),
    state.auth.loggedIn && o.profile ? h(ProfileDialog, { name: o.profile.name, gid: o.profile.gid, onClose: function () { o.setProfile(null); } }) : null,
    state.auth.loggedIn && o.banCfg ? h(BanDialog, { name: o.banCfg.name, gid: o.banCfg.gid, msg: o.banCfg.msg, onClose: function () { o.setBan(null); } }) : null,
    state.auth.loggedIn && o.fullProfile ? h(FullProfileDialog, { name: o.fullProfile, onClose: function () { o.setFullProfile(null); } }) : null,
    state.auth.loggedIn && o.who ? h(WhoDialog, { key: o.who, name: o.who, onClose: function () { o.setWho(null); }, onDone: function () { o.setWho(null); o.setProfile(null); } }) : null,
    o.linkUrl ? h(LinkDialog, { url: o.linkUrl, onClose: function () { o.setLinkUrl(null); } }) : null,
    o.profileLink ? h(ProfileLinkDialog, { link: o.profileLink, onClose: function () { o.setProfileLink(null); } }) : null,
    state.auth.loggedIn && o.palette ? h(Palette, { onClose: function () { o.setPalette(false); } }) : null,
    state.auth.loggedIn && o.create ? h(CreateGroupDialog, { prefill: o.create.prefill, onClose: function () { o.setCreate(null); } }) : null,
    state.auth.loggedIn && o.newDm ? h(NewDmDialog, { onClose: function () { o.setNewDm(false); } }) : null,
    o.confirmCfg ? h(ConfirmDialog, { confirm: o.confirmCfg, onClose: function () { o.setConfirm(null); } }) : null,
    state.auth.loggedIn && state.session ? h(SessionOverlay, { session: state.session }) : null,
    h(Toasts, { toasts: o.toasts, dismiss: o.dismissToast })));
}
