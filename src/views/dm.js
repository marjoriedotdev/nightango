/* ---------- Private messages ---------- */
function DMView(p) {
  var app = useApp(), s = app.state, id = p.id;
  var a1 = useState('all'), tab = a1[0], setTab = a1[1];
  var a2 = useState(''), q = a2[0], setQ = a2[1];
  var column = useRightColumn(function () { app.ui.openProfile(id, null); });
  var convo = id ? s.dms[id] : null;

  var names = listedDms(s);
  useProfiles(names);
  var shown = names.filter(function (n) {
    var c = s.dms[n];
    if (tab === 'unread' && !c.unread) return false;
    return !q || n.indexOf(q.toLowerCase()) >= 0;
  });

  var filters = [['all', 'All'], ['unread', 'Unread']];
  var section = p.tab === 'friends' || p.tab === 'meet' ? p.tab : 'chats';
  var term = section === 'chats' ? q.trim() : '', found = useDmSearch(term);
  var list = h('section', { className: 'convs', 'aria-label': 'Conversations' },
    h('header', { className: 'topbar col-head' }, h(MobileNavButton, null), h('h1', { className: 'grow' }, 'Private messages'),
      h(T.IconButton, { icon: 'edit', label: 'New message', onClick: app.ui.openNewDm })),
    LIVE && s.pmrStatus === 'restricted' && !s.pmrDismissed ? h('div', { style: { padding: '12px 12px 0' } }, h(T.Banner, { tone: 'warning', title: 'Your private messages are restricted', onDismiss: app.actions.dismissPmr },
      'People might not receive your messages.')) : null,
    LIVE && s.pmUnsaved ? h('div', { style: { padding: '12px 12px 0' } }, h(T.Banner, { tone: 'warning', title: "Private messages aren't saved in this browser" }, "They'll be gone after a reload.")) : null,
    convo ? null : pmConnBanner(app, 12),
    h('div', { style: { padding: '12px 12px 0' } }, h(T.SegmentedControl, {
      label: 'Show', block: true, value: section, onChange: function (v) { app.nav({ view: 'dm', id: id, tab: v === 'chats' ? undefined : v }); },
      options: [{ value: 'chats', label: h(Frag, null, 'Chats', h(T.CountBadge, { count: unreadDmCount(s) })) }, { value: 'friends', label: 'Friends' }, { value: 'meet', label: 'Meet people' }]
    })),
    section === 'friends' ? h(FriendsList, { current: id }) : section === 'meet' ? h(MeetPeople, null) : h(Frag, null,
    h('div', { style: { padding: '12px 12px 8px', display: 'flex', flexDirection: 'column', gap: 10 } },
      h('label', { htmlFor: 'pm-search', className: 'tc-sr' }, 'Search conversations'),
      h('input', { id: 'pm-search', className: 'tc-input', type: 'search', placeholder: 'Search conversations', value: q, onChange: function (e) { setQ(e.target.value); } }),
      h('div', { className: 'tabs', role: 'group', 'aria-label': 'Filter conversations' },
        filters.map(function (t) {
          return h('button', { key: t[0], type: 'button', className: 'tab', 'aria-pressed': String(tab === t[0]), onClick: function () { setTab(t[0]); } }, t[1]);
        }))),
    h('div', { className: 'scroll', style: { padding: '0 8px 12px' } },
      LIVE && !s.pmLoaded ? h(SkeletonRows, { count: 5, avatar: 28, twoLines: true, label: 'Loading conversations' }) : h(Frag, null,
        shown.length ? shown.map(function (n) { return h(ChatRow, { key: n, name: n, user: userOf(s, n), convo: s.dms[n], me: s.me, active: n === id }); }) : h('p', { className: 'pal-empty' }, q ? 'No conversation matches.' : 'No conversations yet.'),
        term.length >= DM_SEARCH_MIN ? h(DmSearchHits, { found: found }) : null))));

  var thread = convo ? h(DmThread, { key: id, id: id, tab: p.tab, column: column, seek: p.seek })
    : h('main', { className: 'thread' }, h('div', { className: 'empty' },
      h(T.Icon, { name: 'message', size: 28, strokeWidth: 1.6 }), h('h2', null, 'Select a conversation'),
      h('p', { style: { margin: 0 } }, 'Or start a new one with a friend or someone from a group.'),
      h(T.Button, { variant: 'primary', icon: 'edit', onClick: app.ui.openNewDm }, 'New message')));
  return h('div', { className: 'main', style: { flexDirection: 'row' } },
    h('div', { className: cx('dm-split', id && 'has-thread') }, list, thread),
    convo && column.open ? h(ProfilePanel, { name: id }) : null);
}

