function defaultPrefs() {
  return {
    theme: 'system', accent: '#f27a3f', density: 'comfortable', textSize: 14, h24: true, announcements: true,
    styles: { names: true, fonts: true, backgrounds: false, profileBackgrounds: true },
    notify: {
      mentions: { app: true, sound: true, desktop: true },
      pm: { app: true, sound: true, desktop: true },
      friendOn: { app: true, sound: false, desktop: false },
      friendOff: { app: false, sound: false, desktop: false }
    },
    volume: 70, soundFocusOnly: true, tabTitle: true, markNew: true, pmPreview: true,
    privacy: { joinOwned: true, joinRecent: true, joinFavorites: true, usernameInTitle: false },
    safety: { embedImages: true, embedVideos: true, proxyMedia: true, warnLinks: true, trustedHosts: [], showGuests: true, guestMessages: true, syncBlocked: true, ignoreMode: 'collapse' },
    a11y: { reduceMotion: false, underlineLinks: false },
    sky: { calm: false, south: false, moon: 'auto' },
    simulate: true
  };
}
// En live, ces préférences sont des réglages de BetterChatango, qui font foi : relues à la connexion, écrites chez lui avant de basculer.
var BETTER_CHATANGO_PREFS = { 'safety.guestMessages': 'guestMessages', announcements: 'announcements' };
var BETTER_CHATANGO_SAVE_FAILED = 'BetterChatango could not save this setting. Reload the page and try again.';
