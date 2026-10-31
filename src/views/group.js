/* ---------- Group ---------- */
// BetterChatango rejects the tenth edit of a message.
var EDIT_MAX = 9;
// BetterChatango's limit for a group, counted on the body it builds and not on the typed text.
var GROUP_MESSAGE_MAX = 2900;
// From the @ on, like Discord. A Chatango name has 20 characters at most.
var MENTION_TOKEN = /(?:^|\s)@([A-Za-z0-9_-]{0,20})$/;
var MENTION_SUGGESTIONS = 8;
var COMPOSER_MODES = {
  // BetterChatango renders replies and edits too (inject.js:5407, 5514), other Chatango apps show a new message.
  reply: { icon: 'reply', verb: 'Replying to', cancelLabel: 'Cancel reply', note: 'Only visible to Nightango and BetterChatango users.' },
  edit: { icon: 'edit', verb: 'Editing', cancelLabel: 'Cancel edit', note: 'Only visible to Nightango and BetterChatango users.' },
  quote: { icon: 'quote', verb: 'Quoting', cancelLabel: 'Cancel quote' }
};

/**
 * Reply, edit or quote mode of a composer.
 * During an edit, the draft holds the edited text and the typed draft waits aside.
 * @param {Array} draft useDraft result of the composer.
 * @returns {{mode: ?{kind: string, m: Object}, setMode: Function, close: Function, enter: function(string): Function, edit: function(Object, number)}} Mode and its transitions.
 */
function useComposerMode(draft) {
  var app = useApp();
  var st = useState(null), mode = st[0], setMode = st[1], stash = useRef('');
  if (mode && mode.kind === 'edit') draft[2].current = stash.current;
  function close() { if (mode && mode.kind === 'edit') draft[1](stash.current); setMode(null); }
  return {
    mode: mode, setMode: setMode, close: close,
    enter: function (kind) { return function (m) { close(); setMode({ kind: kind, m: m }); }; },
    edit: function (m, edits) {
      if (edits >= EDIT_MAX) { app.ui.toast("You can't edit this message again. BetterChatango allows " + EDIT_MAX + ' edits per message.'); return; }
      if (!mode || mode.kind !== 'edit') stash.current = draft[0];
      draft[1](m.text);
      setMode({ kind: 'edit', m: m });
    }
  };
}

