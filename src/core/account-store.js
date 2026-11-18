import { ACCOUNT_NAME } from './chatango.js';
import { kindOf } from './util.js';
// -- Account data kept in this browser ----------------------------------------
// Fields of torch-skin:<username>, read back without the entries of another shape.

export var NOTE_LABEL_MAX = 24, NOTE_TEXT_MAX = 500;
/**
 * Returns the private notes kept in this browser without the entries of another shape.
 * @param {Object} stored Notes by member name, untrusted.
 */
export function storedNotes(stored) {
  var out = {};
  Object.keys(stored).forEach(function (n) {
    var x = stored[n];
    if (ACCOUNT_NAME.test(n) && kindOf(x) === 'object' && typeof x.label === 'string' && typeof x.note === 'string' && (x.label || x.note)) {
      out[n] = { label: x.label.slice(0, NOTE_LABEL_MAX), note: x.note.slice(0, NOTE_TEXT_MAX) };
    }
  });
  return out;
}