/**
 * Shows the private connection loss once PMs are loaded and outside a session loss.
 * A session loss has its own dialog.
 * @param {Object} app Application context.
 * @param {number=} inset Side margin.
 */
function pmConnBanner(app, inset) {
  var s = app.state;
  if (!LIVE || !s.pmLoaded || !s.pmConn || s.session) return null;
  return h(ConnectionBanner, { name: 'private messages', conn: s.pmConn, retrying: !!s.retrying.private_message, inset: inset, onRetry: function () { app.actions.retryConnection('private_message'); } });
}

var DM_SEARCH_MIN = 2, DM_SEARCH_MAX = 50, DM_SEARCH_DELAY = 300;
/**
 * Searches a text in the private messages.
 * Reads BetterChatango's history database in live and the state messages in the prototype.
 * @param {Object} s Application state.
 * @param {string} query Searched text, case-insensitive.
 * @returns {Promise<{list: Array, more: boolean}>} Results from newest to oldest, and whether the limit cut the list.
 */
function searchDms(s, query) {
  if (LIVE) return liveBridge.searchPm(query, DM_SEARCH_MAX);
  var q = query.toLowerCase(), list = [];
  Object.keys(s.dms).forEach(function (t) {
    s.dms[t].messages.forEach(function (m) { if (m.text.toLowerCase().indexOf(q) >= 0) list.push({ target: t, from: m.from, ts: m.ts, id: m.id, text: m.text }); });
  });
  list.sort(function (a, b) { return b.ts - a.ts; });
  return Promise.resolve({ list: list.slice(0, DM_SEARCH_MAX), more: list.length > DM_SEARCH_MAX });
}
/**
 * Searches the private messages after a typing pause.
 * @param {string} term Typed text, trimmed.
 * @returns {?Object} Results for the term ({query, list, more}) or failure ({query, failed}), null while reading.
 */
function useDmSearch(term) {
  var app = useApp();
  var st = useState(null), found = st[0], setFound = st[1];
  useEffect(function () {
    if (term.length < DM_SEARCH_MIN) return;
    var current = true, timer = setTimeout(function () {
      searchDms(app.state, term).then(function (r) { if (current) setFound({ query: term, list: r.list, more: r.more }); }, function (e) {
        warn(e);
        if (current) setFound({ query: term, failed: true });
      });
    }, DM_SEARCH_DELAY);
    return function () { current = false; clearTimeout(timer); };
  }, [term]);
  return found && found.query === term ? found : null;
}
/**
 * Cuts the excerpt of a text around a highlighted term.
 * @param {string} text Message text.
 * @param {string} term Term found in the text, case-insensitive.
 */
function hitExcerpt(text, term) {
  var at = text.toLowerCase().indexOf(term.toLowerCase()), end = at + term.length, start = Math.max(0, at - 30), space = text.indexOf(' ', start);
  if (start && space >= 0 && space < at) start = space + 1;
  return h(Frag, null, (start ? '…' : '') + text.slice(start, at), h('mark', null, text.slice(at, end)), text.slice(end));
}
/**
 * Messages section of the Chats search under the conversations.
 * The tabs do not filter it.
 * @param {{found: ?Object}} p Search read by useDmSearch, null while reading.
 */
