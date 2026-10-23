/* ---------- Mentions ---------- */
/**
 * Permet de dater un message hors de son fil : l'heure, précédée du jour hors aujourd'hui.
 * @param {number} ts Horodatage du message.
 * @param {boolean} h24 Format 24 heures.
 */
function entryTime(ts, h24) { return (dayKey(ts) === dayKey(Date.now()) ? '' : dayLabel(ts) + ', ') + fmtTime(ts, h24); }

/**
 * Message hors de son fil, qui l'ouvre au clic : mention de la page Mentions ou résultat de la recherche des MP.
 * @param {{name: string, ts: number, meta: ?string, text: *, onClick: Function}} p Membre affiché, horodatage, ligne de contexte facultative, texte et ouverture.
 */
function MessageEntry(p) {
  var h24 = useApp().state.prefs.h24;
  return h('button', { type: 'button', className: 'conv person', onClick: p.onClick },
    h(T.Avatar, { name: p.name, size: 28 }),
    h('span', { className: 'conv-main' },
      h('span', { className: 'conv-top' },
        h('span', { className: 'conv-name' }, p.name),
        h('time', { className: 'tc-msg-time', dateTime: new Date(p.ts).toISOString(), title: new Date(p.ts).toLocaleString('en-GB') }, entryTime(p.ts, h24))),
      p.meta ? h('span', { className: 'conv-meta' }, p.meta) : null,
      h('span', { className: 'conv-about' }, p.text)));
}

function MentionsView() {
  var app = useApp(), s = app.state;
  var shown = s.mentionLog.filter(function (e) { return !isHiddenAuthor(s, e.author); });
  function open(e) {
    var m = findMsg(s.groups[e.gid], e.id);
    app.nav(m ? { view: 'group', id: e.gid, msgId: m.id } : { view: 'group', id: e.gid });
    if (!m) app.ui.toast('This message is no longer loaded.');
  }
  return h('main', { className: 'main' },
    pageHeader('Mentions'),
    h('div', { className: 'scroll' },
      h('div', { className: 'mentions' }, shown.length ? shown.map(function (e) {
        return h(MessageEntry, { key: e.gid + ' ' + e.id, name: e.author, ts: e.ts, meta: '#' + e.gid, text: e.text, onClick: function () { open(e); } });
      }) : h('p', { className: 'pal-empty' }, 'No mentions yet. Messages that mention you appear here until you reload the page.'))));
}
