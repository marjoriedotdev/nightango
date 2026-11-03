---
status: accepted
date: 2026-10
---

# No invented Chatango frame

## Context

The Chatango protocol is not documented. A guessed frame can be ignored without an error or produce an effect different from the expected one on a real group. The user runs Torch Skin on their real account, with moderation rights.

## Decision

Every frame sent comes from BetterChatango's own code or from a maintained reference library:

- chadango (Go): https://github.com/n0h4rt/chadango
- chatango-lib (Python): https://github.com/neokuze/chatango-lib
- ch.py (older): https://github.com/asl97/ch.py

Owner decision of 2026-11-03 (#8): the official client is also a source, under three conditions:

- only the code `st.chatango.com` serves at the time of reading (`js/gz/r{build}/` and `h5/gz/r{build}/`), the current build id being in `https://st.chatango.com/cfg/nc/r.json`. A citation names the build, the file, the date of reading and a short quoted excerpt.
- no file or module of it is copied into the repo, test fixtures included: it is Chatango's proprietary code, with no licence, unlike `reference/torch/` (MIT). Short excerpts quoted in the docs are the only copy.
- a third-party copy of it (for example `EduardoRFS/chatango-extension`, an unlicensed 2015 build) is only a hint for reading the minified code or for an observation on a real account, never a source.

Why: the official client is what the server is built for, so its frames are the most reliable source available. The badge visibility flags of #8 showed it: the current build sends `updategroupflags` with bits the reference libraries only name.

Without a source, the feature stays marked "not wired" and the interface says so honestly. An action that is not actually sent is hidden or shown as unavailable: never a fake success in live.

## Consequences

- A group's title and description stay read-only: no write frame has a source ([out of scope](../../.out-of-scope/group-title-description-icon.md)). That search predates the 2026-11-03 decision and did not cover the official client.
- A frame taken from the official client is marked "official client, build {id}" next to it in `docs/betterchatango-protocol.md`. The build changes without notice: when a feature that sends such a frame is touched, the frame is checked again against the current build.
- The profile picture and the group icon do not fall under this decision: they are HTTP calls, governed by [ADR-0001](0001-password-never-read.md) and the closed list. The picture has a source in BetterChatango (`updateprofile`, `action=fullpic` and `action=thumb`, `auth=token`), tracked in #6. The icon is a vissle feature, out of scope.
- A less reliable source (a Pastebin script, for example) is flagged next to the frame in `docs/betterchatango-protocol.md`.
- `live_ui` checks the exact format of every frame sent.
