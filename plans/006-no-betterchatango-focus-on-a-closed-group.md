# Plan 006: Showing a group whose connection is closed never starts BetterChatango's own join

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report. Do not improvise. When done, update the status row for this plan
> in `plans/README.md`, unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 0b829ea..HEAD -- src/bridge/live-bridge.js tests/live_ui.js docs/betterchatango-protocol.md`
> If any of these files changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding. On a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plans/001-fail-live-ui-on-a-bridge-operation-that-throws.md (recommended: it guards the bridge changes)
- **Category**: bug
- **Planned at**: commit `0b829ea`, 2026-11-13

## Why this matters

Nightango opens every Chatango connection through its bridge, so that one
socket exists per group and each attempt is tracked. When the user clicks a
group in the sidebar, the bridge tells BetterChatango which group is in front
(`client.setFocus`). But BetterChatango's `setFocus`, given a group whose
socket is not open, does something else: it fills its own join form and
submits it. That handler posts to `vissle.me/chatango/group` and calls
`client.connect` on its own, outside the bridge. So clicking a group that
shows "Reconnecting..." can open a second socket next to the bridge's retry
(messages then arrive twice), and sends a vissle call the closed list of HTTP
calls only allows at sign-in.

After this plan the bridge does not call `setFocus` on a closed group. It
remembers the group and focuses it when its reconnection succeeds.

## Current state

- `src/bridge/live-bridge.js:993`: the focus, with no check on the socket:

  ```js
  focus: function (gid) { try { C.setFocus({ group: gid }); } catch (e) { warn(e); } },
  ```

- `src/app/inbox.js:68`: called on every navigation to a group:

  ```js
  if (LIVE && route.view === 'group' && route.id) liveBridge.focus(route.id);
  ```

- `src/bridge/live-bridge.js:1017-1036`: the two places that focus after a
  connection succeeded:

  ```js
  join: function (gid) {
    delete left[gid];
    try { if (SB && SB.renderGroup) SB.renderGroup({ group: gid, header: gid, recent: true }); } catch (e) { warn(e); }
    connectThen(gid, function () { C.setFocus({ group: gid }); });
  },
  ...
  reconnect: function (gid, background) {
    connectThen(gid, function () { if (gid !== 'private_message' && !background) C.setFocus({ group: gid, reload: true }); });
  },
  ```

  `background` is true when the group is not shown at the moment the retry
  starts (`src/app/reconnection.js:53-55`).

- `src/bridge/live-bridge.js:432-436`: the helper that tells whether a
  connection can carry a frame:

  ```js
  function opened(gid) {
    var c = gid === 'private_message' ? C.private : C.groups && C.groups[gid];
    return !!(c && c.socket && c.socket.readyState === 1);
  }
  function pmOpen() { return opened('private_message'); }
  ```

- `reference/torch/inject.js` is a read-only copy of BetterChatango's code
  (never edit it, never load it). What `setFocus` does on a closed group:

  ```js
  // reference/torch/inject.js:5987-5992
  } else if ((!document.querySelector(".application-sidebar").getAttribute("data-disable") || data.force) && data.group in this.groups) {
    if (this.groups[data.group].socket.readyState != this.groups[data.group].socket.OPEN) {
      document.querySelector('[data-form="join"]').querySelector('[name="group"]').value = data.group
      document.querySelector('[data-form="join"]').querySelector('[type="submit"]').click()
      return
    }
  ```

  and what the join form does (`reference/torch/inject.js:10965-11000`):
  `client.setConnect({enable: true, ...})`, then
  ``fetch(`${torch.domain}/chatango/group`, { method: "POST", ... })``, then
  `client.connect(group)`.

- `docs/betterchatango-protocol.md:85` already records the same hazard for
  another entry point: "this Reconnect calls `client.connect` outside the
  bridge, which opened a second socket when an automatic retry followed."
  Line 153 lists `POST vissle.me/chatango/group` as a sign-in call only.

- In `tests/live_ui.js`, the fake BetterChatango client records each focus
  (line 167): `setFocus(o) { calls.push(['focus', o.group]); }`. It does not
  reproduce the join form. The block that tests a closed connection is at
  lines 1018-1049. It closes the socket of the group `test`
  (`C.groups.test.socket.readyState = 3;`, line 1039) and reopens it
  (`C.groups.test.socket.readyState = 1;`, line 1042) right before its
  `step(...)`.

- Conventions that apply (`docs/coding-conventions.md`):
  - Code in `src/` is ES5: `var`, `function`, no arrow functions.
  - A comment exists only for a trap that would make someone "fix" the code
    by mistake. One line, English, no em-dash and no semicolon in its text.
  - Every new test is seen failing before the fix.

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

**In scope** (the only files you should modify):
- `src/bridge/live-bridge.js`
- `tests/live_ui.js`
- `docs/betterchatango-protocol.md` (one bullet added after line 85)

**Out of scope** (do NOT touch):
- `src/app/inbox.js` and `src/app/reconnection.js`: the callers stay as
  they are.
- The fake `setFocus` of `tests/live_ui.js`: do not make it simulate the
  join form. The test asserts that the call is not made.
- `reference/torch/`.
- `CHANGELOG.md` and `@version`.

## Git workflow

- Branch: `fix/no-focus-on-a-closed-group`
- One commit. Conventional Commits with a body wrapped at 72 columns.
  Suggested subject:
  `fix(bridge): leave the BetterChatango focus alone on a closed group`.
- No `Co-Authored-By` line and no generated footer.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Make the test fail first

In `tests/live_ui.js`, find these two consecutive lines (1042-1043):

```js
  C.groups.test.socket.readyState = 1;
  step('pm, upload, block, status and group message on a connection that is not open send nothing, keep the text and the state, and say so',
```

Insert this block between the line before them and the first of them, so the
socket of `test` is still closed while it runs:

```js
  /* Focus on a closed group: BetterChatango would start its own join there (inject.js:5988) */
  const focusFrom = calls.length;
  click(byText('.tc-nav', 'edits')); await wait(50);
  click(byText('.tc-nav', 'test')); await wait(50);
  const closedFocus = calls.slice(focusFrom).filter(c => c[0] === 'focus').map(c => c[1]);
  step('showing a group whose connection is not open leaves the BetterChatango focus alone', closedFocus.indexOf('test') < 0 && closedFocus.indexOf('edits') >= 0, closedFocus);
```

**Verify**: `pnpm test live_ui` → a line starting with
`FAIL showing a group whose connection is not open leaves the BetterChatango focus alone -> ["edits","test"]`.
This is the expected red state (observed while writing this plan). No other
step should fail.

### Step 2: Guard the focus and remember it

In `src/bridge/live-bridge.js`:

1. Right after the line `function pmOpen() { return opened('private_message'); }`
   (line 436), add:

   ```js
   // Group the user opened while its socket was closed: its reconnection focuses it even when started in the background.
   var pendingFocus = null;
   function focusGroup(gid, reload) {
     pendingFocus = null;
     C.setFocus(reload ? { group: gid, reload: true } : { group: gid });
   }
   ```

2. Replace the `focus` method (line 993) with:

   ```js
   focus: function (gid) {
     // On a closed socket BetterChatango's setFocus submits its own join form (inject.js:5988): the follow-up of the reconnection focuses instead.
     if (!opened(gid)) { pendingFocus = gid; return; }
     try { focusGroup(gid, false); } catch (e) { warn(e); }
   },
   ```

3. In `join`, replace `connectThen(gid, function () { C.setFocus({ group: gid }); });`
   with `connectThen(gid, function () { focusGroup(gid, false); });`.

4. In `reconnect`, replace the body with:

   ```js
   connectThen(gid, function () { if (gid !== 'private_message' && (!background || pendingFocus === gid)) focusGroup(gid, true); });
   ```

`connectThen` already wraps its follow-up in a `try`, so `focusGroup` needs
none there.

**Verify**: `pnpm test live_ui` → the step of Step 1 starts with `ok`, and
the summary says `pass  live_ui`. The reconnection steps near the end of the
suite (`automatic reconnect after a server drop, then after a failed attempt`,
`leaving a group during a reconnect closes its socket, keeps its later frames out of the state and the BetterChatango focus off it`)
must still start with `ok`. (Observed while writing this plan: with exactly
these changes the whole suite passes.)

### Step 3: Record it in the protocol notes

In `docs/betterchatango-protocol.md`, add this bullet right after the bullet
of line 85 (the one that starts with
`- BetterChatango never reconnects on its own.`):

```
- `client.setFocus` on a group whose socket is not open submits BetterChatango's join form (`inject.js:5987-5992`), whose handler posts to `vissle /chatango/group` and calls `client.connect` outside the bridge (`inject.js:10965-11000`). The bridge therefore never focuses a closed group: it remembers the group the user opened and focuses it when its reconnection succeeds, even one started in the background.
```

If plan 007 has landed, its own bullet is also after line 85: put this one
before it.

**Verify**: `grep -c "never focuses a closed group" docs/betterchatango-protocol.md`
prints `1`, and `pnpm test` exits 0 with every summary line `pass`.

## Test plan

- One new `live_ui` step (Step 1), inside the existing closed-connection
  block, modelled on the way that block already closes and reopens the
  socket of `test`.
- Not tested here, on purpose: the focus applied after a background
  reconnection (`pendingFocus === gid`). It needs a reconnection with a
  navigation in the middle. The existing reconnection steps cover the
  unchanged cases and must stay green.

## Done criteria

- [ ] `pnpm test` exits 0 and every summary line starts with `pass`
- [ ] `grep -c "leaves the BetterChatango focus alone" tests/live_ui.js` prints `1`
- [ ] `grep -c "C.setFocus(" src/bridge/live-bridge.js` prints `1` (only inside `focusGroup`)
- [ ] `git status --short` lists only the three in-scope files (plus `plans/README.md`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at the locations in "Current state" does not match the excerpts.
- `grep -n "C.setFocus(" src/bridge/live-bridge.js` shows more than the
  three call sites quoted in "Current state" before you start: another
  caller exists that this plan did not see.
- Step 1 produces more than the one `FAIL` described, or none.
- After Step 2, a reconnection step of `live_ui` fails.

## Maintenance notes

- Every focus of a group now goes through `focusGroup`. A new caller of
  `C.setFocus` for a group must check `opened(gid)` first or go through
  `liveBridge.focus`.
- The group stays without BetterChatango focus while its socket is closed.
  That is intended: nothing can be sent there anyway, and the connection
  banner says so.
- Related, not solved here: a group shown in the side pane or the floating
  window is never focused at all. Plan 011 deals with what that breaks
  (older messages and the member list).
- Reviewer: check that `reconnect` still does nothing for
  `private_message`, and that a group left during an attempt is still not
  focused (`connectThen` tests `left[gid]`).
- Suggested `CHANGELOG.md` line, under `### Fixed`: "Opening a group while
  it reconnects no longer risks a second connection, which showed its
  messages twice."
