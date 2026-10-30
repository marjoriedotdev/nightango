---
status: accepted
date: 2026-10
---

# The password is never read or transmitted

## Context

Torch Skin runs in the BetterChatango page, which knows the user's Chatango password. Several BetterChatango functions add it to requests on their own: the `credential` option of `client.post`, and the `updatemsgstyles` style form. A userscript that touches the password becomes a credential theft vector, and the user could no longer audit it with confidence.

## Decision

Our code never reads, stores, logs or transmits the password. Sign-in happens on the BetterChatango screen. No call to a BetterChatango function that adds the password to a request. The only allowed HTTP calls are those in `docs/betterchatango-protocol.md#allowed-http-calls`:

- `client.post(url, form, {})` to `chatango.com` only, because without an option BetterChatango adds the `s` token for any host in its list, or `client.post(url, form, { cookie: true })`, never `credential`
- `client.post('https://vissle.me/chatango/upload', form, { key: true })`, this URL only and never with `progress`: BetterChatango adds the vissle session key to it, never the password
- `GET https://api.vissle.me/v1/pmr/{name}` through `fetch`, without cookie or credential, for the signed-in account (`client.user.name`) and only if `check_pmr` is on
- `GET https://vissle.me/api/v1/who/{name}` through `fetch`, without cookie or credential, `{name}` validated by `ACCOUNT_NAME`, one call per click on "Who is this": linked accounts, source `inject.js:7452-7477` ([ADR-0010](0010-linked-accounts-on-request.md))
- the public GETs `mod1.xml`, `mod2.xml`, `custom_profile.css`, `msgbg.xml` (message background, whose `msgbg.jpg` image is a resource loaded as a CSS background, always on `ust.chatango.com`)
- `chatango.com/search` with `credentials: 'include'`, like BetterChatango
- `POST https://vissle.me/track1/activity` through `GM_xmlhttpRequest`, `anonymous: true`
- `GET https://api.github.com/repos/marjoriedotdev/nightango/releases/latest` through `fetch`, without cookie or credential, once per page at sign-in ([ADR-0013](0013-update-check-at-sign-in.md))
- `GET https://api.imgflip.com/get_memes` through `fetch`, without cookie, credential or referrer, when the Memes tab is shown ([ADR-0014](0014-meme-templates-on-request.md)).

## Consequences

- Any Chatango feature that requires the password is out of reach. The own message style is therefore not saved on the account ([ADR-0006](0006-local-message-style.md)).
- Adding an endpoint to the list requires checking in BetterChatango's code that it does not carry the password.
- Owner decision of 2026-10-23 (#96): file uploads through vissle (`{ key: true }`) and the PM restriction of one's own account (`v1/pmr`) join the list, `client.post` without an option targets only `chatango.com`, and `check_block` (`v1/profile/{name}?get=status`) stays excluded ([out of scope note](../../.out-of-scope/blocked-by-member.md)).
- Owner decision of 2026-10-28: the BetterChatango sign-in screen takes Nightango's look through a stylesheet only (`src/styles/login.css`). No script touches its form, and the build rejects a `url(` or an `@import` in this stylesheet, so it loads nothing next to the password field.
