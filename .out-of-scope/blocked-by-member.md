# Knowing whether a member blocked us

Nightango does not try to find out whether a correspondent has blocked the user. The private conversation shows the presence that Chatango returns, with no further deduction.

## Why this is out of scope

BetterChatango guesses it with its `check_block` setting (off by default, `inject.js:9691`). When a correspondent from its recent list answers `offline` to `connect:{name}`, it calls `GET https://api.vissle.me/v1/profile/{name}?get=status&verify=false` and compares the status timestamp vissle knows for this member with the one in its list. If they differ, it marks the member as blocking us (`inject.js:4142-4157`).

This is a read of another profile's state, through a third party, without the targeted member knowing. The owner excluded it on 2026-10-23: it goes against the spirit of [ADR-0005](../docs/adr/0005-visitors-own-profile-only.md), which limits any activity lookup to the signed-in user's profile. The call therefore stays out of the closed list of allowed HTTP calls ([ADR-0001](../docs/adr/0001-password-never-read.md)).

In live, the call does not go out from BetterChatango either: the bridge does not call BetterChatango's `connect` handler, which contains it (see `docs/betterchatango-protocol.md`, Friend presence).

## What would reopen the question

A way to know whether one is blocked that reads only one's own account state, for example a Chatango refusal frame found in the code of BetterChatango or of a reference library (chadango, chatango-lib, ch.py), or an owner decision that reverses ADR-0005.

## Sources consulted (2026-10-23)

- `reference/torch/inject.js` (copy from 2026-10-19): `connect` handler of the `private` table (`inject.js:4120-4166`, call at `inject.js:4142-4157`), default of the `check_block` setting (`inject.js:9691`).

## Prior requests

- #96: "chore(protocol): decide on BetterChatango calls outside the closed list"
