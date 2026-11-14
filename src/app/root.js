/* ---------- Root ---------- */
var IDLE_DELAY = 3 * MIN;
/**
 * Returns the first stable version of a list of release tags.
 * @param {Array} tags Tags newest first, untrusted.
 * @returns {?string} Version without its v, null if no tag is vX.Y.Z.
 */
function firstStableVersion(tags) {
  for (var i = 0; i < tags.length; i++) { var m = /^v(\d+\.\d+\.\d+)$/.exec(tags[i]); if (m) return m[1]; }
  return null;
}
/**
 * Reads the version of the latest stable Nightango release published on GitHub.
 * @returns {Promise<?string>} Version without its v, null if the reply does not give one.
 */
function latestGithubVersion() {
  return fetch('https://api.github.com/repos/marjoriedotdev/nightango/releases/latest').then(function (r) {
    if (!r.ok) return null;
    return r.json().then(function (data) { return firstStableVersion([data && data.tag_name]); });
  });
}
/**
 * Reads the version of the latest stable Nightango release published on GitLab.
 * @returns {Promise<?string>} Version without its v, null if the reply does not give one.
 */
function latestGitlabVersion() {
  return fetch('https://gitlab.com/api/v4/projects/marjoriedotdev%2Fnightango/releases?order_by=released_at&sort=desc&per_page=20').then(function (r) {
    if (!r.ok) return null;
    // GitLab has no prerelease flag: a beta can be the newest release, the first stable tag is the latest version.
    return r.json().then(function (list) { return firstStableVersion(Array.isArray(list) ? list.map(function (x) { return x && x.tag_name; }) : []); });
  });
}
var RELEASE_PAGES = { github: REPO_URLS.github + '/releases/tag/v', gitlab: REPO_URLS.gitlab + '/-/releases/v' };
/**
 * Asks GitHub and GitLab for their latest stable release and keeps the newest one. A host that fails is noted in the diagnostic journal.
 * @returns {Promise<?{version: string, url: string}>} Version and its release page, null if neither host gives one.
 */
function fetchLatestRelease() {
  function from(host, read) {
    return read().then(function (v) { return v ? { version: v, url: RELEASE_PAGES[host] + v } : null; }, function () {
      if (JOURNAL) JOURNAL.add('app', 'Update check failed on ' + host);
      return null;
    });
  }
  return Promise.all([from('github', latestGithubVersion), from('gitlab', latestGitlabVersion)]).then(function (found) {
    return found.reduce(function (best, x) { return x && (!best || isNewerVersion(x.version, best.version)) ? x : best; }, null);
  });
}

/**
 * Store of the application state: each update applies at once to a draft of the latest state, and the interface shows the result right away,
 * or on the next animation frame for the updates made in inAnimationFrame, so that the operations of one animation frame make one render.
 * The work held with atFrame runs on that animation frame, before the state is shown.
 * @param {Object} initial First state.
 * @returns {{shown: function(): Object, subscribe: Function, ref: {current: Object}, update: function(function(Object)), inAnimationFrame: function(Function), atFrame: function(Function)}}
 *   State shown by the interface and its subscription, ref to the latest state, update, scope whose updates wait for the next animation frame,
 *   and work held until it.
 */
function appStore(initial) {
  var ref = { current: initial }, shown = initial, batched = 0, pending = null, held = [], listeners = [];
  function cancel() {
    if (pending) { if (pending.frame) cancelAnimationFrame(pending.frame); else clearTimeout(pending.timer); pending = null; }
  }
  function flush() {
    cancel();
    var work = held;
    held = [];
    batched++;
    try { work.forEach(function (fn) { fn(); }); } finally { batched--; }
    // The updates of the held work asked for a frame of their own: they show with this one.
    cancel();
    if (ref.current === shown) return;
    shown = ref.current;
    listeners.slice().forEach(function (l) { l(); });
  }
  // requestAnimationFrame does not run in a hidden tab: there the updates go out on the next timer.
  function schedule() {
    if (!pending) pending = document.visibilityState === 'visible' ? { frame: requestAnimationFrame(flush) } : { timer: setTimeout(flush, 0) };
  }
  document.addEventListener('visibilitychange', function () { if (pending && pending.frame && document.visibilityState !== 'visible') flush(); });
  return {
    shown: function () { return shown; },
    subscribe: function (l) {
      listeners.push(l);
      return function () { listeners = listeners.filter(function (x) { return x !== l; }); };
    },
    ref: ref,
    update: function (fn) {
      var draft = openDraft(ref.current);
      // An update that throws changes nothing.
      try { fn(draft.root); } catch (e) { draft.finish(); throw e; }
      ref.current = draft.finish();
      if (batched) schedule(); else flush();
    },
    inAnimationFrame: function (fn) {
      batched++;
      try { fn(); } finally { batched--; }
    },
    atFrame: function (fn) {
      held.push(fn);
      schedule();
    }
  };
}