function GroupView(p) {
  var app = useApp(), s = app.state, g = s.groups[p.gid], prefs = s.prefs, me = s.me;
  var a2 = useState(null), search = a2[0], setSearch = a2[1];
  var a4 = useState('none'), channel = a4[0], setChannel = a4[1];
  var a6 = useState({}), revealed = a6[0], setRevealed = a6[1];
  var a8 = useState(false), infoOpen = a8[0], setInfoOpen = a8[1];
  var column = useRightColumn(function () { setInfoOpen(true); });
  var a9 = useDraft('group:' + p.gid), draft = a9[0], setDraft = a9[1];
  var cm = useComposerMode(a9), mode = cm.mode, setMode = cm.setMode;
  var inputRef = useRef(null);
  var emoji = useEmojiPicker(inputRef, setDraft), media = useMediaCompletion(draft, setDraft), mentions = useMentionCompletion(g, inputRef, draft, setDraft);
  var attach = useAttachMedia({ kind: 'group', id: p.gid }, setDraft);
  var log = useMessageLog();
  var count = g ? g.messages.length : 0;
  var q = search ? search.trim().toLowerCase() : '';
  // Jump asked by the Mentions page: jumpTo, declared below, refuses a message the log hides.
  useEffect(function () { var o = findMsg(g, p.msgId); if (o) jumpTo(o); }, []);
  var kind = mode && mode.kind, replyId = kind === 'reply' ? mode.m.id : null, quoted = kind === 'quote' ? quoteOf(mode.m.author, mode.m.text) : null;
  var typed = draft.trim(), editId = kind === 'edit' ? editedId(mode.m) : null;
  // Style compared as text: update clones the whole state, so the object changes on every update.
  var measured = useMemo(function () {
    return LIVE ? liveBridge.measure(p.gid, typed, { replyId: replyId, editId: editId, quote: quoted, style: s.ownStyle }) : typed.length;
  }, [p.gid, typed, replyId, editId, quoted, JSON.stringify(s.ownStyle)]);
  if (!g) return h('main', { className: 'main' }, h('div', { className: 'empty' }, h('h2', null, 'This group is gone'), h(T.Button, { onClick: function () { app.nav({ view: 'discover' }); } }, 'Discover groups')));

  var myRole = roleOf(g, me), staff = isStaffRole(myRole);
  var rights = groupRights(g, me);
  var canClose = rights.closeGroup, canBroadcast = rights.broadcast;
  var online = LIVE && g.liveCount ? g.liveCount : g.members.filter(function (n) { return userOf(s, n).status !== 'offline' || n === me; }).length;
  var ann = g.settings.announcement;
  var chans = Object.keys(CHANNELS).filter(function (k) { return k !== 'mod' || staff; });
  // The sending channel is never hidden, even if it stays in the stored list.
  var hiddenChans = chans.filter(function (k) { return k !== channel && g.hiddenChannels.indexOf(k) >= 0; });

  // Like BetterChatango: the mention is added at the end of the draft.
  function mention(handle) {
    setDraft(function (v) { return v + (v && !/\s$/.test(v) ? ' ' : '') + '@' + handle + ' '; });
    if (inputRef.current) inputRef.current.focus();
  }
  function onKeyDown(e) {
    media.onKeyDown(e);
    if (!e.defaultPrevented) mentions.onKeyDown(e);
  }
  var closeMode = cm.close, reply = cm.enter('reply'), quote = cm.enter('quote');
  function edit(m) { cm.edit(m, m.editCount || 0); }
  function send(text) {
    if (kind === 'edit') { if (text !== mode.m.text) app.actions.editMessage(g.id, mode.m, text); closeMode(); return; }
    if (runCommand(app, text, g.id)) return;
    log.follow();
    var opts = { replyTo: replyId ? { id: replyId } : null, quote: quoted, channel: channel }, sentMode = mode;
    if (attach.file) { attach.send(text, opts, function () { setMode(function (cur) { return cur === sentMode ? null : cur; }); }); return; }
    app.actions.sendGroup(g.id, text, opts);
    setMode(null);
  }
  // As in BetterChatango, a hidden message still counts in unreads and mentions.
  function shown(m) { return m.annc ? prefs.announcements : m.kind !== 'msg' || prefs.safety.guestMessages || !isGuest(m.author); }
  // The prototype's sample messages have no channel.
  function hiddenByChannel(m) { return m.kind === 'msg' && hiddenChans.indexOf(m.channel || 'none') >= 0; }
  function jumpTo(o) {
    if (hiddenByChannel(o)) { app.ui.toast('The original message is in a channel you hide. Show that channel from the channel menu to see it.'); return; }
    if (!shown(o)) { app.ui.toast('The original message is hidden because messages from guests are off in Safety settings.'); return; }
    if (isHiddenAuthor(s, o.author) && (prefs.safety.ignoreMode === 'hide' || !revealed[o.id])) { app.ui.toast('The original message is hidden because you ignore its author.'); return; }
    setSearch(null);
    log.jumpTo(o.id);
  }

  var items = [], prev = null, lastDay = null, marker = false;
  var msgs = g.messages.filter(function (m) { return shown(m) && !hiddenByChannel(m) && (!q || m.kind === 'msg' && !m.deleted && (m.text.toLowerCase().indexOf(q) >= 0 || m.author.indexOf(q) >= 0)); });
  for (var i = 0; i < msgs.length; i++) {
    var m = msgs[i], dk = dayKey(m.ts);
    if (dk !== lastDay) { items.push(h(T.DayDivider, { key: 'd' + m.id, date: m.ts }, dayLabel(m.ts))); lastDay = dk; prev = null; }
    if (!q && prefs.markNew && !marker && s.route.markerTs && m.ts > s.route.markerTs && m.author !== me && m.kind === 'msg') {
      items.push(h('div', { key: 'n' + m.id, className: 'newmark', role: 'separator' }, 'New messages')); marker = true; prev = null;
    }
    if (m.kind === 'ban') { items.push(h('div', { key: m.id, className: 'ev' }, h(T.Icon, { name: 'ban', size: 14 }), m.user + ' was banned')); prev = null; continue; }
    if (m.kind === 'system') { items.push(h('div', { key: m.id, className: 'ev' }, h(T.Icon, { name: 'info', size: 14 }), m.text, m.embeds && m.embeds.length ? h(MessageEmbeds, { embeds: m.embeds }) : null)); prev = null; continue; }
    if (isHiddenAuthor(s, m.author)) {
      if (prefs.safety.ignoreMode === 'hide') continue;
      if (!revealed[m.id]) {
        items.push(h('div', { key: m.id, className: 'ignored-row' }, h(T.Icon, { name: 'eye-off', size: 14 }), 'Message from ' + m.author + ' hidden.',
          h('button', { type: 'button', className: 'linkbtn', onClick: (function (id) { return function () { setRevealed(function (x) { var o = Object.assign({}, x); o[id] = true; return o; }); }; })(m.id) }, 'Show')));
        prev = null; continue;
      }
    }
    var cont = !!(prev && prev.author === m.author && !m.replyTo && m.ts - prev.ts < 5 * MIN && !m.deleted && !prev.deleted);
    items.push(h(MessageRow, { key: m.id, m: m, g: g, continued: cont, highlight: log.targetId === m.id, onReply: reply, onQuote: quote, onEdit: edit, onMention: mention, onJump: jumpTo }));
    prev = m;
  }
  var older = !LIVE || q ? null
    : !g.inited && !g.messages.length ? { status: 'pending' }
    : g.historyDone ? { status: 'start', text: 'This is the beginning of the history Chatango keeps for #' + g.id + '.' }
    : g.historyCapped ? null
    : { status: 'more', loading: g.loadingMore, ready: g.inited && !g.loadingMore && g.conn === 'open', load: function () { app.actions.loadMore(g.id); } };
  if (q && !items.length) items.push(h('div', { key: 'none', className: 'empty' }, h('h2', null, 'No messages match'), h('p', null, 'Search looks at loaded messages in #' + g.id + '.')));
  else if (!q && !older && !items.length) items.push(h('div', { key: 'none', className: 'empty' },
    h('h2', null, count ? 'No messages to show' : 'No messages yet'),
    h('p', null, count ? 'Your settings hide every loaded message in #' + g.id + '.' : 'Messages sent in #' + g.id + ' appear here.')));

  var composer;
  if (g.closed) {
    composer = h('div', { className: 'notice' }, h(T.Icon, { name: 'lock', size: 16 }), h('span', { className: 'grow' }, 'This group is closed. Nobody can post until staff reopen it.'),
      canClose ? h(T.Button, { size: 'sm', onClick: function () { app.actions.setClosed(g.id, false); } }, 'Reopen group') : null);
  } else if (ann.broadcast && !canBroadcast) {
    composer = h('div', { className: 'notice' }, h(T.Icon, { name: 'volume', size: 16 }), h('span', { className: 'grow' }, 'Broadcast mode is on. Only staff can post right now.'));
  } else {
    var left = GROUP_MESSAGE_MAX - measured;
    composer = h(Frag, null, media.panel, mentions.panel, h(T.Composer, {
      placeholder: 'Message #' + g.id, value: draft, onChange: mentions.onChange, onKeyDown: onKeyDown, inputRef: inputRef, canSend: left >= 0 && (kind === 'edit' || !attach.busy),
      hint: left < 0 ? 'Shorten your message by ' + plural(-left, 'character', 'characters') + ' to send it.' : left <= 300 ? plural(left, 'character', 'characters') + ' left' : null,
      hintTone: left < 0 ? 'warning' : null,
      context: mode ? Object.assign({ author: mode.m.author, text: messagePreview(mode.m) }, COMPOSER_MODES[mode.kind]) : null,
      onCancelContext: closeMode, onSend: send, onEmoji: emoji.onEmoji, status: attach.status,
      // An edit changes only the text: the picked file waits for the next message.
      onAttach: kind === 'edit' ? null : attach.onAttach, attachment: kind === 'edit' ? null : attach.attachment,
      beforeSend: h(MessageStyleButton, null),
      aside: h(MenuButton, {
        up: true, items: chans.map(function (k) {
          return { label: channelLabel(k), swatch: CHANNELS[k].color || 'transparent', checked: channel === k, onSelect: function () { setChannel(k); } };
        }).concat([{ divider: true }], chans.filter(function (k) { return k !== channel; }).map(function (k) {
          return { label: (hiddenChans.indexOf(k) >= 0 ? 'Show ' : 'Hide ') + (k === 'none' ? 'messages without a channel' : channelLabel(k)), icon: 'eye-off', onSelect: function () { app.actions.toggleHiddenChannel(g.id, k); } };
        })),
        renderTrigger: function (tp) {
          return h('button', Object.assign({ type: 'button', className: 'pillbtn chan-trigger', 'aria-label': 'Channel: ' + CHANNELS[channel].label + (hiddenChans.length ? '. ' + hiddenChans.length + ' hidden.' : '') }, tp),
            h('span', { style: { width: 8, height: 8, borderRadius: '50%', background: CHANNELS[channel].color || 'transparent', border: CHANNELS[channel].color ? 0 : '1.5px solid var(--text-3)' } }),
            h('span', { className: 'hide-mobile' }, CHANNELS[channel].label), hiddenChans.length ? h(T.Icon, { name: 'eye-off', size: 12 }) : null, h(T.Icon, { name: 'chevron-down', size: 12, className: 'hide-mobile' }));
        }
      })
    }), emoji.picker, attach.input);
  }

  var waitingCount = LIVE && !g.membersLoaded && !g.liveCount;
  return h(Frag, null,
    h('main', { className: 'main' },
      h('header', { className: 'topbar' },
        h(MobileNavButton, null),
        h('h1', null, g.id),
        g.topic ? h(Frag, null, h('span', { className: 'vsep' }), h('p', { className: 'topic' }, g.topic)) : null,
        // The topic pushes the buttons to the right on desktop: without one, this spacer does it.
        h('span', { className: g.topic ? 'grow only-mobile' : 'grow' }),
        // On mobile only the number stays visible: the accessible name keeps "online".
        h('button', { type: 'button', className: 'pillbtn', 'aria-label': waitingCount ? undefined : online + ' online', 'aria-pressed': column.pressed == null ? undefined : String(column.pressed), onClick: column.toggle },
          h(T.Icon, { name: 'users', size: 16 }), waitingCount ? 'Members' : online, waitingCount ? null : h('span', { className: 'hide-mobile' }, ' online')),
        h(T.IconButton, { icon: 'search', label: 'Search in this group', pressed: search != null, onClick: function () { setSearch(search == null ? '' : null); } }),
        h(T.IconButton, { icon: g.muted ? 'volume-x' : 'bell', label: g.muted ? 'Unmute group' : 'Mute group', pressed: g.muted, onClick: function () { app.actions.toggleMute(g.id); } }),
        h(MenuButton, {
          label: 'Group options', items: [
            staff ? { label: 'Group settings', icon: 'sliders', onSelect: function () { app.nav({ view: 'gsettings', id: g.id, page: myRole === 'owner' || rights.manageMods ? 'overview' : 'automod' }); } } : null,
            { label: g.favorite ? 'Remove from favorites' : 'Add to favorites', icon: 'star', onSelect: function () { app.actions.toggleFavorite(g.id); } },
            { label: 'Copy invite link', icon: 'link', onSelect: function () { copyText('https://' + g.id + '.chatango.com', function (ok) { app.ui.toast(ok ? 'Invite link copied.' : 'Copy failed. The link is ' + g.id + '.chatango.com'); }); } },
            { divider: true },
            { label: 'Leave group…', icon: 'log-out', danger: true, onSelect: function () { confirmLeave(app, g.id); } }
          ]
        })),
      prefs.announcements && ann.enabled && ann.text && !g.dismissedAnnouncement ? h('div', { className: 'banner-wrap' },
        h(T.Banner, { title: 'Announcement', onDismiss: function () { app.update(function (d) { d.groups[g.id].dismissedAnnouncement = true; }); } },
          LIVE ? ann.displayText : ann.text, LIVE && ann.embeds.length ? h(MessageEmbeds, { embeds: ann.embeds }) : null)) : null,
      search != null ? h('div', { className: 'searchbar' },
        h('label', { htmlFor: 'gsearch', className: 'tc-sr' }, 'Search messages'),
        h('input', { id: 'gsearch', className: 'tc-input', type: 'search', placeholder: 'Search messages in #' + g.id, value: search, autoFocus: true, onChange: function (e) { setSearch(e.target.value); }, onKeyDown: function (e) { if (e.key === 'Escape') setSearch(null); } }),
        h(T.Button, { variant: 'ghost', size: 'sm', onClick: function () { setSearch(null); } }, 'Close')) : null,
      h(MessageLog, { log: log, label: 'Messages in ' + g.id, rows: items, firstTs: count ? g.messages[0].ts : null, changeKey: count + ':' + !!search, newBelow: 'notify', older: older }),
      LIVE && g.conn ? h(ConnectionBanner, { key: g.id, name: '#' + g.id, conn: g.conn, retrying: !!app.state.retrying[g.id], onRetry: function () { app.actions.retryConnection(g.id); } }) : null,
      h('div', { className: 'composer-wrap', onKeyUp: mentions.onCaret, onMouseUp: mentions.onCaret, onFocus: mentions.onCaret, onBlur: mentions.onBlur }, composer)),
    column.open ? h(MembersPanel, { g: g }) : null,
    infoOpen ? h(GroupInfoSheet, { g: g, onClose: function () { setInfoOpen(false); } }) : null);
}

