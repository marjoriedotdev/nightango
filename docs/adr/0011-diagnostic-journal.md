---
status: accepted
date: 2026-10
---

# Local diagnostic journal, without content

## Context

The owner often loses the connection to groups or PMs on mobile, without access to developer tools. On 2026-10-24 they asked to log everything that can be logged and to read the journal in the interface.

BetterChatango's "Debug mode" setting has no effect: `mode_debug` is read nowhere (`reference/torch/inject.js:9635`). BetterChatango's console, on the other hand, writes unconditionally the text of received PMs (`inject.js:4055`), raw frames and the account settings. It gives neither the close code of a socket nor the moment the browser suspended the page. Finally, the group authentication frame carries the password in clear text (`bauth`, `inject.js:5618`).

## Decision

Torch Skin keeps its own journal, set up by the page code before BetterChatango starts (`src/loader/skin-journal.js`) and exposed to the application through `window.__TORCH_JOURNAL__`. It is shown in Settings, Diagnostics, which lets the user copy, download or clear it.

It records:

- the sockets created in the page (wrapped `WebSocket` constructor): target, server, open, error, name of the session and refusal frames received (`OK`, `inited`, `kickingoff`, `DENIED`...), close with code, lifetime, number of frames received, delay since the last one, page visibility and network state
- the page lifecycle: visibility, `pagehide`, `pageshow`, `freeze`, `resume`, network, suspended timers
- uncaught errors
- in the console: `[torch-skin]` lines, BetterChatango's connection lines (closed list) and `Error` objects
- on the bridge side: connection attempts and their outcome, observed state changes, BetterChatango warnings shown.

It never records:

- what goes out through a socket: `send` is not observed, authentication carries the password ([ADR-0001](0001-password-never-read.md))
- the arguments of a received frame, so neither message text nor correspondent name
- the rest of BetterChatango's console
- the response of `/api/v1/who` ([ADR-0010](0010-linked-accounts-on-request.md)).

The journal keeps the last 1,000 events in `localStorage` (`torch-skin:journal`), to survive the reload that often follows a connection loss on mobile. It never leaves the browser: nothing is sent, the user copies it themselves.

## Consequences

- In developer tools, console lines show the journal wrapper as their origin. The call stack stays exact.
- Observing sends, keeping the arguments of a frame or widening the console capture reopens this decision with the owner.
- A new BetterChatango connection line joins the closed list with its `inject.js` reference.
