// -- Texte et références ------------------------------------------------------

function warn(e) { try { console.warn('[torch-skin]', e); } catch (x) { /* console indisponible */ } }
function lower(v) { return String(v == null ? '' : v).toLowerCase(); }
// Comme urllib.parse.unquote (chatango-lib) et Torch : « + » reste un « + ».
function unquote(v) { try { return decodeURIComponent(String(v || '')); } catch (e) { return String(v || ''); } }
/** Échappe le texte saisi : client.sendMessage attend du HTML, comme le champ de saisie de Torch. */
function esc(text) { return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
// Références de message dans <r…/> et <e…/> : Torch retire le "=" final et protège - et _.
function decodeRef(v) { return String(v).replace(/hypheN/g, '-').replace(/underS/g, '_') + '='; }
function encodeRef(id) { var s = String(id); if (s.slice(-1) === '=') s = s.slice(0, -1); return s.replace(/-/g, 'hypheN').replace(/_/g, 'underS'); }

// -- Contenu des messages -----------------------------------------------------

// Face 0 : défaut que Torch envoie sans style utilisateur - la chaîne vide efface la police fusionnée d'un message précédent.
var FACES = [''].concat(FONT_FACES.slice(1));
var decoder = document.createElement('textarea');

function decodeHtml(html) { decoder.innerHTML = html; return decoder.value; }
function fileUrlPattern(extensions) { return new RegExp('^https:\\/\\/\\S+\\.(?:' + extensions + ')(?:[?#]\\S*)?$', 'i'); }
var IMAGE_URL = fileUrlPattern('png|apng|jpe?g|gif|bmp|webp'), VIDEO_URL = fileUrlPattern('mp4|webm'), AUDIO_URL = fileUrlPattern('mp3|ogg|wav');
// Regex de Torch (inject.js:8256) appliquée à un seul lien : sensible à la casse et ouverte à http, seul l'identifiant est gardé.
var YOUTUBE_LINK = /^https?:\/\/(?:(?:\w+\.)?youtube\.\w{1,3}|youtu\.be)(?:.*v=|\/\w+\/|\/)([\w-]{11})/;
// Comme renderMessage de Torch : seule une paire ▓…▒ devient un barré, un marqueur isolé reste du texte.
var STRIKE_PAIR = /\u2593([\s\S]*?)\u2592/g;
function embedOf(src) {
  var yt = /^vid:\/\/yt:([\w-]{11})/.exec(src), img = /^img:\/\/(?:cam|lib):([^"&?\/\s]+)/.exec(src);
  if (yt) return { kind: 'youtube', id: yt[1] };
  if (img) return { kind: 'photo', url: 'https://chatango.com/pmmessageimg?i=' + encodeURIComponent(img[1]) };
  return IMAGE_URL.test(src) ? { kind: 'image', url: src } : null;
}
/**
 * Permet de reconnaître le média d'un lien tapé dans le texte : vidéo YouTube, image, fichier vidéo ou audio.
 * @param {string} url Lien relevé dans le texte.
 */
function linkEmbedOf(url) {
  var yt = YOUTUBE_LINK.exec(url);
  if (yt) return { kind: 'youtube', id: yt[1] };
  return VIDEO_URL.test(url) ? { kind: 'video', url: url } : AUDIO_URL.test(url) ? { kind: 'audio', url: url } : embedOf(url);
}
/**
 * Permet de rendre une émoticône sm:// en texte : son emoji, son premier raccourci si elle est Premium sans le drapeau, son nom seul si la table l'ignore.
 * @param {string} name Nom lu dans la balise, affiché seul s'il est fait de [a-z0-9_-].
 * @param {boolean} premium Le message porte le drapeau Premium.
 */
function emoticonText(name, premium) {
  var e = EMOTICON_BY_NAME[name];
  if (!e) return /^[a-z0-9_-]{1,32}$/.test(name) ? name : '';
  return e.emoji && (premium || !e.premium) ? e.emoji : e.keys[0].split('?')[0];
}
/**
 * Permet de lire un contenu Chatango brut : balises de style, réponses, modifications, médias, émoticônes, entités.
 * @param {string} raw Corps du message.
 * @param {boolean} [keepMedia] Garde la source des médias et des émoticônes dans le texte.
 * @param {boolean} [premium] Le message porte le drapeau Premium.
 */
function parseContent(raw, keepMedia, premium) {
  var style = {}, embeds = [], s = String(raw);
  var n = /<n([a-f0-9]{3}|[a-f0-9]{6})\/>/i.exec(s);
  if (n) style.nameColor = '#' + n[1];
  // Police lue sur <f x…> ou <g x…s…> seulement : les attributs w et h d'une balise <i> ne sont pas une police.
  var f = /<f x(\d{2})?([a-f0-9]{3}|[a-f0-9]{6})?=["']([^"']*)["']>/i.exec(s) || /<g x(\d{2})?s([a-f0-9]{3}|[a-f0-9]{6})?="([^"]*)">/i.exec(s);
  if (f) {
    if (f[2]) style.textColor = '#' + f[2];
    // Taille absente : 100 % explicite, sinon la taille fusionnée d'un message précédent resterait.
    style.fontSize = f[1] ? fontPercent(+f[1]) : 100;
    if (f[3] !== '' && FACES[+f[3]] !== undefined) style.font = FACES[+f[3]];
    else if (f[3] && isNaN(+f[3])) style.font = f[3];
  }
  var r = /<r([^\s<>"\/]+)\/>/.exec(s), e = /<e([^\s<>"\/]+)\/>/.exec(s), k = /<i([a-z0-9]{7,8})\/>/.exec(s);
  var body = s
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<i\s(?:[^>]*?\s)?s=["']?([^"'\s>]+)["']?[^>]*\/?>/gi, function (tag, src) {
      var m = embedOf(decodeHtml(src)), sm = /^sm:\/\/(.*)/i.exec(src);
      if (m) embeds.push(m);
      if (keepMedia) return ' ' + src + ' ';
      return sm ? emoticonText(sm[1], premium) : m ? ' ' : ' ' + src + ' ';
    })
    .replace(STRIKE_PAIR, '<s>$1</s>');
  var text = decodeHtml(body.replace(/<[^>]+>/g, '')).replace(/\r/g, '').trim();
  (text.match(/https?:\/\/\S+/g) || []).forEach(function (url) {
    var m = linkEmbedOf(url);
    if (m && !embeds.some(function (x) { return x.kind === m.kind && x.id === m.id && x.url === m.url; })) embeds.push(m);
  });
  return { text: text, parts: emphasisParts(body), style: style, embeds: embeds, replyId: r ? decodeRef(r[1]) : null, editId: e ? decodeRef(e[1]) : null, key: k ? decodeRef(k[1]) : null };
}
/**
 * Permet de lire le corps d'un MP reçu ou archivé avec son drapeau Premium.
 * @param {Array} data Champs de la trame msg ou msgoff, drapeaux en 4 et corps à partir de 5.
 */
