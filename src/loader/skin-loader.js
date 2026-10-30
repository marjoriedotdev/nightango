// ==UserScript==
// @name         Nightango
// @namespace    torch-skin
// @version      0.28.0
// @description  Starts BetterChatango on st.chatango.com and shows Nightango, a redesigned interface, on top of it. Not affiliated with BetterChatango or Chatango.
// @match        https://st.chatango.com/*
// @noframes
// @grant        GM_xmlhttpRequest
// @connect      vissle.me
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
  function reply(id, out) {
    out.id = id;
    document.dispatchEvent(new CustomEvent('torch-skin:vissle-response', { detail: JSON.stringify(out) }));
  }
  document.addEventListener('torch-skin:vissle-request', function (e) {
    var q = JSON.parse(e.detail);
    // The queried profile is always the one of the BetterChatango session, never one the page would ask for.
    var me = accountName();
    if (!me) { reply(q.id, { error: 'Your BetterChatango account could not be read. Reload the page and try again.' }); return; }
    GM_xmlhttpRequest({
      method: 'POST', url: 'https://vissle.me/track1/activity', anonymous: true, timeout: 15000,
      // Same header as the vissle client, which sends the JSON as plain text.
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      data: JSON.stringify({ action: 'activity', profile: me, page: q.page, order: q.order, get: q.get }),
      onload: function (r) {
        if (r.status !== 200) { reply(q.id, { error: 'vissle.me answered with HTTP ' + r.status + '.' }); return; }
        try { reply(q.id, { data: JSON.parse(r.responseText) }); } catch (x) { reply(q.id, { error: 'vissle.me sent an unreadable reply.' }); }
      },
      onerror: function () { reply(q.id, { error: 'vissle.me could not be reached.' }); },
      ontimeout: function () { reply(q.id, { error: 'vissle.me did not answer in time.' }); }
    });
  });
})();
