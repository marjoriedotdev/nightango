function roleOf(group, name) { return group && group.settings && group.settings.staff ? group.settings.staff[name] || null : null; }
function isStaffRole(r) { return r === 'owner' || r === 'coowner' || r === 'admin' || r === 'mod'; }
function canManage(group, me) { var r = roleOf(group, me); return r === 'owner' || r === 'coowner' || r === 'admin'; }
function userOf(state, name) { return state.users[name] || { status: 'offline', about: '', style: {} }; }
function resolvedTheme(prefs, viewerTheme) {
  if (prefs.theme === 'dark' || prefs.theme === 'light') return prefs.theme;
  if (viewerTheme === 'dark' || viewerTheme === 'light') return viewerTheme;
  try { return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'; } catch (e) { return 'dark'; }
}
/**
 * Permet de savoir si l'utilisateur est alerté de la connexion d'un membre.
 * @param {Object} state État de l'application.
 * @param {string} name Membre suivi.
 */
function isNotifyingOnline(state, name) { return !!(state.dms[name] && state.dms[name].notifyOnline); }
function dmUnreadTotal(state) { var n = 0; for (var k in state.dms) n += state.dms[k].unread || 0; return n; }
function statusLabel(s) { return s === 'online' ? 'Online' : s === 'idle' ? 'Idle' : 'Offline'; }
/**
 * Permet d'abréger le genre d'un profil.
 * @param {string} g Genre en toutes lettres.
 */
function genderShort(g) { return g === 'Male' ? 'M' : g === 'Female' ? 'F' : null; }
/**
 * Permet de lire les couleurs lisibles du fond Premium d'un mini profil.
 * @param {Object} prefs Préférences de l'utilisateur.
 * @param {Object} u Membre dans l'état.
 * @param {string} theme Thème résolu.
 */
function miniStyleOf(prefs, u, theme) {
  var m = u.miniStyle;
  if (!prefs.styles.profileBackgrounds || !m || !m.bg) return null;
  var text = ensureContrast(m.text || SURFACE[theme].body, m.bg, 4.5);
  return { bg: m.bg, text: text, link: m.link ? ensureContrast(m.link, m.bg, 4.5) : text, image: m.image, repeat: m.repeat };
}
