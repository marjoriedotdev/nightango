# Plan 012: Find out what a group shown without BetterChatango's focus loses, then fix what is confirmed

> **Executor instructions**: This is an investigation plan. Part A needs a
> real Chatango session in a browser with Nightango installed: an executor
> without one stops after reading it and reports "needs a real session".
> Part B is written only for the outcomes Part A can have. Do not start
> Part B before Part A is recorded in this file. If anything in the "STOP
> conditions" section occurs, stop and report. Do not improvise. When done,
> update the status row for this plan in `plans/README.md`, unless a
> reviewer dispatched you and told you they maintain the index.
>
> **Drift check (run first)**: `git diff --stat 0b829ea..HEAD -- src/bridge/live-bridge.js src/app/inbox.js src/app/live-ops.js`
> If any of these files changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding. On a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S for Part A (observation), M for Part B
- **Risk**: MED (the meaning of a frame argument is only known from BetterChatango's code)
- **Depends on**: plans/006-no-betterchatango-focus-on-a-closed-group.md (same code area, land it first)
- **Category**: bug
- **Planned at**: commit `0b829ea`, 2026-11-13

## Why this matters

BetterChatango has one "focused" group at a time, and does two things only
for that group: it asks Chatango for the member list, and it keeps the
counter it sends when asking for older messages. Nightango 0.34.0 can show a
second group beside the main one, and a third in a floating window. Those
groups are shown without ever being BetterChatango's focus. Reading the code
says they should have two problems: older messages cannot be paged (the same
page is asked again and again, possibly in a loop), and their member list
never loads. The same may hold for the first group shown after sign-in. None
of this was observed on a real session: the code path is certain, the
server's answers are not. This plan observes first.

## Current state

- `src/bridge/live-bridge.js:1037-1041`: the request for older messages
  reads BetterChatango's counter:

  ```js
  loadMore: function (gid) {
    var g = C.groups && C.groups[gid];
    if (g && g.load === -1) return 'done';
    return send(gid, 'get_more:20:' + (g && g.load || 0), 'Earlier messages could not be loaded.') ? 'sent' : 'failed';
  },
  ```

- `reference/torch/inject.js` is a read-only copy of BetterChatango's code
  (never edit it, never load it). It maintains that counter only for its
  focused group:

  ```js
  // reference/torch/inject.js:3280-3287
  gotmore: function(client, socket, room, data) {
    if (client.focus == room) {
      if (client.groups[room].load != -1) {
        client.groups[room].load = parseInt(data[0]) + 1
        client.groups[room].ready = true
      }
    }
  },
  ```

  Each `setFocus` resets it (`inject.js:6171`: `this.groups[data.group].load = 0`),
  and `nomore` sets it to `-1` for any group (`inject.js:3273-3278`).

- The member list is requested only for the focused group
  (`inject.js:3228-3233` on `inited`, `inject.js:6182` on `setFocus`):
  `socket.send("g_participants:start\r\n")`. No "stop" frame exists in that
  file.

- `src/bridge/live-bridge.js:159-160`: what the bridge does with the
  answers: `case 'nomore': emit({ op: 'histEnd', gid: room }); break;` and
  `case 'gotmore': emit({ op: 'moreLoaded', gid: room }); break;`. It does
  not read `data[0]`.

- `src/app/live-ops.js:207`: `moreLoaded` only clears the "loading" flag,
  after which the view may ask again at once if its top sentinel is still
  visible (`src/views/group.js:189`, `src/core/ui.js:122-131`).
  Duplicates are dropped on arrival (`src/app/live-ops.js:40`), so a page
  of duplicates adds nothing and leaves the sentinel where it is.

- `src/app/inbox.js:76-96`: `openSplit` and `openPip` never call
  `liveBridge.focus`. `src/app/live-ops.js:117`: after sign-in, the first
  group is focused once, 50 ms after its first operation, which does
  nothing if BetterChatango has not registered the group yet
  (`inject.js:5987`: `data.group in this.groups`).

- `src/views/members.js:12` and `src/views/group.js:229` show "Loading
  members" and wait for the online count until `g.membersLoaded`, which
  only a `g_participants` answer sets (`src/app/live-ops.js:174`).

- `docs/betterchatango-protocol.md:471` lists the frame as
  ``get_more:20:{client.groups[g].load}`` with BetterChatango as its source.
  Rule 2 of the project (ADR-0002): every frame sent has a source in
  BetterChatango's code, a reference library or the official client.

- The existing test only checks that the counter value is sent
  (`tests/live_ui.js:733`): `frame('get_more:').pop() === 'get_more:20:5'`.

## Part A: Observation on a real session

Who: the owner, or an agent driving a real browser with Nightango installed
and signed in. Tool: the browser's developer tools, Network tab, filter "WS",
select the socket of the group, "Messages" view. Record the answers in the
table at the end of this part, in this file.

1. **Older messages in the side pane.** Open group X in the main pane.
   Open another busy group Y beside it ("Open beside" in its menu). In Y,
   scroll to the top twice, waiting for each page.
   - Write down each outgoing `get_more:20:N` frame of Y's socket and the
     `gotmore:M` frame that answers it.
   - Write down whether the second page shows older messages than the
     first, or nothing new.
   - Write down whether `get_more` frames keep going out on their own while
     the pane rests at the top (a loop).
2. **Same in the main pane**, for comparison: note the `N` of the first two
   `get_more` frames of X and the `M` of their answers.
3. **Member list in the side pane.** In Y (still beside), type `@` in the
   composer: do members who have no recent message in Y appear? Is a
   `g_participants:start` frame present in Y's socket after its `inited`?
4. **First group after sign-in.** Reload the page, sign in, do not click
   anything. Does the member column of the group shown first fill, or stay
   on "Loading members"? Is a `g_participants:start` frame present in its
   socket?

| # | Observation | Result (fill in) |
|---|---|---|
| 1a | `get_more` / `gotmore` pairs in the side pane | |
| 1b | Second page shows older messages (yes / no) | |
| 1c | `get_more` loops at rest (yes / no) | |
| 2 | `get_more` / `gotmore` pairs in the main pane | |
| 3 | `g_participants:start` sent for the side pane (yes / no) | |
| 4 | Member list of the first group after sign-in (fills / stays loading) | |

## Part B: Fixes, only for confirmed problems

### B1, if 1b is "no" or 1c is "yes": keep the page index in the bridge

- In `src/bridge/live-bridge.js`, keep a table `moreIndex` (group id to
  number). In the `gotmore` case, set it to `parseInt(data[0], 10) + 1`
  for the room, whatever BetterChatango's focus is. This is the same
  arithmetic as `inject.js:3283`, which is the source of the frame. Reset
  the entry when the group's `ok` frame arrives (a new connection).
- In `loadMore`, send `moreIndex[gid]` when it is set, and fall back to
  `C.groups[gid].load` otherwise (first request of a connection).
- Stop the loop whatever the server does: in `src/app/live-ops.js`, when a
  history page adds no message to the group, do not clear `loadingMore`
  through `moreLoaded` alone. Mark the group so the view asks again only
  after a user scroll. Keep this small: one boolean on the group, cleared
  on scroll.
- Test in `tests/live_ui.js`, seen failing first: feed two `gotmore`
  frames to a group that is not the fake client's focus and assert the
  second `get_more` frame carries the next index. Model: the step at
  line 733.
- STOP if observation 2 shows that the main pane's first `N` is not what
  `C.groups[gid].load` holds at that moment: the fallback is then wrong and
  the design needs the owner.

### B2, if 3 is "no": ask for the member list of a pane group

- Add `requestMembers: function (gid) { return send(gid, 'g_participants:start'); }`
  to the bridge. Source of the frame: `inject.js:3232` and `inject.js:6182`.
  Add it to `docs/betterchatango-protocol.md` next to the `get_more` line,
  with that source.
- Call it from `openSplit` and `openPip` in `src/app/inbox.js` for a group
  route in live, when `!stateRef.current.groups[route.id].membersLoaded`.
- Test in `tests/live_ui.js`, seen failing first: open a group beside and
  assert the frame went out on its socket.

### B3, if 4 is "stays loading": focus the first group when it is ready

- In `src/app/live-ops.js`, replace the 50 ms timer of the `group` case
  (line 117) by the same focus done when the group's `inited` operation
  arrives and it is still the route's group. Plan 006 makes
  `liveBridge.focus` safe on a socket that is not open.
- STOP if the `inited` operation is not emitted for groups connected by
  BetterChatango's own startup: report how the bridge learns they are
  ready.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Install | `pnpm install --frozen-lockfile` | exit 0 |
| One suite | `pnpm test live_ui` | builds, then `pass  live_ui (N ok)`, exit 0, about 90 s |
| All suites | `pnpm test` | every line of `== summary` starts with `pass`, exit 0, about 2.5 min |

`pnpm` only. The runner judges a suite on its output too: a line starting
with `FAIL` or `CRASH`, or `ERRORS:` followed by anything but `none`, is a
failure.

## Scope

**In scope** for Part A: this file only (the table).

**In scope** for Part B (only the sub-parts whose condition is met):
- `src/bridge/live-bridge.js`
- `src/app/live-ops.js`
- `src/app/inbox.js`
- `tests/live_ui.js`
- `docs/betterchatango-protocol.md`

**Out of scope** (do NOT touch):
- Moving BetterChatango's focus onto a side pane or the floating window.
  Its `setFocus` has many side effects (it resets the counter, reloads,
  moves its own interface). The fixes above avoid it on purpose.
- `reference/torch/`.
- `CHANGELOG.md` and `@version`.

## Git workflow

- Branch: `fix/groups-without-betterchatango-focus`
- One commit per sub-part of Part B that is done. Conventional Commits
  with a body wrapped at 72 columns that quotes the observation it rests
  on. Example subject: `fix(bridge): page the history of a group beside`.
- No `Co-Authored-By` line and no generated footer.
- Do NOT push or open a PR unless the operator instructed it.

## Done criteria

- [ ] The table of Part A is filled in, in this file, with the date and the Chatango group names left out
- [ ] For each sub-part of Part B whose condition is met: its test exists, was seen failing, and `pnpm test` exits 0 with every summary line `pass`
- [ ] For each sub-part whose condition is not met: one line in "Maintenance notes" says so
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- You have no real session: report "Part A needs a real session" and set
  the status to BLOCKED with that reason.
- An observation does not fit any of the cases above (for example
  `gotmore` carries no number).
- A fix would need a frame that is not quoted in this plan with its
  source.

## Maintenance notes

- Why not simply focus every shown group: BetterChatango has one focus,
  and Nightango now shows up to three groups. The bridge has to own what
  it needs per group instead of borrowing BetterChatango's per-focus
  state. The page index and the member request are the two known cases.
- When the reference copy of BetterChatango is refreshed, check that
  `gotmore` still carries the page index in `data[0]`.
- Reviewer: every new frame must have its `inject.js` reference in
  `docs/betterchatango-protocol.md` (ADR-0002).
