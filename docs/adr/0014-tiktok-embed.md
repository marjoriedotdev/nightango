---
status: accepted
date: 2026-10
---

# TikTok embed on click, short links resolved by the loader

## Context

Members post TikTok links, most often short share links (`tiktok.com/t/{code}/`, `vm.tiktok.com/{code}/`, `vt.tiktok.com/{code}/`). BetterChatango shows them as plain links.

TikTok offers an embed player as an iframe, `https://www.tiktok.com/player/v1/{post id}`. A post link (`/@{user}/video/{id}`) carries the id. A short link does not: only its redirect to the post link gives it. The page cannot follow that redirect itself, since a cross-origin `fetch` from st.chatango.com cannot read TikTok's reply. TikTok's oEmbed does not help: its reply asks for TikTok's `embed.js` script in the page.

## Decision

Owner decision of 2026-10-31:

- with `embedVideos`, a TikTok link is shown as a "Play video" button followed by its host. The player iframe is created only on click, as for YouTube. Nothing goes to TikTok before the click
- for a short link, the click first asks the loader's sandbox for the post id. The sandbox calls `GM_xmlhttpRequest` (`@connect tiktok.com`, which covers `vm.` and `vt.`) with `anonymous: true`, and replies with the post id read from the URL reached after the redirects, never with the response body
- the sandbox accepts only a short TikTok link, which it rebuilds before the call: any script of the page can send it a request ([ADR-0003](0003-two-context-loader.md))
- the call and the iframe join the closed lists of `docs/betterchatango-protocol.md#allowed-http-calls` ([ADR-0001](0001-password-never-read.md))
- if TikTok gives no post id, the embed turns back into a link that goes through the link warning, and a toast says why
- the prototype has no loader: a short link there turns back into a link on click.

## Consequences

- TikTok gets the user's IP address once per short link clicked and per page, then through its player.
- The userscript declares one more domain, `tiktok.com`, which Tampermonkey lists among its permissions.
- If TikTok stops answering short links with an HTTP redirect (a page that redirects through JavaScript, a sign-in wall), short links stay links. Post links keep working.
