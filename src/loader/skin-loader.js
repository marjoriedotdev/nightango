// ==UserScript==
// @name         Nightango
// @namespace    torch-skin
// @version      0.17.0
// @description  Starts the Torch client on st.chatango.com and shows Nightango, a redesigned interface, on top of it.
// @match        https://st.chatango.com/*
// @noframes
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @connect      vissle.me
// @run-at       document-idle
// ==/UserScript==
(function () {
  'use strict';
  // st.chatango.com sert aussi les fenêtres de discussion intégrées aux autres sites : seule la page d'accueil est concernée.
  if (window.top !== window || location.pathname !== '/') return;
  // Le userscript tourne dans un bac à sable qui ne voit ni Torch ni React : l'interface est injectée dans la page.
  var page = document.createElement('script');
  page.textContent = /*PAGE*/;
  document.head.appendChild(page); page.remove();

  /* Pont vers vissle.me : la page ne peut pas l'appeler elle-même, vissle refuse l'origine st.chatango.com. */
  function reply(id, out) {
    out.id = id;
    document.dispatchEvent(new CustomEvent('torch-skin:vissle-response', { detail: JSON.stringify(out) }));
  }
  document.addEventListener('torch-skin:vissle-request', function (e) {
    var q = JSON.parse(e.detail);
    // Le profil interrogé est toujours celui de la session Torch, jamais celui que la page demanderait.
    var me = String(unsafeWindow.__torchRefs.client.user.name).toLowerCase();
    GM_xmlhttpRequest({
      method: 'POST', url: 'https://vissle.me/track1/activity', anonymous: true, timeout: 15000,
      // Même en-tête que le client vissle, qui envoie le JSON comme texte brut.
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
