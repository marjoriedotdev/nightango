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
 * @param {string} p.status Présence affichée.
 * @param {string} p.ring Couleur du fond derrière l'avatar.
 */
function ProfilePhoto(p) {
  var a = useState(false), hasPhoto = a[0], setHasPhoto = a[1];
  var b = useState(false), open = b[0], setOpen = b[1];
  var avatar = h(T.Avatar, { name: p.name, size: 96, status: p.status, ring: p.ring, onLoad: function () { setHasPhoto(true); } });
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
 * Ligne d'informations d'une fiche de profil.
 * @param {string} meta Texte déjà composé.
 * @param {string} name Nom du membre.
 * @param {Object} u Membre dans l'état.
 */
function profileMeta(meta, name, u) {
  if (meta) return h('span', { className: 'muted', style: { fontSize: 13 } }, meta);
  return isProfilePending(name, u) ? h(T.Skeleton, { width: 120, height: 12 }) : null;
}

/** Profil complet : page HTML du membre, affichée dans un cadre isolé sans script. */
function FullProfileDialog(p) {
  var app = useApp(), s = app.state, u = userOf(s, p.name), safety = s.prefs.safety, mini = miniStyleOf(s.prefs, u, app.theme);
  var a = useState(LIVE ? null : ''), html = a[0], setHtml = a[1];
  var b = useState(''), err = b[0], setErr = b[1];
  var c = useState(!safety.proxyMedia && safety.embedImages), media = c[0], setMedia = c[1];
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
      !media && content ? h(T.Button, { key: 'm', variant: 'ghost', onClick: function () { setMedia(true); } }, 'Load images') : null,
      h('a', { key: 'o', className: 'tc-btn', href: 'https://' + p.name + '.chatango.com', target: '_blank', rel: 'noopener noreferrer', style: { textDecoration: 'none' } }, 'Open on chatango.com', h(T.Icon, { name: 'external', size: 14 })),
      h(T.Button, { key: 'c', variant: 'primary', onClick: p.onClose }, 'Close')
    ]
  },
    h('div', { className: 'dialog-body' },
      err ? h('p', { className: 'muted', style: { margin: 0 } }, err)
        : content === null ? h('p', { className: 'muted', style: { margin: 0 } }, 'Loading the profile from Chatango.')
          : !content ? h('p', { className: 'muted', style: { margin: 0 } }, p.name + " hasn't written a full profile.")
            : h('iframe', { title: p.name + "'s full profile", className: 'fullprofile', sandbox: 'allow-popups allow-popups-to-escape-sandbox', referrerPolicy: 'no-referrer', style: mini ? { background: mini.bg } : null, srcDoc: fullProfileDoc(content, media, mini) })));
}

/**
 * Permet de nommer l'alerte de connexion selon son état.
 * @param {boolean} notify Vrai quand l'alerte est active.
 */
function notifyOnlineLabel(notify) { return notify ? 'Notifying when online' : 'Notify when online'; }
/**
 * Permet de basculer l'alerte de connexion d'un membre.
 * @param {Object} app Contexte de l'application.
 * @param {string} name Membre suivi.
 */
function toggleNotifyOnline(app, name) {
  var notify = isNotifyingOnline(app.state, name);
  app.update(function (d) { d.notifyOnline[name] = !notify; });
}

function ProfilePanel(p) {
  var app = useApp(), s = app.state, name = p.name, u = userOf(s, name);
  var common = Object.keys(s.groups).filter(function (k) { var x = s.groups[k]; return x.joined && x.members.indexOf(name) >= 0; });
  var meta = [u.age, genderShort(u.gender), u.location].filter(Boolean).join(' · ');
  var notify = isNotifyingOnline(s, name);
  var friend = useFriendAction(name, u, true);
  useEffect(function () { app.actions.loadProfile(name); }, [name]);
  return h('aside', { className: 'col profile', 'aria-label': 'Profile of ' + name },
    h('div', { className: 'scroll' },
      h('div', { className: 'profile-card' },
        h(T.Avatar, { name: name, size: 72, status: u.status, ring: 'var(--panel)' }),
        h('h2', null, name), profileMeta(meta, name, u)),
      profileAbout(u),
      h('div', { style: { padding: '0 16px 8px' } }, h(T.Button, { size: 'sm', variant: 'ghost', icon: 'external', onClick: function () { app.ui.openFullProfile(name); } }, 'Full profile')),
      common.length ? h('div', { className: 'kv' }, h('h3', null, 'Groups in common · ' + common.length),
        common.map(function (c) { return h('button', { key: c, type: 'button', className: 'mrow', style: { height: 32, padding: '0 4px' }, onClick: function () { app.nav({ view: 'group', id: c }); } }, h(T.Avatar, { name: c, square: true, size: 22 }), h('span', { className: 'grow' }, c)); })) : null,
      h('div', { style: { padding: '12px 12px 16px', display: 'flex', flexDirection: 'column', gap: 2, borderTop: '1px solid var(--border)' } },
        u.friend ? h('button', { type: 'button', className: 'mrow', 'aria-pressed': String(notify), onClick: function () { toggleNotifyOnline(app, name); } },
          h(T.Icon, { name: 'bell', size: 15 }), h('span', { className: 'grow' }, notifyOnlineLabel(notify)), notify ? h(T.Icon, { name: 'check', size: 14 }) : null) : null,
        h('button', { type: 'button', className: 'mrow', disabled: friend.busy, onClick: friend.run }, h(T.Icon, { name: friend.icon, size: 15 }), h('span', { className: 'grow' }, friend.label)),
        h('button', { type: 'button', className: 'mrow', onClick: function () { app.actions.toggleUser(name, 'ignored'); } }, h(T.Icon, { name: 'eye-off', size: 15 }), h('span', { className: 'grow' }, u.ignored ? 'Stop ignoring' : 'Ignore')),
        h('button', { type: 'button', className: 'mrow', style: { color: 'var(--danger)' }, onClick: function () { if (u.blocked) app.actions.toggleUser(name, 'blocked'); else app.ui.confirm({ title: 'Block ' + name + '?', body: name + " won't be able to message you, and their messages are hidden in groups.", confirmLabel: 'Block', danger: true, onConfirm: function () { app.actions.toggleUser(name, 'blocked'); } }); } },
          h(T.Icon, { name: 'ban', size: 15 }), h('span', { className: 'grow' }, u.blocked ? 'Unblock' : 'Block')))));
}
