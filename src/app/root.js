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
  useLiveOps({ store: store, toast: toast, inbox: inbox, actions: actions, local: local, reconnection: reconnection, pms: pms });

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