function DmSearchHits(p) {
  var app = useApp(), me = app.state.me, found = p.found, body;
  if (!found) body = h('div', { className: 'list-more' }, h(T.Spinner, { label: 'Searching messages' }));
  else if (found.failed) body = h('p', { className: 'pal-empty' }, 'Messages could not be searched.');
  else if (!found.list.length) body = h('p', { className: 'pal-empty' }, 'No message matches.');
  else body = h(Frag, null, found.list.map(function (hit) {
    return h(MessageEntry, {
      key: hit.id || hit.archiveTs, name: hit.target, ts: hit.ts, text: h(Frag, null, hit.from === me ? 'You: ' : '', hitExcerpt(hit.text, found.query)),
      onClick: function () { app.nav({ view: 'dm', id: hit.target, seek: hit }); }
    });
  }), found.more ? h('p', { className: 'pal-empty' }, 'Showing the ' + DM_SEARCH_MAX + ' most recent matches. Refine your search to see others.') : null);
  return h('section', null, h('h2', { className: 'mlabel' }, 'Messages'), body);
}
/**
 * Finds the message of a search result in a conversation.
 * @param {Object} c Conversation in the state.
 * @param {Object} hit searchDms result.
 * @returns {?Object} Shown message, null if it is not loaded.
 */
function dmHitMessage(c, hit) {
  if (!LIVE) return c.messages.find(function (m) { return m.id === hit.id; }) || null;
  // An edit shows inside its original, and a PM sent since the last OK has no archive key yet.
  return pmEditTarget(c, hit) || c.messages[pmShownIndex(c.messages, hit)] || null;
}

/**
 * Message log of a private conversation, mounted fresh for each correspondent.
 * @param {{id: string, tab: ?string, column: Object, seek: ?Object}} p Correspondent, list tab, profile column (useRightColumn) and search result to show.
 */