/**
 * Lists the members that complete a mention, as many as the list shows.
 * Names that start with the input come before names that contain it, each part by most recent message in the group then by name.
 * @param {Object} g Open group.
 * @param {string} me Signed-in user, never offered.
 * @param {string} typed Input after @, empty right after the @.
 * @returns {Array<{name: string, handle: string}>} Member name and the name written after @.
 */
function mentionCandidates(g, me, typed) {
  var q = typed.toLowerCase(), seen = Object.create(null), starts = [], contains = [];
  var authors = g.messages.filter(function (m) { return m.kind === 'msg'; }).map(function (m) { return m.author; }).reverse();
  seen[me.toLowerCase()] = true;
  authors.concat(g.members).forEach(function (n, i) {
    var handle = mentionHandle(n), key = handle && handle.toLowerCase();
    if (!handle || seen[key]) return;
    seen[key] = true;
    var at = key.indexOf(q), c = { name: n, handle: handle, rank: Math.min(i, authors.length) };
    if (at === 0) starts.push(c); else if (at > 0) contains.push(c);
  });
  // No case-insensitive duplicates: the comparator never gets two equal names.
  function order(a, b) { return a.rank - b.rank || (a.handle.toLowerCase() < b.handle.toLowerCase() ? -1 : 1); }
  return starts.sort(order).concat(contains.sort(order)).slice(0, MENTION_SUGGESTIONS);
}

