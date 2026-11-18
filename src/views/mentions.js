import { h } from '../core/globals.js';
import { useApp } from '../core/ui.js';
import { bidiText } from '../core/rich-text.js';
import { groupRouteAt, isHiddenAuthor } from '../core/selectors.js';
import { SessionBanner } from './session.js';
import { pageHeader } from './chrome.js';
import { MessageEntry } from './people.js';
// -- Mentions -----------------------------------------------------------------

export function MentionsView() {
  var app = useApp(), s = app.state;
  var shown = s.mentionLog.filter(function (e) { return !isHiddenAuthor(s, e.author); });
  function open(e) {
    var route = groupRouteAt(s, e.gid, e.id);
    app.nav(route);
    if (!route.msgId) app.ui.toast('This message is no longer loaded.');
  }
  return h('main', { className: 'main' },
    pageHeader('Mentions'),
    h(SessionBanner, null),
    h('div', { className: 'scroll' },
      h('div', { className: 'mentions' }, shown.length ? shown.map(function (e) {
        return h(MessageEntry, { key: e.gid + ' ' + e.id, name: e.author, ts: e.ts, meta: '#' + e.gid, text: bidiText(e.text), onClick: function () { open(e); } });
      }) : h('p', { className: 'pal-empty' }, 'No mentions yet. Messages that mention you appear here until you reload the page.'))));
}
