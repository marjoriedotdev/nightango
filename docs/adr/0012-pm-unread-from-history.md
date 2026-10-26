---
status: accepted
date: 2026-10
---

# PM unreads read from the private history

## Context

Two unread counters coexisted for a conversation: the `unread` flag of each entry in BetterChatango's history database, and `unread` in the `Root` state. The second went up by 1 on each PM received, went back to 0 on read and was reset on each `OK` from the entries that no displayed message covered. Seven places in `app/root.js` wrote it, and the fix `1d1022d` (unreads kept on reload) had to touch eight files to keep both in agreement.

## Decision

Owner decision of 2026-10-24 (architecture review, candidate 01): BetterChatango's history database is the only source of unreads. A conversation's count is the number of its unread entries, without PM edits, which BetterChatango archives separately. The state keeps only a copy for rendering, written only by `app/pm.js`, always by reading it back from the archive after a write, never by increment. The prototype, and live in a browser without a database, use an in-memory archive with the same interface.

## Consequences

- A badge appears a few milliseconds after BetterChatango archives the PM, and disappears the same way after the read.
- Without a database (private browsing, quota), unreads do not survive a reload, like the history itself. A banner says so at the top of Chats.
- Reintroducing an incremented counter in the state, or keeping one elsewhere, reopens this decision.
