// -- vissle ------------------------------------------------------------------
// Profile activity that vissle tracks, shared by live and the sample visits of the prototype.

var VISIT_LABEL = { log: 'visited', like: 'liked profile', dislike: 'disliked profile', msg: 'commented on', refer: 'referred by' };
export var VISIT_PAGE = 16;
/**
 * Splits a page of vissle activity.
 * @param {Array} items Items returned by vissle, the sixteenth signals a next page.
 * @param {string} get Requested filter, used as the action when vissle omits it.
 */
export function visitorPage(items, get) {
  var shown = items.slice(0, VISIT_PAGE - 1);
  return {
    rows: shown.map(function (x) {
      var user = String(x.user).toLowerCase(), name = String(x.name || x.user);
      return { key: x.time + ':' + user, user: user, name: name, guest: name.charAt(0) === '!', label: VISIT_LABEL[x.action || get], ts: Math.round(x.time * 1000), msg: x.msg || '' };
    }),
    next: items.length === VISIT_PAGE ? shown[shown.length - 1].time : null
  };
}

