/**
 * Bloc « About » : texte Chatango mis en forme en live, texte simple dans le prototype.
 * @param {Object} u Membre dans l'état.
 * @param {boolean} [skinned] Fond du membre déjà porté par le conteneur.
 */
function profileAbout(u, skinned) {
  if (u.profileMissing) return h('div', { className: 'kv' }, h('p', { className: 'about muted' }, 'This account has no public profile.'));
  if (u.aboutHtml) return h(RichAbout, { u: u, skinned: skinned });
  if (u.about) return h('div', { className: 'kv' }, h('p', { className: 'about' }, u.about));
  if (LIVE && !u.profileLoaded) return h('div', { className: 'kv' }, h('p', { className: 'about muted' }, 'Loading profile.'));
  return null;
}

/**
 * Permet de suivre l'affichage de l'image de fond Premium selon les réglages de médias.
 * @param {?Object} mini Fond du membre tel que le renvoie miniStyleOf.
 */
function useMiniCover(mini) {
  var safety = useApp().state.prefs.safety;
  var r = useState(null), revealed = r[0], setRevealed = r[1];
  var image = mini && mini.image && safety.embedImages ? mini.image : null;
  return { image: image, shown: !!image && (!safety.proxyMedia || revealed === image), reveal: function () { setRevealed(image); } };
}

/**
 * Bouton qui charge l'image de fond Premium retenue par les réglages de médias.
 * @param {Object} cover Image de fond telle que la renvoie useMiniCover.
 * @param {Object} mini Fond du membre tel que le renvoie miniStyleOf.
 */
function coverReveal(cover, mini) {
  return cover.image && !cover.shown ? h('button', { type: 'button', className: 'linkbtn', style: { color: mini.link }, onClick: cover.reveal }, 'Show background') : null;
}

/**
 * Permet de reprendre les jetons de couleur d'un conteneur sur le fond Premium d'un membre.
 * @param {Object} mini Fond du membre tel que le renvoie miniStyleOf.
 */
function miniSkin(mini) {
  var soft = ensureContrast(rgbToHex(mix(hexToRgb(mini.text), hexToRgb(mini.bg), 0.3)), mini.bg, 4.5);
  return {
    backgroundColor: mini.bg, color: mini.text, '--raised': mini.bg, '--text': mini.text, '--text-body': mini.text, '--text-2': soft, '--text-3': soft,
    '--border': rgba(mini.text, 0.16), '--border-strong': rgba(mini.text, 0.24), '--control': rgba(mini.text, 0.4), '--hover': rgba(mini.text, 0.08), '--hover-2': rgba(mini.text, 0.1), '--subtle': rgba(mini.text, 0.06)
  };
}

/**
 * Bloc « About » d'un mini profil Chatango.
 * @param {Object} p.u Membre dans l'état.
 * @param {boolean} [p.skinned] Fond du membre déjà porté par le conteneur.
 */
function RichAbout(p) {
  var app = useApp(), mini = miniStyleOf(app.state.prefs, p.u, app.theme), cover = useMiniCover(mini);
  var own = mini && !p.skinned;
  return h('div', { className: 'kv' + (own ? ' mini-about' : ''), style: own ? { backgroundColor: mini.bg, color: mini.text } : null },
    own && cover.shown ? h('img', { className: 'mini-about-img', src: cover.image, alt: '', referrerPolicy: 'no-referrer' }) : null,
    h(RichText, { html: p.u.aboutHtml, bg: mini ? mini.bg : null, link: mini ? mini.link : null }),
    own ? coverReveal(cover, mini) : null);
}

/**
 * Avatar d'une fiche de profil qui ouvre la photo complète.
 * @param {string} p.name Nom du membre.
 * @param {number} p.size Taille de l'avatar.
 * @param {string} p.status Présence affichée.
 * @param {string} p.ring Couleur du fond derrière l'avatar.
 */
function ProfilePhoto(p) {
  var a = useState(false), hasPhoto = a[0], setHasPhoto = a[1];
  var b = useState(false), open = b[0], setOpen = b[1];
  var avatar = h(T.Avatar, { name: p.name, size: p.size, status: p.status, ring: p.ring, onLoad: function () { setHasPhoto(true); } });
  if (!hasPhoto) return avatar;
  return h(Frag, null,
    h('button', { type: 'button', className: 'avatar-btn photo-btn', 'aria-label': 'View ' + p.name + "'s profile photo", onClick: function () { setOpen(true); } }, avatar),
    open ? h(PhotoViewer, { name: p.name, onClose: function () { setOpen(false); } }) : null);
}

