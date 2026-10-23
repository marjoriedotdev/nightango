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
  function row(n, aside) {
    var u = userOf(s, n);
    return h('button', { key: n, type: 'button', className: 'mrow', onClick: function () { app.ui.openProfile(n, g.id); } },
      h(T.Avatar, { name: n, size: 28, status: n === s.me ? s.meStatus : u.status, ring: 'var(--panel)' }),
      h('span', { className: 'grow', style: u.status === 'offline' && n !== s.me ? { color: 'var(--text-3)' } : null }, n + (n === s.me ? ' (you)' : '')),
      aside ? h('span', { style: { fontSize: 11.5, color: 'var(--text-3)' } }, aside) : null);
  }
  return LIVE && !g.membersLoaded ? h('div', { className: 'members-list' }, h(SkeletonRows, { count: 6, avatar: 28, label: 'Loading members' }))
    : h('div', { className: 'members-list' },
      h('h3', { className: 'mlabel' }, 'Staff · ' + staff.length), staff.map(function (n) { return row(n, ROLE_LABEL[roleOf(g, n)]); }),
      h('h3', { className: 'mlabel' }, 'Online · ' + on.length), on.map(function (n) { return row(n); }),
      off.length ? h('h3', { className: 'mlabel' }, 'Offline · ' + off.length) : null, off.map(function (n) { return row(n); }),
      s.prefs.safety.showGuests && g.guests ? h('p', { className: 'mlabel', style: { marginTop: 16 } }, 'Guests · ' + g.guests) : null);
}

/**
 * Colonne des membres d'un groupe.
 * @param {{g: Object}} p Groupe affiché.
 */
