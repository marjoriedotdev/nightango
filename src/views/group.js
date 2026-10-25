/* ---------- Groupe ---------- */
// Torch refuse la dixième modification d'un message.
var EDIT_MAX = 9;
// Limite de Torch pour un groupe, comptée sur le corps qu'il construit et non sur le texte saisi.
var GROUP_MESSAGE_MAX = 2900;
var COMPOSER_MODES = {
  reply: { icon: 'reply', verb: 'Replying to', cancelLabel: 'Cancel reply' },
  edit: { icon: 'edit', verb: 'Editing', cancelLabel: 'Cancel edit' },
  quote: { icon: 'quote', verb: 'Quoting', cancelLabel: 'Cancel quote' }
};

function GroupView(p) {
  var app = useApp(), s = app.state, g = s.groups[p.gid], prefs = s.prefs, me = s.me;
  var a2 = useState(null), search = a2[0], setSearch = a2[1];
  var a3 = useState(null), mode = a3[0], setMode = a3[1];
  var a4 = useState('none'), channel = a4[0], setChannel = a4[1];
  var a6 = useState({}), revealed = a6[0], setRevealed = a6[1];
  var a8 = useState(false), infoOpen = a8[0], setInfoOpen = a8[1];
  var column = useRightColumn(function () { setInfoOpen(true); });
  var a9 = useState(''), draft = a9[0], setDraft = a9[1];
  var a11 = useState(''), completed = a11[0], setCompleted = a11[1];
  var inputRef = useRef(null), stash = useRef(''), completion = useRef(null);
  var emoji = useEmojiPicker(inputRef, setDraft), media = useMediaCompletion(draft, setDraft);
  var attach = useAttachMedia({ kind: 'group', id: p.gid, channel: channel });
  var log = useMessageLog();
  var count = g ? g.messages.length : 0;
  var q = search ? search.trim().toLowerCase() : '';
  // Saut demandé par la page Mentions : jumpTo, déclarée plus bas, refuse un message que le fil masque.
  useEffect(function () { var o = findMsg(g, p.msgId); if (o) jumpTo(o); }, []);
  var kind = mode && mode.kind, replyId = kind === 'reply' ? mode.m.id : null, quoted = kind === 'quote' ? quoteOf(mode.m) : null;
  var typed = draft.trim(), editId = kind === 'edit' ? editedId(mode.m) : null;
  // Style comparé en texte : update clone tout l'état, l'objet change à chaque mise à jour.
  var measured = useMemo(function () {
    return LIVE ? liveBridge.measure(p.gid, typed, { replyId: replyId, editId: editId, quote: quoted, style: s.ownStyle }) : typed.length;
  }, [p.gid, typed, replyId, editId, quoted, JSON.stringify(s.ownStyle)]);
  if (!g) return h('main', { className: 'main' }, h('div', { className: 'empty' }, h('h2', null, 'This group is gone'), h(T.Button, { onClick: function () { app.nav({ view: 'discover' }); } }, 'Discover groups')));

  var myRole = roleOf(g, me), staff = isStaffRole(myRole);
  var rights = groupRights(g, me);
  var canClose = rights.closeGroup, canBroadcast = rights.broadcast;
  var online = LIVE && g.liveCount ? g.liveCount : g.members.filter(function (n) { return userOf(s, n).status !== 'offline' || n === me; }).length;
  var typing = (s.typing[g.id] || []).filter(function (n) { return n !== me; });
  var ann = g.settings.announcement;
  var chans = Object.keys(CHANNELS).filter(function (k) { return k !== 'mod' || staff; });
  // Le canal d'envoi n'est jamais masqué, même s'il reste dans la liste gardée.
  var hiddenChans = chans.filter(function (k) { return k !== channel && g.hiddenChannels.indexOf(k) >= 0; });

  // Comme Torch : la mention s'ajoute en fin de brouillon.
  function mention(handle) {
    setDraft(function (v) { return v + (v && !/\s$/.test(v) ? ' ' : '') + '@' + handle + ' '; });
    if (inputRef.current) inputRef.current.focus();
  }
  function endCompletion() { if (!completion.current) return; completion.current = null; setCompleted(''); }
  function completeMention(e) {
    var el = e.target, c = completion.current;
    if (e.key !== 'Tab' || e.shiftKey || e.nativeEvent.isComposing) { endCompletion(); return; }
    // Un seul nom : rien à faire défiler, le Tab suivant rend la main à la navigation.
    if (c && c.names.length === 1) { endCompletion(); return; }
    if (!c) {
      var caret = el.selectionEnd, word = el.selectionStart === caret && /(?:^|\s)@([A-Za-z0-9_-]{1,20})$/.exec(el.value.slice(0, caret));
      var names = word ? mentionCandidates(g, me, word[1]) : [];
      if (!names.length) return;
      // Comme Torch, l'espace qui suit déjà le mot est remplacée avec lui.
      c = completion.current = { start: caret - word[1].length - 1, end: caret + (el.value.charAt(caret) === ' ' ? 1 : 0), names: names, index: -1 };
    }
    e.preventDefault();
    c.index = (c.index + 1) % c.names.length;
    var inserted = '@' + c.names[c.index] + ' ', next = el.value.slice(0, c.start) + inserted + el.value.slice(c.end);
    c.end = c.start + inserted.length;
    // Valeur posée sur le champ avant setDraft : React la trouve à jour et laisse le curseur après le nom.
    el.value = next;
    el.setSelectionRange(c.end, c.end);
    setDraft(next);
    setCompleted(c.names[c.index] + ', ' + (c.index + 1) + ' of ' + c.names.length);
  }
  function onKeyDown(e) {
    media.onKeyDown(e);
    if (!e.defaultPrevented) completeMention(e);
  }
  function closeMode() { if (mode && mode.kind === 'edit') setDraft(stash.current); setMode(null); }
  function enter(kind) { return function (m) { closeMode(); setMode({ kind: kind, m: m }); }; }
  var reply = enter('reply'), quote = enter('quote');
  function edit(m) {
    if ((m.editCount || 0) >= EDIT_MAX) { app.ui.toast("You can't edit this message again. Torch allows " + EDIT_MAX + ' edits per message.'); return; }
    if (!mode || mode.kind !== 'edit') stash.current = draft;
    setDraft(m.text);
    setMode({ kind: 'edit', m: m });
  }
  function send(text) {
    if (kind === 'edit') { if (text !== mode.m.text) app.actions.editMessage(g.id, mode.m, text); closeMode(); return; }
    if (runCommand(app, text, g.id)) return;
    log.follow();
    app.actions.sendGroup(g.id, text, { replyTo: replyId ? { id: replyId } : null, quote: quoted, channel: channel });
    setMode(null);
  }
  // Comme dans Torch, un message masqué compte encore dans les non-lus et les mentions.
  function shown(m) { return m.annc ? prefs.announcements : m.kind !== 'msg' || prefs.safety.guestMessages || !isGuest(m.author); }
  // Les messages d'exemple du prototype n'ont pas de canal.
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

  var composer;
  if (g.closed) {
    composer = h('div', { className: 'notice' }, h(T.Icon, { name: 'lock', size: 16 }), h('span', { className: 'grow' }, 'This group is closed. Nobody can post until staff reopen it.'),
      canClose ? h(T.Button, { size: 'sm', onClick: function () { app.actions.setClosed(g.id, false); } }, 'Reopen group') : null);
  } else if (ann.broadcast && !canBroadcast) {
    composer = h('div', { className: 'notice' }, h(T.Icon, { name: 'volume', size: 16 }), h('span', { className: 'grow' }, 'Broadcast mode is on. Only staff can post right now.'));
  } else {
    var left = GROUP_MESSAGE_MAX - measured;
    composer = h(Frag, null, media.panel, h(T.Composer, {
      placeholder: 'Message #' + g.id, value: draft, onChange: setDraft, onKeyDown: onKeyDown, inputRef: inputRef, canSend: left >= 0,
      hint: left < 0 ? 'Shorten your message by ' + plural(-left, 'character', 'characters') + ' to send it.' : left <= 300 ? plural(left, 'character', 'characters') + ' left' : null,
      hintTone: left < 0 ? 'warning' : null,
      context: mode ? Object.assign({ author: mode.m.author, text: messagePreview(mode.m) }, COMPOSER_MODES[mode.kind]) : null,
      onCancelContext: closeMode, onSend: send, onEmoji: emoji.onEmoji, onAttach: attach.onAttach, status: attach.status,
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
        h('span', { className: 'vsep' }),
        h('p', { className: 'topic' }, g.topic),
        h('span', { className: 'grow only-mobile' }),
        // Sur mobile, seul le nombre reste visible : le nom accessible garde « online ».
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
      LIVE && g.conn && g.conn !== 'open' ? h(ConnectionBanner, { name: '#' + g.id, conn: g.conn, onReconnect: function () { app.actions.reconnect(g.id); } }) : null,
      h('div', { className: 'composer-wrap', onMouseDown: endCompletion, onBlur: endCompletion },
        h('p', { className: 'typing', 'aria-live': 'polite' }, typing.length ? h(Frag, null, h('span', { className: 'dots', 'aria-hidden': 'true' }, h('i'), h('i'), h('i')), h('b', null, typing.join(', ')), typing.length > 1 ? ' are typing' : ' is typing') : null),
        composer,
        h('p', { className: 'tc-sr', 'aria-live': 'polite' }, completed))),
    column.open ? h(MembersPanel, { g: g }) : null,
    infoOpen ? h(GroupInfoSheet, { g: g, onClose: function () { setInfoOpen(false); } }) : null);
}

/**
 * Permet de lister les noms qui complètent une mention : ceux qui commencent par la saisie, puis ceux qui la contiennent.
 * @param {Object} g Groupe ouvert.
 * @param {string} me Utilisateur connecté, jamais proposé.
 * @param {string} typed Saisie après @.
 */
function mentionCandidates(g, me, typed) {
  var q = typed.toLowerCase(), seen = Object.create(null), starts = [], contains = [];
  var authors = g.messages.filter(function (m) { return m.kind === 'msg'; }).map(function (m) { return m.author; });
  seen[me.toLowerCase()] = true;
  g.members.concat(authors).forEach(function (n) {
    var handle = mentionHandle(n), key = handle && handle.toLowerCase();
    if (!handle || seen[key]) return;
    seen[key] = true;
    var at = key.indexOf(q);
    if (at === 0) starts.push(handle); else if (at > 0) contains.push(handle);
  });
  // Sans doublon à la casse près : le comparateur n'a jamais deux noms égaux.
  function byName(a, b) { return a.toLowerCase() < b.toLowerCase() ? -1 : 1; }
  return starts.sort(byName).concat(contains.sort(byName));
}

/**
 * Permet de demander confirmation avant de quitter un groupe.
 * @param {Object} app Contexte de l'application.
 * @param {string} gid Groupe à quitter.
 */
function confirmLeave(app, gid) {
  app.ui.confirm({ title: 'Leave #' + gid + '?', body: 'You can join again from Discover at any time.', confirmLabel: 'Leave group', danger: true, onConfirm: function () { app.actions.leaveGroup(gid); } });
}