/**
 * Application state, with a ref to the latest state that handlers read and its update.
 * @param {?Object} boot State handed by the prototype hook.
 * @returns {{state: Object, stateRef: Object, update: function(function(Object)), inAnimationFrame: function(Function), atFrame: function(Function), store: Object}}
 *   State of this render, ref to the latest state, update, scope whose updates wait for the next animation frame, work held until it,
 *   and the store (appStore).
 */
function useAppState(boot) {
  var store = useState(function () { return appStore(boot && boot.auth ? boot : initialState()); })[0];
  var state = useSyncExternalStore(store.subscribe, store.shown);
  /*PROTOTYPE*/
  useEffect(function () {
    var hot = window.claude && window.claude.hot;
    if (hot && hot.snapshot) hot.snapshot(function () { return { state: store.ref.current }; });
  }, []);
  /*END PROTOTYPE*/
  return { state: state, stateRef: store.ref, update: store.update, inAnimationFrame: store.inAnimationFrame, atFrame: store.atFrame, store: store };
}

/**
 * Applies the theme, accent and display preferences to the root, keeps the preferences in this browser and follows the system theme.
 * @param {Object} prefs Preferences.
 * @returns {?string} Season whose decorations are shown, null outside one or when they are turned off.
 */
function useDisplayPrefs(prefs) {
  var rerender = useState(0)[1];
  // Read on each render: a page left open past the last day of a season loses its decorations without a reload.
  var season = prefs.sky.season ? seasonOf(new Date(), prefs.sky.south) : null;
  useEffect(function () {
    var root = ROOT_EL;
    if (prefs.theme === 'dark' || prefs.theme === 'light') root.setAttribute('data-theme', prefs.theme);
    else if (VIEWER_THEME) root.setAttribute('data-theme', VIEWER_THEME);
    else root.removeAttribute('data-theme');
    var acc = accentTokens(prefs.accent);
    root.style.setProperty('--accent', acc.accent);
    root.style.setProperty('--on-accent', acc.onAccent);
    root.style.setProperty('--accent-text-d', acc.text.dark);
    root.style.setProperty('--accent-text-l', acc.text.light);
    root.style.setProperty('--accent-soft-d', acc.soft.dark);
    root.style.setProperty('--accent-soft-l', acc.soft.light);
    root.style.setProperty('--msg-size', prefs.textSize + 'px');
    root.classList.toggle('reduce-motion', !!prefs.a11y.reduceMotion);
    root.classList.toggle('underline-links', !!prefs.a11y.underlineLinks);
    root.classList.toggle('calm-sky', !!prefs.sky.calm);
    root.classList.toggle('moon-south', !!prefs.sky.south);
    SEASONS.forEach(function (id) { root.classList.toggle('season-' + id, season === id); });
    storageSet(PREFS_KEY, prefs);
  }, [prefs, season]);
  useEffect(function () {
    var mq; try { mq = window.matchMedia('(prefers-color-scheme: light)'); } catch (e) { return; }
    function onChange() { rerender(function (n) { return n + 1; }); }
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    return function () { if (mq.removeEventListener) mq.removeEventListener('change', onChange); };
  }, []);
  return season;
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
    var timer = setTimeout(function due() {
      // A timer can fire a little early: switching nobody changes no state, and nothing would set it again.
      if (Date.now() < next) { timer = setTimeout(due, next - Date.now()); return; }
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
    var n = unreadTotal(state);
    document.title = (state.prefs.tabTitle && n ? '(' + n + ') ' : '') + (state.prefs.privacy.usernameInTitle ? shownName(state, state.me) + ' | ' : '') + 'Nightango';
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
    fetchLatestRelease().then(function (latest) {
      if (latest && isNewerVersion(latest.version, APP_VERSION)) toast('Nightango ' + latest.version + ' is available.', { action: { label: 'Download', run: function () { window.open(latest.url, '_blank', 'noopener'); } } });
    });
  }, [loggedIn]);
}

