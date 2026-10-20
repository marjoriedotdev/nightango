function NewDmDialog(p) {
  var app = useApp(), s = app.state;
  var a = useState(''), name = a[0], setName = a[1];
  var b = useState(''), err = b[0], setErr = b[1];
  var suggestions = Object.keys(s.users).filter(function (n) { return n !== s.me && (!name || n.indexOf(name.toLowerCase()) === 0); }).slice(0, 6);
  function start(n) {
    var v = (n || name).trim().toLowerCase();
    if (!v) { setErr('Enter a username.'); return; }
    if (LIVE ? !/^[a-z0-9_-]{1,20}$/.test(v) : !s.users[v]) { setErr(LIVE ? 'Usernames use letters, numbers, - and _ only.' : 'No Chatango user named ' + v + '.'); return; }
    if (v === s.me) { setErr("You can't message yourself."); return; }
    p.onClose(); app.actions.openDm(v);
  }
  return h(Dialog, {
    title: 'New private message', onClose: p.onClose,
    footer: [h(T.Button, { key: 'c', variant: 'ghost', onClick: p.onClose }, 'Cancel'), h(T.Button, { key: 's', variant: 'primary', onClick: function () { start(); } }, 'Start conversation')]
  },
    h('div', { className: 'dialog-body' },
      h(T.TextField, { id: 'newdm', label: 'Username', value: name, error: err, autoComplete: 'off', onChange: function (e) { setName(e.target.value); setErr(''); }, onKeyDown: function (e) { if (e.key === 'Enter') start(); } }),
      h('div', { className: 'chips' }, suggestions.map(function (n) { return h('button', { key: n, type: 'button', className: 'chip', onClick: function () { start(n); } }, n); }))));
}