function DmThread(p) {
  var app = useApp(), s = app.state, id = p.id, convo = s.dms[id];
  var asked = useRef(false);
  var len = convo.messages.length;
  var log = useMessageLog();
  var draft = useDraft('dm:' + id), cm = useComposerMode(draft);
  var personActions = useProfileActions(id, null);
  // Search result: older pages load one by one until it is reached.
  useEffect(function () {
    var seek = p.seek, failed = asked.current && convo.olderFailed;
    if (!seek) return;
    var m = dmHitMessage(convo, seek);
    if (m) log.jumpTo(m.id);
    else if (convo.loadingOlder) return;
    else if (convo.historyCapped) app.ui.toast('This message is still saved in this browser, but a conversation shows only its last ' + THREAD_MAX + ' messages.');
    else if (convo.olderMore && !failed) { asked.current = true; app.actions.loadOlderDm(id); return; }
    // Failed read: loadOlderDm already announced it.
    else if (!failed) app.ui.toast('This message is no longer saved in this browser.');
    asked.current = false;
    app.update(function (d) { delete d.route.seek; });
  }, [p.seek, len, convo.loadingOlder]);

  var u = userOf(s, id);
  var calls = useLatestCalls({ jump: function (o) { log.jumpTo(o.id); }, reply: cm.enter('reply'), quote: cm.enter('quote'), edit: function (x) { cm.edit(x, (x.editKeys || []).length); } });
  var rows = [], prev = null, lastDay = null, byKey = Object.create(null);
  convo.messages.forEach(function (m) { if (m.key && !byKey[m.key]) byKey[m.key] = m; });
  convo.messages.forEach(function (m) {
    var dk = dayKey(m.ts), a = userOf(s, m.from);
    if (dk !== lastDay) { rows.push(h(T.DayDivider, { key: 'd' + m.id, date: m.ts }, dayLabel(m.ts))); lastDay = dk; prev = null; }
    var original = m.replyTo ? byKey[m.replyTo.key] || null : null;
    rows.push(h(DmMessageRow, {
      key: m.id, m: m, peer: id, me: s.me, prefs: s.prefs, theme: app.theme, style: a.style, unstyled: !!a.unstyled,
      continued: !!prev && prev.from === m.from && !m.replyTo && m.ts - prev.ts < 5 * MIN, highlight: log.targetId === m.id,
      original: original, onJump: calls.jump, onReply: u.blocked ? null : calls.reply, onQuote: u.blocked ? null : calls.quote, onEdit: u.blocked ? null : calls.edit
    }));
    prev = m;
  });
  var older = !LIVE || !s.pmLoaded || convo.historyCapped ? null
    : !convo.olderMore ? { status: 'start', text: 'This is the start of the messages saved in this browser.' }
    : {
      status: 'more', loading: convo.loadingOlder, ready: !convo.loadingOlder && !convo.olderFailed, load: function () { app.actions.loadOlderDm(id); },
      // After a failed read, the sentinel retries the read only on the next scroll.
      retry: convo.olderFailed ? function () { app.update(function (d) { d.dms[id].olderFailed = false; }); } : null
    };
  var bottom;
  if (u.blocked) bottom = h('div', { className: 'notice' }, h(T.Icon, { name: 'user-x', size: 16 }), h('span', { className: 'grow' }, 'You blocked ' + id + '. Unblock them to send messages.'), h(T.Button, { size: 'sm', onClick: function () { app.actions.toggleUser(id, 'blocked'); } }, 'Unblock'));
  else bottom = h(DmComposer, { id: id, draft: draft, mode: cm.mode, onCancelMode: cm.close });
  return h('main', { className: 'thread' },
    h('header', { className: 'topbar' },
      h(T.IconButton, { icon: 'arrow-left', label: 'Back to conversations', className: 'only-mobile', onClick: function () { app.nav({ view: 'dm', id: null, tab: p.tab }); } }),
      h('h2', { className: 'dm-title' }, h(Person, { name: id, size: 30, status: u.status, ring: 'var(--bg)' })),
      h('span', { className: 'topic', style: { flex: 1 } }, personStatus(s, id, null)),
      h('span', { className: 'topic dm-meta', style: { flex: 1 } }, [presenceText(u), personAsl(u)].filter(Boolean).join(' · ')),
      h(T.IconButton, { icon: 'panel', label: p.column.pressed == null ? 'View profile' : p.column.pressed ? 'Hide profile' : 'Show profile', pressed: p.column.pressed, onClick: p.column.toggle }),
      h(MenuButton, {
        label: 'Conversation options', items: [viewProfileItem(app, id, null)].concat(personActions, [{ divider: true }], convActions(app, id))
      })),
    h(MessageLog, { log: log, label: 'Messages with ' + id, rows: rows, firstTs: len ? convo.messages[0].ts : null, changeKey: logChangeKey(convo.messages), newBelow: 'follow', older: older }),
    pmConnBanner(app),
    h('div', { className: 'composer-wrap' }, bottom));
}

/**
 * Private message row with its Reply button and its action menu, rendered again only when its props change.
 * A message without a PM key, sent by the official Chatango client, has neither Reply nor Edit: they could not point to it.
 * @param {{m: Object, peer: string, me: string, prefs: Object, theme: string, style: Object, unstyled: boolean, continued: boolean, highlight: boolean, original: ?Object,
 *   onJump: Function, onReply: ?Function, onQuote: ?Function, onEdit: ?Function}} p Message, conversation correspondent, signed-in user, preferences, resolved theme,
 *   author's style and hidden style, follow-up of the previous message from the same author, highlight, loaded original of a reply, jump to it,
 *   and reply to, quote and edit the message (null when sending is not possible).
 */