/**
 * Suggests the members that complete the @name typed before the caret, from the @ on.
 * Tab, Enter or a click replaces the name with the chosen one. Escape closes the list for this mention.
 * @param {?Object} g Open group, absent once it is gone.
 * @param {Object} inputRef Composer field.
 * @param {string} value Composer text.
 * @param {function(string)} setValue Writes the composer text.
 * @returns {{onChange: Function, onKeyDown: Function, onCaret: Function, onBlur: Function, panel: Object}} Composer onChange, keys to handle before the composer's own, caret and focus events of composer-wrap, and suggestions to render in composer-wrap.
 */
function useMentionCompletion(g, inputRef, value, setValue) {
  var app = useApp(), s = app.state;
  var a = useState(null), caretAt = a[0], setCaretAt = a[1];
  var b = useState({ key: '', index: 0 }), sel = b[0], setSel = b[1];
  var c = useState(-1), closedAt = c[0], setClosedAt = c[1];
  // Caret kept with the text it was read in: a text the view writes itself (edit, send, emoji) opens nothing.
  var before = caretAt && caretAt.value === value ? value.slice(0, caretAt.caret) : '';
  var m = MENTION_TOKEN.exec(before), start = m ? before.length - m[1].length - 1 : -1, key = m ? start + ' ' + m[1] : '';
  var list = g && m && start !== closedAt ? mentionCandidates(g, s.me, m[1]) : [];
  var open = list.length > 0, index = sel.key === key ? sel.index : 0;

  function readCaret() {
    var el = inputRef.current, text = el.value, caret = el.selectionStart === el.selectionEnd ? el.selectionEnd : -1;
    setCaretAt(function (old) { return caret < 0 ? null : old && old.value === text && old.caret === caret ? old : { value: text, caret: caret }; });
    if (caret < 0 || !MENTION_TOKEN.test(text.slice(0, caret))) setClosedAt(-1);
  }
  function accept(cand) {
    var el = inputRef.current, inserted = '@' + cand.handle + ' ', caret = start + inserted.length;
    // The rest of the word after the caret and the space that follows it are replaced too.
    var next = value.slice(0, start) + inserted + value.slice(caretAt.caret).replace(/^[A-Za-z0-9_-]* ?/, '');
    // Value set on the field before setValue: React finds it up to date and leaves the caret after the name.
    el.value = next;
    el.setSelectionRange(caret, caret);
    setValue(next);
    setCaretAt({ value: next, caret: caret });
  }
  function onKeyDown(e) {
    if (!open || e.nativeEvent.isComposing) return;
    var n = list.length;
    if ((e.key === 'Tab' || e.key === 'Enter') && !e.shiftKey) accept(list[index]);
    else if (e.key === 'Escape') setClosedAt(start);
    else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') setSel({ key: key, index: (index + (e.key === 'ArrowDown' ? 1 : n - 1)) % n });
    else return;
    e.preventDefault();
  }
  var panel = open ? h('ul', { className: 'suggest', role: 'listbox', 'aria-label': 'Members' }, list.map(function (cand, i) {
    var status = userOf(s, cand.name).status;
    return h('li', {
      key: cand.name, role: 'option', 'aria-selected': String(i === index), className: cx('suggest-item', status === 'offline' && 'suggest-item-off'),
      // The field keeps focus: the click replaces the text without leaving it.
      onMouseDown: function (ev) { ev.preventDefault(); }, onClick: function () { accept(cand); },
      onMouseMove: function () { if (i !== index) setSel({ key: key, index: i }); }
    }, h(T.Avatar, { name: cand.name, size: 24, status: status, ring: 'var(--raised)' }), h('span', { className: 'suggest-name' }, cand.handle), presenceSr(status), roleBadge(roleOf(g, cand.name)));
  })) : null;
  var said = open ? list[index].handle + ', ' + (index + 1) + ' of ' + list.length + '. Press Tab or Enter to insert it.' : '';
  return {
    onChange: function (v) { setValue(v); readCaret(); },
    onKeyDown: onKeyDown,
    // Events bubble from every control of composer-wrap: only those of the field move the caret.
    onCaret: function (e) { if (e.target === inputRef.current) readCaret(); },
    onBlur: function (e) { if (e.target === inputRef.current) setCaretAt(null); },
    panel: h(Frag, null, panel, h('p', { className: 'tc-sr', 'aria-live': 'polite' }, said))
  };
}

/**
 * Asks for confirmation before leaving a group.
 * @param {Object} app Application context.
 * @param {string} gid Group to leave.
 */
function confirmLeave(app, gid) {
  app.ui.confirm({ title: 'Leave #' + gid + '?', body: 'You can join again from Discover at any time.', confirmLabel: 'Leave group', danger: true, onConfirm: function () { app.actions.leaveGroup(gid); } });
}
