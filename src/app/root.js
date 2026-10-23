/* ---------- Racine ---------- */
var THREAD_MAX = 500;
var IDLE_DELAY = 3 * MIN;

function Root(props) {
  var st = useState(function () { return props.boot && props.boot.auth ? props.boot : initialState(); }), state = st[0], setState = st[1];
  var stateRef = useRef(state); stateRef.current = state;
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
  var u10 = useState(0), themeTick = u10[1];
  var prefs = state.prefs;

  useEffect(function () {
    var hot = window.claude && window.claude.hot;
    if (hot && hot.snapshot) hot.snapshot(function () { return { state: stateRef.current }; });
  }, []);

  /* Thème, accent et préférences d'affichage appliqués à la racine */
  useEffect(function () {
    var root = ROOT_EL;
    if (prefs.theme === 'dark' || prefs.theme === 'light') root.setAttribute('data-theme', prefs.theme);
    else if (VIEWER_THEME) root.setAttribute('data-theme', VIEWER_THEME);
    else root.removeAttribute('data-theme');
    var acc = hexToRgb(prefs.accent) ? prefs.accent : '#f27a3f';
    root.style.setProperty('--accent', acc);
    root.style.setProperty('--on-accent', contrast(hexToRgb(acc), [15, 16, 18]) >= 4.5 ? '#0f1012' : '#ffffff');
    root.style.setProperty('--accent-text-d', ensureContrast(acc, '#16171a', 4.5));
    root.style.setProperty('--accent-text-l', ensureContrast(acc, '#ffffff', 4.5));
    root.style.setProperty('--accent-soft-d', rgba(acc, 0.12));
    root.style.setProperty('--accent-soft-l', rgba(acc, 0.14));
    root.style.setProperty('--msg-size', prefs.textSize + 'px');
    root.classList.toggle('reduce-motion', !!prefs.a11y.reduceMotion);
    root.classList.toggle('underline-links', !!prefs.a11y.underlineLinks);
    storageSet(PREFS_KEY, prefs);
  }, [prefs]);
  useEffect(function () {
    var mq; try { mq = window.matchMedia('(prefers-color-scheme: light)'); } catch (e) { return; }
    function onChange() { themeTick(function (n) { return n + 1; }); }
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    return function () { if (mq.removeEventListener) mq.removeEventListener('change', onChange); };
  }, []);

  /* Passage à idle des membres inactifs depuis IDLE_DELAY */
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

  /* Titre de l'onglet */
  useEffect(function () {
    if (!state.auth.loggedIn) { document.title = 'Torch'; return; }
    var n = unreadDmCount(state);
    Object.keys(state.groups).forEach(function (k) { n += state.groups[k].mentions || 0; });
    document.title = (prefs.tabTitle && n ? '(' + n + ') ' : '') + (prefs.privacy.usernameInTitle ? state.me + ' | ' : '') + 'Torch';
  });

  /* Raccourcis clavier globaux */
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

  function nav(route) {
    update(function (d) {
      var cur = d.route;
      if (cur && (cur.view === 'group' || cur.view === 'dm' || cur.view === 'discover')) d.lastChat = cur;
      var r = Object.assign({}, route);
      if (r.view === 'group' && d.groups[r.id]) { var g = d.groups[r.id]; r.markerTs = g.lastReadTs; g.lastReadTs = Date.now(); g.unread = 0; g.mentions = 0; }
      if (r.view === 'dm' && r.id && d.dms[r.id]) { d.dms[r.id].unread = 0; d.dms[r.id].lastReadTs = Date.now(); d.dms[r.id].closed = false; }
      d.route = r;
    });
    setNavOpen(false);
    if (LIVE) {
      if (route.view === 'group' && route.id) liveBridge.focus(route.id);
      liveBridge.focusPm(route.view === 'dm' && route.id ? route.id : false);
    }
  }

  /* Notifications d'un événement entrant, après la mise à jour de l'état */
  function notify(kind, info) {
    var p = stateRef.current.prefs, n = p.notify[kind];
    if (!n) return;
    var focused = document.visibilityState === 'visible' && (typeof document.hasFocus !== 'function' || document.hasFocus());
    if (n.sound && (!p.soundFocusOnly || focused)) beep(p.volume);
    if (n.app && info.toast) toast(info.toast, info.action ? { action: info.action, icon: info.icon, clamp: kind === 'pm' } : { icon: info.icon, clamp: kind === 'pm' });
    if (n.desktop && !focused) {
      try { if (window.Notification && window.Notification.permission === 'granted') new window.Notification('Torch', { body: info.toast }); } catch (e) { /* notifications système indisponibles */ }
    }
  }

  function trimThread(g) {
    if (g.messages.length <= THREAD_MAX) return;
    g.messages.splice(0, g.messages.length - THREAD_MAX);
    // Le compteur get_more de Torch ignore la coupe : une reprise sauterait les messages retirés.
    g.historyCapped = true;
  }
  function receiveGroup(gid, msg) {
    var s0 = stateRef.current, me = s0.me;
    var mention = msg.kind === 'msg' && new RegExp('@' + me + '(?![A-Za-z0-9_-])', 'i').test(msg.text);
    // Comme dans Torch, la mention d'un groupe coupé ou d'un auteur ignoré n'alerte pas, et les compteurs changent quand même.
    var quiet = !!(s0.groups[gid] && s0.groups[gid].muted) || !!userOf(s0, msg.author).ignored;
    var focused = s0.route.view === 'group' && s0.route.id === gid && document.visibilityState === 'visible';
    update(function (d) {
      var g = d.groups[gid]; if (!g) return;
      // La réponse est résolue sur l'état à jour : l'identifiant définitif de l'original peut arriver juste avant.
      if (LIVE && msg.replyId) withReply(g, msg);
      g.messages.push(msg);
      trimThread(g);
      if (msg.kind === 'msg' && !focused) { g.unread += 1; if (mention) g.mentions += 1; }
      if (focused) g.lastReadTs = Date.now();
    });
    if (mention && !quiet && !(s0.route.view === 'group' && s0.route.id === gid)) {
      notify('mentions', { toast: msg.author + ' mentioned you in #' + gid, icon: 'at-sign', action: { label: 'Open', run: function () { nav({ view: 'group', id: gid }); } } });
    }
  }
  function receiveDm(from, text) {
    var s0 = stateRef.current;
    var focused = s0.route.view === 'dm' && s0.route.id === from && document.visibilityState === 'visible';
    var isNew = !s0.dms[from];
    var friend = userOf(s0, from).friend, pmFrom = s0.prefs.privacy.pmFrom;
    var request = isNew && !friend && pmFrom !== 'everyone';
    update(function (d) {
      if (!d.dms[from]) d.dms[from] = { messages: [], unread: 0, lastReadTs: 0, request: request };
      var c = d.dms[from];
      c.closed = false;
      c.messages.push({ id: uid(), from: from, text: text, ts: Date.now() });
      if (!focused) c.unread += 1; else c.lastReadTs = Date.now();
      c.seenTs = Date.now();
    });
    if (!focused && !userOf(s0, from).ignored) notify('pm', { toast: s0.prefs.pmPreview ? from + ': ' + text : 'New message from ' + from, icon: 'message', action: { label: 'Reply', run: function () { nav({ view: 'dm', id: from }); } } });
  }
  /**
   * Permet d'annoncer le basculement d'un membre, en prototype comme en live.
   * @param {string} name Membre visé.
   * @param {string} key Marque basculée (friend, ignored, blocked ou unstyled).
   * @param {boolean} was Marque avant le basculement.
   */
  function toggleUserText(name, key, was) {
    return {
      friend: name + ' removed from friends.',
      ignored: was ? 'You no longer ignore ' + name + '.' : 'Ignoring ' + name + '.',
      blocked: was ? name + ' unblocked.' : name + ' blocked.',
      unstyled: was ? name + "'s style shown again." : name + "'s style hidden."
    }[key];
  }
  function setTyping(key, name, on) {
    update(function (d) {
      var list = (d.typing[key] || []).filter(function (n) { return n !== name; });
      if (on) list.push(name);
      d.typing[key] = list;
    });
  }

  var actions = {
    login: function (name) { update(function (d) { Object.assign(d, seedWorld(name)); d.auth = { loggedIn: true }; d.lastChat = { view: 'group', id: 'community' }; }); },
    logout: function () { update(function (d) { d.auth = { loggedIn: false }; }); setNavOpen(false); },
    resetDemo: function () { update(function (d) { var me = d.me; Object.assign(d, seedWorld(me)); }); toast('Sample data restored.'); },
    backToChat: function () { nav(stateRef.current.lastChat || { view: 'group', id: 'community' }); },
    setStatus: function (st2) { update(function (d) { d.meStatus = st2; }); },
    setMessageStyle: function (style) { update(function (d) { d.ownStyle = style; }); },
    sendGroup: function (gid, text, opts) {
      var me = stateRef.current.me;
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
        setTimeout(function () { setTyping(gid, who, true); }, 1200);
        setTimeout(function () { setTyping(gid, who, false); receiveGroup(gid, { id: uid(), kind: 'msg', author: who, text: '@' + me + ' ' + pick(['On it.', 'Sure, give me a minute.', 'Thanks, checking now.', 'Good point.']), ts: Date.now() }); }, 3400);
      }
    },
    sendDm: function (name, text) {
      var me = stateRef.current.me;
      update(function (d) { var c = d.dms[name]; c.messages.push({ id: uid(), from: me, text: text, ts: Date.now() }); c.seenTs = null; });
      var u = userOf(stateRef.current, name);
      if (u.status === 'offline' || u.blocked) return;
      var delay = 1500 + Math.random() * 1500;
      setTimeout(function () { update(function (d) { if (d.dms[name]) d.dms[name].seenTs = Date.now(); }); setTyping('dm:' + name, name, true); }, 900);
      setTimeout(function () { setTyping('dm:' + name, name, false); receiveDm(name, pick(DM_LINES[name] || DM_LINES.default)); }, 900 + delay);
    },
    openDm: function (name, tab) { update(function (d) { if (!d.dms[name]) d.dms[name] = { messages: [], unread: 0, lastReadTs: Date.now() }; }); nav({ view: 'dm', id: name, tab: tab }); },
    loadProfile: function () { /* prototype : profils déjà présents dans les données d'exemple */ },
    loadProfiles: function () { /* idem */ },
    searchPeople: function (f) {
      // Prototype : recherche parmi les membres d'exemple qui ne sont pas encore amis.
      var s0 = stateRef.current, q = String(f.query || '').toLowerCase();
      var list = Object.keys(s0.users).filter(function (n) { var u = s0.users[n]; return !u.friend && (!q || n.indexOf(q) >= 0 || String(u.location || '').toLowerCase().indexOf(q) >= 0) && (!f.online || u.status !== 'offline'); });
      update(function (d) { d.meet = { results: list, loading: false, error: null, done: true, filters: f }; });
    },
    /**
     * Permet de charger l'activité de son propre profil enregistrée par vissle.me.
     * @param {string} get Filtre vissle (all, log, like, dislike, msg ou refer).
     * @param {boolean} more Vrai pour ajouter la page suivante aux lignes déjà affichées.
     */
    loadVisitors: function (get, more) {
      var req = uid(), q = { page: more ? stateRef.current.visitors.next : 1, order: 'desc', get: get };
      update(function (d) { d.visitors = Object.assign({ rows: [], next: null }, more ? d.visitors : null, { get: get, loading: true, error: null, req: req }); });
      // Seule la dernière demande s'applique : un changement de filtre rend les réponses précédentes obsolètes.
      (LIVE ? liveBridge.visitors(q) : Promise.resolve(sampleVisits(q))).then(function (items) {
        var pg = visitorPage(items, get);
        update(function (d) { if (d.visitors.req === req) d.visitors = { get: get, rows: (more ? d.visitors.rows : []).concat(pg.rows), next: pg.next, loading: false, error: null, req: req }; });
      }, function (e) {
        update(function (d) { if (d.visitors.req === req) Object.assign(d.visitors, { loading: false, error: e.message }); });
      });
    },
    closeDm: function (name) {
      update(function (d) { d.dms[name].closed = true; d.dms[name].unread = 0; });
      var r = stateRef.current.route;
      if (r.view === 'dm' && r.id === name) nav({ view: 'dm', id: null });
    },
    deleteDm: function (name) { actions.closeDm(name); update(function (d) { d.dms[name].messages = []; }); },
    deleteAllDms: function () { update(function (d) { d.dms = {}; }); },
    declineRequest: function (name) { actions.closeDm(name); },
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
      update(function (d) { var g = d.groups[gid]; g.joined = false; g.favorite = false; g.members = g.members.filter(function (n) { return n !== me; }); });
      var next = Object.keys(stateRef.current.groups).filter(function (k) { return k !== gid && stateRef.current.groups[k].joined; })[0];
      nav(next ? { view: 'group', id: next } : { view: 'discover' });
    },
    createGroup: function (name, title, desc, listed) {
      var me = stateRef.current.me, now = Date.now();
      update(function (d) {
        var staff = {}; staff[me] = 'owner';
        d.groups[name] = {
          id: name, title: title, topic: desc || title, joined: true, favorite: false, muted: false, hiddenChannels: [], unread: 0, mentions: 0, lastReadTs: now,
          members: [me], guests: 0, closed: false, dismissedAnnouncement: false, bans: [],
          discover: listed ? { topic: 'Other', desc: desc || title } : null,
          settings: mkSettings({ overview: { title: title, description: desc, showInDiscovery: listed, membersPublic: true, nsfw: false }, staff: staff }),
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
      });
      toast('Message deleted.', { action: { label: 'Undo', run: function () { update(function (d) { d.groups[gid].messages.forEach(function (m) { if (m.id === mid) m.deleted = null; }); }); } } });
    },
    ban: function (gid, name, reason) {
      var me = stateRef.current.me, now = Date.now();
      update(function (d) {
        var g = d.groups[gid];
        g.bans.unshift({ name: name, by: me, at: now, reason: reason || 'Spam', ip: (40 + Math.floor(Math.random() * 180)) + '.' + Math.floor(Math.random() * 255) + '.x.x' });
        g.members = g.members.filter(function (n) { return n !== name; });
        if (g.settings.staff[name]) delete g.settings.staff[name];
        g.messages.push({ id: uid(), kind: 'ban', user: name, ts: now });
        g.audit.push({ id: uid(), at: now, actor: me, text: 'Banned ' + name + ' for ' + String(reason || 'spam').toLowerCase() });
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
      var labels = { overview: 'Updated group info', announcement: 'Updated the announcement', automod: 'Changed AutoMod settings', media: 'Changed media and link rules', roles: 'Changed role permissions' };
      update(function (d) {
        var g = d.groups[gid];
        Object.keys(labels).forEach(function (k) { if (JSON.stringify(old[k]) !== JSON.stringify(draft[k])) g.audit.push({ id: uid(), at: now, actor: me, text: labels[k] }); });
        Object.keys(Object.assign({}, old.staff, draft.staff)).forEach(function (n) {
          if (old.staff[n] !== draft.staff[n]) g.audit.push({ id: uid(), at: now, actor: me, text: draft.staff[n] ? 'Made ' + n + ' ' + ROLE_LONG[draft.staff[n]].toLowerCase() : 'Removed ' + n + ' from staff' });
        });
        if (old.announcement.text !== draft.announcement.text || (!old.announcement.enabled && draft.announcement.enabled)) g.dismissedAnnouncement = false;
        if (old.overview.title !== draft.overview.title) g.title = draft.overview.title;
        if (g.discover) g.discover.desc = draft.overview.description || g.discover.desc;
        g.settings = JSON.parse(JSON.stringify(draft));
      });
      toast('Changes to #' + gid + ' saved.', { icon: 'check' });
    }
  };

  /* Simulateur d'activité */
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
          setTyping(gid, author, true);
          setTimeout(function () { if (!alive) return; setTyping(gid, author, false); receiveGroup(gid, { id: uid(), kind: 'msg', author: author, text: text, ts: Date.now() }); }, 1600);
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
          setTyping('dm:' + from, from, true);
          setTimeout(function () { if (!alive) return; setTyping('dm:' + from, from, false); receiveDm(from, pick(DM_LINES[from] || DM_LINES.default)); }, 1800);
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

  /* ---------- Mode live : actions transmises à Chatango par le client Torch ---------- */
  var localRef = useRef(blankLocal());
  var profilePending = useRef({}), msgBgPending = useRef({});
  // Nom vérifié par New private message : son refus s'affiche dans la fenêtre, pas en toast.
  var pmAsked = useRef(null);
  var offlineCount = useRef(0);
  function skinKey(me) { return 'torch-skin:' + me; }
  function blankLocal() { return { hidden: [], channels: {}, unstyled: [], style: null }; }
  function lastMessageOf(g, name) {
    for (var i = g.messages.length - 1; i >= 0; i--) { var m = g.messages[i]; if (m.kind === 'msg' && m.author === name && m.unid) return m; }
    return null;
  }
  function wordList(v) { return String(v || '').split(/[,\n]/).map(function (x) { return x.trim(); }).filter(Boolean).join(','); }

  /**
   * Envoie uniquement ce que l'utilisateur a changé par rapport à la version qu'il a ouverte,
   * appliqué sur l'état serveur courant : les changements d'un autre modérateur entre-temps sont préservés.
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
      // Intervalle inchangé : on renvoie la valeur exacte en secondes plutôt que l'arrondi affiché.
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
   * Permet de basculer un drapeau de groupe tenu par une liste de Torch, sans rien changer si Torch ne l'enregistre pas.
   * @param {string} gid Groupe visé.
   * @param {string} key favorite ou muted.
   * @param {function(string, boolean): boolean} save Écriture du pont.
   * @param {string} failure Toast affiché si Torch n'enregistre pas.
   */
  function toggleTorchList(gid, key, save, failure) {
    var on = !stateRef.current.groups[gid][key];
    if (!save(gid, on)) { toast(failure); return; }
    update(function (d) { d.groups[gid][key] = on; });
  }
  /**
   * Permet d'envoyer un message de groupe construit par Torch avec le style perso, puis d'en garder le style.
   * @param {string} gid Groupe visé.
   * @param {string} text Texte saisi.
   * @param {{replyId: ?string, editId: ?string, channel: ?string}} opts Réponse ou original modifié, et canal.
   * @param {string} failure Toast affiché si rien n'est parti.
   */
  function sendStyled(gid, text, opts, failure) {
    var style = liveBridge.send(gid, text, Object.assign({ style: stateRef.current.ownStyle }, opts));
    if (style) setOwnStyle(style); else toast(failure);
  }

  if (LIVE) {
    actions.logout = function () { location.reload(); };
    actions.resetDemo = function () { toast('Not available in the test build.'); };
    actions.setStatus = function (st2) { if (liveBridge.setStatus(st2)) update(function (d) { d.meStatus = st2; }); };
    actions.sendGroup = function (gid, text, opts) {
      opts = opts || {};
      var replyId = opts.replyTo && opts.replyTo.id;
      if (replyId && !liveBridge.canReply(replyId)) { toast('Wait until this message is delivered before replying to it.'); return; }
      sendStyled(gid, text, { replyId: replyId, channel: opts.channel }, 'Message not sent. Torch rejected it.');
    };
    // Modifier une modification affichée à part vise son original, seul message visible chez les autres membres.
    actions.editMessage = function (gid, m, text) { sendStyled(gid, text, { editId: m.editId || m.id, channel: m.channel }, 'Message not edited. Torch rejected it.'); };
    actions.sendDm = function (name, text) {
      var me = stateRef.current.me;
      var sent = liveBridge.sendPm(name, text, stateRef.current.ownStyle);
      if (!sent) { toast('Private message not sent.'); return; }
      update(function (d) { var c = d.dms[name] || (d.dms[name] = { messages: [], unread: 0, lastReadTs: Date.now() }); c.messages.push({ id: uid(), from: me, text: sent.text, parts: sent.parts, embeds: sent.embeds, ts: Date.now() }); });
      setOwnStyle(sent.style);
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
    actions.toggleFavorite = function (gid) { toggleTorchList(gid, 'favorite', liveBridge.setFavorite, 'Torch could not save this favorite. Reload the page and try again.'); };
    actions.toggleMute = function (gid) { toggleTorchList(gid, 'muted', liveBridge.setMuted, 'Torch could not save the mute for #' + gid + '. Reload the page and try again.'); };
    actions.leaveGroup = function (gid) {
      liveBridge.leave(gid);
      var kept = !!(stateRef.current.groups[gid] && stateRef.current.groups[gid].favorite) && !liveBridge.setFavorite(gid, false);
      if (kept) toast('Torch could not remove #' + gid + ' from favorites. Reload the page and try again.');
      update(function (d) { if (d.groups[gid]) { d.groups[gid].joined = false; d.groups[gid].favorite = kept; } });
      var next = Object.keys(stateRef.current.groups).filter(function (k) { return k !== gid && stateRef.current.groups[k].joined; })[0];
      nav(next ? { view: 'group', id: next } : { view: 'discover' });
    };
    actions.reconnect = function (gid) {
      liveBridge.reconnect(gid);
      update(function (d) { var g = d.groups[gid]; if (g) g.conn = 'connecting'; if (gid === 'private_message') d.pmConn = 'connecting'; });
    };
    actions.reconnectSession = function () {
      reconnectClosed();
      update(function (d) { if (d.session) d.session.attempts += 1; });
    };
    actions.loadProfile = function (name) {
      var pending = profilePending.current;
      // true marque un profil en file d'attente de loadProfiles : il n'a pas encore de requête à partager.
      if (pending[name] && pending[name] !== true) return pending[name];
      var run = liveBridge.fetchProfile(name).then(function (pr) {
        update(function (d) {
          var u = ensureLiveUser(d, name);
          u.profileLoaded = true; u.profileMissing = !!pr.missing;
          if (!pr.missing) { u.age = pr.age; u.gender = pr.gender; u.location = pr.location; u.aboutHtml = pr.about; u.premium = pr.premium; u.miniStyle = pr.mini; }
        });
      }, function () {
        // La fiche reste avec ce que l'on sait déjà : seule une ouverture explicite le redemande.
        update(function (d) { ensureLiveUser(d, name).profileFailed = true; });
      }).then(function () { delete pending[name]; });
      pending[name] = run;
      return run;
    };
    /**
     * Permet de lire le fond de message Premium d'un membre, gardé dans l'état jusqu'à ce qu'il change.
     * @param {string} name Membre visé.
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
    /** Mini profils d'une liste de résultats, quatre requêtes à la fois pour ménager Chatango. */
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
     * Permet de vérifier auprès de Chatango le correspondant d'un nouveau MP, comme Torch avant de l'ouvrir.
     * @param {string} name Correspondant visé.
     * @returns {boolean} Vrai si la demande est partie, faux si la connexion privée n'est pas ouverte.
     */
    actions.checkPm = function (name) {
      if (!liveBridge.connectPm(name)) return false;
      pmAsked.current = name;
      return true;
    };
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
    actions.loadMore = function (gid) {
      var result = liveBridge.loadMore(gid);
      // Échec : le pont l'annonce et la sentinelle reste en place pour réessayer.
      if (result === 'failed') return;
      update(function (d) { var g = d.groups[gid]; if (!g) return; if (result === 'sent') g.loadingMore = true; else g.historyDone = true; });
    };
    actions.toggleUser = function (name, key) {
      var was = !!userOf(stateRef.current, name)[key];
      if (key === 'friend' && !was) {
        if (!liveBridge.addFriend(name)) return;
        var asked = Date.now();
        update(function (d) { d.friendAdds[name] = asked; });
        setTimeout(function () {
          if (stateRef.current.friendAdds[name] !== asked) return;
          update(function (d) { delete d.friendAdds[name]; });
          toast("Chatango didn't confirm adding " + name + ' to friends.');
        }, CONFIRM_TIMEOUT);
        return;
      }
      if (key === 'friend' && !liveBridge.removeFriend(name)) return;
      if (key === 'blocked' && !(was ? liveBridge.unblock(name) : liveBridge.block(name))) return;
      if (key === 'ignored' && !liveBridge.setIgnored(name, !was)) { toast('Torch could not save its ignore list. Reload the page and try again.'); return; }
      update(function (d) { ensureLiveUser(d, name)[key] = !was; });
      toast(toggleUserText(name, key, was), { action: { label: 'Undo', run: function () { actions.toggleUser(name, key); } } });
    };
    actions.deleteDm = function (name) {
      liveBridge.clearPmHistory(name);
      actions.closeDm(name);
      update(function (d) { d.dms[name].messages = []; });
    };
    actions.deleteAllDms = function () {
      Object.keys(stateRef.current.dms).forEach(function (n) { liveBridge.clearPmHistory(n); actions.closeDm(n); });
      update(function (d) { Object.keys(d.dms).forEach(function (n) { d.dms[n].messages = []; }); });
    };
    actions.createGroup = function (name, title, desc, listed) {
      return liveBridge.createGroup({ name: name, title: title, description: desc, discovery: listed }).then(function () {
        actions.joinGroup(name);
        return true;
      }, function (e) { toast(e && e.message ? e.message : 'Chatango refused to create the group.'); return false; });
    };
    actions.deleteMessage = function (gid, mid) {
      if (String(mid).indexOf('k:') === 0) { toast('This message is still being delivered. Try again in a moment.'); return; }
      var m = findMsg(stateRef.current.groups[gid], mid);
      // Comme Torch : l'original, puis chacune de ses modifications dont Chatango a donné l'identifiant définitif.
      [mid].concat((m && m.editIds) || []).filter(liveBridge.canReply).forEach(function (id) { liveBridge.deleteMessage(gid, id); });
    };
    actions.deleteAllFrom = function (gid, name, msg) {
      var g = stateRef.current.groups[gid], m = msg && msg.unid ? msg : g && lastMessageOf(g, name);
      if (!m) { toast('No recent message from ' + name + ' in #' + gid + '.'); return; }
      liveBridge.deleteAllFrom(gid, m);
    };
    actions.ban = function (gid, name, reason, opts) {
      var g = stateRef.current.groups[gid], m = opts && opts.msg && opts.msg.unid ? opts.msg : null;
      // Les invités et anonymes peuvent partager un nom : on ne les bannit qu'à partir du message choisi.
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
    actions.requestBans = function (gid) { liveBridge.banList(gid); };
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
   * Permet d'ajouter un membre que l'état ne connaît pas encore, hors ligne par défaut tant que son statut est inconnu.
   * @param {Object} d État en cours de modification.
   * @param {string} name Membre visé.
   */
  function ensureUnseenUser(d, name) {
    if (!d.users[name]) ensureLiveUser(d, name).status = 'offline';
  }
  /**
   * Permet de compter en ligne un membre présent dans un groupe, sauf un ami dont la connexion privée donne la présence.
   * @param {Object} d État en cours de modification.
   * @param {string} name Membre visé.
   */
  function ensurePresentUser(d, name) {
    var u = ensureLiveUser(d, name);
    if (u.status === 'offline' && !u.friend) u.status = 'online';
  }
  /**
   * Permet d'appliquer à un membre une présence reçue du pont.
   * @param {Object} u Membre dans l'état.
   * @param {{status: string, lastOn: number, idleSince: number}} x Présence reçue.
   */
  function applyPresence(u, x) {
    // Avant IDLE_DELAY, un membre inactif reste affiché online : idleSince seul garde l'inactivité.
    u.idleSince = x.status === 'idle' ? x.idleSince || u.idleSince || Date.now() : 0;
    u.status = x.status === 'idle' && Date.now() - u.idleSince < IDLE_DELAY ? 'online' : x.status;
    if (x.lastOn) u.lastOn = x.lastOn;
  }
  /**
   * Permet de fusionner le style d'un message dans celui du membre.
   * @param {Object} u Membre dans l'état.
   * @param {?Object} style Style lu dans le message.
   * @param {number} ts Horodatage du message en millisecondes.
   */
  function mergeStyle(u, style, ts) {
    if (!style || ts <= u.styleTs) return;
    u.style = Object.assign({}, u.style, style);
    u.styleTs = ts;
  }
  function setOwnStyle(style) {
    update(function (d) {
      var u = ensureLiveUser(d, d.me);
      // Fusion sans mergeStyle : l'horloge locale peut retarder sur l'horodatage serveur des messages reçus.
      u.style = Object.assign({}, u.style, style);
      u.styleTs = Math.max(u.styleTs || 0, Date.now());
    });
  }
  /** Traduit l'état Chatango d'un groupe (drapeaux, modérateurs, annonce) dans le modèle de l'interface. */
  function deriveLive(g) {
    var L = g.live, F = GROUP_FLAG, f = L.flags, s = g.settings, staff = {};
    if (L.owner) staff[L.owner] = 'owner';
    Object.keys(L.mods).forEach(function (n) { if (n !== L.owner) staff[n] = liveRole(L.mods[n]); });
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
  function applyEdit(o, m) { o.text = m.text; o.parts = m.parts; o.embeds = m.embeds; o.edited = true; }
  /**
   * Permet d'appliquer une modification de groupe à l'original en gardant son compte et ses identifiants.
   * @param {Object} o Message original.
   * @param {{id: string, text: string, parts: ?Array, embeds: ?Array}} m Message de modification.
   * @param {boolean=} keepText Vrai pour compter la modification sans remplacer le texte.
   */
  function applyGroupEdit(o, m, keepText) {
    o.editCount = (o.editCount || 0) + 1;
    o.editIds = (o.editIds || []).concat([m.id]);
    if (!keepText) applyEdit(o, m);
  }
  /**
   * Permet de reprendre dans un original arrivé après elles ses modifications affichées à part, la plus récente en dernier.
   * @param {Object} g Groupe dans l'état.
   * @param {Object} o Message original, pas encore dans le fil.
   */
  function mergeEdits(g, o) {
    var edits = g.messages.filter(function (x) { return x.editId === o.id && x.author === o.author; });
    if (!edits.length) return;
    edits.sort(function (a, b) { return a.ts - b.ts; }).forEach(function (e) { applyGroupEdit(o, e); });
    g.messages = g.messages.filter(function (x) { return edits.indexOf(x) < 0; });
  }
  // Mots et médias en ensemble trié : Torch archive l'URL d'image tapée dans le texte sous forme de balise <i s>.
  function pmContentKey(m) {
    var media = (m.embeds || []).map(function (e) { return e.kind === 'youtube' ? 'yt:' + e.id : e.url; });
    return String(m.text).split(/\s+/).concat(media).filter(Boolean).sort().filter(function (v, i, a) { return v !== a[i - 1]; }).join(' ');
  }
  function pmEditTarget(c, m) { return m.editId ? c.messages.find(function (x) { return x.key === m.editId && x.from === m.from; }) : null; }
  function pmMessage(x) {
    // Modification sans original chargé : elle prend la clé de l'original, que visent l'archive et les modifications suivantes.
    var m = { id: uid(), from: x.from, key: x.editId || x.key, text: x.text, parts: x.parts, embeds: x.embeds, ts: x.ts };
    if (x.editId) m.edited = true;
    return m;
  }
  function groupUpdate(gid, fn) { update(function (d) { if (!d.auth.loggedIn) return; var g = d.groups[gid]; if (g) fn(g, d); }); }
  /**
   * Permet de relancer les connexions fermées.
   */
  function reconnectClosed() {
    var s0 = stateRef.current, held = s0.session && SESSION_RANK[s0.session.reason] >= SESSION_RANK.kicked;
    Object.keys(s0.groups).forEach(function (gid) { var g = s0.groups[gid]; if (g.joined && g.conn === 'closed') actions.reconnect(gid); });
    if (s0.pmConn === 'closed' && !held) actions.reconnect('private_message');
  }

  function handleLiveOp(op) {
    switch (op.op) {
      case 'login': {
        var stored = storageGet(skinKey(op.me)) || {}, raw = JSON.stringify(stored);
        var lists = { fav: liveBridge.setFavorite, muted: liveBridge.setMuted, ignored: liveBridge.setIgnored };
        // Listes d'avant la synchronisation avec Torch : versées dans les siennes, retirées du stockage local une fois toutes acceptées.
        Object.keys(lists).forEach(function (k) { if (stored[k] && stored[k].map(function (x) { return lists[k](x, true); }).every(Boolean)) delete stored[k]; });
        if (JSON.stringify(stored) !== raw) storageSet(skinKey(op.me), stored);
        localRef.current = Object.assign(blankLocal(), stored);
        update(function (d) {
          Object.assign(d, liveWorld(op.me)); d.ownStyle = localRef.current.style && Object.assign({}, DEFAULT_MESSAGE_STYLE, localRef.current.style); d.auth = { loggedIn: true };
          (liveBridge.ignoredUsers() || []).forEach(function (n) { ensureUnseenUser(d, n); });
          Object.keys(TORCH_PREFS).forEach(function (path) { var v = liveBridge.setting(TORCH_PREFS[path]); if (v !== null) setIn(d.prefs, path, v); });
        });
        // Un compte sans groupe rejoint ne reçoit aucune trame de groupe.
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
          // Rejoindre rappelle renderGroup avec recent: true, owned ne revient donc jamais à faux.
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
          // Modification : appliquée à l'original s'il est chargé, sinon affichée comme un message modifié qui garde sa référence.
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
          // Historique reçu du plus récent au plus ancien : comme Torch, un original déjà modifié garde son texte.
          if (o) { applyGroupEdit(o, hm, o.edited); return; }
          if (hm.editId) hm.edited = true;
          else { delete hm.editId; mergeEdits(g, hm); }
          g.messages.push(withReply(g, hm));
          g.messages.sort(function (a, b) { return a.ts - b.ts; });
          trimThread(g);
        });
        break;
      }
      case 'msgid': groupUpdate(op.gid, function (g) {
        g.messages.forEach(function (x) {
          if (x.id === op.tmp) x.id = op.id;
          if (x.replyTo && x.replyTo.id === op.tmp) x.replyTo.id = op.id;
          if (x.editIds) x.editIds = x.editIds.map(function (id) { return id === op.tmp ? op.id : id; });
        });
      }); break;
      case 'del': groupUpdate(op.gid, function (g) {
        function hit(id) { return op.ids.indexOf(String(id).replace(/^k:/, '')) >= 0; }
        // Une modification affichée à part disparaît avec son original, même quand celui-ci n'est pas chargé.
        g.messages = g.messages.filter(function (x) { return !(x.editId && hit(x.editId)); });
        g.messages.forEach(function (x) { if (hit(x.id)) x.deleted = { by: 'staff' }; });
      }); break;
      case 'cleared': groupUpdate(op.gid, function (g) { g.messages = [{ id: uid(), kind: 'system', text: 'All messages in #' + g.id + ' were cleared.', ts: Date.now() }]; }); break;
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
        liveBridge.requestAnnouncement(op.gid);
        // Torch charge le titre et la description du groupe juste après la connexion.
        setTimeout(function () {
          var info = liveBridge.roomInfo(op.gid);
          if (info) handleLiveOp({ op: 'info', gid: op.gid, title: info.title, description: info.description });
        }, 3000);
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
      case 'bans': groupUpdate(op.gid, function (g) { g.bans = op.list; g.live.bansLoaded = true; }); break;
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
        g.bans = g.bans.filter(function (b) { return !op.list.some(function (x) { return x.unid === b.unid && x.ip === b.ip; }); });
      }); break;
      case 'unbannedAll': groupUpdate(op.gid, function (g) { g.bans = []; }); break;
      case 'modlog': groupUpdate(op.gid, function (g) {
        var known = {}, list = (g.live.modlog || []).slice();
        list.forEach(function (x) { known[x.id] = true; });
        op.list.forEach(function (x) { if (!known[x.id]) list.push(x); });
        list.sort(function (a, b) { return b.at - a.at; });
        g.live.modlog = list;
      }); break;
      case 'conn': update(function (d) {
        if (op.gid === 'private_message') d.pmConn = op.state;
        if (!d.auth.loggedIn) return;
        var g = d.groups[op.gid];
        // Une demande d'historique en cours ne reçoit plus de réponse sur un socket fermé.
        if (g && g.joined) { g.conn = op.state; if (op.state !== 'open') g.loadingMore = false; }
        d.session = sessionAfterConn(d, op);
      }); break;
      case 'session': update(function (d) {
        if (!d.session || SESSION_RANK[op.reason] >= SESSION_RANK[d.session.reason]) d.session = { reason: op.reason, attempts: 0 };
      }); break;
      case 'online':
        reconnectClosed();
        update(function (d) {
          var open = d.pmConn === 'open' || Object.keys(d.groups).some(function (k) { return d.groups[k].joined && d.groups[k].conn === 'open'; });
          // Coupure brève : les sockets restés ouverts ne changent pas d'état, aucune trame conn ne lèverait la fenêtre.
          if (d.session && d.session.reason === 'offline' && open) d.session = null;
        });
        break;
      // Torch adresse ses notices au groupe qu'il croit ouvert : un toast évite de les écrire dans le mauvais fil.
      case 'notice': toast(op.text, { icon: 'info' }); break;
      case 'alert': if (!stateRef.current.session) toast(op.text, op.button && op.action ? { icon: 'info', action: { label: op.button, run: op.action } } : { icon: 'info' }); break;
      case 'pm': {
        var s0 = stateRef.current;
        var focused = s0.route.view === 'dm' && s0.route.id === op.from && document.visibilityState === 'visible';
        // Comme dans Torch, le MP d'un membre ignoré est reçu et archivé, sans alerte.
        var ignored = !!userOf(s0, op.from).ignored;
        var edit = !!(s0.dms[op.from] && pmEditTarget(s0.dms[op.from], op));
        update(function (d) {
          if (!d.auth.loggedIn) return;
          mergeStyle(ensureLiveUser(d, op.from), op.style, op.ts);
          var c = d.dms[op.from] || (d.dms[op.from] = { messages: [], unread: 0, lastReadTs: 0 });
          var o = pmEditTarget(c, op);
          if (o) { applyEdit(o, op); return; }
          c.closed = false;
          c.messages.push(pmMessage(op));
          c.messages.sort(function (a, b) { return a.ts - b.ts; });
          if (!focused) c.unread += 1;
        });
        if (edit) break;
        if (!focused && !op.offline && !ignored) notify('pm', { toast: s0.prefs.pmPreview ? op.from + ': ' + messagePreview(op) : 'New message from ' + op.from, icon: 'message', action: { label: 'Reply', run: function () { nav({ view: 'dm', id: op.from }); } } });
        // Torch sonne lui-même pour le MP de client.private.focus, remis à false à chaque connexion privée : la route ne suffit pas.
        if (!op.offline && !ignored && op.from !== s0.me && op.from !== liveBridge.focusedPm()) {
          var sounds = liveBridge.torchSounds();
          // Lecture refusée par le navigateur : silence voulu, sans toast.
          if (sounds && sounds.play_mention) liveBridge.playTorchSound('mention').then(null, function () {});
        }
        // Les msgoff arrivent en rafale juste après la connexion : une seule notification pour toute la rafale.
        if (op.offline && !ignored && !offlineCount.current++) setTimeout(function () {
          var n = offlineCount.current;
          offlineCount.current = 0;
          notify('pm', { toast: plural(n, 'message', 'messages') + ' received while you were away.', icon: 'message', action: { label: 'Open', run: function () { nav({ view: 'dm', id: null }); } } });
        }, 1500);
        break;
      }
      case 'pmReady':
        liveBridge.pmHistory(100).then(function (hist) {
          update(function (d) {
            if (!d.auth.loggedIn) return;
            d.pmLoaded = true;
            Object.keys(hist).forEach(function (t) {
              if (t === d.me) return;
              ensureLiveUser(d, t);
              var c = d.dms[t] || (d.dms[t] = { messages: [], unread: 0, lastReadTs: Date.now(), closed: localRef.current.hidden.indexOf(t) >= 0 });
              // L'horodatage archivé par Torch diffère du nôtre : même auteur et même contenu à deux minutes près = même message. Chaque message déjà affiché ne couvre qu'une entrée.
              var shown = c.messages.slice();
              function claim(x) {
                var k = pmContentKey(x);
                for (var i = 0; i < shown.length; i++) {
                  var y = shown[i];
                  // Même clé = même message, même si une modification a changé son texte.
                  if (x.key && y.key ? y.key === x.key : y.from === x.from && pmContentKey(y) === k && Math.abs(y.ts - x.ts) < 120000) { shown.splice(i, 1); return true; }
                }
                return false;
              }
              hist[t].forEach(function (x) {
                mergeStyle(ensureLiveUser(d, x.from), x.style, x.ts);
                var o = pmEditTarget(c, x);
                if (o) { applyEdit(o, x); return; }
                var m = pmMessage(x);
                if (!claim(m)) c.messages.push(m);
              });
              c.messages.sort(function (a, b) { return a.ts - b.ts; });
            });
          });
        });
        break;
      case 'friends':
        update(function (d) {
          if (!op.added) d.friendsLoaded = true;
          op.list.forEach(function (f) { var u = ensureLiveUser(d, f.name); u.friend = true; applyPresence(u, f); delete d.friendAdds[f.name]; });
        });
        break;
      case 'friendRefused':
        update(function (d) { delete d.friendAdds[op.name]; });
        toast(unknownUserText(op.name), { icon: 'info' });
        break;
      case 'pmChecked': {
        var asked = pmAsked.current === op.name;
        if (asked) pmAsked.current = null;
        update(function (d) { d.pmChecked = { name: op.name, found: op.found, ts: Date.now() }; });
        if (!op.found && !asked && stateRef.current.dms[op.name]) toast(unknownUserText(op.name), { icon: 'info' });
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
  /* Conversations masquées, canaux masqués, membres au style coupé et style perso, conservés par compte dans ce navigateur */
  useEffect(function () {
    if (!LIVE || !state.auth.loggedIn || !state.me) return;
    var prev = localRef.current, o = blankLocal();
    o.style = state.ownStyle;
    // Favoris, sourdines et membres ignorés locaux que Torch n'a pas encore acceptés : gardés pour la prochaine connexion.
    o.fav = prev.fav;
    o.muted = prev.muted;
    o.ignored = prev.ignored;
    prev.hidden.forEach(function (n) { if (!state.dms[n]) o.hidden.push(n); });
    Object.keys(state.dms).forEach(function (n) { if (state.dms[n].closed) o.hidden.push(n); });
    Object.keys(prev.channels).forEach(function (k) { if (!state.groups[k]) o.channels[k] = prev.channels[k]; });
    Object.keys(state.groups).forEach(function (k) { if (state.groups[k].hiddenChannels.length) o.channels[k] = state.groups[k].hiddenChannels; });
    prev.unstyled.forEach(function (n) { if (!state.users[n]) o.unstyled.push(n); });
    Object.keys(state.users).forEach(function (n) { if (state.users[n].unstyled) o.unstyled.push(n); });
    if (JSON.stringify(o) !== JSON.stringify(prev)) { localRef.current = o; storageSet(skinKey(state.me), o); }
  });
  useEffect(function () { if (LIVE && liveBridge) return liveBridge.onOp(handleLiveOp); }, []);

  var ui = {
    toast: toast,
    confirm: setConfirm,
    openProfile: function (name, gid) { setProfile({ name: name, gid: gid }); },
    openFullProfile: function (name) { setFullProfile(name); },
    openLink: setLinkUrl,
    openProfileLink: setProfileLink,
    openPalette: function () { setPalette(true); setNavOpen(false); },
    openCreate: function (prefill) { setCreate({ prefill: prefill || '' }); setNavOpen(false); },
    openNewDm: function () { setNewDm(true); setNavOpen(false); },
    ban: function (name, gid, msg) { setBan({ name: name, gid: gid, msg: msg || null }); },
    openNav: function () { setNavOpen(true); },
    closeNav: function () { setNavOpen(false); }
  };
  var app = { state: state, update: update, nav: nav, actions: actions, ui: ui, navOpen: navOpen, theme: resolvedTheme(prefs, VIEWER_THEME) };

  return h(Ctx.Provider, { value: app },
    state.auth.loggedIn ? h(Shell, null) : LIVE ? null : h(Login, null),
    state.auth.loggedIn && profile ? h(ProfileDialog, { name: profile.name, gid: profile.gid, onClose: function () { setProfile(null); } }) : null,
    state.auth.loggedIn && banCfg ? h(BanDialog, { name: banCfg.name, gid: banCfg.gid, msg: banCfg.msg, onClose: function () { setBan(null); } }) : null,
    state.auth.loggedIn && fullProfile ? h(FullProfileDialog, { name: fullProfile, onClose: function () { setFullProfile(null); } }) : null,
    linkUrl ? h(LinkDialog, { url: linkUrl, onClose: function () { setLinkUrl(null); } }) : null,
    profileLink ? h(ProfileLinkDialog, { link: profileLink, onClose: function () { setProfileLink(null); } }) : null,
    state.auth.loggedIn && palette ? h(Palette, { onClose: function () { setPalette(false); } }) : null,
    state.auth.loggedIn && create ? h(CreateGroupDialog, { prefill: create.prefill, onClose: function () { setCreate(null); } }) : null,
    state.auth.loggedIn && newDm ? h(NewDmDialog, { onClose: function () { setNewDm(false); } }) : null,
    confirmCfg ? h(ConfirmDialog, { confirm: confirmCfg, onClose: function () { setConfirm(null); } }) : null,
    state.auth.loggedIn && state.session ? h(SessionOverlay, { session: state.session }) : null,
    h(Toasts, { toasts: toasts, dismiss: dismissToast }));
}
