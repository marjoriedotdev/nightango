function NotificationsPage() {
  var app = useApp(), pr = usePref(), prefs = app.state.prefs;
  var perm = 'default';
  try { perm = window.Notification ? window.Notification.permission : 'unsupported'; } catch (e) { perm = 'unsupported'; }
  var p1 = useState(perm), permission = p1[0], setPermission = p1[1];
  var rows = [
    ['mentions', 'Mentions', 'Someone writes @' + app.state.me + ' in a group'],
    ['pm', 'Private messages', 'A new private message arrives'],
    ['friendOn', 'Friend comes online', 'Someone on your friends list connects'],
    ['friendOff', 'Friend goes offline', 'Someone on your friends list disconnects']
  ];
  var cols = [['app', 'In app'], ['sound', 'Sound'], ['desktop', 'Desktop']];
  // In live, BetterChatango plays the sounds itself: the column is removed.
  if (LIVE) cols = cols.filter(function (c) { return c[0] !== 'sound'; });
  function ask() {
    try {
      window.Notification.requestPermission().then(function (r) { setPermission(r); app.ui.toast(r === 'granted' ? 'Desktop alerts are on.' : 'The browser kept desktop alerts blocked. Allow them in its site settings.'); }, function () { app.ui.toast('The browser refused the request.'); });
    } catch (e) { app.ui.toast('This browser view cannot show desktop alerts.'); }
  }
  return h(Page, { title: 'Notifications', lede: 'Choose where Nightango alerts you. Changes are saved automatically.' },
    permission !== 'granted' ? h(T.Banner, { tone: 'warning', action: permission === 'unsupported' ? null : h(T.Button, { size: 'sm', onClick: ask }, 'Allow in browser') },
      permission === 'unsupported' ? 'This browser view cannot show desktop alerts. The Desktop column has no effect here.' : "Your browser blocks desktop notifications for this site. Desktop alerts won't show until you allow them.") : null,
    h(T.SettingsSection, { title: 'Alerts' },
      h('div', { className: 'matrix-wrap' },
        h('table', { className: 'matrix' },
          h('thead', null, h('tr', null, h('th', { scope: 'col', style: { textAlign: 'left', paddingLeft: 20 } }, 'Event'), cols.map(function (c) { return h('th', { key: c[0], scope: 'col' }, c[1]); }))),
          h('tbody', null, rows.map(function (r) {
            return h('tr', { key: r[0] },
              h('th', { scope: 'row' }, h('span', { style: { display: 'block', fontWeight: 500, color: 'var(--text)' } }, r[1]), h('span', { style: { display: 'block', fontSize: 12.5, color: 'var(--text-3)' } }, r[2])),
              cols.map(function (c) {
                return h('td', { key: c[0] }, h(T.Checkbox, { ariaLabel: r[1] + ', ' + c[1], checked: !!prefs.notify[r[0]][c[0]], onChange: function (e) { pr.set('notify.' + r[0] + '.' + c[0], e.target.checked); } }));
              }));
          }))))),
    LIVE ? h(BetterChatangoSoundsSection) : h(T.SettingsSection, { title: 'Sound' },
      h(T.SettingRow, {
        asLabel: false, title: 'Volume', description: 'Applies to every alert sound.',
        control: h(VolumeControl, { label: 'Volume', value: prefs.volume, onChange: function (v) { pr.set('volume', v); }, onPlay: function () { beep(prefs.volume, true); } })
      }),
      h(T.SettingRow, { title: 'Only when Nightango is in focus', description: "Stay silent while you're in another tab or app.", control: pr.sw('soundFocusOnly') })),
    h(T.SettingsSection, { title: 'In the app' },
      h(T.SettingRow, { title: 'Show mentions in the tab title', description: 'Adds a counter to the browser tab, for example (2) Nightango.', control: pr.sw('tabTitle') }),
      h(T.SettingRow, { title: 'Mark new messages', description: "Draws a line above the first message you haven't read.", control: pr.sw('markNew') }),
      h(T.SettingRow, { title: 'Preview private messages', description: 'Shows the text in the alert instead of only the sender.', control: pr.sw('pmPreview') })));
}

function VolumeControl(p) {
  return h('div', { className: 'range-row' },
    h('input', { type: 'range', min: 0, max: 100, value: p.value, disabled: p.disabled, 'aria-label': p.label, onChange: function (e) { p.onChange(+e.target.value); } }),
    h('span', { className: 'tc-msg-time', style: { width: 40, textAlign: 'right' } }, p.value + '%'),
    h(T.IconButton, { icon: 'volume', label: 'Play test sound', disabled: p.disabled, onClick: p.onPlay }));
}

var BETTER_CHATANGO_SOUND_ROWS = [
  ['mention', 'Mention sound', 'When someone mentions you or sends you a private message.', 'Mention volume'],
  ['online', 'Friend online sound', 'When a friend connects, at most once every 5 minutes per friend.', 'Friend online volume']
];

function BetterChatangoSoundsSection() {
  var app = useApp();
  var st = useBetterChatangoSettings(liveBridge.betterChatangoSounds, liveBridge.setBetterChatangoSound), sounds = st[0], set = st[1];
  function play(kind) {
    liveBridge.playBetterChatangoSound(kind).then(null, function () { app.ui.toast('Your browser blocked the sound. Click the page, then try again.'); });
  }
  return h(T.SettingsSection, { title: 'Sounds', description: "BetterChatango plays these sounds. Nightango stays silent so you don't hear every alert twice." },
    sounds ? BETTER_CHATANGO_SOUND_ROWS.map(function (r) {
      var on = sounds['play_' + r[0]];
      return h(T.SettingRow, {
        key: r[0], asLabel: false, title: r[1], description: r[2],
        control: h(Frag, null,
          h(T.Switch, { label: r[1], checked: on, onChange: function (e) { set('play_' + r[0], e.target.checked); } }),
          h(VolumeControl, { label: r[3], value: sounds['volume_' + r[0]], disabled: !on, onChange: function (v) { set('volume_' + r[0], v); }, onPlay: function () { play(r[0]); } }))
      });
    }) : h('p', { className: 'pal-empty' }, "BetterChatango's sound settings could not be read. Reload the page and try again."));
}
