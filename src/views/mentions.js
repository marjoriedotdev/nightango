/* ---------- Mentions ---------- */
/**
 * Dates a message outside its log with the time, preceded by the day unless it is today.
 * @param {number} ts Message timestamp.
 * @param {boolean} h24 24-hour format.
 */
function entryTime(ts, h24) { return (dayKey(ts) === dayKey(Date.now()) ? '' : dayLabel(ts) + ', ') + fmtTime(ts, h24); }

/**
 * Message outside its log that opens the log on click.
 * It is a mention on the Mentions page or a PM search result.
 * @param {{name: string, ts: number, meta: ?string, text: *, onClick: Function}} p Shown member, timestamp, optional context line, text and opening.
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