var DmMessageRow = React.memo(function DmMessageRow(p) {
  var app = useAppApi(), m = p.m, me = p.me, prefs = p.prefs;
  var st = useState(false), menuOpen = st[0], setMenuOpen = st[1];
  var ms = memberStyles({ style: p.style, unstyled: p.unstyled }, prefs.styles, p.theme, false);
  // A sent PM gets its archive key only at the next OK: its remove entry appears only after that.
  var canRemove = !LIVE || !!m.archiveTs;
  var canEdit = !!p.onEdit && m.from === me && !!m.key, canQuote = !!p.onQuote && !!m.text && !!mentionHandle(m.from);
  var items = [canEdit ? { label: 'Edit message', icon: 'edit', onSelect: function () { p.onEdit(m); } } : null,
    canQuote ? { label: 'Quote message', icon: 'quote', onSelect: function () { p.onQuote(m); } } : null,
    copyTextItem(app, m), m.from !== me ? viewProfileItem(app, m.from, null) : null, whoItem(app, m.from),
    canRemove ? { divider: true } : null,
    canRemove ? { label: 'Remove from this browser…', icon: 'trash', danger: true, onSelect: function () {
      app.ui.confirm({ title: 'Remove this message from this browser?', body: keptCopyText(p.peer, LIVE), confirmLabel: 'Remove', danger: true, onConfirm: function () { app.actions.removeDmMessage(p.peer, m); } });
    } } : null];
  var o = p.original;
  var reply = o ? { author: h(Person, { name: o.from, size: 16 }), text: messagePreview(o), onJump: function () { p.onJump(o); } }
    : m.replyTo ? { text: 'Original message not loaded' } : null;
  var actions = h(Frag, null,
    p.onReply && m.key ? h(T.IconButton, { icon: 'reply', label: 'Reply', size: 28, iconSize: 16, onClick: function () { p.onReply(m); } }) : null,
    moreActionsButton(items, setMenuOpen));
  return h(T.Message, {
    compact: prefs.density === 'compact', continued: p.continued, time: fmtTime(m.ts, prefs.h24),
    avatar: h(Person, { name: m.from, avatarOnly: true }), author: authorName(m.from, ms.name), style: ms.row, reply: reply,
    actions: actions, msgId: m.id, highlight: p.highlight, className: cx(menuOpen && 'menu-open')
  }, h(MessageContent, { m: m, style: ms.text, plain: ms.plain }));
});

/**
 * Private conversation composer with its reply, edit or quote, emoticon and media picker, :name completion and file upload.
 * @param {{id: string, draft: Array, mode: ?Object, onCancelMode: Function}} p Conversation correspondent, draft (useDraft), mode (useComposerMode) and its end.
 */
function DmComposer(p) {
  var app = useApp(), id = p.id, mode = p.mode, kind = mode && mode.kind;
  var draft = p.draft[0], setDraft = p.draft[1];
  var inputRef = useRef(null);
  var emoji = useEmojiPicker(inputRef, setDraft), media = useMediaCompletion(draft, setDraft);
  var attach = useAttachMedia({ kind: 'dm', id: id }, setDraft);
  return h(Frag, null, media.panel, h(T.Composer, {
    placeholder: 'Message ' + id, value: draft, onChange: setDraft, onKeyDown: media.onKeyDown, inputRef: inputRef, onEmoji: emoji.onEmoji, status: attach.status, canSend: kind === 'edit' || !attach.busy,
    // An edit changes only the text: the picked file waits for the next message.
    onAttach: kind === 'edit' ? null : attach.onAttach, attachment: kind === 'edit' ? null : attach.attachment,
    context: mode ? Object.assign({ author: mode.m.from, text: messagePreview(mode.m) }, COMPOSER_MODES[kind]) : null, onCancelContext: p.onCancelMode,
    onSend: function (text) {
      if (kind === 'edit') { if (text !== mode.m.text) app.actions.sendDm(id, text, { editKey: mode.m.key }); p.onCancelMode(); return; }
      if (runCommand(app, text, null)) return;
      var opts = { replyTo: kind === 'reply' ? { key: mode.m.key } : null, quote: kind === 'quote' ? quoteOf(mode.m.from, mode.m.text) : null };
      if (attach.file) { attach.send(text, opts, p.onCancelMode); return; }
      if (!app.actions.sendDm(id, text, opts)) { setDraft(text); return; }
      p.onCancelMode();
    }, beforeSend: h(MessageStyleButton, null)
  }), emoji.picker, attach.input);
}

var STATUS_ORDER = { online: 0, idle: 1, offline: 2 };
function statusRank(st) { return st in STATUS_ORDER ? STATUS_ORDER[st] : 2; }
/**
 * Writes a member's presence with their last online time when it is known.
 * @param {Object} u Member in the state.
 */