function parsePm(data) { return parseContent(data.slice(5).join(':'), false, !!(parseInt(data[4], 10) & MSG_FLAG.PREMIUM)); }
/**
 * Permet de lire un enregistrement de l'historique privé de Torch.
 * @param {{ts: number, data: string, unread: number}} v Enregistrement (saveMessage), data étant la trame msg complète.
 * @returns {?Object} Message archivé avec sa clé archiveTs, null si la trame n'a pas tous ses champs.
 */
function pmRecordEntry(v) {
  var parts = String(v.data || '').split(':').slice(1);
  if (parts.length <= 5) return null;
  var body = parsePm(parts);
  return { from: lower(parts[0]), ts: Math.round(parseFloat(parts[3]) * 1000) || 0, archiveTs: v.ts, text: body.text, parts: body.parts, style: body.style, embeds: body.embeds, key: body.key, editId: body.editId, unread: !!v.unread };
}
var PM_TARGET = /^[A-Za-z0-9_-]{1,20}$/;
/**
 * Permet de trier les enregistrements d'un historique privé importé, avant toute écriture.
 * @param {Array} records Contenu du fichier, non fiable.
 * @param {string} me Compte connecté.
 * @returns {{valid: Array, skipped: number, foreign: boolean}} Enregistrements à écrire, marqués lus, nombre d'ignorés, et vrai pour le fichier d'un autre compte, dont rien n'est écrit.
 */