/**
 * Visionneuse plein écran de la photo de profil.
 * @param {string} p.name Nom du membre.
 * @param {Function} p.onClose Fermeture de la visionneuse.
 */
function PhotoViewer(p) {
  var ref = useRef(null), thumb = avatarSrc(p.name, 96);
  var a = useState(profileImgSrc(p.name, 'full')), src = a[0], setSrc = a[1];
  var b = useState(false), loaded = b[0], setLoaded = b[1];
  useEffect(function () {
    var prev = ref.current.getRootNode().activeElement;
    ref.current.querySelector('button').focus();
    // Écoute en capture : Escape et Tab s'arrêtent avant la fenêtre de profil ouverte dessous.
    function onKey(e) {
      if (e.key !== 'Escape' && e.key !== 'Tab') return;
      e.stopPropagation();
      e.preventDefault();
      if (e.key === 'Escape') p.onClose();
    }
    document.addEventListener('keydown', onKey, true);
    return function () {
      document.removeEventListener('keydown', onKey, true);
      if (prev && prev.focus) prev.focus();
    };
  }, []);
  return h(Portal, null, h('div', { className: 'overlay photo-viewer', role: 'dialog', 'aria-modal': 'true', 'aria-label': p.name + "'s profile photo", ref: ref, onMouseDown: function (e) { if (e.target === e.currentTarget) p.onClose(); } },
    loaded ? null : h('span', { className: 'photo-loading' }, h(T.Spinner, { size: 24, label: 'Loading photo' })),
    h('img', { className: 'photo-full' + (loaded ? '' : ' photo-wait'), src: src, alt: p.name + "'s profile photo", referrerPolicy: 'no-referrer', onLoad: function () { setLoaded(true); }, onError: function () { if (src !== thumb) setSrc(thumb); } }),
    h(T.Button, { onClick: p.onClose }, 'Close')));
}

/**
 * ASL d'une fiche de profil, ou son squelette tant que le mini profil est attendu.
 * @param {Object} s État de l'application.
 * @param {string} name Nom du membre.
 */
function profileMeta(s, name) {
  var asl = personAsl(s, name);
  if (asl) return h('span', { className: 'muted profile-line' }, asl);
  return isProfilePending(name, userOf(s, name)) ? h(T.Skeleton, { width: 120, height: 12 }) : null;
}

/**
 * Résumé d'un profil commun à la fenêtre et au panneau : photo, nom, statut, ASL, About, profil complet et groupes en commun.
 * @param {string} p.name Nom du membre.
 * @param {?string} p.gid Groupe d'où le profil est ouvert.
 * @param {string} p.heading Balise de titre du nom.
 * @param {number} p.size Taille de la photo.
 * @param {string} p.ring Couleur du fond derrière la photo.
 * @param {?Object} p.skin Fond Premium porté par le conteneur, tel que le renvoie miniStyleOf.
 * @param {boolean} [p.guest] Invité sans compte Chatango.
 * @param {Function} p.nav Navigation vers un groupe en commun.
 */
function ProfileSummary(p) {
  var app = useApp(), s = app.state, name = p.name, u = userOf(s, name), cover = useMiniCover(p.skin);
  var common = commonGroups(s, name);
  useEffect(function () { if (!p.guest) app.actions.loadProfile(name); }, [name]);
  return h(Frag, null,
    cover.shown ? h('div', { className: 'profile-cover' }, h('img', { src: cover.image, alt: '', referrerPolicy: 'no-referrer' })) : null,
    h('div', { className: 'profile-card' },
      // Clé sur le nom : le panneau garde son instance d'une conversation à l'autre.
      h(ProfilePhoto, { key: name, name: name, size: p.size, status: name === s.me ? s.meStatus : u.status, ring: p.ring }),
      h(p.heading, { className: 'profile-name' }, name),
      h('span', { className: 'muted profile-line' }, personStatus(s, name, p.gid)),
      profileMeta(s, name),
      p.skin ? coverReveal(cover, p.skin) : null),
    profileAbout(u, !!p.skin),
    p.guest ? null : h('div', { className: 'profile-full' }, h(T.Button, { size: 'sm', variant: 'ghost', icon: 'id-card', onClick: function () { app.ui.openFullProfile(name); } }, 'Full profile')),
    common.length ? h('div', { className: 'kv' }, h('h3', null, 'Groups in common · ' + common.length),
      common.map(function (c) { return h('button', { key: c, type: 'button', className: 'mrow common-row', onClick: function () { p.nav({ view: 'group', id: c }); } }, h(T.Avatar, { name: c, square: true, size: 22 }), h('span', { className: 'grow' }, c)); })) : null);
}