function presenceText(u) { return u.status === 'offline' && u.lastOn ? 'Last online ' + ago(u.lastOn) : statusLabel(u.status); }
/**
 * Writes a person's status line.
 * The line holds presence, friend and role in the group the profile is opened from.
 * @param {Object} s Application state.
 * @param {string} name Member name.
 * @param {?string} gid Group the profile is opened from.
 */
function personStatus(s, name, gid) {
  var u = userOf(s, name), role = gid ? roleOf(s.groups[gid], name) : null;
  return [name === s.me ? statusLabel(s.meStatus) : presenceText(u), u.friend ? 'Friend' : null, role ? ROLE_LONG[role] + ' in #' + gid : null].filter(Boolean).join(' · ');
}
/**
 * Writes a person's ASL.
 * @param {Object} u Member in the state.
 */
function personAsl(u) {
  return [u.age || null, genderShort(u.gender), u.location || null].filter(Boolean).join(' · ');
}
/**
 * Dates a friend's idle time or last online time.
 * @param {Object} u Member in the state.
 */
function presenceSince(u) {
  if (!u.friend) return null;
  if (u.status === 'idle' && u.idleSince) return { ts: u.idleSince, text: 'Idle ' + elapsedShort(u.idleSince), title: 'Idle since ' };
  if (u.status === 'offline' && u.lastOn) return { ts: u.lastOn, text: elapsedShort(u.lastOn) + ' ago', title: 'Last online ' };
  return null;
}
/**
 * Idle or offline duration of a friend, refreshed every minute by the clock all relative times share.
 * @param {{user: Object}} p Member in the state.
 */
function PresenceTime(p) {
  useMinute();
  var x = presenceSince(p.user);
  return x ? h('time', { className: 'tc-msg-time conv-time', dateTime: new Date(x.ts).toISOString(), title: x.title + new Date(x.ts).toLocaleString('en-GB') }, x.text) : null;
}
/**
 * Info line of a person.
 * @param {string} n Member name.
 * @param {Object} u Member in the state.
 */
function personMetaLine(n, u) {
  return h('span', { className: 'conv-meta' }, personAsl(u), isProfilePending(n, u) ? h(T.Skeleton, { width: 72, height: 10 }) : null);
}
/**
 * Loads the mini profiles of a list of people and keeps them in the state while the list shows them.
 * @param {string[]} names People listed.
 */
function useProfiles(names) {
  var app = useApp();
  useShownUsers(names);
  useEffect(function () { app.actions.loadProfiles(names); }, [names.join(',')]);
}
/**
 * Row of a person in the Chats and Friends lists.
 * @param {string} n Member name.
 * @param {Object} u Member in the state.
 * @param {?Object} c Conversation with the member, if any.
 * @param {string} me Signed-in user.
 * @param {Function} onClick Opens the conversation.
 * @param {boolean} active The conversation is open.
 */
function personRow(n, u, c, me, onClick, active) {
  var last = c && c.messages[c.messages.length - 1];
  return h('button', { key: n, type: 'button', className: cx('conv', c && c.unread && 'unread'), 'aria-current': active ? 'page' : undefined, onClick: onClick },
    h(T.Avatar, { name: n, size: 28, status: u.status, ring: 'var(--panel)' }),
    h('span', { className: 'conv-main conv-grid' },
      h('span', { className: 'conv-name' }, n), presenceSr(u.status),
      presenceSince(u) ? h(PresenceTime, { user: u }) : null,
      personMetaLine(n, u),
      c ? h('span', { className: 'conv-prev' }, last ? (last.from === me ? 'You: ' : '') + messagePreview(last) : 'No messages yet') : null,
      c ? h(T.CountBadge, { count: c.unread }) : null));
}

/**
 * Tells who keeps the PMs removed from this browser.
 * @param {string} name Correspondent.
 * @param {boolean} betterChatango True to say first that only BetterChatango's copy goes away.
 */