function screenPmRecords(records, me) {
  var valid = [], skipped = 0, foreign = 0;
  records.forEach(function (r) {
    var ok = !!r && typeof r.target === 'string' && PM_TARGET.test(r.target) && typeof r.ts === 'number' && isFinite(r.ts) && r.ts > 0
      && typeof r.data === 'string' && r.data.indexOf('msg:') === 0;
    var fields = ok ? r.data.split(':') : [];
    if (fields.length < 7) { skipped++; return; }
    var author = lower(fields[1]);
    if (author !== lower(r.target) && author !== lower(me)) { skipped++; foreign++; return; }
    valid.push({ target: r.target, ts: r.ts, data: r.data, unread: 0 });
  });
  // Fichier d'un autre compte : ses MP reçus passent le tri un par un, mais aucun n'est écrit.
  if (skipped && foreign === skipped) return { valid: [], skipped: skipped, foreign: true };
  return { valid: valid, skipped: skipped, foreign: false };
}
/**
 * Permet de découper un corps de message en segments marqués gras, italique, souligné ou barré.
 * Liste blanche de Torch (renderMessage) : b, i sans attribut, u, s et strike.
 * @param {string} body Corps dont les balises br, les médias et les paires ▓…▒ sont déjà convertis.
 * @returns {?Array} Segments {text, b, i, u, s} rognés comme le texte, null si aucun n'est marqué.
 */
function emphasisParts(body) {
  var depth = { b: 0, i: 0, u: 0, s: 0 }, parts = [];
  body.split(/(<[^>]+>)/).forEach(function (t, k) {
    if (k % 2) {
      var tag = /^<(\/?)(b|i|u|s|strike)>$/i.exec(t);
      var mark = tag && lower(tag[2]).charAt(0);
      if (mark && !tag[1]) depth[mark] += 1;
      else if (mark && depth[mark]) depth[mark] -= 1;
      return;
    }
    var part = { text: decodeHtml(t).replace(/\r/g, '') };
    EMPHASIS.forEach(function (m) { if (depth[m]) part[m] = true; });
    if (part.text) parts.push(part);
  });
  while (parts.length && !(parts[0].text = parts[0].text.replace(/^\s+/, ''))) parts.shift();
  while (parts.length && !(parts[parts.length - 1].text = parts[parts.length - 1].text.replace(/\s+$/, ''))) parts.pop();
  return parts.some(function (x) { return EMPHASIS.some(function (m) { return x[m]; }); }) ? parts : null;
}

// -- Trames de groupe ---------------------------------------------------------

function notNone(v) { return !!v && v !== 'None'; }
// Invité nommé en minuscules, comme l'auteur de ses messages : fiche et bannissement les retrouvent.
function sessionOf(account, guest) {
  return notNone(account) ? { account: lower(account) } : notNone(guest) ? { guest: '#' + lower(guest) } : { anon: true };
}
function parseParticipants(list) {
  var names = [], sessions = {};
  list.forEach(function (x) {
    var t = x.split(':');
    if (t.length < 4) return;
    var one = sessionOf(t[3], t[4]);
    if (one.account && names.indexOf(one.account) < 0) names.push(one.account);
    sessions[t[1]] = one;
  });
  return { names: names, sessions: sessions };
}
function parseMods(entries) {
  var mods = {};
  entries.forEach(function (x) { var p = String(x).split(','); if (p[0]) mods[lower(p[0])] = parseInt(p[1], 10) || 0; });
  return mods;
}
/**
 * Permet de lire une page de bannissements de Torch : entrées unid:ip:nom:horodatage:auteur séparées par des points-virgules.
 * @param {Array<string>} data Trame découpée sur :.
 * @returns {Array<Object>} Entrées, avec l'horodatage brut (ts) qui sert de curseur à la page suivante.
 */
