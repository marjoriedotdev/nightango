/* ---------- Session coupée ---------- */
var SESSION_ATTEMPTS = 3;
var SESSION_COPY = {
  kicked: { title: "You're signed in somewhere else", body: 'Chatango closed your private messages here because your account connected from another window or device.' },
  denied: { title: 'Your session expired', body: 'Reload the page and sign in again on the BetterChatango screen.' },
  offline: { title: "You're offline", body: 'Nightango will reconnect when your connection is back.' },
  lost: { title: 'Connection lost', body: 'Unable to connect, please try again in a few minutes.' }
};

/**
 * Fenêtre bloquante de session coupée.
 * @param {{session: {reason: string, attempts: number}}} p Raison de la coupure et nombre de tentatives de reconnexion.
 */
function SessionOverlay(p) {
  var app = useApp(), s = p.session, copy = SESSION_COPY[s.reason];
  var spent = s.reason === 'lost' && s.attempts >= SESSION_ATTEMPTS;
  var busy = app.state.pmConn === 'connecting' || Object.keys(app.state.groups).some(function (k) { var g = app.state.groups[k]; return g.joined && g.conn === 'connecting'; });
  /**
   * Permet de construire le bouton Reload.
   * @param {string} variant Variante du bouton.
   */
  function reload(variant) { return h(T.Button, { key: 'reload', variant: variant, onClick: function () { location.reload(); } }, 'Reload'); }
  var footer = s.reason === 'kicked' ? [h(T.Button, { key: 'here', variant: 'ghost', disabled: busy, onClick: function () { app.actions.reconnect('private_message'); } }, 'Reconnect here'), reload('primary')]
    : s.reason === 'lost' && !spent ? [reload('ghost'), h(T.Button, { key: 'retry', variant: 'primary', disabled: busy, onClick: function () { app.actions.reconnectSession(); } }, 'Reconnect')]
    : [reload('primary')];
  return h(Dialog, { role: 'alertdialog', title: copy.title, description: spent ? 'Unable to connect. Please reload the page.' : copy.body, footer: footer });
}
