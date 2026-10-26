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

Without a source, the feature stays marked "not wired" and the interface says so honestly. An action that is not actually sent is hidden or shown as unavailable: never a fake success in live.

## Consequences

- A group's title and description stay read-only: no write frame has a source ([out of scope](../../.out-of-scope/group-title-description-icon.md)).
- The profile picture and the group icon do not fall under this decision: they are HTTP calls, governed by [ADR-0001](0001-password-never-read.md) and the closed list. The picture has a source in BetterChatango (`updateprofile`, `action=fullpic` and `action=thumb`, `auth=token`), tracked in #6. The icon is a vissle feature, out of scope.
- A less reliable source (a Pastebin script, for example) is flagged next to the frame in `docs/betterchatango-protocol.md`.
- `live_ui` checks the exact format of every frame sent.
