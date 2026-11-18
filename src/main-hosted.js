import { start } from './app/start.js';
import { reviewNewYear } from './views/season.js';
import { holdSkyAt } from './app/root.js';
// Entry of the hosted prototype: its page can hand a saved state, reads the state back and gets the review helpers.

window.showNewYear = reviewNewYear;
window.showSkyAt = holdSkyAt;

var hot = window.claude && window.claude.hot;
/**
 * Starts the interface with what the hosted page hands over.
 * @param {?{state: ?Object}} data Saved state.
 */
function startHosted(data) {
  start({ state: data && data.state, snapshot: hot && hot.snapshot ? function (read) { hot.snapshot(read); } : null });
}
if (hot && hot.ready) hot.ready(startHosted);
else startHosted(hot ? hot.data || {} : {});
