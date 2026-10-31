---
status: accepted
date: 2026-10
---

Revised on 2026-10-31 for 0.29.1: the card shows TikTok's thumbnail under the rules of the YouTube thumbnail.

# TikTok embed on click, short links resolved by the loader

## Context

Members post TikTok links, most often short share links (`tiktok.com/t/{code}/`, `vm.tiktok.com/{code}/`, `vt.tiktok.com/{code}/`). BetterChatango shows them as plain links.

TikTok offers an embed player as an iframe, `https://www.tiktok.com/player/v1/{post id}`. A post link (`/@{user}/video/{id}`) carries the id. A short link does not: only its redirect to the post link gives it. The page cannot follow that redirect itself, since a cross-origin `fetch` from st.chatango.com cannot read TikTok's reply. TikTok's oEmbed (`www.tiktok.com/oembed?url=`) cannot replace the player: its `html` asks for TikTok's `embed.js` script in the page. It is the only source of a thumbnail (`thumbnail_url`), which cannot be built from the post id as YouTube's can.

## Decision

Owner decisions of 2026-10-31 (0.29.0, then the thumbnail in 0.29.1):

- with `embedVideos`, a TikTok link is shown as a vertical card with a play button, like the YouTube card. The player iframe is created only on click
- the thumbnail follows the rules of the YouTube thumbnail: asked to TikTok when the card shows, only if "Block external media until I click" (`proxyMedia`) is off or the host of the link is trusted. Otherwise nothing goes to TikTok before the click
- the sandbox resolves a short link (`GM_xmlhttpRequest`, `@connect tiktok.com`, which covers `vm.` and `vt.`, `anonymous: true`) and replies with the post id and link read from the URL reached after the redirects, never with the response body. This happens at the click, or before it for the thumbnail
- the sandbox reads the thumbnail from TikTok's oEmbed for a post link (`anonymous: true`) and replies with `thumbnail_url` only, if it is an https address. The page shows it in `<img referrerPolicy="no-referrer">`
- the sandbox accepts only a short or post TikTok link, which it rebuilds before the call: any script of the page can send it a request ([ADR-0003](0003-two-context-loader.md))
- the calls, the iframe and the thumbnail join the closed lists of `docs/betterchatango-protocol.md#allowed-http-calls` ([ADR-0001](0001-password-never-read.md))
- if TikTok gives no post id, the embed turns back into a link that goes through the link warning, and a toast says why
- the prototype has no loader: a short link there turns back into a link on click.

## Consequences

- With media not blocked, TikTok gets the user's IP address for each TikTok link shown, once per page (redirect, oEmbed, thumbnail on its CDN). Otherwise only on click, then through its player.
- A thumbnail TikTok does not give leaves the card plain. A failed thumbnail is not asked again before the next page load.
- The userscript declares one more domain, `tiktok.com`, which Tampermonkey lists among its permissions.
- If TikTok stops answering short links with an HTTP redirect (a page that redirects through JavaScript, a sign-in wall), short links stay links. Post links keep working.
