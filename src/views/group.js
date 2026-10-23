/* ---------- Groupe ---------- */
function GroupView(p) {
  var app = useApp(), s = app.state, g = s.groups[p.gid], prefs = s.prefs, me = s.me;
  var a1 = useState(true), showMembers = a1[0], setShowMembers = a1[1];
  var a2 = useState(null), search = a2[0], setSearch = a2[1];
  var a3 = useState(null), replyTo = a3[0], setReplyTo = a3[1];
  var a4 = useState('none'), channel = a4[0], setChannel = a4[1];
  var a6 = useState({}), revealed = a6[0], setRevealed = a6[1];
  var a7 = useState(false), jump = a7[0], setJump = a7[1];
  var a8 = useState(false), infoOpen = a8[0], setInfoOpen = a8[1];
  var a9 = useState(''), draft = a9[0], setDraft = a9[1];
  var inputRef = useRef(null);
  var logRef = useRef(null), sentinelRef = useRef(null), atBottom = useRef(true), seen = useRef({ firstTs: null, top: 0, height: 0 });
  var count = g ? g.messages.length : 0, firstTs = count ? g.messages[0].ts : null;
  var q = search ? search.trim().toLowerCase() : '';
  useLayoutEffect(function () {
    var el = logRef.current; if (!el) return;
    var was = seen.current;
    if (atBottom.current) el.scrollTop = el.scrollHeight;
    // Position absolue : le navigateur a pu ancrer le défilement lui-même, l'ajouter au sien doublerait le décalage.
    else if (firstTs < was.firstTs) el.scrollTop = was.top + el.scrollHeight - was.height;
    else setJump(true);
    seen.current = { firstTs: firstTs, top: el.scrollTop, height: el.scrollHeight };
  }, [count, !!search]);
  var canLoadMore = !!(LIVE && g && !q && g.inited && !g.historyDone && !g.historyCapped && !g.loadingMore && g.conn === 'open');
  useInfiniteScroll(logRef, sentinelRef, canLoadMore, function () { app.actions.loadMore(g.id); }, '200px 0px 0px 0px');
  if (!g) return h('main', { className: 'main' }, h('div', { className: 'empty' }, h('h2', null, 'This group is gone'), h(T.Button, { onClick: function () { app.nav({ view: 'discover' }); } }, 'Discover groups')));

  var myRole = roleOf(g, me), staff = isStaffRole(myRole);
  var lp = LIVE ? livePerms(g, me) : null;
  var canClose = LIVE ? lp.closeGroup : canManage(g, me), canBroadcast = LIVE ? lp.broadcast : staff;
  var online = LIVE && g.liveCount ? g.liveCount : g.members.filter(function (n) { return userOf(s, n).status !== 'offline' || n === me; }).length;
  var typing = (s.typing[g.id] || []).filter(function (n) { return n !== me; });
  var ann = g.settings.announcement;

  function onScroll() {
    var el = logRef.current;
    atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
    seen.current.top = el.scrollTop; seen.current.height = el.scrollHeight;
    if (atBottom.current && jump) setJump(false);
  }
  // Comme Torch : la mention s'ajoute en fin de brouillon.
  function mention(handle) {
    setDraft(function (v) { return v + (v && !/\s$/.test(v) ? ' ' : '') + '@' + handle + ' '; });
    if (inputRef.current) inputRef.current.focus();
  }
  function toBottom() { var el = logRef.current; atBottom.current = true; el.scrollTop = el.scrollHeight; setJump(false); }

  var items = [], prev = null, lastDay = null, marker = false;
  var msgs = q ? g.messages.filter(function (m) { return m.kind === 'msg' && !m.deleted && (m.text.toLowerCase().indexOf(q) >= 0 || m.author.indexOf(q) >= 0); }) : g.messages;
  for (var i = 0; i < msgs.length; i++) {
    var m = msgs[i], dk = dayKey(m.ts);
    if (dk !== lastDay) { items.push(h(T.DayDivider, { key: 'd' + m.id }, dayLabel(m.ts))); lastDay = dk; prev = null; }
    if (!q && prefs.markNew && !marker && s.route.markerTs && m.ts > s.route.markerTs && m.author !== me && m.kind === 'msg') {
      items.push(h('div', { key: 'n' + m.id, className: 'newmark', role: 'separator' }, 'New messages')); marker = true; prev = null;
    }
    if (m.kind === 'ban') { items.push(h('div', { key: m.id, className: 'ev' }, h(T.Icon, { name: 'ban', size: 14 }), m.user + ' was banned')); prev = null; continue; }
    if (m.kind === 'system') { items.push(h('div', { key: m.id, className: 'ev' }, h(T.Icon, { name: 'info', size: 14 }), m.text, m.embeds && m.embeds.length ? h(MessageEmbeds, { embeds: m.embeds }) : null)); prev = null; continue; }
    var u = userOf(s, m.author);
    if ((u.ignored || (u.blocked && prefs.safety.syncBlocked)) && m.author !== me) {
      if (prefs.safety.ignoreMode === 'hide') continue;
      if (!revealed[m.id]) {
        items.push(h('div', { key: m.id, className: 'ignored-row' }, h(T.Icon, { name: 'eye-off', size: 14 }), 'Message from ' + m.author + ' hidden.',
          h('button', { type: 'button', className: 'linkbtn', onClick: (function (id) { return function () { setRevealed(function (x) { var o = Object.assign({}, x); o[id] = true; return o; }); }; })(m.id) }, 'Show')));
        prev = null; continue;
      }
    }
    var cont = !!(prev && prev.author === m.author && !m.replyTo && m.ts - prev.ts < 5 * MIN && !m.deleted && !prev.deleted);
    items.push(h(MessageRow, { key: m.id, m: m, g: g, continued: cont, onReply: setReplyTo, onMention: mention }));
    prev = m;
  }
  if (LIVE && !q) items.unshift(!g.inited && !g.messages.length
    ? h(SkeletonRows, { key: 'top', count: 6, avatar: 36, twoLines: true, label: 'Loading messages' })
    : g.historyDone
      ? h('div', { key: 'top', className: 'ev' }, h(T.Icon, { name: 'info', size: 14 }), 'This is the beginning of the history Chatango keeps for #' + g.id + '.')
      : g.historyCapped ? null
      : h('div', { key: 'top', ref: sentinelRef, className: 'ev history-more' }, g.loadingMore ? h(T.Spinner, { label: 'Loading earlier messages' }) : null));
  if (q && !items.length) items.push(h('div', { key: 'none', className: 'empty' }, h('h2', null, 'No messages match'), h('p', null, 'Search looks at loaded messages in #' + g.id + '.')));

  var composer;
  if (g.closed) {
    composer = h('div', { className: 'notice' }, h(T.Icon, { name: 'lock', size: 16 }), h('span', { className: 'grow' }, 'This group is closed. Nobody can post until staff reopen it.'),
      canClose ? h(T.Button, { size: 'sm', onClick: function () { app.actions.setClosed(g.id, false); } }, 'Reopen group') : null);
  } else if (ann.broadcast && !canBroadcast) {
    composer = h('div', { className: 'notice' }, h(T.Icon, { name: 'volume', size: 16 }), h('span', { className: 'grow' }, 'Broadcast mode is on. Only staff can post right now.'));
  } else {
    composer = h(T.Composer, {
      placeholder: 'Message #' + g.id, value: draft, onChange: setDraft, inputRef: inputRef, replyTo: replyTo ? { author: replyTo.author, text: messagePreview(replyTo) } : null,
      onCancelReply: function () { setReplyTo(null); },
      onSend: function (text) { atBottom.current = true; app.actions.sendGroup(g.id, text, { replyTo: replyTo ? { id: replyTo.id, author: replyTo.author, text: messagePreview(replyTo) } : null, channel: channel }); setReplyTo(null); },
      onEmoji: LIVE ? null : function () { app.ui.toast('The emoji picker is not part of this prototype.'); },
      onAttach: LIVE ? null : function () { app.ui.toast('Uploading media is not part of this prototype.'); },
      beforeSend: h(MessageStyleButton, null),
      aside: h(MenuButton, {
        up: true, items: Object.keys(CHANNELS).filter(function (k) { return k !== 'mod' || staff; }).map(function (k) {
          return { label: CHANNELS[k].label + (k === 'none' ? '' : ' channel'), swatch: CHANNELS[k].color || 'transparent', checked: channel === k, onSelect: function () { setChannel(k); } };
        }),
        renderTrigger: function (tp) {
          return h('button', Object.assign({ type: 'button', className: 'pillbtn chan-trigger', 'aria-label': 'Channel: ' + CHANNELS[channel].label }, tp),
            h('span', { style: { width: 8, height: 8, borderRadius: '50%', background: CHANNELS[channel].color || 'transparent', border: CHANNELS[channel].color ? 0 : '1.5px solid var(--text-3)' } }),
            h('span', { className: 'hide-mobile' }, CHANNELS[channel].label), h(T.Icon, { name: 'chevron-down', size: 12, className: 'hide-mobile' }));
        }
      })
    });
  }

  return h(Frag, null,
    h('main', { className: 'main' },
      h('header', { className: 'topbar' },
        h(MobileNavButton, null),
        h(T.Icon, { name: 'hash', size: 18, style: { color: 'var(--text-3)' } }),
        h('h1', null, g.id),
        h('span', { className: 'vsep' }),
        h('p', { className: 'topic' }, g.topic),
        h('span', { className: 'grow only-mobile' }),
        h('button', { type: 'button', className: 'pillbtn hide-mobile', 'aria-pressed': String(showMembers), onClick: function () { setShowMembers(!showMembers); } },
          h(T.Icon, { name: 'users', size: 16 }), LIVE && !g.membersLoaded && !g.liveCount ? 'Members' : online + ' online'),
        h(T.IconButton, { icon: 'info', label: 'Group info and members', className: 'only-mobile', onClick: function () { setInfoOpen(true); } }),
        h(T.IconButton, { icon: 'search', label: 'Search in this group', pressed: search != null, onClick: function () { setSearch(search == null ? '' : null); } }),
        h(T.IconButton, { icon: g.muted ? 'volume-x' : 'bell', label: g.muted ? 'Unmute group' : 'Mute group', pressed: g.muted, onClick: function () { app.actions.toggleMute(g.id); } }),
        h(MenuButton, {
          label: 'Group options', items: [
            canManage(g, me) || staff ? { label: 'Group settings', icon: 'sliders', onSelect: function () { app.nav({ view: 'gsettings', id: g.id, page: canManage(g, me) ? 'overview' : 'automod' }); } } : null,
            { label: g.favorite ? 'Remove from favorites' : 'Add to favorites', icon: 'star', onSelect: function () { app.actions.toggleFavorite(g.id); } },
            { label: 'Copy invite link', icon: 'link', onSelect: function () { copyText('https://' + g.id + '.chatango.com', function (ok) { app.ui.toast(ok ? 'Invite link copied.' : 'Copy failed. The link is ' + g.id + '.chatango.com'); }); } },
            { divider: true },
            { label: 'Leave group', icon: 'log-out', danger: true, onSelect: function () { app.ui.confirm({ title: 'Leave #' + g.id + '?', body: 'You can join again from Discover at any time.', confirmLabel: 'Leave group', danger: true, onConfirm: function () { app.actions.leaveGroup(g.id); } }); } }
          ]
        })),
      ann.enabled && ann.text && !g.dismissedAnnouncement ? h('div', { className: 'banner-wrap' },
        h(T.Banner, { title: 'Announcement', onDismiss: function () { app.update(function (d) { d.groups[g.id].dismissedAnnouncement = true; }); } },
          LIVE ? ann.displayText : ann.text, LIVE && ann.embeds.length ? h(MessageEmbeds, { embeds: ann.embeds }) : null)) : null,
      search != null ? h('div', { className: 'searchbar' },
        h('label', { htmlFor: 'gsearch', className: 'tc-sr' }, 'Search messages'),
        h('input', { id: 'gsearch', className: 'tc-input', type: 'search', placeholder: 'Search messages in #' + g.id, value: search, autoFocus: true, onChange: function (e) { setSearch(e.target.value); }, onKeyDown: function (e) { if (e.key === 'Escape') setSearch(null); } }),
        h(T.Button, { variant: 'ghost', size: 'sm', onClick: function () { setSearch(null); } }, 'Close')) : null,
      h('div', { className: 'log', role: 'log', 'aria-label': 'Messages in ' + g.id, ref: logRef, onScroll: onScroll },
        h('div', { className: 'log-inner' }, items)),
      jump ? h('button', { type: 'button', className: 'jump', onClick: toBottom }, h(T.Icon, { name: 'chevron-down', size: 14 }), 'New messages') : null,
      LIVE && g.conn && g.conn !== 'open' ? h('div', { className: 'banner-wrap' }, h(T.Banner, {
        tone: 'warning', icon: 'info', title: g.conn === 'connecting' ? 'Connecting to #' + g.id : 'Disconnected from #' + g.id,
        action: g.conn === 'closed' ? h(T.Button, { size: 'sm', onClick: function () { app.actions.reconnect(g.id); } }, 'Reconnect') : null
      }, g.conn === 'connecting' ? 'Messages you send now may not arrive.' : 'New messages will not arrive until you reconnect.')) : null,
      h('div', { className: 'composer-wrap' },
        h('p', { className: 'typing', 'aria-live': 'polite' }, typing.length ? h(Frag, null, h('span', { className: 'dots', 'aria-hidden': 'true' }, h('i'), h('i'), h('i')), h('b', null, typing.join(', ')), typing.length > 1 ? ' are typing' : ' is typing') : null),
        composer)),
    showMembers ? h(MembersPanel, { g: g }) : null,
    infoOpen ? h(GroupInfoSheet, { g: g, onClose: function () { setInfoOpen(false); } }) : null);
}
