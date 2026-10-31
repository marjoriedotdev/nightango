// ==UserScript==
// @name         Nightango
// @namespace    torch-skin
// @version      0.28.0
// @description  Starts BetterChatango on st.chatango.com and shows Nightango, a redesigned interface, on top of it. Not affiliated with BetterChatango or Chatango.
// @match        https://st.chatango.com/*
// @noframes
// @grant        GM_xmlhttpRequest
// @connect      vissle.me
// @connect      tiktok.com
// @run-at       document-idle
// ==/UserScript==
(function () {
  'use strict';
  // st.chatango.com also serves the chat windows embedded in other sites: only the home page is concerned.
  if (window.top !== window || location.pathname !== '/') return;
  // The userscript runs in a sandbox that sees neither BetterChatango nor React: the interface is injected into the page.
  var page = document.createElement('script');
  page.textContent = /*PAGE*/;
  document.head.appendChild(page); page.remove();

  /* Bridge to vissle.me: the page cannot call it itself, vissle refuses the st.chatango.com origin. */
  // The sandbox does not see BetterChatango and Userscripts (Safari) has no unsafeWindow: a probe reads the name in the page, the event is synchronous.
  function accountName() {
    var name = '';
    function take(e) { name = String(e.detail); }
    document.addEventListener('torch-skin:account', take);
    var probe = document.createElement('script');
    probe.textContent = 'document.dispatchEvent(new CustomEvent("torch-skin:account", { detail: typeof client !== "undefined" && client.user ? String(client.user.name || "") : "" }));';
    document.head.appendChild(probe); probe.remove();
    document.removeEventListener('torch-skin:account', take);
    return name.toLowerCase();
  }
  function reply(channel, id, out) {
    out.id = id;
    document.dispatchEvent(new CustomEvent('torch-skin:' + channel + '-response', { detail: JSON.stringify(out) }));
  }
  document.addEventListener('torch-skin:vissle-request', function (e) {
    var q = JSON.parse(e.detail);
    // The queried profile is always the one of the BetterChatango session, never one the page would ask for.
    var me = accountName();
    if (!me) { reply('vissle', q.id, { error: 'Your BetterChatango account could not be read. Reload the page and try again.' }); return; }
    GM_xmlhttpRequest({
      method: 'POST', url: 'https://vissle.me/track1/activity', anonymous: true, timeout: 15000,
      // Same header as the vissle client, which sends the JSON as plain text.
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      data: JSON.stringify({ action: 'activity', profile: me, page: q.page, order: q.order, get: q.get }),
      onload: function (r) {
        if (r.status !== 200) { reply('vissle', q.id, { error: 'vissle.me answered with HTTP ' + r.status + '.' }); return; }
        try { reply('vissle', q.id, { data: JSON.parse(r.responseText) }); } catch (x) { reply('vissle', q.id, { error: 'vissle.me sent an unreadable reply.' }); }
      },
      onerror: function () { reply('vissle', q.id, { error: 'vissle.me could not be reached.' }); },
      ontimeout: function () { reply('vissle', q.id, { error: 'vissle.me did not answer in time.' }); }
    });
  });

  /* Bridge to TikTok: only the redirect of a short link gives its post id, and the page cannot read it across origins. */
  // Any script of the page can send this event: only a short link goes out, rebuilt here, and only the post id comes back.
  var TIKTOK_SHORT = /^https?:\/\/((?:vm|vt)\.tiktok\.com|(?:www\.)?tiktok\.com\/t)\/([\w-]+)\/?(?:[?#]\S*)?$/;
  var TIKTOK_POST = /^https:\/\/(?:www\.|m\.)?tiktok\.com\/@[\w.-]+\/(?:video|photo)\/(\d+)/;
  document.addEventListener('torch-skin:tiktok-request', function (e) {
    var q = JSON.parse(e.detail), link = TIKTOK_SHORT.exec(q.url), unknown = 'TikTok did not say which video this link leads to. Open the link instead.';
    if (!link) { reply('tiktok', q.id, { error: unknown }); return; }
    GM_xmlhttpRequest({
      method: 'GET', url: 'https://' + link[1] + '/' + link[2] + '/', anonymous: true, timeout: 15000,
      onload: function (r) {
        // finalUrl in Tampermonkey, responseURL in Userscripts (Safari).
        var post = TIKTOK_POST.exec(r.finalUrl || r.responseURL || '');
        reply('tiktok', q.id, post ? { post: post[1] } : { error: unknown });
      },
      onerror: function () { reply('tiktok', q.id, { error: 'TikTok could not be reached. Open the link instead.' }); },
      ontimeout: function () { reply('tiktok', q.id, { error: 'TikTok did not answer in time. Open the link instead.' }); }
    });
  });
})();