function MembersPanel(p) {
  return h('aside', { className: 'col members', 'aria-label': 'Members of ' + p.g.id },
    h('div', { className: 'topbar', style: { padding: '0 12px 0 16px' } }, h('h2', { className: 'grow' }, 'Members')),
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
 * Permet de suivre une demande d'ami jusqu'à la réponse de Chatango.
 */
function useFriendRequest() {
  var app = useApp(), s = app.state;
  var a = useState(null), asked = a[0], setAsked = a[1];
  // Un refus plus ancien pour le même nom ne termine pas une nouvelle demande.
  var refused = !!(asked && s.friendRefused && s.friendRefused.name === asked.name && s.friendRefused.ts >= asked.ts);
  if (asked && (userOf(s, asked.name).friend || refused)) setAsked(null);
  useEffect(function () {
    if (!asked) return undefined;
    var t = setTimeout(function () {
      setAsked(null);
      app.ui.toast("Chatango didn't confirm adding " + asked.name + ' to friends.');
    }, CONFIRM_TIMEOUT);
    return function () { clearTimeout(t); };
  }, [asked]);
  return {
    pending: asked ? asked.name : null,
    toggle: function (name) {
      var was = !!userOf(s, name).friend, sent = app.actions.toggleUser(name, 'friend');
      // Le prototype ajoute sans rien renvoyer : seul un envoi refusé en live (false) n'ouvre pas l'attente.
      setAsked(!was && sent !== false ? { name: name, ts: Date.now() } : null);
    }
  };
}

/**
 * Permet d'ajouter ou de retirer un ami depuis une fiche de profil.
 * @param {string} name Nom du membre.
 * @param {Object} u Membre dans l'état.
 */
function useFriendAction(name, u) {
  var request = useFriendRequest(), busy = request.pending === name;
  return {
    busy: busy, icon: u.friend ? 'user-minus' : 'user-plus', label: busy ? 'Adding friend' : u.friend ? 'Remove friend' : 'Add friend',
    run: function () { request.toggle(name); }
  };
}

function ProfileDialog(p) {
  var app = useApp(), s = app.state, name = p.name, u = userOf(s, name), isMe = name === s.me;
  var g = p.gid ? s.groups[p.gid] : null;
  var myRole = g ? roleOf(g, s.me) : null, theirRole = g ? roleOf(g, name) : null;
  var common = Object.keys(s.groups).filter(function (k) { var x = s.groups[k]; return x.joined && x.members.indexOf(name) >= 0; });
  var meta = [u.age && (isMe ? s.profile.visibility.age : true) ? u.age : null, genderShort(u.gender), u.location || null].filter(Boolean).join(' · ');
  var guest = /^[!#]/.test(name);
  var friend = useFriendAction(name, u);
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
    !guest ? h('div', { style: { padding: '0 20px 4px' } }, h(T.Button, { size: 'sm', variant: 'ghost', icon: 'external', onClick: function () { app.ui.openFullProfile(name); } }, 'Full profile')) : null,
    common.length ? h('div', { className: 'kv' }, h('h3', null, 'Groups in common · ' + common.length), h('p', { className: 'about', style: { color: 'var(--text-2)' } }, common.map(function (c) { return '#' + c; }).join(', '))) : null,
    h('div', { className: 'dialog-foot', style: { justifyContent: 'flex-start', paddingTop: 14, borderTop: '1px solid var(--border)' } },
      isMe ? h(T.Button, { variant: 'primary', icon: 'edit', onClick: function () { go({ view: 'settings', page: 'profile' }); } }, 'Edit profile')
      : LIVE && /^[!#]/.test(name) ? h('span', { className: 'muted', style: { fontSize: 13 } }, 'Guests have no Chatango account: no messages, friends or blocks.') : h(Frag, null,
        h(T.Button, { variant: 'primary', icon: 'message', disabled: u.blocked, onClick: function () { app.actions.openDm(name); p.onClose(); } }, 'Message'),
        h(T.Button, { icon: friend.icon, disabled: friend.busy, onClick: friend.run }, friend.label),
        h(MenuButton, {
          label: 'More profile actions', items: [
            { label: u.ignored ? 'Stop ignoring' : 'Ignore', icon: 'eye-off', onSelect: function () { app.actions.toggleUser(name, 'ignored'); } },
            { label: u.blocked ? 'Unblock' : 'Block', icon: 'ban', danger: !u.blocked, onSelect: function () { if (u.blocked) app.actions.toggleUser(name, 'blocked'); else app.ui.confirm({ title: 'Block ' + name + '?', body: name + " won't be able to message you, and their messages are hidden in groups.", confirmLabel: 'Block', danger: true, onConfirm: function () { app.actions.toggleUser(name, 'blocked'); } }); } },
            isStaffRole(myRole) && theirRole !== 'owner' ? { label: 'Ban from #' + g.id, icon: 'ban', danger: true, onSelect: function () { p.onClose(); app.ui.ban(name, g.id); } } : null
          ]
        }))));
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

function LinkDialog(p) {
  var app = useApp();
  return h(Dialog, {
    title: 'This link leaves Torch', description: 'Check the address before you continue. Torch does not check external sites.', onClose: p.onClose,
    footer: [
      h(T.Button, { key: 'c', variant: 'ghost', onClick: p.onClose }, 'Cancel'),
      h('a', { key: 'o', className: 'tc-btn tc-btn-primary', href: p.url, target: '_blank', rel: 'noopener noreferrer', onClick: p.onClose, style: { textDecoration: 'none' } }, 'Open link', h(T.Icon, { name: 'external', size: 14 }))
    ]
  },
    h('div', { className: 'dialog-body' },
      h('p', { className: 'mono', style: { margin: 0, padding: '10px 12px', borderRadius: 8, background: 'var(--subtle)', border: '1px solid var(--border)', fontSize: 12.5, overflowWrap: 'anywhere', color: 'var(--text-body)' } }, p.url),
      h(T.Checkbox, { label: "Don't warn me again", onChange: function (e) { var v = e.target.checked; app.update(function (d) { d.prefs.safety.warnLinks = !v; }); } })));
}
