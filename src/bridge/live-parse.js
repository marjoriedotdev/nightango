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
var IMAGE_URL = /^https:\/\/\S+\.(?:png|apng|jpe?g|gif|bmp|webp)(?:[?#]\S*)?$/i;
function embedOf(src) {
  var yt = /^vid:\/\/yt:([\w-]{11})/.exec(src), img = /^img:\/\/(?:cam|lib):([^"&?\/\s]+)/.exec(src);
  if (yt) return { kind: 'youtube', id: yt[1] };
  if (img) return { kind: 'photo', url: 'https://chatango.com/pmmessageimg?i=' + encodeURIComponent(img[1]) };
  return IMAGE_URL.test(src) ? { kind: 'image', url: src } : null;
}
/* Contenu Chatango brut : balises de style, réponses, modifications, médias, entités */
function parseContent(raw, keepMedia) {
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
  var r = /<r([^\s<>"\/]+)\/>/.exec(s), e = /<e([^\s<>"\/]+)\/>/.exec(s);
  var text = decodeHtml(s
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<i s=["']?([^"'\s>]+)["']?[^>]*\/?>/gi, function (tag, src) {
      var m = embedOf(decodeHtml(src));
      if (m) embeds.push(m);
      return m && !keepMedia ? ' ' : ' ' + src + ' ';
    })
    .replace(/<[^>]+>/g, '')).replace(/\r/g, '').trim();
  (text.match(/https:\/\/\S+/g) || []).forEach(function (url) { if (IMAGE_URL.test(url)) embeds.push({ kind: 'image', url: url }); });
  return { text: text, style: style, embeds: embeds, replyId: r ? decodeRef(r[1]) : null, editId: e ? decodeRef(e[1]) : null };
}

// -- Trames de groupe ---------------------------------------------------------

function parseParticipants(list) {
  var names = [], guests = 0;
  list.forEach(function (x) {
    var t = x.split(':');
    if (t.length < 4) return;
    if (t[3] && t[3] !== 'None') names.push(lower(t[3])); else guests += 1;
  });
  return { names: names.filter(function (v, i, a) { return a.indexOf(v) === i; }), guests: guests };
}
function parseMods(entries) {
  var mods = {};
  entries.forEach(function (x) { var p = String(x).split(','); if (p[0]) mods[lower(p[0])] = parseInt(p[1], 10) || 0; });
  return mods;
}
function parseBans(data) {
  var raw = data.join(':');
  if (!raw) return [];
  return raw.split(';').map(function (x) {
    var t = x.split(':');
    return { unid: t[0], ip: t[1], name: lower(t[2]) || '!anon', at: Math.round(parseFloat(t[3]) * 1000) || Date.now(), by: lower(t[4]) };
  }).filter(function (b) { return b.unid; });
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

// -- Présence et connexions ---------------------------------------------------

function presenceOf(state, idle) { return state === 'on' ? (+idle ? 'idle' : 'online') : state === 'app' ? 'online' : 'offline'; }
// Chatango envoie "None" ou 0 quand il ne connaît pas la dernière connexion.
function epochMs(v) { return Math.round(parseFloat(v) * 1000) || 0; }
/**
 * Permet de lire la présence d'un ami dans une trame wl ou wladd.
 * @param {string} name Nom de l'ami.
 * @param {string} state État Chatango on, off ou app.
 * @param {string} ts Dernière connexion en secondes.
 * @param {string} minutes Minutes d'inactivité.
 */
function friendPresence(name, state, ts, minutes) {
  var status = presenceOf(state, minutes);
  return { name: lower(name), status: status, lastOn: state === 'off' ? epochMs(ts) : 0, idleSince: status === 'idle' ? Date.now() - minutes * MIN : 0 };
}
function stateOf(sock) { return !sock ? 'closed' : sock.readyState === 1 ? 'open' : sock.readyState === 0 ? 'connecting' : 'closed'; }