/**
 * Permet de retenir les images d'un profil complet tant que les réglages de médias le demandent.
 * @returns {{on: boolean, button: ?Object}} Images autorisées et bouton qui les charge.
 */
function useFullProfileMedia() {
  var safety = useApp().state.prefs.safety;
  var c = useState(!safety.proxyMedia && safety.embedImages), on = c[0], setOn = c[1];
  return { on: on, button: on ? null : h(T.Button, { key: 'm', variant: 'ghost', onClick: function () { setOn(true); } }, 'Load images') };
}

/**
 * Profil complet affiché dans un cadre isolé sans script, sur le fond Premium du membre.
 * @param {string} p.name Membre dont c'est le profil.
 * @param {string} p.html HTML écrit par le membre.
 * @param {boolean} p.media Images autorisées, telles que les donne useFullProfileMedia.
 */
function FullProfileFrame(p) {
  var app = useApp(), mini = miniStyleOf(app.state.prefs, userOf(app.state, p.name), app.theme);
  return h('iframe', { title: p.name + "'s full profile", className: 'fullprofile', sandbox: 'allow-popups allow-popups-to-escape-sandbox', referrerPolicy: 'no-referrer', style: mini ? { background: mini.bg } : null, srcDoc: fullProfileDoc(p.html, p.media, mini) });
}

/** Profil complet : page HTML du membre, affichée dans un cadre isolé sans script. */
function FullProfileDialog(p) {
  var app = useApp(), s = app.state, u = userOf(s, p.name), media = useFullProfileMedia();
  var a = useState(LIVE ? null : ''), html = a[0], setHtml = a[1];
  var b = useState(''), err = b[0], setErr = b[1];
  useEffect(function () {
    if (!LIVE) return;
    if (isProfilePending(p.name, u)) app.actions.loadProfile(p.name);
    liveBridge.fetchFullProfile(p.name).then(setHtml, function () { setErr('Chatango did not return this profile.'); });
  }, [p.name]);
  // Prototype : page d'exemple construite à partir des données de démonstration, échappée.
  var sample = '<h2>' + String(p.name).replace(/[<>&"]/g, '') + '</h2><p>' + String(u.about || 'No full profile yet.').replace(/[<>&"]/g, '') + '</p>';
  var content = LIVE ? html : sample;
  return h(Dialog, {
    title: p.name + "'s profile", wide: true, onClose: p.onClose,
    footer: [
      content ? media.button : null,
      h('a', { key: 'o', className: 'tc-btn', href: 'https://' + p.name + '.chatango.com', target: '_blank', rel: 'noopener noreferrer', style: { textDecoration: 'none' } }, 'Open on chatango.com', h(T.Icon, { name: 'external', size: 14 })),
      h(T.Button, { key: 'c', variant: 'primary', onClick: p.onClose }, 'Close')
    ]
  },
    h('div', { className: 'dialog-body' },
      err ? h('p', { className: 'muted', style: { margin: 0 } }, err)
        : content === null ? h('p', { className: 'muted', style: { margin: 0 } }, 'Loading the profile from Chatango.')
          : !content ? h('p', { className: 'muted', style: { margin: 0 } }, p.name + " hasn't written a full profile.")
            : h(FullProfileFrame, { name: p.name, html: content, media: media.on })));
}

function ProfilePanel(p) {
  var app = useApp(), name = p.name;
  var actions = useProfileActions(name, null);
  return h('aside', { className: 'col profile', 'aria-label': 'Profile of ' + name },
    columnHeader('Profile'),
    h('div', { className: 'scroll' },
      h(ProfileSummary, { name: name, gid: null, heading: 'h3', size: 72, ring: 'var(--panel)', skin: null, nav: app.nav }),
      h('div', { style: { padding: '12px 12px 16px', display: 'flex', flexDirection: 'column', gap: 2, borderTop: '1px solid var(--border)' } },
        actions.map(function (it) {
          return h('button', { key: it.id, type: 'button', className: 'mrow', disabled: it.disabled, 'aria-pressed': it.pressed == null ? undefined : String(it.pressed), style: it.danger ? { color: 'var(--danger)' } : null, onClick: it.onSelect },
            h(T.Icon, { name: it.icon, size: 15 }), h('span', { className: 'grow' }, it.label), it.pressed ? h(T.Icon, { name: 'check', size: 14 }) : null);
        }))));
}
