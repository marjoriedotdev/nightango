/**
 * "About" block.
 * It shows formatted Chatango text in live and plain text in the prototype.
 * @param {Object} u Member in the state.
 * @param {boolean} [skinned] Member background already carried by the container.
 */
function profileAbout(u, skinned) {
  if (u.profileMissing) return h('div', { className: 'kv' }, h('p', { className: 'about muted' }, 'This account has no public profile.'));
  if (u.aboutHtml) return h(RichAbout, { u: u, skinned: skinned });
  if (u.about) return h('div', { className: 'kv' }, h('p', { className: 'about', dir: 'auto' }, bidiText(u.about)));
  if (LIVE && !u.profileLoaded) return h('div', { className: 'kv' }, h('p', { className: 'about muted' }, 'Loading profile.'));
  return null;
}

/**
 * Tracks whether the Premium background image shows under the media settings and trusted hosts.
 * @param {?Object} mini Member background as returned by miniStyleOf.
 */
function useMiniCover(mini) {
  var safety = useApp().state.prefs.safety;
  var r = useState(null), revealed = r[0], setRevealed = r[1];
  var image = mini && mini.image && safety.embedImages ? mini.image : null;
  return { image: image, shown: !!image && (revealed === image || !waitsForClick(safety, 'image', image)), reveal: function () { setRevealed(image); } };
}

/**
 * Button that loads the Premium background image held back by the media settings.
 * @param {Object} cover Background image as returned by useMiniCover.
 * @param {Object} mini Member background as returned by miniStyleOf.
 */
function coverReveal(cover, mini) {
  return cover.image && !cover.shown ? h('button', { type: 'button', className: 'linkbtn', style: { color: mini.link }, onClick: cover.reveal }, 'Show background') : null;
}

/**
 * Remaps a container's color tokens onto a member's Premium background.
 * @param {Object} mini Member background as returned by miniStyleOf.
 */
function miniSkin(mini) {
  var soft = ensureContrast(rgbToHex(mix(hexToRgb(mini.text), hexToRgb(mini.bg), 0.3)), mini.bg, 4.5);
  return {
    backgroundColor: mini.bg, color: mini.text, '--raised': mini.bg, '--text': mini.text, '--text-body': mini.text, '--text-2': soft, '--text-3': soft,
    '--border': rgba(mini.text, 0.16), '--border-strong': rgba(mini.text, 0.24), '--control': rgba(mini.text, 0.4), '--hover': rgba(mini.text, 0.08), '--hover-2': rgba(mini.text, 0.1), '--subtle': rgba(mini.text, 0.06)
  };
}

/**
 * "About" block of a Chatango mini profile.
 * @param {Object} p.u Member in the state.
 * @param {boolean} [p.skinned] Member background already carried by the container.
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
 * Avatar of a profile card that opens the full photo.
 * @param {string} p.name Member name.
 * @param {number} p.size Avatar size.
 * @param {string} p.status Shown presence.
 * @param {string} p.ring Background color behind the avatar.
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
 * Full-screen profile picture viewer.
 * @param {string} p.name Member name.
 * @param {Function} p.onClose Closes the viewer.
 */
