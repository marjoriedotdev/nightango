---
status: accepted
date: 2026-11
---

# Private notes on members, local only

## Context

The owner asked for a private note and a short label on a member (#119), for example "coworker of X" or "banned before", to tell people apart in busy groups. Chatango has no such field, and a note says something about another person: where it goes and who can read it matters more than for a setting.

[ADR-0005](0005-visitors-own-profile-only.md) forbids looking up the activity of another profile. A note is written by the user about what they already know: it reads nothing from Chatango or vissle.

## Decision

A note is a label of at most 24 characters and a text of at most 500 characters, written by the user on a member's profile.

- It stays in this browser, per account, in `torch-skin:<username>` (`notes` field), like the own message style ([ADR-0006](0006-local-message-style.md)).
- It is never sent: no frame, no HTTP call, no BetterChatango setting.
- It is never written to the diagnostic journal ([ADR-0011](0011-diagnostic-journal.md)) or to the console.
- It is shown as text only, to the user only: the label next to the member's name in the members column, the note on their profile.
- Settings, Privacy says how many notes this browser keeps for the account and deletes them all after confirmation. Clearing both fields of a note deletes it.

## Consequences

- Notes do not follow the user to another browser or another client, and are lost with the browser data.
- Syncing notes, sharing them with other staff or deriving a label from Chatango data reopens this decision with the owner.
