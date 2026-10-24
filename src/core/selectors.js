function roleOf(group, name) { return group && group.settings && group.settings.staff ? group.settings.staff[name] || null : null; }
function isStaffRole(r) { return r === 'owner' || r === 'coowner' || r === 'admin' || r === 'mod'; }
function canManage(group, me) { var r = roleOf(group, me); return r === 'owner' || r === 'coowner' || r === 'admin'; }
/**
 * Permet de savoir si l'utilisateur voit les IP d'un groupe : propriétaire, ou staff qui a le droit « See IP addresses ».
 * @param {?string} myRole Rôle de l'utilisateur dans le groupe.
 * @param {Object} perms Droits de l'utilisateur dans le groupe.
 */
function canSeeIps(myRole, perms) { return myRole === 'owner' || !!perms.seeIps; }
function userOf(state, name) { return state.users[name] || { status: 'offline', about: '', style: {} }; }
/**
 * Permet de savoir si les messages d'un membre sont masqués : membre ignoré, ou bloqué quand le blocage vaut aussi en groupe.
 * @param {Object} state État de l'application.
 * @param {string} name Auteur visé.
 */
function isHiddenAuthor(state, name) { var u = userOf(state, name); return (u.ignored || (u.blocked && state.prefs.safety.syncBlocked)) && name !== state.me; }
/**
 * Permet de savoir si un texte mentionne l'utilisateur par @nom.
 * @param {string} me Nom de l'utilisateur.
 * @param {string} text Texte du message.
 */
function mentionsMe(me, text) { return new RegExp('@' + me + '(?![A-Za-z0-9_-])', 'i').test(text); }
/**
 * Permet de retrouver un message chargé d'un groupe, par son identifiant provisoire ou définitif.
 * @param {Object} g Groupe dans l'état.
 * @param {string} id Identifiant du message.
 */
function findMsg(g, id) {
  if (!g || !id) return null;
  var plain = String(id).replace(/^k:/, '');
  for (var i = g.messages.length - 1; i >= 0; i--) { var x = g.messages[i]; if (x.id === plain || x.id === 'k:' + plain) return x; }
  return null;
}
/**
 * Permet de lire les invités d'un groupe : noms des invités nommés et total, anonymes compris.
 * @param {Object} group Groupe.
 */
function guestsOf(group) {
  // Le prototype n'a pas de guestNames : tous ses invités sont anonymes.
  var names = group.guestNames || [];
  return { names: names, count: names.length + group.guests };
}
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
function isNotifyingOnline(state, name) { return !!state.notifyOnline[name]; }
/**
 * Permet de lister les groupes rejoints dont un membre fait partie.
 * @param {Object} state État de l'application.
 * @param {string} name Nom du membre.
 */
function commonGroups(state, name) {
  return Object.keys(state.groups).filter(function (k) { var g = state.groups[k]; return g.joined && g.members.indexOf(name) >= 0; });
}
function lastTs(c) { return c.messages.length ? c.messages[c.messages.length - 1].ts : 0; }
/**
 * Permet de lister les conversations affichées, hors demandes et conversations fermées, de la plus récente à la plus ancienne.
 * @param {Object} state État de l'application.
 */
function listedDms(state) {
  return Object.keys(state.dms).filter(function (n) { return !state.dms[n].request && !state.dms[n].closed; })
    .sort(function (a, b) { return lastTs(state.dms[b]) - lastTs(state.dms[a]); });
}
/**
 * Permet de compter les conversations non lues, hors demandes et conversations fermées.
 * @param {Object} state État de l'application.
 */
function unreadDmCount(state) { return listedDms(state).filter(function (n) { return state.dms[n].unread; }).length; }
/**
 * Permet de savoir si une conversation est ouverte sous les yeux de l'utilisateur.
 * @param {Object} state État de l'application.
 * @param {string} name Membre de la conversation.
 */
function isDmInView(state, name) { return state.route.view === 'dm' && state.route.id === name && document.visibilityState === 'visible'; }
// Mots et médias en ensemble trié : Torch archive l'URL d'image tapée dans le texte sous forme de balise <i s>.
function pmContentKey(m) {
  var media = (m.embeds || []).map(function (e) { return e.kind === 'youtube' ? 'yt:' + e.id : e.url; });
  return String(m.text).split(/\s+/).concat(media).filter(Boolean).sort().filter(function (v, i, a) { return v !== a[i - 1]; }).join(' ');
}
function pmEditTarget(c, m) { return m.editId ? c.messages.find(function (x) { return x.key === m.editId && x.from === m.from; }) : null; }
/**
 * Permet de retrouver le message affiché qui couvre une entrée de l'historique privé autre qu'une modification appliquée.
 * @param {Array} list Messages affichés.
 * @param {Object} x Entrée de l'historique, avec sa clé archiveTs.
 * @returns {number} Position du message dans list, -1 si aucun ne la couvre.
 */
function pmShownIndex(list, x) {
  // Une modification sans original chargé s'affiche sous la clé de l'original.
  var key = x.editId || x.key, k = pmContentKey(x), i = list.findIndex(function (y) { return y.archiveTs === x.archiveTs; });
  // Un message qui porte déjà une clé d'archive est une autre entrée. Même clé de MP = même message, même si une modification a changé son texte.
  return i >= 0 ? i : list.findIndex(function (y) { return !y.archiveTs && (key && y.key ? y.key === key : y.from === x.from && pmContentKey(y) === k && Math.abs(y.ts - x.ts) < 120000); });
}
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
