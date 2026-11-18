import { T, h } from '../core/globals.js';
import { useApp } from '../core/ui.js';
import { ProfilePage } from './profile.js';
import { AppearancePage } from './appearance.js';
import { NotificationsPage } from './notifications.js';
import { PrivacyPage, SafetyPage } from './privacy.js';
import { AboutPage, AccessibilityPage, DiagnosticsPage, WhatsNewPage } from './language-a11y-about.js';
import { AccountPage, PremiumPage, PrivacyPageLive, ProfilePageLive } from './live-account.js';
import { JOURNAL, LIVE } from '../core/env.js';
import { SettingsShell, listedPage } from './kit.js';
// -- Settings router ----------------------------------------------------------
// The settings pages and their navigation: the live variant of a page is chosen here.
export var SETTINGS_NAV = [
  { title: 'Account', items: [['profile', 'Profile'], ['privacy', 'Privacy'], ['safety', 'Safety'], ['account', 'Password and email'], ['premium', 'Chatango Premium']] },
  { title: 'App', items: [['appearance', 'Appearance'], ['notifications', 'Notifications'], ['accessibility', 'Accessibility']] },
  { title: 'Support', items: [['whatsnew', "What's new"], ['diagnostics', 'Diagnostics'], ['about', 'About Nightango']].filter(function (it) { return JOURNAL || it[0] !== 'diagnostics'; }) }
];







export function SettingsView(p) {
  var app = useApp();
  var map = { profile: LIVE ? ProfilePageLive : ProfilePage, privacy: LIVE ? PrivacyPageLive : PrivacyPage, safety: SafetyPage, account: AccountPage, premium: PremiumPage, appearance: AppearancePage, notifications: NotificationsPage, accessibility: AccessibilityPage, whatsnew: WhatsNewPage, diagnostics: DiagnosticsPage, about: AboutPage };
  var page = listedPage(SETTINGS_NAV, p.page, 'appearance'), Comp = map[page];
  return h(SettingsShell, {
    navLabel: 'Settings', sections: SETTINGS_NAV, page: page,
    onBack: app.actions.backToChat, onPage: function (pg) { app.nav({ view: 'settings', page: pg }); },
    footer: h(T.NavItem, { icon: 'log-out', label: 'Log out', className: 'danger-nav', onClick: app.actions.logout })
  }, h(Comp, { key: page }));
}
