/* ---------- Connexion ---------- */
function Login() {
  var app = useApp();
  var a = useState('orrin'), user = a[0], setUser = a[1];
  var b = useState(''), pass = b[0], setPass = b[1];
  var c = useState({}), errors = c[0], setErrors = c[1];
  var d = useState(false), busy = d[0], setBusy = d[1];

  function submit(e) {
    e.preventDefault();
    var err = {};
    if (!/^[a-z0-9]{3,20}$/i.test(user)) err.user = 'Use 3 to 20 letters or numbers.';
    if (!pass) err.pass = 'Enter your password.';
    setErrors(err);
    if (Object.keys(err).length) return;
    setBusy(true);
    setTimeout(function () { app.actions.login(user.toLowerCase(), pass); }, 450);
  }
  return h('div', { className: 'login' },
    h('section', { className: 'login-main', 'aria-label': 'Account' },
      h('form', { className: 'login-form', onSubmit: submit, noValidate: true },
        h('div', null, h('h2', null, 'Welcome back'), h('p', { className: 'muted' }, 'Log in with your Chatango account.')),
        h(T.TextField, { id: 'lg-user', label: 'Username', autoComplete: 'username', value: user, error: errors.user, onChange: function (e) { setUser(e.target.value); } }),
        h(T.TextField, { id: 'lg-pass', label: 'Password', type: 'password', autoComplete: 'current-password', value: pass, error: errors.pass, hint: 'Demo account. Any password works.', onChange: function (e) { setPass(e.target.value); } }),
        h(T.Button, { type: 'submit', variant: 'primary', size: 'lg', block: true, disabled: busy }, busy ? 'Signing in' : 'Log in'),
        h(T.Banner, { icon: 'lock' }, 'BetterChatango signs in to Chatango on your behalf. To keep you signed in, your credentials are stored encrypted on BetterChatango servers.')),
      h('div', { className: 'login-foot' },
        h('span', { className: 'mono' }, 'v' + APP_VERSION), h('span', null, 'Prototype with simulated data'))));
}
