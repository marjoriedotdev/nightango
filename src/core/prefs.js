function defaultPrefs() {
  return {
    theme: 'system', accent: '#f27a3f', density: 'comfortable', textSize: 14, h24: true, announcements: true,
    styles: { names: true, fonts: true, backgrounds: false, profileBackgrounds: true },
    notify: {
      mentions: { app: true, sound: true, desktop: true, email: null },
      pm: { app: true, sound: true, desktop: true, email: false },
      friendOn: { app: true, sound: false, desktop: false, email: null },
      friendOff: { app: false, sound: false, desktop: false, email: null },
      gift: { app: null, sound: null, desktop: null, email: true },
      account: { app: null, sound: null, desktop: null, email: true },
      updates: { app: true, sound: null, desktop: null, email: null }
    },
    volume: 70, soundFocusOnly: true, tabTitle: true, markNew: true, pmPreview: true, featureHints: true,
    privacy: { pmFrom: 'everyone', showIdle: true, joinOwned: true, joinRecent: true, joinFavorites: true, meet: false, usernameInTitle: false },
    safety: { embedImages: true, embedVideos: true, proxyMedia: true, warnLinks: true, trustedHosts: [], showGuests: true, guestMessages: true, syncBlocked: true, ignoreMode: 'collapse' },
    a11y: { reduceMotion: false, underlineLinks: false },
    language: 'en-US', simulate: true
  };
}
// En live, ces préférences sont des réglages de Torch, qui font foi : relues à la connexion, écrites chez lui avant de basculer.
var TORCH_PREFS = { 'safety.guestMessages': 'guestMessages', announcements: 'announcements' };
var TORCH_SAVE_FAILED = 'Torch could not save this setting. Reload the page and try again.';
