// ==UserScript==
// @name         Nightango
// @namespace    torch-skin
// @version      0.31.1
// @description  Starts BetterChatango on st.chatango.com and shows Nightango, a redesigned interface, on top of it. Not affiliated with BetterChatango or Chatango.
// @match        https://st.chatango.com/*
// @noframes
// @grant        GM_xmlhttpRequest
// @connect      vissle.me
// @connect      tiktok.com
// @connect      publish.x.com
// @connect      cdn.syndication.twimg.com
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

  /* Bridge to TikTok: the post page of a short or post link, which the page cannot read across origins. */
  // Any script of the page can send this event: only a short or post link goes out, rebuilt here, and only the post link and its cover address come back.
  var TIKTOK_SHORT = /^https?:\/\/((?:vm|vt)\.tiktok\.com|(?:www\.)?tiktok\.com\/t)\/([\w-]+)\/?(?:[?#]\S*)?$/;
  var TIKTOK_POST = /^https?:\/\/(?:www\.|m\.)?tiktok\.com\/@([\w.-]+)\/(video|photo)\/(\d+)/;
  // TikTok's oEmbed no longer gives thumbnail_url: the cover is only in the JSON of the post page, its slashes escaped as \u002F.
  var TIKTOK_COVER = /"cover":"(https:[^"\s]+)"/;
  function tiktokPostLink(m) { return 'https://www.tiktok.com/@' + m[1] + '/' + m[2] + '/' + m[3]; }
  document.addEventListener('torch-skin:tiktok-request', function (e) {
    var q = JSON.parse(e.detail), short = TIKTOK_SHORT.exec(q.url), post = TIKTOK_POST.exec(q.url), unknown = 'TikTok did not say which video this link leads to. Open the link instead.';
    if (!short && !post) { reply('tiktok', q.id, { error: unknown }); return; }
    GM_xmlhttpRequest({
      method: 'GET', url: short ? 'https://' + short[1] + '/' + short[2] + '/' : tiktokPostLink(post), anonymous: true, timeout: 15000,
      onload: function (r) {
        // finalUrl in Tampermonkey, responseURL in Userscripts (Safari).
        var to = short ? TIKTOK_POST.exec(r.finalUrl || r.responseURL || '') : post;
        if (!to) { reply('tiktok', q.id, { error: unknown }); return; }
        var out = { post: to[3], link: tiktokPostLink(to) }, cover = r.status === 200 ? TIKTOK_COVER.exec(r.responseText || '') : null;
        if (cover) { try { out.thumb = JSON.parse('"' + cover[1] + '"'); } catch (x) { /* malformed escape: no cover */ } }
        reply('tiktok', q.id, out);
      },
      onerror: function () { reply('tiktok', q.id, { error: 'TikTok could not be reached. Open the link instead.' }); },
      ontimeout: function () { reply('tiktok', q.id, { error: 'TikTok did not answer in time. Open the link instead.' }); }
    });
  });

  /* Bridge to X: the oEmbed of a post, its author picture, time and first media, which the page cannot read across origins. */
  // Any script of the page can send this event: only a post link goes out, rebuilt here, and only the fields of the card come back.
  // Mirrors (fxtwitter, vxtwitter, fixupx, fixvx) are only read for the post: the call goes to X, never to them.
  var X_POST = /^https?:\/\/(?:www\.|mobile\.)?(?:x|twitter|fxtwitter|vxtwitter|fixupx|fixvx)\.com\/(\w{1,15})\/status\/(\d{1,20})/;
  var X_AVATAR = /^https:\/\/pbs\.twimg\.com\/profile_images\/[^\s"'<>]+_normal\.\w+$/;
  var X_AUTHOR = /^https:\/\/(?:x|twitter)\.com\/(\w{1,15})$/;
  var X_IMAGE = /^https:\/\/pbs\.twimg\.com\/[^\s"'<>]+$/, X_VIDEO = /^https:\/\/video\.twimg\.com\/[^\s"'<>]+$/;
  // Up to 720p: the card is 420 pixels wide and the 1080p variant weighs about five times more.
  var X_VIDEO_BITRATE = 2500000;
  // Token that platform.twitter.com derives from the post id, as read in vercel/react-tweet (fetch-tweet.ts): not a secret.
  function xToken(id) { return ((Number(id) / 1e15) * Math.PI).toString(36).replace(/(0+|\.)/g, ''); }
  // oEmbed blockquote: text in <p>, then the author and the date as the last link. Parsed inert, only text comes out.
  function xText(html) {
    var doc = new DOMParser().parseFromString(html, 'text/html'), p = doc.querySelector('blockquote > p'), dates = doc.querySelectorAll('blockquote > a');
    if (!p) return null;
    [].forEach.call(p.querySelectorAll('br'), function (br) { br.replaceWith('\n'); });
    // pic.twitter.com links stand for the media, which the card shows or X opens.
    [].forEach.call(p.querySelectorAll('a'), function (a) { if (/^pic\.(?:twitter|x)\.com\//.test(a.textContent)) a.remove(); });
    return { text: p.textContent.trim(), date: dates.length ? dates[dates.length - 1].textContent.trim() : '' };
  }
  // Author picture in the 73 pixel size, sharp in a 40 pixel avatar, and exact time of the post.
  function xAuthor(t) {
    var out = {}, pic = (t.user && t.user.profile_image_url_https) || '', time = Date.parse(t.created_at);
    if (X_AVATAR.test(pic)) out.avatar = pic.replace(/_normal(\.\w+)$/, '_bigger$1');
    if (isFinite(time)) out.time = time;
    return out;
  }
  function xMedia(t) {
    var m = t.mediaDetails && t.mediaDetails[0], o = m && m.original_info;
    if (!m || !X_IMAGE.test(m.media_url_https || '')) return null;
    var out = { kind: 'photo', thumb: m.media_url_https, sensitive: t.possibly_sensitive === true };
    if (o && o.width > 0 && o.height > 0) { out.width = Math.round(o.width); out.height = Math.round(o.height); }
    if (m.type === 'photo') return out;
    var mp4 = ((m.video_info || {}).variants || []).filter(function (v) { return v.content_type === 'video/mp4' && X_VIDEO.test(v.url || ''); })
      .sort(function (a, b) { return (b.bitrate || 0) - (a.bitrate || 0); });
    var pick = mp4.filter(function (v) { return (v.bitrate || 0) <= X_VIDEO_BITRATE; })[0] || mp4[mp4.length - 1];
    if (!pick) return null;
    out.kind = 'video'; out.video = pick.url;
    return out;
  }
  document.addEventListener('torch-skin:x-request', function (e) {
    var q = JSON.parse(e.detail), post = X_POST.exec(q.url);
    if (!post) { reply('x', q.id, { error: 'X did not share this post. Open the link instead.' }); return; }
    var link = 'https://x.com/' + post[1] + '/status/' + post[2], card = null, extra = {}, error = null, left = 2;
    // The card waits for both replies: the media is a bonus, the text decides.
    function done() {
      if (--left) return;
      if (!card) { reply('x', q.id, { error: error }); return; }
      reply('x', q.id, Object.assign(card, extra));
    }
    GM_xmlhttpRequest({
      method: 'GET', url: 'https://publish.x.com/oembed?url=' + encodeURIComponent(link) + '&omit_script=true&dnt=true&hide_thread=true', anonymous: true, timeout: 15000,
      onload: function (r) {
        var o = null, body = null, author = null;
        try { o = r.status === 200 ? JSON.parse(r.responseText) : null; } catch (x) { /* unreadable reply: no card */ }
        if (o && typeof o.html === 'string') { body = xText(o.html); author = X_AUTHOR.exec(o.author_url || ''); }
        if (body && author) card = { author: String(o.author_name || author[1]), handle: author[1], text: body.text, date: body.date, link: 'https://x.com/' + author[1] + '/status/' + post[2] };
        else error = 'X did not share this post. Open the link instead.';
        done();
      },
      onerror: function () { error = 'X could not be reached. Open the link instead.'; done(); },
      ontimeout: function () { error = 'X did not answer in time. Open the link instead.'; done(); }
    });
    GM_xmlhttpRequest({
      method: 'GET', url: 'https://cdn.syndication.twimg.com/tweet-result?id=' + post[2] + '&lang=en&token=' + xToken(post[2]), anonymous: true, timeout: 15000,
      onload: function (r) {
        // Undocumented reply: if X changes it, the card shows without media.
        try {
          var t = r.status === 200 ? JSON.parse(r.responseText) : null, media = t && xMedia(t);
          if (t) extra = xAuthor(t);
          if (media) extra.media = media;
        } catch (x) { extra = {}; }
        done();
      },
      onerror: done, ontimeout: done
    });
  });
})();
