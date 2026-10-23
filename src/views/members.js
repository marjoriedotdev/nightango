/**
 * Liste des membres d'un groupe.
 * @param {{g: Object}} p Groupe affiché.
 */
function MembersList(p) {
  var app = useApp(), s = app.state, g = p.g;
  var staff = g.members.filter(function (n) { return roleOf(g, n); });
  var others = g.members.filter(function (n) { return !roleOf(g, n); });
  var on = others.filter(function (n) { return userOf(s, n).status !== 'offline' || n === s.me; });
  var off = others.filter(function (n) { return userOf(s, n).status === 'offline' && n !== s.me; });
  var guests = guestsOf(g);
  function row(n) {
    var u = userOf(s, n), isMe = n === s.me, status = isMe ? s.meStatus : u.status;
    return h('button', { key: n, type: 'button', className: 'mrow', onClick: function () { app.ui.openProfile(n, g.id); } },
      h(T.Avatar, { name: n, size: 28, status: status, ring: 'var(--panel)' }),
      h('span', { className: 'grow', style: u.status === 'offline' && !isMe ? { color: 'var(--text-3)' } : null }, n),
      presenceSr(status), youBadge(isMe), roleBadge(roleOf(g, n)));
  }
  return LIVE && !g.membersLoaded ? h('div', { className: 'members-list' }, h(SkeletonRows, { count: 6, avatar: 28, label: 'Loading members' }))
    : h('div', { className: 'members-list' },
      h('h3', { className: 'mlabel' }, 'Staff · ' + staff.length), staff.map(function (n) { return row(n); }),
      h('h3', { className: 'mlabel' }, 'Online · ' + on.length), on.map(function (n) { return row(n); }),
      off.length ? h('h3', { className: 'mlabel' }, 'Offline · ' + off.length) : null, off.map(function (n) { return row(n); }),
      s.prefs.safety.showGuests && guests.count ? h(Frag, null,
        h('h3', { className: 'mlabel', style: { marginTop: 16 } }, 'Guests · ' + guests.count), guests.names.map(function (n) { return row(n); }),
        g.guests ? h('p', { className: 'muted', style: { margin: 'var(--space-1) var(--space-2)' } }, g.guests + ' anonymous') : null) : null);
}

/**
 * Colonne des membres d'un groupe.
 * @param {{g: Object}} p Groupe affiché.
 */
function MembersPanel(p) {
  return h('aside', { className: 'col members', 'aria-label': 'Members of ' + p.g.id },
    columnHeader('Members'),
    h('div', { className: 'scroll' }, h(MembersList, { g: p.g })));
}

/**
 * Feuille plein écran qui montre la description et les membres d'un groupe.
 * @param {{g: Object, onClose: Function}} p Groupe affiché et fermeture de la feuille.
 */
function GroupInfoSheet(p) {
  var g = p.g;
  return h(Dialog, { label: 'About #' + g.id, sheet: true, onClose: p.onClose },
    h('div', { className: 'topbar' },
      h(T.Icon, { name: 'hash', size: 18, style: { color: 'var(--text-3)' } }),
      h('h2', { className: 'grow' }, g.id),
      h(T.IconButton, { icon: 'x', label: 'Close', onClick: p.onClose })),
    h('div', { className: 'scroll' },
      g.topic ? h('div', { className: 'kv' }, h('h3', null, 'Description'), h('p', { className: 'about' }, g.topic)) : null,
      h('div', { className: 'kv' }, h('h3', null, 'Members')),
      h(MembersList, { g: g })));
}

/* ---------- Profil d'un membre ---------- */
/**
 * Permet de suivre la demande d'ami envoyée depuis un formulaire jusqu'à la réponse de Chatango.
 */
function useFriendRequest() {
  var app = useApp();
  var a = useState(null), asked = a[0], setAsked = a[1];
  return {
    pending: asked && app.state.friendAdds[asked] ? asked : null,
    add: function (name) { app.actions.toggleUser(name, 'friend'); setAsked(name); }
  };
}

/**
 * Permet de demander confirmation avant de retirer un ami.
 * @param {Object} app Contexte de l'application.
 * @param {string} name Ami à retirer.
 */
