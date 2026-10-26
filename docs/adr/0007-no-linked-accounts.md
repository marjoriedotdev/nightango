---
status: superseded by ADR-0010
date: 2026-10
---

Superseded on 2026-10-23 by [ADR-0010](0010-linked-accounts-on-request.md): linked accounts are offered as in BetterChatango, shown to the user only.

# Linked accounts not implemented

## Context

An `/api/v1/who` endpoint returns the accounts linked to a member, that is their secondary accounts deduced from their IP address. The feature could have been shown on the profile card.

Source: `reference/torch/inject.js:7452-7477`, "who" action of the message menu (`inject.js:8132-8138`), also offered by the "More" button of a member card (`inject.js:782`). BetterChatango calls ``fetch(`${torch.domain}/api/v1/who/${data.username}`)``, with `torch.domain` = `https://vissle.me` (`inject.js:2911`). The response groups the accounts by match level: `definite`, `linked`, `strong`, `medium` and `weak`. BetterChatango shows the total then each non-empty level in a `systemMessage`. The client code does not say how vissle computes these levels: matching by IP address, including the `linked` level, cannot be checked in `inject.js`.

## Decision

Linked accounts are not implemented. Decision made by the assistant. Reason: the feature exposes other people's secondary accounts, deduced from their IP, without their consent.

## Consequences

- No call to `/api/v1/who`, and the endpoint stays out of the list of allowed calls ([ADR-0001](0001-password-never-read.md)).
- A future request in this direction reopens this decision explicitly, with the user.
