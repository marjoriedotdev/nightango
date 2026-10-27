---
status: accepted
date: 2026-10
---

# Update check at sign-in, without automatic install

## Context

Nightango is installed by pasting `dist/nightango.min.user.js` into Tampermonkey. Nothing tells the user that a newer version exists. The CI publishes each version as a GitHub release `vX.Y.Z` of `marjoriedotdev/nightango`.

Tampermonkey can update a script on its own (`@updateURL`, `@downloadURL`), on its own schedule, and installs the new code without the user seeing it. The installed version touches the user's Chatango account.

## Decision

Owner decision of 2026-10-27: in live, once per page at sign-in, Nightango asks GitHub for the latest release and, if it is newer than `APP_VERSION`, shows a toast "Nightango X.Y.Z is available." whose Download button opens the release page. The user installs it by hand, as before. The prototype makes no call.

Guards:

- the call joins the closed list ([ADR-0001](0001-password-never-read.md), `docs/betterchatango-protocol.md#allowed-http-calls`): `GET https://api.github.com/repos/marjoriedotdev/nightango/releases/latest` through `fetch` from the page, without cookie or credential, and without a new `@connect`
- only `tag_name` is read, and only in the form `vX.Y.Z`. The opened link is built from that number on `github.com/marjoriedotdev/nightango/releases/`, never taken from the reply
- a failure shows nothing and adds one line to the diagnostic journal ([ADR-0011](0011-diagnostic-journal.md))
- no `@updateURL` or `@downloadURL`: Nightango never installs code on its own.

## Consequences

- GitHub gets the user's IP address once per sign-in.
- Without an answer from GitHub (offline, rate limit), the user is not told about a new version until a later sign-in.
