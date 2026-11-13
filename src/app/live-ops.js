/* ---------- Live operations: what the bridge emits, applied to the state ---------- */
/**
 * Hands each bridge operation to the handler of the latest render.
 * The operations received after login wait for its first render: until then they would read the signed-out state, without groups, users or route.
 * @param {function(Object)} handle Handler of this render.
 * @param {boolean} loggedIn The state of this render is signed in.
 */
function useBridgeOps(handle, loggedIn) {
  var latest = useRef(handle), held = useRef(null);
  latest.current = handle;
  useEffect(function () {
    if (!LIVE || !liveBridge) return;
    return liveBridge.onOp(function (op) {
      if (held.current) { held.current.push(op); return; }
      latest.current(op);
      if (op.op === 'login') held.current = [];
    });
  }, []);
  useEffect(function () {
    var ops = held.current;
    if (!ops || !loggedIn) return;
    held.current = null;
    ops.forEach(function (op) { deliverOp(latest.current, op); });
  }, [loggedIn]);
}

/**
 * Adds a message of a history page to its group without sorting it: the page sorts each group it fills once.
 * @param {Object} d State being modified.
 * @param {{gid: string, msg: Object}} op History operation.
 * @param {Object} local Account data kept in this browser.
 * @returns {boolean} True if the message joined the message log, false for a message already there or an edit applied to its original.
 */
function addHistory(d, op, local) {
  var hm = Object.assign({}, op.msg), hs = hm.style; delete hm.style; delete hm.badge; delete hm.spelling;
  var g = ensureLiveGroup(d, op.gid, local), u = ensureLiveUser(d, hm.author, local);
  noteBadge(g, hm.author, op.msg.badge);
  mergeStyle(u, hs, hm.ts);
  mergeSpelling(u, op.msg.spelling, hm.ts);
  if (plainOf(g.messages).some(function (x) { return x.id === hm.id || (x.editIds || []).indexOf(hm.id) >= 0; })) return false;
  var o = editTarget(g, hm);
  // History received from newest to oldest: like BetterChatango, an original already edited keeps its text.
  if (o) { applyGroupEdit(o, hm, o.edited); return false; }
  if (hm.editId) hm.edited = true;
  else { delete hm.editId; mergeEdits(g, hm); }
  g.messages.push(withReply(g, hm));
  logMention(d, op.gid, hm);
  // History newer than the read position kept in this browser counts as unread, without an alert. The group in view reads it instead.
  if (hm.kind === 'msg' && !hm.editId && hm.author !== d.me && g.lastReadTs != null && hm.ts > g.lastReadTs && !isGroupInView(d, op.gid)) {
    g.unread += 1;
    if (mentionsMe(d.me, hm.text)) g.mentions += 1;
  }
  return true;
}

/**
 * Applies the bridge operations to the state in live.
 * @param {{store: Object, toast: Function, inbox: Object, actions: Object, local: Object, reconnection: Object, pms: Object}} k
 *   Application state with its ref and update, notifications, inbox (useInbox), actions (useActions), account data kept in this browser (useLocalStore),
 *   reconnection (useReconnection) and live PMs (useLivePms).
 */