function confirmRemoveFriend(app, name) {
  app.ui.confirm({ title: 'Remove ' + name + ' from friends?', body: "You'll stop seeing when " + name + ' is online. You can add them again by username.', confirmLabel: 'Remove', danger: true, onConfirm: function () { app.actions.toggleUser(name, 'friend'); } });
}

/**
 * Permet de proposer l'alerte de connexion d'un ami en entrée de menu ou de liste.
 * @param {Object} app Contexte de l'application.
 * @param {string} name Ami suivi.
 */
function notifyOnlineItem(app, name) {
  var notify = isNotifyingOnline(app.state, name);
  return { id: 'notify', label: notify ? 'Notifying when online' : 'Notify when online', short: notify ? 'Notifying' : 'Notify', icon: 'bell', pressed: notify, onSelect: function () { app.update(function (d) { d.notifyOnline[name] = !notify; }); } };
}

/**
 * Permet de proposer l'ouverture de la fenêtre de profil d'un membre.
 * @param {Object} app Contexte de l'application.
 * @param {string} name Nom du membre.
 * @param {?string} gid Groupe d'où le profil est ouvert.
 */
function viewProfileItem(app, name, gid) {
  return { label: 'View profile', icon: 'user', onSelect: function () { app.ui.openProfile(name, gid); } };
}

/**
 * Permet de proposer d'ignorer un membre ou de ne plus l'ignorer.
 * @param {Object} app Contexte de l'application.
 * @param {string} name Nom du membre.
 */
function ignoreItem(app, name) {
  return { id: 'ignore', label: userOf(app.state, name).ignored ? 'Stop ignoring' : 'Ignore', icon: 'eye-off', onSelect: function () { app.actions.toggleUser(name, 'ignored'); } };
}

/**
 * Permet de proposer de couper le style d'un membre ou de le rétablir.
 * @param {Object} app Contexte de l'application.
 * @param {string} name Nom du membre.
 * @param {boolean} [named] Libellé qui nomme le membre, pour le menu d'un message.
 */
function styleItem(app, name, named) {
  var label = (userOf(app.state, name).unstyled ? 'Show ' : 'Hide ') + (named ? name + "'s style" : 'style');
  return { id: 'style', label: label, icon: 'type', onSelect: function () { app.actions.toggleUser(name, 'unstyled'); } };
}

/**
 * Permet de proposer le bannissement d'un membre d'un groupe.
 * @param {Object} app Contexte de l'application.
 * @param {string} name Nom du membre.
 * @param {string} gid Groupe.
 * @param {Object} [msg] Message d'où part le bannissement.
 */
function banItem(app, name, gid, msg) {
  return { id: 'ban', label: 'Ban from #' + gid + '…', icon: 'ban', danger: true, closes: true, onSelect: function () { app.ui.ban(name, gid, msg); } };
}

/**
 * Permet de lister les actions sur une personne, communes à la fenêtre de profil, au panneau et au menu d'un MP.
 * Une entrée marquée closes ferme la fenêtre de profil qui l'affiche, buttonLabel est son libellé en bouton.
 * @param {string} name Nom du membre.
 * @param {?string} gid Groupe d'où le profil est ouvert.
 */
function useProfileActions(name, gid) {
  var app = useApp(), s = app.state, u = userOf(s, name), busy = !!s.friendAdds[name];
  var g = gid ? s.groups[gid] : null;
  var inDm = s.route.view === 'dm' && s.route.id === name;
  var friendLabel = busy ? 'Adding friend' : u.friend ? 'Remove friend' : 'Add friend';
  return [
    inDm ? null : { id: 'message', label: 'Message', icon: 'message', disabled: u.blocked, closes: true, onSelect: function () { app.actions.openDm(name); } },
    {
      id: 'friend', label: u.friend ? friendLabel + '…' : friendLabel, buttonLabel: friendLabel, icon: u.friend ? 'user-minus' : 'user-plus', disabled: busy,
      onSelect: function () { if (u.friend) confirmRemoveFriend(app, name); else app.actions.toggleUser(name, 'friend'); }
    },
    u.friend ? notifyOnlineItem(app, name) : null,
    styleItem(app, name),
    ignoreItem(app, name),
    {
      id: 'block', label: u.blocked ? 'Unblock' : 'Block…', icon: 'user-x', danger: !u.blocked, onSelect: function () {
        if (u.blocked) app.actions.toggleUser(name, 'blocked');
        else app.ui.confirm({ title: 'Block ' + name + '?', body: name + " won't be able to message you, and their messages are hidden in groups.", confirmLabel: 'Block', danger: true, onConfirm: function () { app.actions.toggleUser(name, 'blocked'); } });
      }
    },
    g && isStaffRole(roleOf(g, s.me)) && roleOf(g, name) !== 'owner' ? banItem(app, name, gid) : null
  ].filter(Boolean);
}

