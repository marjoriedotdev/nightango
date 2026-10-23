/* ---------- Mentions ---------- */
/**
 * Permet de dater une mention : l'heure, précédée du jour hors aujourd'hui.
 * @param {number} ts Horodatage du message.
 * @param {boolean} h24 Format 24 heures.
 */
function mentionTime(ts, h24) { return (dayKey(ts) === dayKey(Date.now()) ? '' : dayLabel(ts) + ', ') + fmtTime(ts, h24); }

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
        return h('button', { key: e.gid + ' ' + e.id, type: 'button', className: 'conv person', onClick: function () { open(e); } },
          h(T.Avatar, { name: e.author, size: 28 }),
          h('span', { className: 'conv-main' },
            h('span', { className: 'conv-top' },
              h('span', { className: 'conv-name' }, e.author),
              h('time', { className: 'tc-msg-time', dateTime: new Date(e.ts).toISOString(), title: new Date(e.ts).toLocaleString('en-GB') }, mentionTime(e.ts, s.prefs.h24))),
            h('span', { className: 'conv-meta' }, '#' + e.gid),
            h('span', { className: 'conv-about' }, e.text)));
      }) : h('p', { className: 'pal-empty' }, 'No mentions yet. Messages that mention you appear here until you reload the page.'))));
}