function keptCopyText(name, betterChatango) {
  return (betterChatango ? 'Removes the copy BetterChatango keeps in this browser. ' : '') + 'Chatango does not store private messages, and ' + name + ' keeps their copy.';
}

/**
 * Lists the close and delete actions of a conversation.
 * @param {Object} app Application context.
 * @param {string} name Conversation member.
 */
function convActions(app, name) {
  return [
    { label: 'Close conversation', short: 'Close', icon: 'x', onSelect: function () { app.actions.closeDm(name); } },
    { label: 'Delete conversation…', short: 'Delete', icon: 'trash', danger: true, onSelect: function () {
      app.ui.confirm({ title: 'Delete this conversation?', body: keptCopyText(name, LIVE), confirmLabel: 'Delete', danger: true, onConfirm: function () { app.actions.deleteDm(name); } });
    } }
  ];
}

/**
 * Lists the actions of a friend list row.
 * @param {Object} app Application context.
 * @param {string} name Friend of the row.
 */
function friendActions(app, name) {
  return [
    notifyOnlineItem(app, name),
    { label: 'Remove friend…', short: 'Remove', icon: 'user-minus', danger: true, onSelect: function () { confirmRemoveFriend(app, name); } }
  ];
}

var SWIPE_REVEAL = 144;
/**
 * List row with swipe actions and a menu that also opens the profile.
 * @param {{name: string, actions: Array, children: *}} p Row member, row actions and main button.
 */
function SwipeRow(p) {
  var app = useAppApi(), n = p.name, actions = p.actions;
  var m = useState(null), menu = m[0], setMenu = m[1];
  var w = useState(null), swipe = w[0], setSwipe = w[1];
  var rowRef = useRef(null), drag = useRef(null), swallow = useRef(false);
  // The offset follows the finger outside React: one render per pointermove would cost too much.
  function settle(open) { rowRef.current.style.setProperty('--swipe', (open ? -SWIPE_REVEAL : 0) + 'px'); setSwipe(open ? 'open' : null); }
  useOutside(rowRef, swipe === 'open', function () { settle(false); });
  function onPointerDown(e) {
    swallow.current = false;
    if (e.pointerType === 'mouse') return;
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, from: swipe === 'open' ? -SWIPE_REVEAL : 0, axis: null, dx: 0 };
  }
  function onPointerMove(e) {
    var d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    var mx = e.clientX - d.x, my = e.clientY - d.y;
    if (!d.axis) {
      if (Math.abs(mx) < 8 && Math.abs(my) < 8) return;
      d.axis = Math.abs(mx) > Math.abs(my) ? 'x' : 'y';
      if (d.axis === 'x') { rowRef.current.setPointerCapture(e.pointerId); setSwipe('drag'); }
    }
    if (d.axis !== 'x') return;
    d.dx = Math.min(0, Math.max(-SWIPE_REVEAL, d.from + mx));
    rowRef.current.style.setProperty('--swipe', d.dx + 'px');
  }
  function onPointerUp(e) {
    var d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    if (d.axis !== 'x') return;
    swallow.current = true;
    settle(d.dx < -SWIPE_REVEAL / 2);
  }
  function onPointerCancel() {
    var d = drag.current;
    drag.current = null;
    if (d && d.axis === 'x') settle(false);
  }
  // The click that follows a swipe does not open the conversation: a tap on an open row closes it.
  function onClickCapture(e) {
    if (swallow.current) swallow.current = false;
    else if (swipe === 'open' && e.target.closest('.conv')) settle(false);
    else return;
    e.preventDefault();
    e.stopPropagation();
  }
  return h('div', {
    ref: rowRef, className: cx('conv-row', menu && 'menu-open', swipe === 'drag' && 'dragging', swipe === 'open' && 'swiped'),
    onContextMenu: function (e) { e.preventDefault(); setMenu({ at: { x: e.clientX, y: e.clientY } }); },
    onPointerDown: onPointerDown, onPointerMove: onPointerMove, onPointerUp: onPointerUp, onPointerCancel: onPointerCancel, onClickCapture: onClickCapture
  },
    swipe ? h('div', { className: 'conv-swipe', style: { width: SWIPE_REVEAL } }, actions.map(function (a) {
      return h('button', { key: a.short, type: 'button', className: a.danger ? 'danger' : undefined, 'aria-label': a.label, onClick: function () { settle(false); a.onSelect(); } }, h(T.Icon, { name: a.icon, size: 16 }), a.short);
    })) : null,
    p.children,
    h('div', { className: 'conv-more' }, h(MenuButton, {
      label: 'Options for ' + n, size: 26, iconSize: 16, items: [viewProfileItem(app, n, null), whoItem(app, n)].concat(actions), open: !!menu, at: menu && menu.at, align: menu && menu.at ? 'left' : undefined,
      onOpenChange: function (o) { setMenu(o ? { at: null } : null); }
    })));
}