function skyHour() { var d = new Date(); return d.getHours() + d.getMinutes() / 60; }
/*PROTOTYPE*/
// Review of the hosted prototype: holds the sky at an hour of the day, minutes as its fraction, until the page reloads.
window.showSkyAt = function (hour) {
  skyHour = function () { return hour; };
  window.dispatchEvent(new Event('torch-sky'));
};
/*END PROTOTYPE*/

/**
 * Keeps the sky on the device hour: sets on the root the shares of the early and late skies (skyAt), which the stylesheet mixes into the base sky.
 * @param {{subscribe: function(Function): Function}} clock Minute clock of the application.
 * @param {string} theme dark or light.
 * @param {boolean} calm Calm sky: the sky keeps its base colors.
 */
function useSkyHour(clock, theme, calm) {
  useEffect(function () {
    var root = ROOT_EL;
    if (calm) {
      root.style.removeProperty('--sky-early');
      root.style.removeProperty('--sky-late');
      return;
    }
    function paint() {
      var sky = skyAt(theme, skyHour());
      root.style.setProperty('--sky-early', sky.early.toFixed(2) + '%');
      root.style.setProperty('--sky-late', sky.late.toFixed(2) + '%');
    }
    paint();
    var stop = clock.subscribe(paint);
    /*PROTOTYPE*/
    window.addEventListener('torch-sky', paint);
    /*END PROTOTYPE*/
    return function () {
      stop();
      /*PROTOTYPE*/
      window.removeEventListener('torch-sky', paint);
      /*END PROTOTYPE*/
    };
  }, [theme, calm]);
}

/**
 * Interface root: composes the hooks of the application and renders the shell, the dialogs and the toasts.
 * @param {{boot: ?Object}} props State handed by the prototype hook.
 */
function Root(props) {
  var store = useAppState(props.boot), state = store.state;
  // Composer drafts by conversation, in memory only: a reload, which is also how live signs out, drops every draft.
  var drafts = useState(draftStore)[0];
  var o = useOverlays();
  var inbox = useInbox(store.stateRef, store.update, o.toast, o.setNavOpen);
  var season = useDisplayPrefs(state.prefs);
  useIdleStatus(state.users, store.update);
  useTabTitle(state);
  useShortcuts(store.stateRef, o.setPalette);
  useUpdateCheck(state.auth.loggedIn, o.toast);
  var local = useLocalStore(state);
  var keepUsers = usePrunedUsers(store, state.auth.loggedIn);
  var reconnection = useReconnection(store.stateRef, store.update);
  var pms = useLivePms(store, local.ref, inbox.pmArchive);
  var act = useActions({ store: store, toast: o.toast, setNavOpen: o.setNavOpen, inbox: inbox, drafts: drafts, localRef: local.ref, reconnection: reconnection, pms: pms });
  useSimulation(store, inbox, o.toast, act.actions);
  useLiveOps({ store: store, toast: o.toast, inbox: inbox, actions: act.actions, local: local, reconnection: reconnection, pms: pms });

  // nav, actions and ui keep their identity: the context changes only with what the views show.
  var api = useMemo(function () {
    return { store: store.store, update: store.update, nav: inbox.nav, actions: act.actions, ui: o.ui, drafts: drafts, clock: minuteClock(), keepUsers: keepUsers, get state() { return store.store.shown(); } };
  }, []);
  var theme = resolvedTheme(state.prefs, VIEWER_THEME);
  useSkyHour(api.clock, theme, state.prefs.sky.calm);
  var app = useMemo(function () {
    return { state: state, update: store.update, nav: inbox.nav, actions: act.actions, ui: o.ui, navOpen: o.navOpen, uploads: act.uploads, drafts: drafts, theme: theme, season: season };
  }, [state, o.navOpen, act.uploads, theme, season]);
  return h(Layers, null, h(ApiCtx.Provider, { value: api }, h(SeasonCtx.Provider, { value: season }, h(Ctx.Provider, { value: app },
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
    state.auth.loggedIn && o.spacesFor ? h(ConversationSpacesDialog, { route: o.spacesFor, onClose: function () { o.setSpacesFor(null); } }) : null,
    state.auth.loggedIn && o.spaceEditor ? h(SpaceEditorDialog, { id: o.spaceEditor.id, add: o.spaceEditor.add || null, onClose: function () { o.setSpaceEditor(null); } }) : null,
    o.confirmCfg ? h(ConfirmDialog, { confirm: o.confirmCfg, onClose: function () { o.setConfirm(null); } }) : null,
    sessionBlocks(state) ? h(SessionOverlay, { session: state.session }) : null,
    h(Toasts, { toasts: o.toasts, dismiss: o.dismissToast, under: sessionBlocks(state) })))));
}