function parseBans(data) {
  var raw = data.join(':');
  if (!raw) return [];
  return raw.split(';').map(function (x) {
    var t = x.split(':');
    // Curseur converti comme Torch, qui lit l'horodatage par + avant de le renvoyer.
    return { unid: t[0], ip: t[1], name: lower(t[2]) || '!anon', guest: !t[2], ts: String(+t[3]), at: Math.round(parseFloat(t[3]) * 1000) || Date.now(), by: lower(t[4]) };
  }).filter(function (b) { return b.unid; });
}
/**
 * Permet de lire la trame unblocked comme Torch : entrées unid:ip:nom séparées par des points-virgules, auteur à l'avant-dernier champ.
 * @param {Array<string>} data Trame découpée sur :.
 * @returns {Array<Object>} Débannissements, datés de la réception comme chez Torch.
 */
function parseUnbanned(data) {
  var by = lower(data.slice(-2)[0]), at = Date.now();
  return data.join(':').split(';').map(function (x) {
    var t = x.split(':');
    return { unid: t[0], ip: t[1], name: lower(t[2]) || '!anon', guest: !t[2], by: by, at: at };
  }).filter(function (b) { return b.unid; });
}
/**
 * Permet de lire la réponse bansearchresult de Torch : autres noms, nom, IP, unid, auteur et date.
 * @param {Array<string>} data Trame découpée sur :, date comprise.
 * @returns {?Object} Bannissement trouvé, null si aucun.
 */
function parseBanSearch(data) {
  // Torch ne regarde que le nom et dirait introuvable un invité cherché par son IP.
  if (!data[1] && !data[3]) return null;
  // Comme Torch, la date se lit en heure du Pacifique fixe. Seul, GMT-0800 passe pour une année : la date se valide sans lui.
  var date = data.slice(5).join(':'), at = isNaN(new Date(date).getTime()) ? 0 : new Date(date + ' GMT-0800').getTime();
  return { unid: data[3], ip: data[2], name: lower(data[1]) || '!anon', guest: !data[1], by: lower(data[4]), at: at, includes: data[0] ? data[0].split(';').filter(Boolean).map(lower) : [] };
}
function parseModLog(data) {
  var raw = data.join(':');
  if (!raw) return [];
  return raw.split(';').map(function (x) {
    var f = unquote(x).split(',');
    return { id: f[0], type: f[1], actor: lower(f[2]), target: lower(f[4]), at: Math.round(parseFloat(f[5]) * 1000) || 0, extra: f.slice(6).join(',') };
  }).filter(function (x) { return x.type; });
}

// -- Fond Premium -------------------------------------------------------------

/**
 * Permet de convertir une couleur de fond CSS en hex.
 * @param {string} value Couleur CSS lue dans custom_profile.css.
 */
function opaqueColor(value) {
  var v = String(value || '').trim(), f = /^(?:rgb|hsl)a?\(([^)]*)\)$/i.exec(v), p = f ? f[1].trim().split(/\s*[,\/]\s*|\s+/) : [];
  return p.length > 3 && parseFloat(p[3]) === 0 ? null : cssColor(v);
}
/**
 * Permet de lire le fond Premium d'un mini profil sans jamais injecter son CSS.
 * @param {string} css Contenu de custom_profile.css.
 */
function parseMiniCss(css) {
  var rules = Object.create(null), re = /([^{}]+)\{([^}]*)\}/g, m, unsafe = /^(?:__proto__|constructor|prototype)$/;
  css = String(css).replace(/\/\*[\s\S]*?\*\//g, '');
  while ((m = re.exec(css))) {
    var decl = Object.create(null);
    m[2].split(';').forEach(function (x) {
      var i = x.indexOf(':'), prop = x.slice(0, i).trim().toLowerCase();
      if (i > 0 && !unsafe.test(prop)) decl[prop] = x.slice(i + 1).replace(/!important/i, '').trim();
    });
    m[1].split(',').forEach(function (sel) {
      sel = sel.trim().toLowerCase();
      if (!unsafe.test(sel)) rules[sel] = Object.assign(rules[sel] || Object.create(null), decl);
    });
  }
  var body = rules.body || {}, short = body.background || '';
  var image = 'background-image' in body ? /^url\(\s*['"]?(https?:\/\/[^'")\s]+)['"]?\s*\)$/i.exec(body['background-image']) : /url\(\s*['"]?(https?:\/\/[^'")\s]+)['"]?\s*\)/i.exec(short);
  var bg = 'background-color' in body ? body['background-color'] : (short.match(/[a-z-]+\([^)]*\)|[^\s()]+/gi) || []).find(cssColor);
  var repeat = lower('background-repeat' in body ? body['background-repeat'] : (/\b(?:no-repeat|repeat-x|repeat-y|repeat)\b/i.exec(short.replace(/url\([^)]*\)/gi, '')) || [''])[0]);
  return {
    bg: opaqueColor(bg),
    text: cssColor(body.color || (rules['.profile_text'] || {}).color),
    link: cssColor((rules.a || {}).color),
    image: image ? image[1].replace(/^http:/i, 'https:') : null,
    repeat: BACKGROUND_REPEAT.test(repeat) ? repeat : null
  };
}

