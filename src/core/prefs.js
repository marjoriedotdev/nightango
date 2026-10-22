function defaultPrefs() {
  return {
    theme: 'system', accent: '#f27a3f', density: 'comfortable', textSize: 14, h24: true,
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
    privacy: { pmFrom: 'everyone', showIdle: true, joinOwned: true, joinRecent: true, joinFavorites: true, openPms: false, meet: false, usernameInTitle: false },
    safety: { embedImages: true, embedVideos: true, proxyMedia: true, warnLinks: true, showGuests: true, syncBlocked: true, ignoreMode: 'collapse' },
    a11y: { reduceMotion: false, underlineLinks: false },
    language: 'en-US', simulate: true
  };
}
