// -- Loader contract ----------------------------------------------------------
// What the sandbox of the loader (src/loader/skin-loader.js) and the page agree on (ADR-0003): events, delays, links, card fields and texts.

/**
 * Names the event of a request to a bridge of the sandbox, or of its reply.
 * @param {string} channel vissle, tiktok or x.
 * @param {string} kind request or response.
 */
export function loaderEvent(channel, kind) { return 'torch-skin:' + channel + '-' + kind; }
// Synchronous event through which a probe in the page tells the sandbox the signed-in account.
export var ACCOUNT_EVENT = 'torch-skin:account';
// The page waits longer than a call of the sandbox, whose own reply says more.
export var LOADER_TIMEOUT = 15000, LOADER_WAIT = LOADER_TIMEOUT + 5000;
// Filters of the Visitors screen, the only ones the sandbox sends to vissle.
export var VISIT_GETS = ['all', 'log', 'like', 'dislike', 'msg', 'refer'];
// TikTok short link (host, code), whose redirect leads to the post page, and post link (user, video or photo, id).
// Read from the start of a link that may run into text: the sandbox calls only the link it rebuilds from them.
export var TIKTOK_SHORT = /^https?:\/\/((?:vm|vt)\.tiktok\.com|(?:www\.)?tiktok\.com\/t)\/([\w-]+)/;
export var TIKTOK_POST = /^https?:\/\/(?:www\.|m\.)?tiktok\.com\/@([\w.-]+)\/(video|photo)\/(\d+)/;
// X post link (handle, id), on X or a mirror that the sandbox turns back into an X link: the call goes to X, never to the mirror.
export var X_POST = /^https?:\/\/(?:www\.|mobile\.)?(?:x|twitter|fxtwitter|vxtwitter|fixupx|fixvx)\.com\/(\w{1,15})\/status\/(\d{1,20})/;
// Fields of an X card: the page checks them again, since any script of the page can send a reply.
export var X_HANDLE = /^\w{1,15}$/, X_LINK = /^https:\/\/x\.com\/\w{1,15}\/status\/\d{1,20}$/;
export var X_IMAGE = /^https:\/\/pbs\.twimg\.com\/[^\s"'<>]+$/, X_PICTURE = /^https:\/\/pbs\.twimg\.com\/profile_images\/[^\s"'<>]+$/, X_VIDEO = /^https:\/\/video\.twimg\.com\/[^\s"'<>]+$/;
export var LOADER_TEXT = {
  tiktokUnknown: "TikTok didn't say which video this link leads to. Open the link instead.",
  tiktokLate: "TikTok didn't answer in time. Open the link instead.",
  xUnshared: "X didn't share this post. Open the link instead.",
  xLate: "X didn't answer in time. Open the link instead.",
  vissleUnreadable: "vissle sent an answer Nightango can't read."
};