function PhotoViewer(p) {
  var ref = useRef(null), thumb = avatarSrc(p.name, 96);
  var a = useState(profileImgSrc(p.name, 'full')), src = a[0], setSrc = a[1];
  var b = useState(false), loaded = b[0], setLoaded = b[1];
  useEffect(function () {
    var prev = ref.current.getRootNode().activeElement;
    ref.current.querySelector('button').focus();
    // Capture listener: Escape and Tab stop before the profile dialog open underneath.
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
 * ASL of a profile card, or its skeleton while the mini profile is pending.
 * @param {Object} s Application state.
 * @param {string} name Member name.
 */
function profileMeta(s, name) {
  var asl = personAsl(s, name);
  if (asl) return h('span', { className: 'muted profile-line' }, asl);
  return isProfilePending(name, userOf(s, name)) ? h(T.Skeleton, { width: 120, height: 12 }) : null;
}

/**
 * Traits of the member spelled out under their name.
 * @param {string} name Member name.
 * @param {Object} u Member data.
 */
function profileBadges(name, u) {
  var dev = developerBadge(name, true), premium = premiumBadge(u.premium, true);
  return dev || premium ? h('span', { className: 'profile-badges' }, dev, premium) : null;
}

/**
 * Profile summary shared by the dialog and the panel.
 * It holds the photo, name, status, ASL, About, full profile and groups in common.
 * @param {string} p.name Member name.
 * @param {?string} p.gid Group the profile is opened from.
 * @param {string} p.heading Heading tag of the name.
 * @param {number} p.size Photo size.
 * @param {string} p.ring Background color behind the photo.
 * @param {?Object} p.skin Premium background carried by the container, as returned by miniStyleOf.
 * @param {boolean} [p.guest] Guest without a Chatango account.
 * @param {Function} p.nav Navigation to a group in common.
 * @param {boolean} [p.focusHeading] The name gets the focus when a dialog opens.
 */
function ProfileSummary(p) {
  var app = useApp(), s = app.state, name = p.name, u = userOf(s, name), cover = useMiniCover(p.skin);
  var common = commonGroups(s, name);
  useEffect(function () { if (!p.guest) app.actions.loadProfile(name); }, [name]);
  return h(Frag, null,
    cover.shown ? h('div', { className: 'profile-cover' }, h('img', { src: cover.image, alt: '', referrerPolicy: 'no-referrer' })) : null,
    h('div', { className: 'profile-card' },
      // Key on the name: the panel keeps its instance from one conversation to the next.
      h(ProfilePhoto, { key: name, name: name, size: p.size, status: name === s.me ? s.meStatus : u.status, ring: p.ring }),
      h(p.heading, p.focusHeading ? { className: 'profile-name', tabIndex: -1, 'data-autofocus': true } : { className: 'profile-name' }, name),
      profileBadges(name, u),
      h('span', { className: 'muted profile-line' }, personStatus(s, name, p.gid)),
      profileMeta(s, name),
      p.skin ? coverReveal(cover, p.skin) : null),
    profileAbout(u, !!p.skin),
    p.guest ? null : h('div', { className: 'profile-full' }, h(T.Button, { size: 'sm', variant: 'ghost', icon: 'id-card', onClick: function () { app.ui.openFullProfile(name); } }, 'Full profile')),
    common.length ? h('div', { className: 'kv' }, h('h3', null, 'Groups in common · ' + common.length),
      common.map(function (c) { return h('button', { key: c, type: 'button', className: 'mrow common-row', onClick: function () { p.nav({ view: 'group', id: c }); } }, h(T.Avatar, { name: c, square: true, size: 22 }), h('span', { className: 'grow' }, c)); })) : null);
}

/**
 * Holds back the images of a full profile while the media settings ask for it.
 * @returns {{on: boolean, button: ?Object}} Whether images are allowed, and the button that loads them.
 */
function useFullProfileMedia() {
  var safety = useApp().state.prefs.safety;
  var c = useState(!safety.proxyMedia && safety.embedImages), on = c[0], setOn = c[1];
  return { on: on, button: on ? null : h(T.Button, { key: 'm', variant: 'ghost', onClick: function () { setOn(true); } }, 'Load images') };
}

/**
 * Full profile shown in an isolated frame without scripts on the member's Premium background.
 * @param {string} p.name Member whose profile it is.
 * @param {string} p.html HTML written by the member.
 * @param {boolean} p.media Whether images are allowed, as given by useFullProfileMedia.
 */
function FullProfileFrame(p) {
  var app = useApp(), mini = miniStyleOf(app.state.prefs, userOf(app.state, p.name), app.theme);
  return h('iframe', { title: p.name + "'s full profile", className: 'fullprofile', sandbox: 'allow-popups allow-popups-to-escape-sandbox', referrerPolicy: 'no-referrer', style: mini ? { background: mini.bg } : null, srcDoc: fullProfileDoc(p.html, p.media, mini) });
}

/** Full profile: the member's HTML page shown in an isolated frame without scripts. */
function FullProfileDialog(p) {
  var app = useApp(), s = app.state, u = userOf(s, p.name), media = useFullProfileMedia();
  var a = useState(LIVE ? null : ''), html = a[0], setHtml = a[1];
  var b = useState(''), err = b[0], setErr = b[1];
  useEffect(function () {
    if (!LIVE) return;
    if (isProfilePending(p.name, u)) app.actions.loadProfile(p.name);
    liveBridge.fetchFullProfile(p.name).then(setHtml, function () { setErr('Chatango did not return this profile.'); });
  }, [p.name]);
  // Prototype: escaped sample page built from the simulated data.
  var sample = '<h2>' + String(p.name).replace(/[<>&"]/g, '') + '</h2><p>' + String(u.about || 'No full profile yet.').replace(/[<>&"]/g, '') + '</p>';
  var content = LIVE ? html : sample;
  return h(Dialog, {
    title: p.name + "'s profile", focusTitle: true, wide: true, onClose: p.onClose,
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
