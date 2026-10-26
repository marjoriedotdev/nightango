# Editing a group's title, description or icon

Nightango does not edit a group's title, description or icon. The group settings show them read-only.

## Why this is out of scope

No write path respects both [ADR-0001](../docs/adr/0001-password-never-read.md) (the password is never transmitted) and [ADR-0002](../docs/adr/0002-no-invented-frames.md) (no invented frame).

**Title and description.** No socket write frame exists in BetterChatango, chadango, chatango-lib or ch.py. The read side is known (`updgroupinfo:{title}:{desc}`, received by BetterChatango and chadango). The server can edit a group (modaction `egrp`, "edited group", in chadango), but the only write found is an HTTP POST from the megach fork (GPL, not a reference library):

```
POST http://chatango.com/updategroupprofile
erase=0&l=1&d={desc}&n={title}&u={group}&lo={login}&p={password}&origin=st.chatango.com
```

It requires the password (`p`): excluded by ADR-0001. BetterChatango does not call it (its Save button in the Information section has no handler), and BetterChatango's `client.post` rejects this endpoint (not in its whitelist). No token or cookie variant was found.

**Icon.** What BetterChatango calls a group icon is not a Chatango feature: it is a vissle feature, reserved for groups registered with vissle, sent to `vissle.me/chatango/updateavatar` and `updateprofile` with the vissle session key (`{ key: true }`), and shown only in BetterChatango. The endpoint is not in the closed list of allowed calls, where the `key` option applies only to file uploads (`vissle.me/chatango/upload`, #96).

## What would reopen the question

A frame or a call without the password, found in the code of BetterChatango or of a reference library (chadango, chatango-lib, ch.py).

## Sources consulted (2026-10-22)

- `reference/torch/inject.js` and `client.html` (copy from 2026-10-19).
- chadango @ d53b02a: `group.go` (`updgroupinfo`), `models/modaction.go` (`egrp`).
- chatango-lib @ 49a6dfa, ch.py @ b3c64da: nothing.
- LinkkG/megach @ 6aace67: `update_info` (`updategroupprofile`, with password).
- `gh search code` and web search: `updategroupprofile`, `updgroupinfo`, `ownr_msg`.

## Prior requests

- #5: "feat(group): edit the group's title, description and icon"
