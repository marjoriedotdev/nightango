/* ---------- Réglages utilisateur ---------- */
var SETTINGS_NAV = [
  { title: 'Account', items: [['profile', 'Profile'], ['privacy', 'Privacy'], ['safety', 'Safety'], ['account', 'Password and email'], ['premium', 'Chatango Premium']] },
  { title: 'App', items: [['appearance', 'Appearance'], ['notifications', 'Notifications'], ['language', 'Language'], ['accessibility', 'Accessibility']] },
  { title: 'Support', items: [['whatsnew', "What's new"], ['about', 'About Torch']] }
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
      var v = getIn(app.state.prefs, path);
      return h(T.Switch, { checked: !!v, onChange: function (e) { var nv = e.target.checked; app.update(function (d) { setIn(d.prefs, path, nv); }); } });
    }
  };
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
    h('div', { className: 'spage' }, p.children));
}

function Page(p) {
  return h('div', { className: cx('spage-inner', p.wide && 'wide') },
    h('div', { className: p.aside ? 'page-head' : null },
      h('div', null, h('h1', null, p.title), p.lede ? h('p', { className: 'lede' }, p.lede) : null),
      p.aside || null),
    p.children);
}

function SettingsView(p) {
  var app = useApp(), page = p.page || 'appearance';
  var map = { profile: ProfilePage, privacy: PrivacyPage, safety: SafetyPage, account: AccountPage, premium: PremiumPage, appearance: AppearancePage, notifications: NotificationsPage, language: LanguagePage, accessibility: AccessibilityPage, whatsnew: WhatsNewPage, about: AboutPage };
  var Comp = map[page] || AppearancePage;
  return h(SettingsShell, {
    navLabel: 'Settings', sections: SETTINGS_NAV, page: page,
    onBack: app.actions.backToChat, onPage: function (pg) { app.nav({ view: 'settings', page: pg }); },
    footer: h(T.NavItem, { icon: 'log-out', label: 'Log out', className: 'danger-nav', onClick: app.actions.logout })
  }, h(Comp, { key: page }));
}
