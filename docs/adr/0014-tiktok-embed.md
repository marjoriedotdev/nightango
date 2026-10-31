---
status: accepted
date: 2026-10
---

Revised on 2026-10-31 for 0.29.1: the card shows TikTok's thumbnail under the rules of the YouTube thumbnail. Revised again for 0.30.2: the thumbnail is read from the post page, TikTok's oEmbed no longer gives it.

# TikTok embed on click, short links resolved by the loader

## Context

Members post TikTok links, most often short share links (`tiktok.com/t/{code}/`, `vm.tiktok.com/{code}/`, `vt.tiktok.com/{code}/`). BetterChatango shows them as plain links.

TikTok offers an embed player as an iframe, `https://www.tiktok.com/player/v1/{post id}`. A post link (`/@{user}/video/{id}`) carries the id. A short link does not: only its redirect to the post link gives it. The page cannot follow that redirect itself, since a cross-origin `fetch` from st.chatango.com cannot read TikTok's reply. TikTok's oEmbed (`www.tiktok.com/oembed?url=`) adds nothing to the player: its `html` is an iframe of the same `player/v1`. Its documented response (Embed Videos, checked on 2026-10-31) no longer has `thumbnail_url`, a title or an author, and real posts answer the same. The Embed Player documentation (updated 2026-10-28) offers no cover or poster parameter. A thumbnail cannot be built from the post id as YouTube's can. The post page has no `og:image`: the cover is only in the JSON of the page (`"cover"`, a signed address on TikTok's CDN, valid about two days), which TikTok does not document.

## Decision

Owner decisions of 2026-10-31 (0.29.0, the thumbnail in 0.29.1, read from the post page in 0.30.2):

- with `embedVideos`, a TikTok link is shown as a "Play video" button followed by its host, which becomes a vertical card once its thumbnail has loaded. The player iframe is created only on click
- the thumbnail follows the rules of the YouTube thumbnail: asked to TikTok when the link shows, only if "Block external media until I click" (`proxyMedia`) is off or the host of the link is trusted. Otherwise nothing goes to TikTok before the click
- the sandbox reads the post page of the link (`GM_xmlhttpRequest`, `@connect tiktok.com`, which covers `vm.` and `vt.`, `anonymous: true`): a short link redirects to it. It replies with the post id and link, read from the URL reached after the redirects for a short link, and with the `"cover"` https address of the page JSON, never with the rest of the page. One call per link and per page, before the click for the thumbnail, at the click otherwise (short links only, a post link carries its id)
- the page shows the cover in `<img referrerPolicy="no-referrer">`. If TikTok changes its page and the cover disappears, links stay buttons and keep playing
- the sandbox accepts only a short or post TikTok link, which it rebuilds before the call: any script of the page can send it a request ([ADR-0003](0003-two-context-loader.md))
- the calls, the iframe and the thumbnail join the closed lists of `docs/betterchatango-protocol.md#allowed-http-calls` ([ADR-0001](0001-password-never-read.md))
- if TikTok gives no post id, the embed turns back into a link that goes through the link warning, and a toast says why
- the prototype has no loader: its sample post shows a sample thumbnail, and a short link turns back into a link on click.

## Consequences

- With media not blocked, TikTok gets the user's IP address for each TikTok link shown, once per page (post page of about 400 KB, cover on its CDN). Otherwise only on click, then through its player.
- The cover depends on an undocumented field of TikTok's page: it can disappear without notice.
- Without a thumbnail from TikTok, the link stays a button: an empty vertical card would take the height of a video. A failed thumbnail is not asked again before the next page load.
- The userscript declares one more domain, `tiktok.com`, which Tampermonkey lists among its permissions.
- If TikTok stops answering short links with an HTTP redirect (a page that redirects through JavaScript, a sign-in wall), short links stay links. Post links keep working.
