import { T, h } from '../core/globals.js';
import { unreadTotal } from '../core/selectors.js';
import { useApp } from '../core/ui.js';
import { closePipWindow } from './pip-window.js';
// -- Pane chrome ---------------------------------------------------------------

/**
 * Close button of a conversation shown beside the main pane or in the floating window, null in the main pane.
 * @param {Object} app Application context.
 * @param {string} role Pane of the conversation: main, beside or floating.
 * @param {string} name Conversation as the button names it.
 */
export function paneCloseButton(app, role, name) {
  if (role === 'beside') return h(T.IconButton, { icon: 'x', label: 'Close ' + name + ' side by side', onClick: app.actions.closeSplit });
  if (role === 'floating') return h(T.IconButton, { icon: 'x', label: 'Close the floating window', onClick: closePipWindow });
  return null;
}
// Headers and menu items that the panes share, apart from the shell that routes between them.
export function MobileNavButton() {
  var app = useApp();
  return h(T.IconButton, { icon: 'menu', label: 'Open navigation', className: 'only-mobile', count: unreadTotal(app.state), onClick: app.ui.openNav });
}
/**
 * Titled header of a main page with the mobile navigation button.
 * @param {string} title Page title.
 */
export function pageHeader(title) {
  return h('header', { className: 'topbar' }, h(MobileNavButton, null), h('h1', { className: 'grow' }, title));
}
/**
 * Titled header of a right column.
 * @param {string} title Column title.
 */
export function columnHeader(title) {
  return h('header', { className: 'topbar col-head' }, h('h2', { className: 'grow' }, title));
}
/**
 * Menu entry that adds a group or a person to the favorites, or removes them.
 * @param {Object} app Application context.
 * @param {{view: string, id: string}} route Group, or PM with the person.
 * @param {boolean} on The group or the person is a favorite.
 */
export function favoriteItem(app, route, on) {
  return {
    id: 'favorite', label: on ? 'Remove from favorites' : 'Add to favorites', icon: 'star',
    onSelect: function () { if (route.view === 'group') app.actions.toggleFavorite(route.id); else app.actions.toggleUser(route.id, 'favorite'); }
  };
}
