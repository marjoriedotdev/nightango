// -- Page environment ---------------------------------------------------------
// Globals the page code of the loader sets before the interface starts (src/loader/skin-page.js): absent from the hosted prototype.

export var LIVE = !!window.__TORCH_LIVE__;
// Set before BetterChatango (loader/skin-journal.js): absent from the prototype and from the suites that only read the bridge.
export var JOURNAL = window.__TORCH_JOURNAL__ || null;
// Carries the theme and the global classes: the Shadow DOM host in live, the document in the prototype.
export var ROOT_EL = window.__TORCH_ROOT__ || document.documentElement;
// Theme the hosted page set before the interface started: Root writes data-theme afterwards.
export var VIEWER_THEME = ROOT_EL.getAttribute('data-theme');

export function appMount() { return window.__TORCH_MOUNT__ || document.getElementById('app'); }

/**
 * Returns the objects BetterChatango exposes to the page: client, chatango, sidebar and torch.
 */
export function betterChatangoRefs() { return window.__betterChatangoRefs || {}; }

/**
 * Shows the interface over the BetterChatango page, once signed in.
 */
export function showInterface() { if (typeof window.__TORCH_SHOW__ === 'function') window.__TORCH_SHOW__(); }

/**
 * Removes the interface and gives the page back to BetterChatango.
 */
export function hideInterface() { window.__TORCH_HIDE__(); }
