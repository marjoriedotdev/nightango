---
status: accepted
date: 2026-10
---

# Own message style, local only

## Context

The user picks the font, size, text and name colors, bold, italic and underline for their messages. Chatango saves this style on the account through BetterChatango's style form (`updatemsgstyles`), which transmits the password.

## Decision

The own style stays local to the browser, in `torch-skin:<username>` (`style` field). It is written into BetterChatango's style fields (`msgstyles` form) right before each send, and is never saved on Chatango. "Use account style" restores the account style. Reason: [ADR-0001](0001-password-never-read.md).

## Consequences

- The own style does not follow the user to another browser or another client.
- Reversing this decision requires a save path that does not carry the password, checked in a reference source.
