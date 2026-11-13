---
status: accepted
date: 2026-10
---

# Update check at sign-in, without automatic install

## Context

Nightango is installed by pasting `dist/nightango.min.user.js` into Tampermonkey. Nothing tells the user that a newer version exists. The CI publishes each version as a release `vX.Y.Z` of `marjoriedotdev/nightango`, on GitHub and on GitLab (see Revision).

Tampermonkey can update a script on its own (`@updateURL`, `@downloadURL`), on its own schedule, and installs the new code without the user seeing it. The installed version touches the user's Chatango account.

## Decision

Owner decision of 2026-10-27: in live, once per page at sign-in, Nightango asks for the latest release and, if it is newer than `APP_VERSION`, shows a toast "Nightango X.Y.Z is available." whose Download button opens the release page. The user installs it by hand, as before. The prototype makes no call.

Guards:

- the calls join the closed list ([ADR-0001](0001-password-never-read.md), `docs/betterchatango-protocol.md#allowed-http-calls`): `GET https://api.github.com/repos/marjoriedotdev/nightango/releases/latest` and, at the same time, `GET https://gitlab.com/api/v4/projects/marjoriedotdev%2Fnightango/releases?order_by=released_at&sort=desc&per_page=20`, through `fetch` from the page, without cookie or credential, and without a new `@connect`. Both APIs answer any origin
- only `tag_name` is read, and only in the form `vX.Y.Z`: on GitLab, the first one of the list, newest first. The newer of the two versions is announced. The opened link is built from that number on the release page of the host that gave it (`github.com/marjoriedotdev/nightango/releases/tag/` or `gitlab.com/marjoriedotdev/nightango/-/releases/`), never taken from the reply
- a host that fails shows nothing and adds one line to the diagnostic journal, naming the host ([ADR-0011](0011-diagnostic-journal.md))
- no `@updateURL` or `@downloadURL`: Nightango never installs code on its own.

## Consequences

- GitHub and GitLab each get the user's IP address once per sign-in.
- Without an answer from either host (offline, rate limit), the user is not told about a new version until a later sign-in.
- Betas (`vX.Y.Z-beta.N`, from the `beta` branch) are GitHub prereleases, which `releases/latest` skips, and ordinary GitLab releases, since GitLab has no prerelease flag. The check skips any tag that is not `vX.Y.Z`. A beta user is told about stable releases only, the `X.Y.Z` that follows their beta included, never about the next beta. More than 20 betas published after the last stable release would hide it until the next one.

## Revision

2026-11-10: the GitHub account was suspended on 2026-11-09. The owner pushes the same code by hand to GitHub and to gitlab.com, GitHub first, GitLab while GitHub is down, and each CI publishes its own releases. The check asks both hosts and announces the newer version, so a release published on one host only is still found. Versions installed before this change ask GitHub only: while it does not answer, their users learn about new versions only once they install one with the two-host check by hand.

2026-11-13: the GitHub account is back. Both hosts keep their pipeline and their releases, and the check keeps asking both.