function useLiveOps(k) {
  var stateRef = k.store.stateRef, update = k.store.update, toast = k.toast;
  var pmArchive = k.inbox.pmArchive, nav = k.inbox.nav, notify = k.inbox.notify, notifyPm = k.inbox.notifyPm, receiveGroup = k.inbox.receiveGroup;
  var actions = k.actions, local = k.local, localRef = k.local.ref, reconnection = k.reconnection, pms = k.pms;
  var offlineCount = useRef(0);
  // History operations held for the animation frame: Chatango sends a page one frame per message.
  var page = useRef([]);
  /** Adds the history messages held since the last animation frame or operation in one update, with one sort and one trim of each group. */
  function applyPage() {
    var ops = page.current;
    if (!ops.length) return;
    page.current = [];
    update(function (d) {
      if (!d.auth.loggedIn) return;
      var filled = {};
      ops.forEach(function (op) { if (addHistory(d, op, localRef.current)) filled[op.gid] = true; });
      Object.keys(filled).forEach(function (gid) {
        var g = d.groups[gid];
        g.messages.sort(function (a, b) { return a.ts - b.ts; });
        trimThread(g);
        // A group without a kept read position takes its first history as read, as before read positions were kept.
        if (g.lastReadTs == null || isGroupInView(d, gid)) g.lastReadTs = readThrough(g);
      });
    });
  }
  function handleLiveOp(op) {
    switch (op.op) {
      case 'login': {
        local.restore(op.me);
        // BetterChatango's "Mentioned in #g" title would come back 5 s later without the Nightango counter.
        if (liveBridge.setting('tabTitleAlerts')) liveBridge.setSetting('tabTitleAlerts', false);
        update(function (d) {
          Object.assign(d, liveWorld(op.me)); d.ownStyle = localRef.current.style && Object.assign({}, DEFAULT_MESSAGE_STYLE, localRef.current.style); d.notes = storedNotes(localRef.current.notes); d.spaces = storedSpaces(localRef.current.spaces); d.space = d.spaces.some(function (x) { return x.id === localRef.current.space; }) ? localRef.current.space : null; d.auth = { loggedIn: true };
          mergeSpelling(d.users[op.me], op.spelling, Date.now());
          (liveBridge.ignoredUsers() || []).forEach(function (n) { ensureUnseenUser(d, n, localRef.current); });
          storedFavoritePeople(localRef.current.favoritePeople).forEach(function (n) { ensureUnseenUser(d, n, localRef.current); d.users[n].favorite = true; });
          Object.keys(BETTER_CHATANGO_PREFS).forEach(function (path) { var v = liveBridge.setting(BETTER_CHATANGO_PREFS[path]); if (v !== null) setIn(d.prefs, path, v); });
          d.prefs.safety.trustedHosts = liveBridge.trustedHosts();
        });
        // An account with no joined group receives no group frame.
        setTimeout(function () { update(function (d) { d.groupsSeen = true; }); }, 10000);
        break;
      }
      case 'group': {
        var unfocused = !stateRef.current.liveFocused;
        update(function (d) {
          if (!d.auth.loggedIn) return;
          var g = ensureLiveGroup(d, op.id, localRef.current);
          d.groupsSeen = true;
          if (op.ready) { g.inited = true; g.membersLoaded = true; }
          if (op.title) { g.title = op.title; g.topic = op.title; }
          // Joining calls renderGroup again with recent: true, so owned never goes back to false.
          if (op.owned) g.owned = true;
          g.joined = !op.hidden;
          if (g.joined && !d.liveFocused && d.route.view === 'discover') { d.liveFocused = true; d.route = { view: 'group', id: op.id, markerTs: g.lastReadTs }; }
        });
        if (!op.hidden && unfocused) setTimeout(function () { var r = stateRef.current.route; if (r.view === 'group' && r.id === op.id) liveBridge.focus(op.id); }, 50);
        break;
      }
      case 'msg': {
        var m = Object.assign({}, op.msg), style = m.style; delete m.style; delete m.badge; delete m.spelling;
        if (m.editId) {
          // Edit: applied to the original if it is loaded, otherwise shown as an edited message that keeps its reference.
          update(function (d) {
            if (!d.auth.loggedIn) return;
            var g = ensureLiveGroup(d, op.gid, localRef.current), u = ensureLiveUser(d, m.author, localRef.current), o = editTarget(g, m);
            mergeStyle(u, style, m.ts);
            mergeSpelling(u, op.msg.spelling, m.ts);
            noteBadge(g, m.author, op.msg.badge);
            if (o) { applyGroupEdit(o, m); return; }
            m.edited = true;
            g.messages.push(withReply(g, m));
          });
          break;
        }
        delete m.editId;
        update(function (d) {
          if (!d.auth.loggedIn) return;
          var mg = ensureLiveGroup(d, op.gid, localRef.current);
          // The duration unit of a temporary ban is unconfirmed: a message of the user that gets through ends it.
          if (m.author === d.me && mg.live.tempBan) mg.live.tempBan = null;
          noteBadge(mg, m.author, op.msg.badge);
          var mu = ensureLiveUser(d, m.author, localRef.current);
          mergeStyle(mu, style, m.ts);
          mergeSpelling(mu, op.msg.spelling, m.ts);
        });
        receiveGroup(op.gid, m);
        break;
      }
      case 'hist':
        if (!page.current.length) k.store.atFrame(applyPage);
        page.current.push(op);
        break;
      case 'msgid': groupUpdate(update, op.gid, function (g, d) {
        plainOf(g.messages).forEach(function (x, i) {
          if (x.id === op.tmp) g.messages[i].id = op.id;
          if (x.replyTo && x.replyTo.id === op.tmp) g.messages[i].replyTo.id = op.id;
          if (x.editIds && x.editIds.indexOf(op.tmp) >= 0) g.messages[i].editIds = x.editIds.map(function (id) { return id === op.tmp ? op.id : id; });
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
      case 'spellings': update(function (d) {
        if (d.auth.loggedIn) Object.keys(op.names).forEach(function (n) { mergeSpelling(ensureLiveUser(d, n, localRef.current), op.names[n], Date.now()); });
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
      case 'rate': groupUpdate(update, op.gid, function (g) {
        g.live.rate = op.seconds;
        if (op.wait) g.live.cooldown = { until: Date.now() + op.wait * 1000, refused: false };
        deriveLive(g);
      }); break;
      case 'tooFast': groupUpdate(update, op.gid, function (g) {
        g.live.cooldown = { until: Date.now() + op.seconds * 1000, refused: true };
        if (op.text) g.live.refused = op.text;
      }); break;
      // Raw length kept, end read as minutes like chadango: the longer reading, a message of the user that gets through ends the ban sooner.
      case 'tempBan': groupUpdate(update, op.gid, function (g) { g.live.tempBan = { length: op.length, until: op.length ? Date.now() + op.length * MIN : 0 }; }); break;
      case 'bans': groupUpdate(update, op.gid, function (g) { receiveBanPage(banListOf(g, op.kind), op); }); break;
      case 'banned': {
        var mine = op.ban.by === stateRef.current.me;
        groupUpdate(update, op.gid, function (g) {
          if (!g.bans.some(function (b) { return b.unid === op.ban.unid && b.ip === op.ban.ip; })) g.bans.unshift(op.ban);
          g.messages.push({ id: uid(), kind: 'ban', user: op.ban.name, ts: Date.now() });
        });
        if (mine) toast(shownName(stateRef.current, op.ban.name) + ' was banned from #' + op.gid + '.', { action: { label: 'Undo', run: function () { liveBridge.unban(op.gid, op.ban); } } });
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
        var page = g.live.modlogPage, next = page.loading, known = {}, list = (g.live.modlog || []).slice();
        list.forEach(function (x) { known[x.id] = true; });
        var fresh = op.list.filter(function (x) { return !known[x.id]; });
        list.push.apply(list, fresh);
        list.sort(function (a, b) { return b.at - a.at; });
        g.live.modlog = list;
        // A first page sent again when the settings reopen only adds the newest actions: the end of the log stays as paging left it.
        if (next || !page.loaded) page.more = op.more && (!next || fresh.length > 0);
        page.loaded = true;
        page.loading = false;
      }); break;
      case 'conn':
        reconnection.follow(op);
        update(function (d) {
          if (op.gid === 'private_message') d.pmConn = op.state;
          if (!d.auth.loggedIn) return;
          var g = d.groups[op.gid];
          // A pending history request gets no response on a closed socket.
          if (g && g.joined) { g.conn = op.state; if (op.state !== 'open') { g.loadingMore = false; g.live.banPage.loading = false; g.live.unbanPage.loading = false; g.live.modlogPage.loading = false; } }
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
          var pu = ensureLiveUser(d, op.from, localRef.current);
          mergeStyle(pu, op.style, op.ts);
          mergeSpelling(pu, op.spelling, op.ts);
          receivePm(d, op);
        });
        pmArchive.current.record(op.from, op, true);
        // Read created after the current stack: BetterChatango archives a received PM only after pm is emitted.
        if (focused) readPm(pmArchive.current, update, op.from); else syncPmUnread(pmArchive.current, update, [op.from]);
        if (edit) break;
        if (!focused && !op.offline && !ignored) notifyPm(op.from, messagePreview(op));
        // msgoff frames arrive in a burst right after the connection: a single notification for the whole burst.
        if (op.offline && !ignored && !offlineCount.current++) setTimeout(function () {
          var n = offlineCount.current;
          offlineCount.current = 0;
          notify('pm', { toast: plural(n, 'message', 'messages') + ' received while you were away.', tag: 'pm-away', icon: 'message', action: { label: 'Open', run: function () { nav({ view: 'dm', id: null }); } } });
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
      case 'premium': {
        var premium = { status: op.status, until: op.until }, today = dayKey(Date.now()), key = skinKey(stateRef.current.me);
        update(function (d) { if (d.auth.loggedIn) d.premium = premium; });
        // Chatango sends the frame on each private connection: the day of the last reminder is kept for the account.
        if (premiumEndsSoon(premium, Date.now()) && (storageGet(key) || {}).premiumReminded !== today) {
          storageMerge(key, { premiumReminded: today });
          toast('Your Chatango Premium ends on ' + shortDate(op.until) + '.', { icon: 'star', action: { label: 'Open chatango.com', run: function () { window.open(CHATANGO_URL, '_blank', 'noopener,noreferrer'); } } });
        }
        break;
      }
      case 'friends':
        update(function (d) {
          if (!op.added) d.friendsLoaded = true;
          op.list.forEach(function (f) { var u = ensureLiveUser(d, f.name, localRef.current); u.friend = true; applyPresence(u, f); delete d.friendAdds[f.name]; });
        });
        break;
      case 'friendTimeout':
        if (!stateRef.current.friendAdds[op.name]) break;
        update(function (d) { delete d.friendAdds[op.name]; });
        toast("Chatango didn't confirm adding " + shownName(stateRef.current, op.name) + ' to friends.');
        break;
      case 'friendRefused':
        update(function (d) { delete d.friendAdds[op.name]; });
        toast(unknownUserText(op.name), { icon: 'info' });
        break;
      case 'pmChecked': {
        update(function (d) { d.pmChecked = { name: op.name, found: !!op.found, timeout: !!op.timeout, ts: Date.now() }; });
        // Name checked by New private message: its refusal shows in the dialog, not as a toast.
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
          var who = shownName(stateRef.current, op.name), openDm = { label: 'Message', run: function () { actions.openDm(op.name); } };
          if (status === 'online' && before.status === 'offline') {
            if (isNotifyingOnline(stateRef.current, op.name)) toast(who + ' is online.', { icon: 'users', action: openDm });
            else notify('friendOn', { toast: who + ' is online.', title: who, tag: 'friend:' + op.name, icon: 'users', action: openDm });
          } else if (status === 'offline') notify('friendOff', { toast: who + ' went offline.', title: who, tag: 'friend:' + op.name, icon: 'users' });
        }
        break;
      }
      case 'pmBlocked': update(function (d) {
        Object.keys(d.users).forEach(function (n) { if (d.users[n].blocked && op.list.indexOf(n) < 0) d.users[n].blocked = false; });
        op.list.forEach(function (n) { ensureLiveUser(d, n, localRef.current).blocked = true; });
      }); break;
      // A new avatarV gives the memoized rows of the member new props: their avatars render again with the picture AVATAR_VERSION now points to.
      case 'profileStale': update(function (d) { if (d.users[op.name]) d.users[op.name].avatarV = op.v; }); break;
      case 'msgBgStale': update(function (d) { if (d.users[op.name]) delete d.users[op.name].msgBg; }); break;
      case 'people': update(function (d) { op.list.forEach(function (x) { applyPresence(ensureLiveUser(d, x.name, localRef.current), x); }); }); break;
      case 'pmUnblocked': update(function (d) { if (d.users[op.name]) d.users[op.name].blocked = false; }); break;
      default: break;
    }
  }
  // The operations of one animation frame make one render: a history page or a burst of presence included.
  useBridgeOps(function (op) {
    k.store.inAnimationFrame(function () {
      // An operation after a held page reads it in the state, like the deletion or the final id of one of its messages.
      if (op.op !== 'hist') applyPage();
      handleLiveOp(op);
    });
  }, k.store.state.auth.loggedIn);
}
