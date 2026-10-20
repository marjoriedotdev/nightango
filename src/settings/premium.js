/* ---------- Premium ---------- */
var PLANS = [
  { id: 'm1', price: 0.95, label: 'Premium, 1 month', desc: 'For your account. Custom backgrounds, media and badges.', tag: 'Recommended' },
  { id: 'g2', price: 3, label: '2 gifts', desc: 'Two months of Premium to give to any account.' },
  { id: 'g4', price: 5, label: '4 gifts', desc: 'Four months to give away.' },
  { id: 'g13', price: 10, label: '13 gifts', desc: 'Thirteen months to give away.', tag: '+33% bonus' },
  { id: 'g29', price: 20, label: '29 gifts and 1 inactive username', desc: 'For groups that reward their members.', tag: '+42.5% bonus' }
];
var RATES = { USD: [1, '$'], GBP: [0.79, '£'], EUR: [0.92, '€'], JPY: [150, '¥'] };
function money(v, cur) { var r = RATES[cur]; var n = v * r[0]; return r[1] + (cur === 'JPY' ? Math.round(n).toLocaleString('en-GB') : n.toFixed(2)); }

function PremiumPage() {
  if (LIVE) return h(PremiumPageLive, null);
  var app = useApp(), s = app.state;
  var a = useState('premium'), mode = a[0], setMode = a[1];
  var b = useState('plan'), step = b[0], setStep = b[1];
  var c = useState('m1'), planId = c[0], setPlan = c[1];
  var d = useState('USD'), cur = d[0], setCur = d[1];
  var e = useState('me'), forWho = e[0], setForWho = e[1];
  var f = useState([]), recips = f[0], setRecips = f[1];
  var g = useState(''), rin = g[0], setRin = g[1];
  var h1 = useState(''), rerr = h1[0], setRerr = h1[1];
  var i1 = useState('paypal'), method = i1[0], setMethod = i1[1];
  var j = useState(''), uname = j[0], setUname = j[1];
  var k = useState(null), check = k[0], setCheck = k[1];
  var plan = PLANS.filter(function (x) { return x.id === planId; })[0];
  function addRecipient() {
    var n = rin.trim().toLowerCase();
    if (!n) return;
    if (!s.users[n]) { setRerr('No Chatango user named ' + n + '.'); return; }
    if (recips.indexOf(n) >= 0) { setRerr(n + ' is already in the list.'); return; }
    setRecips(recips.concat([n])); setRin(''); setRerr('');
  }
  function checkName() {
    var n = uname.trim().toLowerCase();
    if (!/^[a-z0-9]{1,20}$/.test(n)) setCheck({ ok: false, text: 'Usernames use 1 to 20 letters or numbers.' });
    else if (s.groups[n]) setCheck({ ok: false, text: n + ' belongs to a group, so it cannot be bought.' });
    else if (s.users[n]) setCheck({ ok: false, text: n + ' is an active account, so it is not for sale.' });
    else setCheck({ ok: true, text: 'No account uses ' + n + '. You can sign up with it for free.' });
  }
  var steps = h('div', { className: 'steps', 'aria-label': 'Progress' }, [['plan', 'Choose'], ['who', 'Recipients'], ['review', 'Review']].map(function (x, idx) {
    return h('span', { key: x[0] }, idx ? '› ' : '', step === x[0] ? h('b', null, x[1]) : x[1]);
  }));
  var body;
  if (mode === 'name') {
    body = h(T.SettingsSection, { title: 'Inactive username', description: 'Chatango sells names of accounts that expired. Check a name before buying it.', padded: true },
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: 12 } },
        h('div', { style: { display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 10 } },
          h('div', { style: { flex: '1 1 240px' } }, h(T.TextField, { id: 'inact', label: 'Username', value: uname, onChange: function (ev) { setUname(ev.target.value); setCheck(null); }, onKeyDown: function (ev) { if (ev.key === 'Enter') checkName(); } })),
          h(T.Button, { onClick: checkName, style: { height: 38 } }, 'Check')),
        check ? h(T.Banner, { tone: check.ok ? 'info' : 'warning', icon: check.ok ? 'check' : 'alert' }, check.text) : null));
  } else if (step === 'plan') {
    body = h(T.SettingsSection, {
      title: 'Choose a plan', padded: true,
      headerAside: h('label', { style: { display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-2)' } }, 'Currency',
        h('select', { className: 'tc-input', style: { width: 'auto', height: 32 }, value: cur, onChange: function (ev) { setCur(ev.target.value); } }, Object.keys(RATES).map(function (r) { return h('option', { key: r }, r); })))
    },
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: 10 } },
        h('div', { role: 'radiogroup', 'aria-label': 'Plan', style: { display: 'flex', flexDirection: 'column', gap: 10 } }, PLANS.map(function (pl) {
          return h('button', { key: pl.id, type: 'button', role: 'radio', className: 'plan', 'aria-checked': String(planId === pl.id), onClick: function () { setPlan(pl.id); } },
            h('span', { className: 'radio', 'aria-hidden': 'true' }),
            h('span', { className: 'price' }, money(pl.price, cur)),
            h('span', { className: 'grow' }, h('span', { style: { display: 'block', fontWeight: 500 } }, pl.label), h('span', { style: { display: 'block', fontSize: 12.5, color: 'var(--text-3)' } }, pl.desc)),
            pl.tag ? h(T.Badge, { tone: pl.tag === 'Recommended' ? 'accent' : 'neutral' }, pl.tag) : null);
        })),
        cur !== 'USD' ? h('p', { className: 'tc-hint', style: { margin: 0 } }, 'Approximate. Chatango charges in US dollars.') : null,
        h('div', { className: 'btnrow', style: { justifyContent: 'flex-end' } }, h(T.Button, { variant: 'primary', iconRight: 'chevron-right', onClick: function () { setStep('who'); } }, 'Continue'))));
  } else if (step === 'who') {
    var canNext = forWho === 'me' || recips.length > 0;
    body = h(T.SettingsSection, { title: 'Who is it for?', padded: true },
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: 14 } },
        h(T.SegmentedControl, { label: 'Recipient', value: forWho, onChange: setForWho, options: [{ value: 'me', label: 'For me' }, { value: 'gift', label: 'As a gift' }] }),
        forWho === 'gift' ? h(Frag, null,
          h('div', { style: { display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 10 } },
            h('div', { style: { flex: '1 1 240px' } }, h(T.TextField, { id: 'recip', label: 'Add a username', value: rin, error: rerr || undefined, onChange: function (ev) { setRin(ev.target.value); setRerr(''); }, onKeyDown: function (ev) { if (ev.key === 'Enter') addRecipient(); } })),
            h(T.Button, { onClick: addRecipient, style: { height: 38 } }, 'Add')),
          recips.length ? h('div', { className: 'recipients' }, recips.map(function (n) {
            return h('span', { key: n, className: 'rchip' }, n, h(T.IconButton, { icon: 'x', label: 'Remove ' + n, size: 22, iconSize: 12, onClick: function () { setRecips(recips.filter(function (x) { return x !== n; })); } }));
          })) : h('p', { className: 'tc-hint', style: { margin: 0 } }, 'Gifts are split between the people you add.')) : h('p', { className: 'tc-hint', style: { margin: 0 } }, 'Premium starts on ' + s.me + ' right after payment.'),
        h('div', { className: 'btnrow', style: { justifyContent: 'space-between' } },
          h(T.Button, { variant: 'ghost', icon: 'chevron-left', onClick: function () { setStep('plan'); } }, 'Back'),
          h(T.Button, { variant: 'primary', iconRight: 'chevron-right', disabled: !canNext, onClick: function () { setStep('review'); } }, 'Continue'))));
  } else {
    body = h(T.SettingsSection, { title: 'Review and pay' },
      h('div', { className: 'summary' },
        h('div', null, h('span', null, plan.label), h('span', { className: 'mono' }, money(plan.price, cur))),
        h('div', null, h('span', { className: 'muted' }, 'For'), h('span', null, forWho === 'me' ? s.me : recips.join(', '))),
        h('div', { className: 'total' }, h('span', null, 'Total'), h('span', { className: 'mono' }, money(plan.price, cur)))),
      h(T.SettingRow, {
        asLabel: false, title: 'Payment method', description: "You confirm and pay on chatango.com. Torch never sees your payment details.",
        control: h(T.SegmentedControl, { label: 'Payment method', value: method, onChange: setMethod, options: [{ value: 'paypal', label: 'PayPal' }, { value: 'card', label: 'Card' }] })
      }),
      h('div', { className: 'btnrow', style: { justifyContent: 'space-between', padding: '14px 20px 18px', borderTop: '1px solid var(--divider)' } },
        h(T.Button, { variant: 'ghost', icon: 'chevron-left', onClick: function () { setStep('who'); } }, 'Back'),
        h(T.Button, { variant: 'primary', iconRight: 'external', onClick: function () { app.ui.toast('Payments are disabled in this prototype. Nothing was charged.'); } }, 'Continue to Chatango')));
  }
  return h(Page, {
    title: 'Chatango Premium', lede: 'Premium is sold by Chatango. Torch shows the offers and hands you over to pay.',
    aside: h(T.SegmentedControl, { label: 'Purchase type', value: mode, onChange: function (v) { setMode(v); setStep('plan'); }, options: [{ value: 'premium', label: 'Premium' }, { value: 'name', label: 'Inactive username' }] })
  }, mode === 'premium' ? steps : null, body);
}