function ProfileDialog(p) {
  var app = useApp(), s = app.state, name = p.name, u = userOf(s, name), isMe = name === s.me;
  var g = p.gid ? s.groups[p.gid] : null;
  var theirRole = g ? roleOf(g, name) : null;
  var common = Object.keys(s.groups).filter(function (k) { var x = s.groups[k]; return x.joined && x.members.indexOf(name) >= 0; });
  var meta = [u.age && (isMe ? s.profile.visibility.age : true) ? u.age : null, genderShort(u.gender), u.location || null].filter(Boolean).join(' · ');
  var guest = /^[!#]/.test(name);
  var actions = useProfileActions(name, p.gid).map(function (it) {
    return it.closes ? Object.assign({}, it, { onSelect: function () { p.onClose(); it.onSelect(); } }) : it;
  });
  var buttons = actions.filter(function (it) { return it.id === 'message' || it.id === 'friend'; });
  var mini = miniStyleOf(s.prefs, u, app.theme), cover = useMiniCover(mini);
  useEffect(function () { if (!guest) app.actions.loadProfile(name); }, [name]);
  function go(route) { p.onClose(); app.nav(route); }
  return h(Dialog, { label: 'Profile of ' + name, onClose: p.onClose, className: 'profile-dialog', style: mini ? miniSkin(mini) : null },
    cover.shown ? h('div', { className: 'profile-cover' }, h('img', { src: cover.image, alt: '', referrerPolicy: 'no-referrer' })) : null,
    h('div', { className: 'profile-card' },
      h(ProfilePhoto, { name: name, status: isMe ? s.meStatus : u.status, ring: 'var(--raised)' }),
      h('h2', null, name),
      h('span', { className: 'muted', style: { fontSize: 13 } }, [statusLabel(isMe ? s.meStatus : u.status), u.friend ? 'Friend' : null, theirRole ? ROLE_LONG[theirRole] + ' in #' + g.id : null].filter(Boolean).join(' · ')),
      profileMeta(meta, name, u),
      mini ? coverReveal(cover, mini) : null),
    profileAbout(u, true),
    !guest ? h('div', { style: { padding: '0 20px 4px' } }, h(T.Button, { size: 'sm', variant: 'ghost', icon: 'id-card', onClick: function () { app.ui.openFullProfile(name); } }, 'Full profile')) : null,
    common.length ? h('div', { className: 'kv' }, h('h3', null, 'Groups in common · ' + common.length), h('p', { className: 'about', style: { color: 'var(--text-2)' } }, common.map(function (c) { return '#' + c; }).join(', '))) : null,
    h('div', { className: 'dialog-foot', style: { justifyContent: 'flex-start', paddingTop: 14, borderTop: '1px solid var(--border)' } },
      isMe ? h(T.Button, { variant: 'primary', icon: 'edit', onClick: function () { go({ view: 'settings', page: 'profile' }); } }, 'Edit profile')
      : LIVE && guest ? h('span', { className: 'muted', style: { fontSize: 13 } }, 'Guests have no Chatango account: no messages, friends or blocks.') : h(Frag, null,
        buttons.map(function (it) { return h(T.Button, { key: it.id, variant: it.id === 'message' ? 'primary' : undefined, icon: it.icon, disabled: it.disabled, onClick: it.onSelect }, it.buttonLabel || it.label); }),
        h(MenuButton, { label: 'More profile actions', items: actions.filter(function (it) { return buttons.indexOf(it) < 0; }) }))));
}

function BanDialog(p) {
  var app = useApp();
  var st = useState('Spam'), reason = st[0], setReason = st[1];
  var dl = useState(false), wipe = dl[0], setWipe = dl[1];
  if (LIVE) {
    return h(Dialog, {
      title: 'Ban ' + p.name + ' from #' + p.gid + '?', description: 'Chatango bans the account and the IP of their last message. They cannot rejoin until unbanned.', onClose: p.onClose,
      footer: [h(T.Button, { key: 'c', variant: 'ghost', onClick: p.onClose }, 'Cancel'), h(T.Button, { key: 'b', variant: 'danger', icon: 'ban', onClick: function () { if (app.actions.ban(p.gid, p.name, null, { deleteAll: wipe, msg: p.msg }) !== false) p.onClose(); } }, 'Ban')]
    }, h('div', { className: 'dialog-body' }, h(T.Checkbox, { label: 'Also delete their recent messages', checked: wipe, onChange: function (e) { setWipe(e.target.checked); } })));
  }
  return h(Dialog, {
    title: 'Ban ' + p.name + ' from #' + p.gid + '?', description: 'They are removed from the group and cannot rejoin from this IP until unbanned.', onClose: p.onClose,
    footer: [h(T.Button, { key: 'c', variant: 'ghost', onClick: p.onClose }, 'Cancel'), h(T.Button, { key: 'b', variant: 'danger', icon: 'ban', onClick: function () { app.actions.ban(p.gid, p.name, reason); p.onClose(); } }, 'Ban')]
  },
    h('div', { className: 'dialog-body' },
      h('div', { className: 'tc-field' }, h('label', { className: 'tc-label', htmlFor: 'ban-reason' }, 'Reason'),
        h('select', { id: 'ban-reason', className: 'tc-input', value: reason, onChange: function (e) { setReason(e.target.value); } },
          ['Spam', 'Harassment', 'Ban evasion', 'Off-topic flooding', 'Other'].map(function (r) { return h('option', { key: r }, r); })),
        h('span', { className: 'tc-hint' }, 'Shown to other staff in the audit log.'))));
}

/**
 * Bouton qui ouvre une adresse dans un nouvel onglet puis ferme la fenêtre.
 * @param {string} url Adresse à ouvrir.
 * @param {string} variant Variante du bouton.
 * @param {Function} onClose Fermeture de la fenêtre.
 */
function openLinkButton(url, variant, onClose) {
  return h('a', { key: 'o', className: 'tc-btn tc-btn-' + variant, href: url, target: '_blank', rel: 'noopener noreferrer', onClick: onClose, style: { textDecoration: 'none' } }, 'Open link', h(T.Icon, { name: 'external', size: 14 }));
}
/**
 * Adresse complète d'un lien, en tête de sa fenêtre.
 * @param {string} url Adresse du lien.
 */
function linkAddress(url) {
  return h('p', { style: { margin: 0, padding: '10px 12px', borderRadius: 'var(--radius-lg)', background: 'var(--subtle)', border: '1px solid var(--border)', fontSize: 12.5, overflowWrap: 'anywhere', color: 'var(--text-body)' } }, url);
}

function LinkDialog(p) {
  var app = useApp();
  return h(Dialog, {
    title: 'This link leaves Torch', description: 'Check the address before you continue. Torch does not check external sites.', onClose: p.onClose,
    footer: [
      h(T.Button, { key: 'c', variant: 'ghost', onClick: p.onClose }, 'Cancel'),
      openLinkButton(p.url, 'primary', p.onClose)
    ]
  },
    h('div', { className: 'dialog-body' },
      linkAddress(p.url),
      h(T.Checkbox, { label: "Don't warn me again", onChange: function (e) { var v = e.target.checked; app.update(function (d) { d.prefs.safety.warnLinks = !v; }); } })));
}

function ProfileLinkDialog(p) {
  var app = useApp(), link = p.link;
  return h(Dialog, {
    title: link.name + '.chatango.com', description: 'This address can lead to a Chatango profile or group.', onClose: p.onClose,
    footer: [
      h(T.Button, { key: 'c', variant: 'ghost', onClick: p.onClose }, 'Cancel'),
      openLinkButton(link.url, 'secondary', p.onClose),
      h(T.Button, { key: 'v', variant: 'primary', icon: 'user', onClick: function () { p.onClose(); app.ui.openProfile(link.name, link.gid); } }, 'View profile')
    ]
  }, h('div', { className: 'dialog-body' }, linkAddress(link.url)));
}
