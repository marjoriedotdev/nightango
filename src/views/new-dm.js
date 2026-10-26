/**
 * Rejects a name no conversation can be opened with.
 * @param {Object} s Application state.
 * @param {string} name Lowercase name, not empty.
 */
function dmNameError(s, name) {
  if (LIVE ? !ACCOUNT_NAME.test(name) : !s.users[name]) return LIVE ? 'Usernames use letters, numbers, - and _ only.' : unknownUserText(name);
  return name === s.me ? "You can't message yourself." : '';
}
function NewDmDialog(p) {
  var app = useApp(), s = app.state;
  var a = useState(''), name = a[0], setName = a[1];
  var b = useState(''), err = b[0], setErr = b[1];
  var c = useState(null), asked = c[0], setAsked = c[1];
  // An older answer for the same name does not end a new request.
  var answer = asked && s.pmChecked && s.pmChecked.name === asked.name && s.pmChecked.ts >= asked.ts ? s.pmChecked : null;
  useEffect(function () {
    if (!answer) return;
    setAsked(null);
    if (answer.timeout) { setErr('Chatango did not answer. Try again.'); return; }
    if (!answer.found) { setErr(unknownUserText(answer.name)); return; }
    p.onClose(); app.actions.openDm(answer.name);
  }, [answer && answer.ts]);
  function start() {
    if (asked) return;
    var v = name.trim().toLowerCase();
    if (!v) { setErr('Enter a username.'); return; }
    var invalid = dmNameError(s, v);
    if (invalid) { setErr(invalid); return; }
    if (!LIVE) { p.onClose(); app.actions.openDm(v); return; }
    if (app.actions.checkPm(v)) setAsked({ name: v, ts: Date.now() });
    else setErr('Private messages are still connecting. Try again in a moment.');
  }
  return h(Dialog, {
    title: 'New private message', onClose: p.onClose,
    footer: [h(T.Button, { key: 'c', variant: 'ghost', onClick: p.onClose }, 'Cancel'), h(T.Button, { key: 's', variant: 'primary', disabled: !!asked, onClick: start }, asked ? 'Checking' : 'Start conversation')]
  },
    h('div', { className: 'dialog-body' },
      h(T.TextField, { id: 'newdm', label: 'Username', value: name, error: err, autoComplete: 'off', onChange: function (e) { setName(e.target.value); setErr(''); }, onKeyDown: function (e) { if (e.key === 'Enter') start(); } })));
}
