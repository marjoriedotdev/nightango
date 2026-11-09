/* ---------- Inbox: messages received and read ---------- */
var MENTION_MAX = 100;
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
 * Returns a route with the group or PM it opens marked read, and the group's previous read position for its New messages line.
 * @param {Object} d State being modified.
 * @param {Object} route Route to show.
 */
function opened(d, route) {
  var r = Object.assign({}, route);
  if (r.view === 'group' && d.groups[r.id]) { var g = d.groups[r.id]; r.markerTs = g.lastReadTs; g.lastReadTs = readThrough(g); g.unread = 0; g.mentions = 0; }
  if (r.view === 'dm' && r.id && d.dms[r.id]) { d.dms[r.id].lastReadTs = Date.now(); d.dms[r.id].closed = false; }
  return r;
}
function sameConversation(a, b) { return !!a && !!b && a.view === b.view && a.id === b.id; }

/**
 * Messages that reach the user and their reading: the PM archive that holds the unreads, the reception and notification of an incoming event, and the navigation that marks the opened conversation read.
 * @param {Object} stateRef Ref to the application state.
 * @param {Function} update State update.
 * @param {Function} toast Shows a notification.
 * @param {function(boolean)} setNavOpen Opens or closes the navigation drawer.
 * @returns {{pmArchive: Object, nav: Function, notify: Function, notifyPm: Function, receiveGroup: Function, receiveDm: Function}} PM archive ref, navigation, notification
 *   of an event and of a PM, and reception.
 */
