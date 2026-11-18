import { T, h, useEffect, useRef, useState, useSyncExternalStore } from './globals.js';
import { useApp, useAppApi } from './ui.js';
// -- Composer drafts ----------------------------------------------------------
/**
 * Composer drafts by conversation.
 * marked lists the conversations with a draft and changes only when one gains or loses its draft, not on each keystroke.
 * @returns {{current: Object, marked: Object, subscribe: function(Function): Function, keep: function(string, string), clear: Function}} Texts by key, keys with a draft,
 *   subscription to marked, saving of a text on leaving, and emptying.
 */
export function draftStore() {
  var listeners = [];
  function changed() { listeners.forEach(function (l) { l(); }); }
  var s = {
    current: {}, marked: {},
    subscribe: function (l) {
      listeners.push(l);
      return function () { listeners = listeners.filter(function (x) { return x !== l; }); };
    },
    keep: function (key, text) {
      if (text) s.current[key] = text; else delete s.current[key];
      if (!!text === !!s.marked[key]) return;
      s.marked = Object.assign({}, s.marked);
      if (text) s.marked[key] = true; else delete s.marked[key];
      changed();
    },
    clear: function () { s.current = {}; s.marked = {}; changed(); }
  };
  return s;
}
/**
 * Composer text kept when leaving the conversation and given back on return.
 * The drafts belong to Root, which gives them through the context.
 * @param {string} key Conversation, as group:<id> or dm:<name>.
 * @returns {Array} Text, its setter, and a ref to the text saved on leaving, which the view may replace after the call.
 */
export function useDraft(key) {
  var drafts = useApp().drafts;
  var a = useState(function () { return drafts.current[key] || ''; }), kept = useRef('');
  kept.current = a[0];
  useEffect(function () {
    return function () { drafts.keep(key, kept.current); };
  }, [key]);
  return [a[0], a[1], kept];
}
export function groupDraftKey(id) { return 'group:' + id; }
export function dmDraftKey(name) { return 'dm:' + name; }
/**
 * Returns a part of the conversations that keep a draft and renders again only when that part changes.
 * @param {function(Object): *} part Reads the part from the keys of the conversations with a draft.
 */
export function useDraftMarks(part) {
  var drafts = useAppApi().drafts;
  return useSyncExternalStore(drafts.subscribe, function () { return part(drafts.marked); });
}
/**
 * Tells whether a conversation row shows the draft marker.
 * @param {Object} marked Keys of the conversations with a draft.
 * @param {string} key Draft key of the conversation.
 * @param {boolean} active The conversation is in view.
 */
export function showsDraft(marked, key, active) {
  // The conversation in view still holds the draft it opened with until it is left.
  return !!marked[key] && !active;
}
/**
 * Draft marker of a conversation row.
 */
export function DraftMark() {
  // Isolated: dir="auto" on the preview reads the direction of the message, not of this label.
  return h('bdi', { className: 'draft-mark' }, h('span', { className: 'tc-sr' }, ', '), h(T.Icon, { name: 'edit', size: 12 }), 'Draft');
}
