---
status: accepted
date: 2026-10
---

# Linked accounts on request, shown to the user only

Supersedes [ADR-0007](0007-no-linked-accounts.md).

## Context

BetterChatango offers "who" on any member who has an account. The entry is in a message menu, for messages from accounts, one's own included, never a guest's (`reference/torch/inject.js:8132-8138`), and in the "More" button of a member card (`inject.js:782`).

On click (`inject.js:7452-7477`), BetterChatango calls ``fetch(`${torch.domain}/api/v1/who/${data.username}`)``, with `torch.domain` = `https://vissle.me` (`inject.js:2911`). The call carries neither key nor password, and `fetch` sends no cookie to another origin. The JSON response has a `target` field and lists of names per match level: `definite`, `linked`, `strong`, `medium` and `weak`. BetterChatango shows the total then each non-empty level in a local system message, which only the user sees and which is not kept.

[ADR-0007](0007-no-linked-accounts.md) had ruled the feature out, by decision of the assistant: it exposes other people's secondary accounts, deduced from their IP address, without their consent. The client code does not say how vissle computes the levels.

## Decision

Owner decision of 2026-10-23 (#120): Torch Skin offers linked accounts like BetterChatango, on any member who has an account. Reason: the owner wants to find this BetterChatango feature in the rebuilt interface.

In live, "Who is this" appears in the "More actions" menu of any message from an account, one's own included, never a guest's, and in the "More profile actions" menu of the member card. The click opens a "Who is {name}" dialog that shows the total then each non-empty level with its names, and says that it is vissle's estimate, which can be wrong. The prototype does not show the entry.

Owner decision of 2026-10-24: each listed account has its card (picture, ASL, start of the About), and a click opens its card on top of the list. The mini profiles and avatars of the listed accounts load as soon as the response arrives, like the Meet people results: they are Chatango public files from the closed list, with no new call to vissle.

Guards:

- the result is shown to the user only, in a dialog, never posted in a group or a PM
- it is never stored (no persistent state, no `torch-skin:<username>`, no cache) or logged (no `console`, no `warn`): it lives in the dialog, and closing it forgets it. The mini profiles loaded for the cards join the in-memory state like any profile viewed, with no trace of the link to the targeted account
- one call per user click, never automatic or in batch
- the call joins the closed list ([ADR-0001](0001-password-never-read.md), `docs/betterchatango-protocol.md#allowed-http-calls`) with its source: `GET https://vissle.me/api/v1/who/{name}` through `fetch`, without cookie or credential, `{name}` validated by `ACCOUNT_NAME` (`src/bridge/live-model.js`), source `inject.js:7452-7477`
- only the strings of the five levels are read, any other field is ignored, and names are rendered as text, never as HTML.

## Risks accepted by the owner

- Secondary accounts deduced from third parties' IP address, without their consent.
- Chatango gets a read of the mini profile of each listed account as soon as the dialog opens.
- False matches: a shared IP address (household, school, public wifi, mobile carrier) links unrelated people, and vissle's method cannot be checked.
- Use of the result to accuse or harass a member in a group.
- vissle gets the name of each member looked up, with the user's IP address.

## How it fits with the other decisions

- [ADR-0005](0005-visitors-own-profile-only.md) does not change. It covers a profile's activity recorded by the vissle tracker, which Torch Skin still reads only for the signed-in account. Linked accounts are a separate exception, decided by the owner, which reads no activity of another profile and starts only from a click on a specific member.
- `GET https://api.vissle.me/v1/profile/{name}?get=status` (BetterChatango's `check_block`) stays excluded by the decision of 2026-10-23 on #96 ([out of scope note](../../.out-of-scope/blocked-by-member.md)). This read of another profile's state would go out on its own, without the user or the member knowing, for every offline correspondent in their list. Linked accounts start only from an explicit click. This decision does not reopen `check_block`.

## Consequences

- [ADR-0007](0007-no-linked-accounts.md) moves to the `superseded by ADR-0010` status.
- `docs/betterchatango-protocol.md` (Allowed HTTP calls, Linked accounts (vissle)) and [ADR-0001](0001-password-never-read.md) add the call to the closed list.
- Keeping the result, sharing it, chaining it over several members or requesting it without a click reopens this decision with the owner.