function useInbox(stateRef, update, toast, setNavOpen) {
  // Only source of PM unreads: the BetterChatango database in live, an in-memory archive in the prototype or when that database is missing.
  var pmArchive = useRef(null);
  if (!pmArchive.current) pmArchive.current = LIVE ? betterChatangoPmArchive() : memoryPmArchive();
  /**
   * Shows a route and marks the group or the PM it opens read.
   * @param {{view: string, id: ?string}} route Route to show.
   */
  var nav = useCallback(function (route) {
    update(function (d) {
      var cur = d.route;
      // Going back to the message log does not jump again to the message opened from Mentions or the PM search.
      if (cur && (cur.view === 'group' || cur.view === 'dm' || cur.view === 'discover' || cur.view === 'mentions')) { d.lastChat = cur; delete cur.msgId; delete cur.seek; }
      d.route = opened(d, route);
      // The same conversation never shows in both panes, and only a conversation keeps one beside it.
      if (d.split && (sameConversation(d.split, d.route) || (d.route.view !== 'group' && d.route.view !== 'dm'))) d.split = null;
    });
    setNavOpen(false);
    if (route.view === 'dm' && route.id) readPm(pmArchive.current, update, route.id);
    if (LIVE && route.view === 'group' && route.id) liveBridge.focus(route.id);
    focusPms();
  }, []);
  /**
   * Opens a group or a PM beside the main one and marks it read.
   * A conversation already in the main pane, or a main pane without a conversation, simply shows it there.
   * @param {{view: string, id: string}} route Conversation to show beside.
   */
  var openSplit = useCallback(function (route) {
    var r0 = stateRef.current.route;
    if (sameConversation(r0, route) || !r0.id || (r0.view !== 'group' && r0.view !== 'dm')) { nav(route); return; }
    update(function (d) { d.split = opened(d, route); });
    if (route.view === 'dm') readPm(pmArchive.current, update, route.id);
    focusPms();
  }, []);
  var closeSplit = useCallback(function () { update(function (d) { d.split = null; }); focusPms(); }, []);
  // BetterChatango's PM sound follows one open PM: the main one first, the one beside otherwise.
  function focusPms() {
    if (!LIVE) return;
    var s = stateRef.current, r = s.route.view === 'dm' && s.route.id ? s.route : s.split && s.split.view === 'dm' ? s.split : null;
    liveBridge.focusPm(r ? r.id : false);
  }
  /**
   * Notifies an incoming event after its state update, as the notification preferences ask.
   * @param {string} kind Preference of the event: mentions, pm, friendOn or friendOff.
   * @param {{toast: string, icon: string, action: ?Object, tag: string, title: ?string, body: ?string}} info Text, icon and action of the notification,
   *   and the conversation tag, title and text of its desktop alert, which a click opens through the action.
   */
  function notify(kind, info) {
    var p = stateRef.current.prefs, n = p.notify[kind];
    if (!n) return;
    var focused = document.visibilityState === 'visible' && (typeof document.hasFocus !== 'function' || document.hasFocus());
    if (n.sound && (!p.soundFocusOnly || focused)) beep(p.volume);
    if (n.app && info.toast) toast(info.toast, info.action ? { action: info.action, icon: info.icon, clamp: kind === 'pm' } : { icon: info.icon, clamp: kind === 'pm' });
    // BetterChatango already shows its own desktop alert for a mention when push_desktop is on, but none for a PM.
    if (n.desktop && !focused && !(LIVE && kind === 'mentions' && liveBridge.setting('desktopMentions'))) {
      try {
        if (window.Notification && window.Notification.permission === 'granted') {
          // Same tag: the alert replaces the previous one of its conversation. renotify (Chromium only) keeps the replacement audible: the app plays no sound of its own in live.
          var shown = new window.Notification(info.title || 'Nightango', { body: info.body || info.toast, tag: info.tag, renotify: true });
          shown.onclick = function () { window.focus(); shown.close(); if (info.action) info.action.run(); };
        }
      } catch (e) { /* system notifications unavailable */ }
    }
  }
  /**
   * Notifies a received PM.
   * @param {string} from Correspondent.
   * @param {string} preview Text of the PM.
   */
  function notifyPm(from, preview) {
    var show = stateRef.current.prefs.pmPreview;
    notify('pm', {
      toast: show ? from + ': ' + preview : 'New message from ' + from, title: from, body: show ? preview : 'New message', tag: 'pm:' + from,
      icon: 'message', action: { label: 'Reply', run: function () { nav({ view: 'dm', id: from }); } }
    });
  }
  /**
   * Returns the current id of a received mention.
   * @param {Object} state Application state.
   * @param {string} gid Group of the message.
   * @param {Object} msg Message as received.
   */
  function mentionId(state, gid, msg) {
    // A live message changes id once Chatango confirms it, and the mention log follows that change.
    var e = state.mentionLog.filter(function (x) { return x.gid === gid && x.ts === msg.ts && x.author === msg.author; })[0];
    return e ? e.id : msg.id;
  }
  /**
   * Adds a received group message, counts it unread unless its group is in view, and notifies a mention.
   * @param {string} gid Group of the message.
   * @param {Object} msg Received message.
   */
  function receiveGroup(gid, msg) {
    var s0 = stateRef.current, me = s0.me;
    var mention = msg.kind === 'msg' && mentionsMe(me, msg.text);
    // Like in BetterChatango, a mention in a muted group or from an ignored author does not alert, and the counters still change.
    var quiet = !!(s0.groups[gid] && s0.groups[gid].muted) || !!userOf(s0, msg.author).ignored;
    var focused = isGroupInView(s0, gid);
    update(function (d) {
      var g = d.groups[gid]; if (!g) return;
      // The reply is resolved on the up-to-date state: the final id of the original can arrive just before.
      if (LIVE && msg.replyId) withReply(g, msg);
      g.messages.push(msg);
      trimThread(g);
      logMention(d, gid, msg);
      if (msg.kind === 'msg' && !focused) { g.unread += 1; if (mention) g.mentions += 1; }
      if (focused) g.lastReadTs = readThrough(g);
    });
    if (mention && !quiet && !isPaneOpen(s0, 'group', gid)) {
      var g0 = s0.groups[gid];
      // A message the log hides keeps its text out of the system alert too.
      var hidden = isHiddenAuthor(s0, msg.author) || (!s0.prefs.safety.guestMessages && isGuest(msg.author)) || !!(g0 && g0.hiddenChannels.indexOf(msg.channel || 'none') >= 0);
      notify('mentions', {
        toast: msg.author + ' mentioned you in #' + gid, title: msg.author + ' in #' + gid, body: hidden ? null : messagePreview(msg), tag: 'group:' + gid,
        icon: 'at-sign', action: { label: 'Open', run: function () { var s = stateRef.current; nav(groupRouteAt(s, gid, mentionId(s, gid, msg))); } }
      });
    }
  }
  /**
   * Receives a PM in the prototype.
   * @param {string} from Correspondent.
   * @param {string} text Message text.
   */
  function receiveDm(from, text) {
    var s0 = stateRef.current, m = { from: from, key: uid(), text: text, ts: Date.now() };
    var focused = isDmInView(s0, from);
    update(function (d) {
      receivePm(d, m);
      var c = d.dms[from];
      if (focused) c.lastReadTs = Date.now();
    });
    pmArchive.current.record(from, m, !focused);
    syncPmUnread(pmArchive.current, update, [from]);
    if (!focused && !userOf(s0, from).ignored) notifyPm(from, text);
  }
  return { pmArchive: pmArchive, nav: nav, openSplit: openSplit, closeSplit: closeSplit, notify: notify, notifyPm: notifyPm, receiveGroup: receiveGroup, receiveDm: receiveDm };
}
