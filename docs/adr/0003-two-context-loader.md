---
status: accepted
date: 2026-10
---

Amended on 2026-10-31 by [ADR-0014](0014-tiktok-embed.md): the sandbox also holds the TikTok bridge (`@connect tiktok.com`, `torch-skin:tiktok-request` and `torch-skin:tiktok-response`).

# Two-context loader: sandbox and page

## Context

Tampermonkey runs a userscript that asks for `@grant` in an isolated sandbox: it sees neither BetterChatango's global objects (`client`, `chatango`, `sidebar`, `torch`) nor the React loaded in the page. Also, `vissle.me/track1/activity` sends no CORS header: from the st.chatango.com page, `fetch` cannot read its response.

## Decision

The userscript is split into two contexts:

- `skin-loader.js` stays in the sandbox. It contains only the home page guard and the vissle bridge, which calls `GM_xmlhttpRequest` (`@connect vissle.me`, `anonymous: true`).
- Everything else (`skin-page.js`, the design system, the application) is injected into the page by an inline `<script>` whose `textContent` is a JSON string literal. There it sees BetterChatango directly.
- The two contexts communicate through `CustomEvent` on `document` (`torch-skin:vissle-request`, `torch-skin:vissle-response` and `torch-skin:account`).

## Consequences

- The page code has no Tampermonkey privilege. The only privileged access is the vissle call, and its profile is set by the loader ([ADR-0005](0005-visitors-own-profile-only.md)).
- The injected code must never contain `</script`: the build checks it.
- The signed-in account name is read through an inline probe that the loader injects into the page, never through `unsafeWindow`, which Userscripts (Safari) lacks.
