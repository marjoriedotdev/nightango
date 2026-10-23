var PM_CHECK_TIMEOUT = 5000;
/**
 * Permet de refuser un nom avec lequel aucune conversation ne peut s'ouvrir.
 * @param {Object} s État de l'application.
 * @param {string} name Nom en minuscules, non vide.
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
  // Une réponse plus ancienne pour le même nom ne termine pas une nouvelle demande.
  var answer = asked && s.pmChecked && s.pmChecked.name === asked.name && s.pmChecked.ts >= asked.ts ? s.pmChecked : null;
  useEffect(function () {
    if (!answer) return;
    setAsked(null);
    if (!answer.found) { setErr(unknownUserText(answer.name)); return; }
    p.onClose(); app.actions.openDm(answer.name);
  }, [answer && answer.ts]);
  useEffect(function () {
    if (!asked) return undefined;
    var t = setTimeout(function () { setAsked(null); setErr('Chatango did not answer. Try again.'); }, PM_CHECK_TIMEOUT);
    return function () { clearTimeout(t); };
  }, [asked]);
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
