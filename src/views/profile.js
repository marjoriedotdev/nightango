/** Bloc « About » : texte Chatango mis en forme en live, texte simple dans le prototype. */
function profileAbout(u) {
  if (u.profileMissing) return h('div', { className: 'kv' }, h('p', { className: 'about muted' }, 'This account has no public profile.'));
  if (u.aboutHtml) return h(RichAbout, { u: u });
  if (u.about) return h('div', { className: 'kv' }, h('h3', null, 'About'), h('p', { className: 'about' }, u.about));
  if (LIVE && !u.profileLoaded) return h('div', { className: 'kv' }, h('p', { className: 'about muted' }, 'Loading profile.'));
  return null;
}

/**
 * Bloc « About » d'un mini profil Chatango.
 * @param {Object} p.u Membre dans l'état.
 */
function RichAbout(p) {
  var app = useApp(), safety = app.state.prefs.safety, mini = miniStyleOf(app.state.prefs, p.u, app.theme);
  var r = useState(null), revealed = r[0], setRevealed = r[1];
  var image = mini && mini.image && safety.embedImages ? mini.image : null;
  var shown = image && (!safety.proxyMedia || revealed === image);
  return h('div', { className: 'kv' + (mini ? ' mini-about' : ''), style: mini ? { backgroundColor: mini.bg, color: mini.text } : null },
    shown ? h('img', { className: 'mini-about-img', src: image, alt: '', referrerPolicy: 'no-referrer' }) : null,
    h('h3', null, 'About'),
    h(RichText, { html: p.u.aboutHtml, bg: mini ? mini.bg : null, link: mini ? mini.link : null }),
    image && !shown ? h('button', { type: 'button', className: 'linkbtn', style: { color: mini.link, alignSelf: 'flex-start' }, onClick: function () { setRevealed(image); } }, 'Show background') : null);
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

function ProfilePanel(p) {
  var app = useApp(), s = app.state, name = p.name, u = userOf(s, name);
  var common = Object.keys(s.groups).filter(function (k) { var x = s.groups[k]; return x.joined && x.members.indexOf(name) >= 0; });
  var meta = [u.age, genderShort(u.gender), u.location].filter(Boolean).join(' · ');
  var notify = s.dms[name] && s.dms[name].notifyOnline;
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
        h('button', { type: 'button', className: 'mrow', 'aria-pressed': String(!!notify), onClick: function () { app.update(function (d) { d.dms[name].notifyOnline = !notify; }); app.ui.toast(notify ? 'You will not be notified.' : "You'll be notified when " + name + ' comes online.'); } },
          h(T.Icon, { name: 'bell', size: 15 }), h('span', { className: 'grow' }, notify ? 'Notifying when online' : 'Notify when online'), notify ? h(T.Icon, { name: 'check', size: 14 }) : null),
        h('button', { type: 'button', className: 'mrow', onClick: function () { app.actions.toggleUser(name, 'friend'); } }, h(T.Icon, { name: u.friend ? 'user-minus' : 'user-plus', size: 15 }), h('span', { className: 'grow' }, u.friend ? 'Remove friend' : 'Add friend')),
        h('button', { type: 'button', className: 'mrow', onClick: function () { app.actions.toggleUser(name, 'ignored'); } }, h(T.Icon, { name: 'eye-off', size: 15 }), h('span', { className: 'grow' }, u.ignored ? 'Stop ignoring' : 'Ignore in groups')),
        h('button', { type: 'button', className: 'mrow', style: { color: 'var(--danger)' }, onClick: function () { if (u.blocked) app.actions.toggleUser(name, 'blocked'); else app.ui.confirm({ title: 'Block ' + name + '?', body: name + " won't be able to message you, and their messages are hidden in groups.", confirmLabel: 'Block', danger: true, onConfirm: function () { app.actions.toggleUser(name, 'blocked'); } }); } },
          h(T.Icon, { name: 'ban', size: 15 }), h('span', { className: 'grow' }, u.blocked ? 'Unblock' : 'Block')))));
}
