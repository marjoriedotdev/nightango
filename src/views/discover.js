import { Frag, T, h, useState } from '../core/globals.js';
import { useApp } from '../core/ui.js';
import { SessionBanner } from './session.js';
import { LIVE } from '../core/env.js';
import { ACCOUNT_NAME, chatangoPageUrl, parseGroupName } from '../core/chatango.js';
import { pageHeader } from './chrome.js';
import { Dialog } from '../core/layers.js';
// -- Discover -----------------------------------------------------------------
/**
 * Rejects a group missing from the sample data in the prototype.
 * @param {Object} s Application state.
 * @param {string} id Group name read by parseGroupName.
 */
export function unknownGroupError(s, id) { return s.groups[id] || LIVE ? '' : 'No group named ' + id + '. Check the spelling.'; }
function GroupJoinButton(p) {
  var app = useApp(), g = p.group;
  return g.joined
    ? h(T.Button, { size: 'sm', variant: 'ghost', onClick: function () { app.nav({ view: 'group', id: g.id }); } }, 'Open')
    : h(T.Button, { size: 'sm', onClick: function () { app.actions.joinGroup(g.id); } }, 'Join');
}
export function Discover() {
  var app = useApp(), s = app.state;
  var a = useState(''), joinName = a[0], setJoinName = a[1];
  var b = useState(''), err = b[0], setErr = b[1];
  function submit(e) {
    e.preventDefault();
    var id = parseGroupName(joinName);
    if (!id) { setErr('Enter a group name or a link.'); return; }
    var unknown = unknownGroupError(s, id);
    if (unknown) { setErr(unknown); return; }
    setErr(''); setJoinName(''); app.actions.joinGroup(id);
  }
  return h('main', { className: 'main' },
    pageHeader('Discover groups'),
    h(SessionBanner, null),
    h('div', { className: 'scroll' },
      h('div', { className: 'discover' },
        h('div', { className: 'page-head' },
          h('div', null, h('p', { className: 'lede' }, 'Join a group, or open one directly by its name.')),
          h(T.Button, { variant: 'primary', icon: 'plus', onClick: function () { app.ui.openCreate(''); } }, 'Create a group')),
        h('form', { onSubmit: submit, className: 'tc-section join-form', noValidate: true },
          h(T.TextField, {
            id: 'join', label: 'Join by name or link', placeholder: 'community, community.chatango.com or a full link', value: joinName, error: err || undefined, onChange: function (e) { setJoinName(e.target.value); setErr(''); },
            action: h(T.Button, { type: 'submit' }, 'Join')
          })),
        h(JoinedGroups, null))));
}

export function CreateGroupDialog(p) {
  var app = useApp(), s = app.state;
  var a = useState(p.prefill || ''), name = a[0], setName = a[1];
  var b = useState(''), title = b[0], setTitle = b[1];
  var c = useState(''), desc = c[0], setDesc = c[1];
  var d = useState(true), listed = d[0], setListed = d[1];
  var e = useState({}), err = e[0], setErr = e[1];
  var f = useState(false), busy = f[0], setBusy = f[1];
  function create() {
    var n = name.trim().toLowerCase(), x = {};
    // A group is a Chatango account: the prototype checks its name like live.
    if (!ACCOUNT_NAME.test(n)) x.name = 'Use up to 20 letters, numbers, - or _.';
    else if (s.groups[n] || s.users[n]) x.name = 'This name is taken. Try another one.';
    if (title.length > 60) x.title = 'Keep the title under 60 characters.';
    setErr(x);
    if (Object.keys(x).length) return;
    setBusy(true);
    Promise.resolve(app.actions.createGroup(n, title.trim() || n, desc.trim(), listed)).then(function (ok) { if (ok) p.onClose(); else setBusy(false); });
  }
  return h(Dialog, {
    title: 'Create a group', description: 'You become its owner. The name is also its address: name.chatango.com.', onClose: p.onClose,
    footer: [h(T.Button, { key: 'c', variant: 'ghost', onClick: p.onClose }, 'Cancel'), h(T.Button, { key: 'k', variant: 'primary', disabled: busy, onClick: create }, busy ? 'Creating group' : 'Create group')]
  },
    h('div', { className: 'dialog-body' },
      h(T.TextField, { id: 'cg-name', label: 'Group name', value: name, error: err.name, hint: name ? chatangoPageUrl(parseGroupName(name) || 'name') : 'Lowercase letters, numbers and dashes.', onChange: function (ev) { setName(ev.target.value); setErr({}); } }),
      h(T.TextField, { id: 'cg-title', label: 'Title', value: title, error: err.title, placeholder: 'Shown under the name in Discover', onChange: function (ev) { setTitle(ev.target.value); } }),
      h(T.TextField, { id: 'cg-desc', label: 'Description', multiline: true, rows: 3, value: desc, labelAside: h('span', { className: 'tc-msg-time' }, desc.length + ' / 300'), maxLength: 300, onChange: function (ev) { setDesc(ev.target.value); } }),
      h('label', { className: 'tc-checkline', style: { justifyContent: 'space-between', width: '100%' } }, h('span', null, 'Show in Discover'), h(T.Switch, { checked: listed, onChange: function (ev) { setListed(ev.target.checked); } }))));
}

function GroupSection(p) {
  var s = useApp().state;
  return h('section', { 'aria-labelledby': p.id, style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' } },
    h('h2', { id: p.id, className: 'tc-section-title' }, p.title),
    p.names.length ? h('div', { className: 'cards small' }, p.names.map(function (k) {
      return h('article', { key: k, className: 'card row' }, h(T.Avatar, { name: k, square: true, size: 36 }),
        h('span', { className: 'card-title' }, h('strong', { title: k }, k), h('span', null, s.groups[k].title)), h(GroupJoinButton, { group: s.groups[k] }));
    })) : h('p', { className: 'muted', style: { margin: 0 } }, p.empty));
}
function JoinedGroups() {
  var s = useApp().state;
  var names = Object.keys(s.groups);
  var joined = names.filter(function (k) { return s.groups[k].joined; });
  var rest = names.filter(function (k) { return !s.groups[k].joined; }).sort();
  var owned = rest.filter(function (k) { return s.groups[k].owned; });
  var recent = rest.filter(function (k) { return !s.groups[k].owned; });
  return h(Frag, null,
    h(GroupSection, { id: 'lj-h', title: 'Joined groups', names: joined, empty: LIVE ? 'Connecting to your groups. They appear here as BetterChatango joins them.' : "You haven't joined any group yet." }),
    owned.length ? h(GroupSection, { id: 'lo-h', title: 'Groups you own', names: owned }) : null,
    recent.length ? h(GroupSection, { id: 'lr-h', title: 'Recent groups', names: recent }) : null);
}
