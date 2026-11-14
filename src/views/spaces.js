/* ---------- Spaces ---------- */
var SPACE_MAX = 12, SPACE_NAME_MAX = 24;

/**
 * Names a conversation inside a space.
 * @param {{view: string, id: string}} route Group or PM.
 */
function spaceKey(route) { return route.view + ':' + route.id; }
function currentSpace(s) { return s.space ? s.spaces.filter(function (x) { return x.id === s.space; })[0] || null : null; }
/**
 * Tells whether the chosen space shows a conversation. Without a chosen space, every conversation shows.
 * @param {Object} s Application state.
 * @param {string} view group or dm.
 * @param {string} id Group or conversation member.
 */
function inCurrentSpace(s, view, id) {
  var sp = currentSpace(s);
  return !sp || sp.members.indexOf(view + ':' + id) >= 0;
}
/**
 * Counts the conversations of a space with unread messages, as the sidebar marks them.
 * @param {Object} s Application state.
 * @param {?Object} sp Space, null for every conversation.
 */
function spaceUnread(s, sp) {
  var n = 0;
  Object.keys(s.groups).forEach(function (k) {
    var g = s.groups[k];
    if (g.joined && (g.mentions || (g.unread && !g.muted)) && (!sp || sp.members.indexOf('group:' + k) >= 0)) n++;
  });
  Object.keys(s.dms).forEach(function (k) { if (s.dms[k].unread && (!sp || sp.members.indexOf('dm:' + k) >= 0)) n++; });
  return n;
}
/**
 * Tells whether the chosen space silences the private messages of a member outside it.
 * @param {Object} s Application state.
 * @param {string} name Sender.
 */
function quietOutsideSpace(s, name) {
  var sp = currentSpace(s);
  return !!sp && sp.quiet && sp.members.indexOf('dm:' + name) < 0;
}

/**
 * Space switcher of the sidebar: All, then each space with its unread conversations.
 */
function SpaceBar() {
  var app = useApp(), s = app.state, sp = currentSpace(s);
  var items = [{ id: null, name: 'All', count: 0 }].concat(s.spaces.map(function (x) { return { id: x.id, name: x.name, count: spaceUnread(s, x) }; }));
  return h('div', { className: 'space-bar', role: 'group', 'aria-label': 'Spaces' },
    items.map(function (it) {
      var on = (s.space || null) === it.id;
      return h('button', { key: it.id || 'all', type: 'button', className: 'space-chip', 'aria-pressed': String(on), onClick: function () { app.actions.setSpace(it.id); } },
        it.name, it.count && !on ? h(T.CountBadge, { count: it.count }) : null);
    }),
    h(MenuButton, {
      icon: 'plus', label: 'Spaces', size: 28, iconSize: 15, align: 'left', items: [
        s.spaces.length < SPACE_MAX ? { label: 'New space…', icon: 'plus', onSelect: function () { app.ui.openSpaceEditor({ id: null }); } } : null,
        sp ? { label: 'Edit ' + sp.name + '…', icon: 'edit', onSelect: function () { app.ui.openSpaceEditor({ id: sp.id }); } } : null
      ]
    }));
}

/**
 * Creates or edits a space: name, private messages from outside it, deletion.
 * @param {{id: ?string, add: ?Object, onClose: Function}} p Edited space, null for a new one, conversation a new space starts with, and close.
 */
function SpaceEditorDialog(p) {
  var app = useApp(), sp = p.id ? app.state.spaces.filter(function (x) { return x.id === p.id; })[0] : null;
  var a = useState(sp ? sp.name : ''), name = a[0], setName = a[1];
  var b = useState(sp ? sp.quiet : false), quiet = b[0], setQuiet = b[1];
  var c = useState(''), err = c[0], setErr = c[1];
  function save() {
    var v = name.trim();
    if (!v) { setErr('Name the space.'); return; }
    if (app.state.spaces.some(function (x) { return x.id !== p.id && x.name.toLowerCase() === v.toLowerCase(); })) { setErr('Another space has this name.'); return; }
    if (sp) app.actions.updateSpace(sp.id, { name: v, quiet: quiet }); else app.actions.createSpace(v, quiet, p.add ? spaceKey(p.add) : null);
    p.onClose();
  }
  function remove() {
    p.onClose();
    app.ui.confirm({ title: 'Delete ' + sp.name + '?', body: 'Its groups and private messages stay where they are. Only the space goes away.', confirmLabel: 'Delete space', danger: true, onConfirm: function () { app.actions.deleteSpace(sp.id); } });
  }
  return h(Dialog, {
    title: sp ? 'Edit space' : 'New space', description: 'Groups and private messages you put together. Kept in this browser.', onClose: p.onClose,
    footer: [
      sp ? h(T.Button, { key: 'x', variant: 'danger', onClick: remove, style: { marginRight: 'auto' } }, 'Delete space…') : null,
      h(T.Button, { key: 'c', variant: 'ghost', onClick: p.onClose }, 'Cancel'),
      h(T.Button, { key: 's', variant: 'primary', onClick: save }, sp ? 'Save' : 'Create space')
    ]
  },
    h('div', { className: 'dialog-body' },
      h(T.TextField, { id: 'space-name', label: 'Name', value: name, maxLength: SPACE_NAME_MAX, error: err, placeholder: 'Friends, Games, Moderation', onChange: function (e) { setName(e.target.value); setErr(''); }, onKeyDown: function (e) { if (e.key === 'Enter') save(); } }),
      h(T.Checkbox, { checked: quiet, onChange: function (e) { setQuiet(e.target.checked); }, label: "Mute private messages from outside this space while it's open" })));
}

/**
 * Puts a group or a PM in spaces, by a checkbox per space.
 * @param {{route: {view: string, id: string}, onClose: Function}} p Conversation and close.
 */
function ConversationSpacesDialog(p) {
  var app = useApp(), key = spaceKey(p.route), spaces = app.state.spaces;
  var label = p.route.view === 'group' ? '#' + p.route.id : p.route.id;
  return h(Dialog, {
    title: 'Spaces for ' + label, onClose: p.onClose,
    footer: [
      spaces.length < SPACE_MAX ? h(T.Button, { key: 'n', variant: 'ghost', icon: 'plus', onClick: function () { p.onClose(); app.ui.openSpaceEditor({ id: null, add: p.route }); } }, 'New space…') : null,
      h(T.Button, { key: 'd', variant: 'primary', onClick: p.onClose }, 'Done')
    ]
  },
    h('div', { className: 'dialog-body' }, spaces.length ? spaces.map(function (sp) {
      return h(T.Checkbox, { key: sp.id, checked: sp.members.indexOf(key) >= 0, label: sp.name, onChange: function () { app.actions.toggleInSpace(sp.id, key); } });
    }) : h('p', { className: 'muted', style: { margin: 0 } }, 'No space yet. Create one to put ' + label + ' in it.')));
}

/**
 * Menu entry that opens the spaces of a conversation.
 * @param {Object} app Application context.
 * @param {{view: string, id: string}} route Group or PM.
 */
function spacesItem(app, route) { return { label: 'Spaces…', icon: 'list', onSelect: function () { app.ui.openSpaces(route); } }; }