/**
 * Chats list row with its conversation actions, rendered again only when its props change.
 * @param {{name: string, user: Object, convo: Object, me: string, active: boolean}} p Conversation member, the member and the conversation in the state,
 *   signed-in user, and whether the conversation is open.
 */
var ChatRow = React.memo(function ChatRow(p) {
  var app = useAppApi(), n = p.name;
  return h(SwipeRow, { name: n, actions: convActions(app, n) }, personRow(n, p.user, p.convo, p.me, function () { app.nav({ view: 'dm', id: n }); }, p.active));
});

function FriendsList(p) {
  var app = useApp(), s = app.state;
  var a = useState(''), name = a[0], setName = a[1];
  var b = useState(''), err = b[0], setErr = b[1];
  var request = useFriendRequest();
  var friends = Object.keys(s.users).filter(function (n) { return n !== s.me && s.users[n].friend; }).sort(function (x, y) {
    var a = s.users[x], b = s.users[y], rank = statusRank(a.status);
    return rank - statusRank(b.status) || (rank === STATUS_ORDER.offline ? (b.lastOn || 0) - (a.lastOn || 0) : 0) || x.localeCompare(y);
  });
  var on = friends.filter(function (n) { return s.users[n].status !== 'offline'; });
  var off = friends.filter(function (n) { return s.users[n].status === 'offline'; });
  useProfiles(friends);
  function section(label, names) {
    return names.length ? h(Frag, null, h('h3', { className: 'mlabel' }, label + ' · ' + names.length),
      names.map(function (n) { return h(SwipeRow, { key: n, name: n, actions: friendActions(app, n) }, personRow(n, s.users[n], s.dms[n], s.me, function () { app.actions.openDm(n, 'friends'); }, p.current === n)); })) : null;
  }
  function add(e) {
    e.preventDefault();
    var n = name.trim().toLowerCase();
    if (!/^[a-z0-9_-]{1,20}$/.test(n)) { setErr('Enter a Chatango username.'); return; }
    if (n === s.me) { setErr("You can't add yourself."); return; }
    if (s.users[n] && s.users[n].friend) { setErr(n + ' is already a friend.'); return; }
    setErr(''); setName('');
    request.add(n);
  }
  return h(Frag, null,
    h('form', { onSubmit: add, noValidate: true, style: { padding: '12px 12px 4px' } },
      h(T.TextField, {
        id: 'add-friend', label: 'Add a friend', placeholder: 'Username', value: name, error: err || undefined, autoComplete: 'off', onChange: function (e) { setName(e.target.value); setErr(''); },
        action: h(T.Button, { type: 'submit', disabled: !!request.pending }, request.pending ? 'Adding' : 'Add')
      })),
    h('div', { className: 'scroll', style: { padding: '0 8px 12px' } }, LIVE && !s.friendsLoaded ? h(SkeletonRows, { count: 5, avatar: 28, twoLines: true, label: 'Loading friends' })
      : friends.length
      ? h(Frag, null, section('Online', on), section('Offline', off))
      : h('p', { className: 'pal-empty' }, 'No friends yet. Add someone by username, or from their profile.')));
}
