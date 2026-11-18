import { IMAGE_URL } from './message-content.js';
import { lower } from './util.js';
// -- BetterChatango media library ---------------------------------------------
// Rules of the favorite_media library that live and the sample library of the prototype share.

// Page size of the media library, like BetterChatango viewMedia and loadMedia.
export var MEDIA_PAGE = 21;
var PHOTO_URL = /^https:\/\/chatango\.com\/pmmessageimg\?i=[^"&?\/\s]+$/;
/**
 * Tells whether a media library entry can be shown and written.
 * @param {*} e Entry {url, name} read from the BetterChatango database or from a file, untrusted.
 * @returns {boolean} True for an https image or a pmmessageimg with a text name.
 */
export function mediaEntryOk(e) { return !!e && typeof e.url === 'string' && (IMAGE_URL.test(e.url) || PHOTO_URL.test(e.url)) && typeof e.name === 'string'; }
/**
 * Keeps an entry read by pages when it comes after the last one of the previous page in index order and its name contains the search.
 * @param {string} index BetterChatango index, url or name, whose order follows the key then the url.
 * @param {{url: string, name: string}} e Entry read.
 * @param {?{url: string, name: string}} after Last entry of the previous page, null for the first page.
 * @param {string} text Search, case-insensitive, empty to keep everything.
 */
export function mediaMatch(index, e, after, text) {
  return (!after || e[index] > after[index] || e[index] === after[index] && e.url > after.url) && lower(e.name).indexOf(lower(text)) >= 0;
}
/**
 * Names a media item like BetterChatango (favoriteMedia).
 * @param {string} url Image address, whose last segment becomes the name.
 */
export function mediaName(url) { return url.split('/').slice(-1)[0]; }
/**
 * Screens the entries of an imported media library before any write.
 * @param {Array} entries File content, untrusted.
 * @returns {{valid: Array, skipped: number}} Entries {url, name} to write, and the number skipped.
 */
export function screenMediaEntries(entries) {
  var valid = entries.filter(mediaEntryOk).map(function (e) { return { url: e.url, name: e.name }; });
  return { valid: valid, skipped: entries.length - valid.length };
}
