/* ---------- Connexion ---------- */
function Login() {
  var app = useApp();
  var s1 = useState('login'), mode = s1[0], setMode = s1[1];
  var s2 = useState('orrin'), user = s2[0], setUser = s2[1];
  var s3 = useState(''), pass = s3[0], setPass = s3[1];
  var s4 = useState(''), email = s4[0], setEmail = s4[1];
  var s5 = useState(false), agree = s5[0], setAgree = s5[1];
  var s6 = useState({}), errors = s6[0], setErrors = s6[1];
  var s7 = useState(false), sent = s7[0], setSent = s7[1];
  var s8 = useState(false), busy = s8[0], setBusy = s8[1];

  function switchMode(m) { setMode(m); setErrors({}); setSent(false); }
  function submit(e) {
    e.preventDefault();
    var err = {};
    if (mode === 'forgot') {
      if (!/^\S+@\S+\.\S+$/.test(email)) err.email = 'Enter the email on your Chatango account.';
      setErrors(err);
      if (!err.email) setSent(true);
      return;
    }
    if (!/^[a-z0-9]{3,20}$/i.test(user)) err.user = 'Use 3 to 20 letters or numbers.';
    if (mode === 'login' && !pass) err.pass = 'Enter your password.';
    if (mode === 'signup') {
      if (pass.length < 8) err.pass = 'Use at least 8 characters.';
      if (!/^\S+@\S+\.\S+$/.test(email)) err.email = 'Enter a valid email address.';
      if (!agree) err.agree = 'Agree to the terms to create an account.';
    }
    setErrors(err);
    if (Object.keys(err).length) return;
    setBusy(true);
    setTimeout(function () { app.actions.login(user.toLowerCase(), pass); }, 450);
  }
  var tabs = mode === 'forgot' ? null : h(T.SegmentedControl, {
    label: 'Account', block: true, value: mode, onChange: switchMode,
    options: [{ value: 'login', label: 'Log in' }, { value: 'signup', label: 'Sign up' }]
  });
  var form;
  if (mode === 'forgot') {
    form = sent
      ? h(Frag, null,
        h('div', null, h('h2', null, 'Check your inbox'), h('p', { className: 'muted' }, 'If ' + email + ' matches a Chatango account, Chatango sends a reset link to it. In this prototype no email is sent.')),
        h(T.Button, { variant: 'primary', size: 'lg', block: true, onClick: function () { switchMode('login'); } }, 'Back to log in'))
      : h(Frag, null,
        h(T.Button, { variant: 'ghost', size: 'sm', icon: 'arrow-left', onClick: function () { switchMode('login'); }, style: { alignSelf: 'flex-start', paddingLeft: 4 } }, 'Back to log in'),
        h('div', null, h('h2', null, 'Reset your password'), h('p', { className: 'muted' }, 'Enter the email on your Chatango account. Chatango will send you a reset link.')),
        h(T.TextField, { id: 'fg-email', label: 'Email', type: 'email', autoComplete: 'email', value: email, error: errors.email, onChange: function (e) { setEmail(e.target.value); } }),
        h(T.Button, { type: 'submit', variant: 'primary', size: 'lg', block: true }, 'Send reset link'));
  } else {
    form = h(Frag, null,
      h('div', null,
        h('h2', null, mode === 'login' ? 'Welcome back' : 'Create a Chatango account'),
        h('p', { className: 'muted' }, mode === 'login' ? 'Log in with your Chatango account.' : 'It works on chatango.com and in BetterChatango.')),
      mode === 'signup' ? h(T.TextField, { id: 'su-email', label: 'Email', type: 'email', autoComplete: 'email', value: email, error: errors.email, onChange: function (e) { setEmail(e.target.value); } }) : null,
      h(T.TextField, { id: 'lg-user', label: 'Username', autoComplete: 'username', value: user, error: errors.user, hint: mode === 'signup' ? "Letters and numbers, up to 20 characters. It can't be changed later." : undefined, onChange: function (e) { setUser(e.target.value); } }),
      h(T.TextField, {
        id: 'lg-pass', label: 'Password', type: 'password', autoComplete: mode === 'login' ? 'current-password' : 'new-password', value: pass, error: errors.pass,
        hint: mode === 'login' ? 'Demo account. Any password works.' : undefined, onChange: function (e) { setPass(e.target.value); },
        labelAside: mode === 'login' ? h('button', { type: 'button', className: 'linkbtn', style: { fontSize: 13 }, onClick: function () { switchMode('forgot'); } }, 'Forgot password?') : null
      }),
      mode === 'login'
        ? h(T.Checkbox, { label: 'Keep me signed in', defaultChecked: true })
        : h('div', { className: 'tc-field' },
          h(T.Checkbox, { label: 'I agree to the Terms of Service and the Privacy Policy', checked: agree, onChange: function (e) { setAgree(e.target.checked); } }),
          errors.agree ? h('span', { className: 'tc-error' }, errors.agree) : null),
      h(T.Button, { type: 'submit', variant: 'primary', size: 'lg', block: true, disabled: busy }, busy ? 'Signing in' : mode === 'login' ? 'Log in' : 'Create account'));
  }
  return h('div', { className: 'login' },
    h('section', { className: 'login-aside', 'aria-label': 'About BetterChatango' },
      h('div', { className: 'login-brand' }, h('span', { className: 'login-mark' }, h(T.Icon, { name: 'flame', size: 18, strokeWidth: 2.2 })), h('span', { className: 'login-brand-name' }, 'BetterChatango')),
      h('div', null,
        h('h1', null, 'A cleaner client for Chatango.'),
        h('p', { className: 'muted', style: { margin: '0 0 32px', fontSize: 15, color: 'var(--text-2)' } }, 'Same account, same groups. Fewer bugs and the tools Chatango never shipped.'),
        h('ul', null,
          [['Replies and mentions', 'Reply to a specific message and see who mentioned you.'], ['Block users inside groups', 'Hide someone everywhere, not only in private messages.'], ['Moderation that scales', 'AutoMod, roles and an audit log for group staff.']].map(function (f) {
            return h('li', { key: f[0] }, h(T.Icon, { name: 'check', size: 18, strokeWidth: 2.2 }), h('span', null, h('strong', null, f[0]), h('span', null, f[1])));
          }))),
      h('p', { className: 'muted', style: { margin: 0, fontSize: 13 } }, 'Free and open source under the MIT license. ', h('a', { href: 'https://github.com/Vissle-Drissle/Torch-Client', target: '_blank', rel: 'noopener noreferrer' }, 'View the source'))),
    h('section', { className: 'login-main', 'aria-label': 'Account' },
      h('form', { className: 'login-form', onSubmit: submit, noValidate: true }, tabs, form,
        h(T.Banner, { icon: 'lock' }, 'BetterChatango signs in to Chatango on your behalf. To keep you signed in, your credentials are stored encrypted on BetterChatango servers.')),
      h('div', { className: 'login-foot' },
        h('span', { className: 'mono' }, 'v' + APP_VERSION), h('span', null, 'Prototype with simulated data'),
        h('label', { htmlFor: 'lg-lang', style: { display: 'inline-flex', alignItems: 'center', gap: 6 } }, h(T.Icon, { name: 'globe', size: 14 }), h('span', { className: 'tc-sr' }, 'Language'),
          h('select', { id: 'lg-lang', defaultValue: 'en-US' }, h('option', { value: 'en-US' }, 'English (US)'), h('option', { value: 'en-GB' }, 'English (UK)'), h('option', { value: 'id' }, 'Bahasa Indonesia'), h('option', { value: 'pl' }, 'Polski'))))));
}