// -- Fond de message ----------------------------------------------------------

var MSG_BG_ALIGN = { tl: 'left top', tr: 'right top', bl: 'left bottom', br: 'right bottom' };
/**
 * Permet de lire le fond de message Premium d'un membre sans rien reprendre d'autre de msgbg.xml.
 * @param {string} xml Contenu de msgbg.xml.
 * @param {string} image URL de msgbg.jpg construite à partir du nom du membre, jamais lue dans le fichier.
 */
function parseMsgBg(xml, image) {
  var doc = new DOMParser().parseFromString(String(xml), 'text/xml'), root = doc.documentElement;
  if (doc.querySelector('parsererror')) return null;
  function percent(name) { var v = root.getAttribute(name); return v === null ? 100 : Math.min(100, Math.max(0, parseFloat(v) || 0)); }
  var bgc = root.getAttribute('bgc') || '', align = root.getAttribute('align');
  return {
    color: /^(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(bgc) ? '#' + bgc.toLowerCase() : null,
    alpha: percent('bgalp'),
    image: root.getAttribute('useimg') === '1' ? image : null,
    // Alignement inconnu : coin haut gauche, la position par défaut du fond CSS de Torch.
    align: Object.prototype.hasOwnProperty.call(MSG_BG_ALIGN, align) ? align : 'tl',
    imageAlpha: percent('ialp'),
    tile: root.getAttribute('tile') === '1'
  };
}

// -- Comptes liés -------------------------------------------------------------

var WHO_LEVELS = ['definite', 'linked', 'strong', 'medium', 'weak'];
/**
 * Permet de lire la réponse de vissle aux comptes liés d'un compte sans rien reprendre d'autre que les noms des cinq niveaux.
 * @param {*} data Réponse JSON de /api/v1/who.
 * @returns {?Array<{level: string, names: Array<string>}>} Niveaux non vides dans l'ordre de Torch, null sans target.
 */
function parseWho(data) {
  if (!data || !data.target) return null;
  return WHO_LEVELS.map(function (level) {
    var list = Array.isArray(data[level]) ? data[level] : [];
    return { level: level, names: list.filter(function (x) { return typeof x === 'string'; }) };
  }).filter(function (x) { return x.names.length; });
}

// -- Présence et connexions ---------------------------------------------------

function presenceOf(state, idle) { return state === 'on' ? (+idle ? 'idle' : 'online') : state === 'app' ? 'online' : 'offline'; }
// Chatango envoie "None" ou 0 quand il ne connaît pas la dernière connexion.
function epochMs(v) { return Math.round(parseFloat(v) * 1000) || 0; }
/**
 * Permet de lire la présence d'un correspondant dans une trame wl, wladd ou connect.
 * @param {string} name Nom du correspondant.
 * @param {string} state État Chatango on, off ou app.
 * @param {string} ts Dernière connexion en secondes.
 * @param {string} minutes Minutes d'inactivité.
 */
function friendPresence(name, state, ts, minutes) {
  var status = presenceOf(state, minutes);
  return { name: lower(name), status: status, lastOn: state === 'off' ? epochMs(ts) : 0, idleSince: status === 'idle' ? Date.now() - minutes * MIN : 0 };
}
function stateOf(sock) { return !sock ? 'closed' : sock.readyState === 1 ? 'open' : sock.readyState === 0 ? 'connecting' : 'closed'; }
