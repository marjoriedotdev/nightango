/* ---------- User settings ---------- */
var SETTINGS_NAV = [
  { title: 'Account', items: [['profile', 'Profile'], ['privacy', 'Privacy'], ['safety', 'Safety'], ['account', 'Password and email'], ['premium', 'Chatango Premium']] },
  { title: 'App', items: [['appearance', 'Appearance'], ['notifications', 'Notifications'], ['accessibility', 'Accessibility']] },
  { title: 'Support', items: [['whatsnew', "What's new"], ['diagnostics', 'Diagnostics'], ['about', 'About Nightango']].filter(function (it) { return JOURNAL || it[0] !== 'diagnostics'; }) }
];

function setIn(obj, path, value) {
  var keys = path.split('.'), o = obj;
  for (var i = 0; i < keys.length - 1; i++) o = o[keys[i]];
  o[keys[keys.length - 1]] = value;
}
function getIn(obj, path) { return path.split('.').reduce(function (o, k) { return o == null ? o : o[k]; }, obj); }
function usePref() {
  var app = useApp();
  return {
    get: function (path) { return getIn(app.state.prefs, path); },
    set: function (path, v) { app.update(function (d) { setIn(d.prefs, path, v); }); },
    sw: function (path) {
      var v = getIn(app.state.prefs, path), key = LIVE && BETTER_CHATANGO_PREFS[path];
      return h(T.Switch, { checked: !!v, onChange: function (e) { var nv = e.target.checked; if (!key || saveBetterChatangoSetting(app, liveBridge.setSetting, key, nv)) app.update(function (d) { setIn(d.prefs, path, nv); }); } });
    }
  };
}

/**
 * Saves a setting into the BetterChatango settings with a toast if BetterChatango does not save it.
 * @param {Object} app Application context.
 * @param {Function} write Bridge write, true if BetterChatango saved the value.
 * @param {string} key Setting key in the bridge.
 * @param {boolean|number} value New value.
 * @returns {boolean} True if BetterChatango saved it.
 */
function saveBetterChatangoSetting(app, write, key, value) {
  if (write(key, value)) return true;
  app.ui.toast(BETTER_CHATANGO_SAVE_FAILED);
  return false;
}

function SettingsShell(p) {
  var app = useApp();
  return h('div', { className: 'settings' },
    h('nav', { className: 'snav', 'aria-label': p.navLabel },
      h(T.NavItem, { icon: 'arrow-left', label: 'Back to chat', onClick: p.onBack }),
      p.header || null,
      p.sections.map(function (sec) {
        return h(Frag, { key: sec.title },
          h('h3', null, sec.title),
          sec.items.map(function (it) {
            return h(T.NavItem, { key: it[0], label: it[1], active: p.page === it[0], onClick: function () { p.onPage(it[0]); } });
          }));
      }),
      h('span', { style: { flex: 1, minHeight: 24 } }),
      p.footer || null),
    h('div', { className: 'snav-select' },
      h(T.IconButton, { icon: 'arrow-left', label: 'Back to chat', onClick: p.onBack }),
      h('label', { htmlFor: 'snav-sel', className: 'tc-sr' }, 'Settings page'),
      h('select', { id: 'snav-sel', className: 'tc-input', style: { height: 36 }, value: p.page, onChange: function (e) { p.onPage(e.target.value); } },
        p.sections.map(function (sec) { return h('optgroup', { key: sec.title, label: sec.title }, sec.items.map(function (it) { return h('option', { key: it[0], value: it[0] }, it[1]); })); }))),
    h('div', { ref: p.scrollRef, className: 'spage' }, p.children));
}

/**
 * Keeps the requested page if the navigation lists it or else returns the fallback page.
 * @param {Array} sections Navigation sections in the SETTINGS_NAV format.
 * @param {string} page Page requested by the route.
 * @param {string} [fallback] Fallback page, the first listed one by default.
 */
function listedPage(sections, page, fallback) {
  var ids = [].concat.apply([], sections.map(function (sec) { return sec.items.map(function (it) { return it[0]; }); }));
  return ids.indexOf(page) >= 0 ? page : fallback || ids[0];
}

function Page(p) {
  return h('div', { className: cx('spage-inner', p.wide && 'wide') },
    h('div', { className: p.aside ? 'page-head' : null },
      h('div', null, h('h1', null, p.title), p.lede ? h('p', { className: 'lede' }, p.lede) : null),
      p.aside || null),
    p.children);
}

/**
 * Activity row: who did what and when.
 * @param {{first: boolean, lead: *, sub: ?string, at: ?number}} p First row of the section, icon before the text, secondary line, date of the action.
 */
function ActivityRow(p) {
  return h('div', { className: 'lrow', style: p.first ? { borderTop: 0 } : null },
    p.lead,
    h('span', { className: 'grow' }, h('span', { className: 'lrow-title lrow-activity' }, p.children), p.sub ? h('span', { className: 'lrow-sub person-sub' }, p.sub) : null),
    p.at ? h('time', { className: 'tc-msg-time', title: new Date(p.at).toLocaleString('en-GB') }, ago(p.at)) : null);
}

function SettingsView(p) {
  var app = useApp();
  var map = { profile: ProfilePage, privacy: PrivacyPage, safety: SafetyPage, account: AccountPage, premium: PremiumPage, appearance: AppearancePage, notifications: NotificationsPage, accessibility: AccessibilityPage, whatsnew: WhatsNewPage, diagnostics: DiagnosticsPage, about: AboutPage };
  var page = listedPage(SETTINGS_NAV, p.page, 'appearance'), Comp = map[page];
  return h(SettingsShell, {
    navLabel: 'Settings', sections: SETTINGS_NAV, page: page,
    onBack: app.actions.backToChat, onPage: function (pg) { app.nav({ view: 'settings', page: pg }); },
    footer: h(T.NavItem, { icon: 'log-out', label: 'Log out', className: 'danger-nav', onClick: app.actions.logout })
  }, h(Comp, { key: page }));
}
