# Plan 017: A group whose startup connection never opens shows as disconnected, with Try again

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report. Do not improvise. When done, update the status row for this plan
> in `plans/README.md`, unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 0b829ea..HEAD -- src/bridge/live-bridge.js src/app/reconnection.js tests/live_ui.js`
> If any of these files changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding. Plans
> 006, 007 and 008 edit other functions of `src/bridge/live-bridge.js`:
> that is expected. A mismatch on a quoted excerpt is a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: MED (connection state drives the banner, the retries and the session-lost screen)
- **Depends on**: plans/001-fail-live-ui-on-a-bridge-operation-that-throws.md (recommended)
- **Category**: bug
- **Planned at**: commit `0b829ea`, 2026-11-13

## Why this matters

At sign-in, BetterChatango connects the user's groups itself, and when one of
those connections fails it only writes a line in its console. Nightango
creates each group in its state as "open" before any socket exists, and
learns the real state by watching the sockets BetterChatango registers. A
group whose first connection never succeeds is never registered, so it is
never watched, and it stays "open" for the whole session: no banner, a
message log that waits forever, a composer that answers "Try again once
you're reconnected" with nothing to click. Seen while writing this plan, in a
disposable clone: such a group shows no connection banner at all. After this
plan the bridge notices that an expected group never appeared, reports it
closed, and the existing banner offers "Try again". It starts no automatic
retries, which is what the code already intends for a failure at startup.

## Current state

- `src/app/live-state.js:172`: a live group is created open:

  ```js
  conn: 'open', historyDone: false, historyCapped: false, inited: false, membersLoaded: false, loadingMore: false,
  ```

- `src/bridge/live-bridge.js:340-361`: the watcher. It only looks at
  groups BetterChatango has registered (`C.groups`) or that it has already
  seen (`connState`):

  ```js
  /* Connection state: BetterChatango publishes no event, so we watch its sockets. */
  var connState = {}, pmState = null, left = {}, attempts = {};
  function watchConnections() {
    setInterval(function () {
      try {
        var groups = C.groups || {};
        var seen = {};
        Object.keys(groups).forEach(function (gid) {
          if (gid === ENV) return;
          seen[gid] = true;
          var st = stateOf(groups[gid] && groups[gid].socket);
          if (connState[gid] !== st) { connState[gid] = st; if (!left[gid]) { note(connName(gid) + ' is ' + st); emit({ op: 'conn', gid: gid, state: st }); } }
        });
        Object.keys(connState).forEach(function (gid) {
          if (!seen[gid] && connState[gid] !== 'closed') { connState[gid] = 'closed'; if (!left[gid]) { note(connName(gid) + ' was removed by BetterChatango'); emit({ op: 'conn', gid: gid, state: 'closed' }); } }
        });
        var pm = C.private && C.private.socket;
        var pst = pm ? stateOf(pm) : 'closed';
        if (pmState !== pst) { pmState = pst; note(connName('private_message') + ' is ' + pst); emit({ op: 'conn', gid: 'private_message', state: pst }); }
      } catch (e) { warn(e); }
    }, 2000);
  }
  // BetterChatango times out only the group it recorded last in cache.connecting (inject.js:5699-5704): each attempt gets the same 10 s here.
  var CONNECT_TIMEOUT = 10000;
  ```

  `attempts[gid]` is set while the bridge itself is connecting a group
  (join, reconnect). `left[gid]` is set when the user left the group.

- `src/bridge/live-bridge.js:903-909`: how the bridge learns that a group
  is in the user's list: it wraps BetterChatango's `sidebar.renderGroup`.
  `data.hidden` is true for a group that is listed but not joined:

  ```js
  SB.renderGroup = function (data) {
    try { if (data && data.group && data.group !== ENV) emit({ op: 'group', id: lower(data.group), title: data.header ? String(data.header) : '', hidden: !!data.hidden, owned: data.recent === false }); } catch (e) { warn(e); }
    return renderGroup(data);
  };
  ```

- `reference/torch/inject.js:1219-1229` (read-only copy of BetterChatango,
  never edit it): the startup connections. A group is registered in
  `client.groups` only when its `ok` frame arrives (`inject.js:3185`):

  ```js
  groups.reverse().forEach(x => {
    sidebar.renderGroup(x)
  })
  official.concat(connect).forEach(x => {
    client.connect(x).then(socket => {
      ...
    }).catch(error => {
      console.log(error)
  ```

- `src/app/reconnection.js:102-107`: what a `conn` operation does to the
  automatic retries. The comment states the intent for startup failures:

  ```js
  function follow(op) {
    // Only an open connection that closes starts the sequence: a failure at startup or a left group does not.
    var was = connOf(stateRef.current, op.gid);
    if (op.state === 'open') stopRetry(op.gid);
    else if (op.state === 'closed' && (was === 'open' || was === 'connecting' && retries.current[op.gid])) scheduleRetry(op.gid, was === 'open');
  }
  ```

  Because a group is created `open`, a `closed` operation for a group that
  never connected would read `was === 'open'` and start three retries,
  against that intent. The operation therefore has to say that the group
  never connected.

- `src/app/live-ops.js:257-266`: the `conn` operation sets `g.conn`, and
  the connection banner of the group view reads it. A closed group without
  a retry sequence shows the banner with "Try again" (as the existing step
  at `tests/live_ui.js:713-719` checks for a loss while the page is
  hidden).

- In `tests/live_ui.js`: `SB.renderGroup({ group: 'edits', header: 'Edits' })`
  (line 578) is how a group enters the list. `connBanner()` (line 702)
  reads the banner: `{ phase, text, buttons }` or `null`. `calls` records
  `['connect', gid, ...]` for each connection the bridge asks for.
  `menuItem(label)` finds a menu entry. Lines 2301-2303 show how a group is
  left through the interface. The suite uses real time: its longest
  existing wait is 13.5 s.

- Conventions that apply (`docs/coding-conventions.md`):
  - Code in `src/` is ES5: `var`, `function`, no arrow functions.
  - A comment exists only for a trap that would make someone "fix" the code
    by mistake. One line, English, no em-dash and no semicolon in its text.
  - Every new test is seen failing before the fix. ADR-0009 names "loader
    startup" and "presence" among the behaviours that get a test: a
    connection state is of that kind.
  - The whole `tests/live_ui.js` scenario is one function: a new `const`
    must not reuse a name declared anywhere else in it.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Install | `pnpm install --frozen-lockfile` | exit 0 |
| One suite | `pnpm test live_ui` | builds, then `pass  live_ui (N ok)`, exit 0, about 105 s after this plan |
| All suites | `pnpm test` | every line of `== summary` starts with `pass`, exit 0 |

`pnpm` only. The runner judges a suite on its output too: a line starting
with `FAIL` or `CRASH`, or `ERRORS:` followed by anything but `none`, is a
failure.

## Scope

**In scope** (the only files you should modify):
- `src/bridge/live-bridge.js` (the watcher and the `renderGroup` wrapper)
- `src/app/reconnection.js` (one condition of `follow`)
- `tests/live_ui.js`

**Out of scope** (do NOT touch):
- `src/app/live-state.js`: the group keeps starting as `open`. Starting it
  as `connecting` would show a banner on every group at each sign-in.
- Automatic retries for a group that never connected: not added, on
  purpose (the comment of `follow`).
- A first join through the bridge that fails: it goes through another
  path (`attempts`), not changed here.
- `reference/torch/`.
- `CHANGELOG.md` and `@version`.

## Git workflow

- Branch: `fix/group-that-never-connected`
- One commit. Conventional Commits with a body wrapped at 72 columns.
  Suggested subject:
  `fix(bridge): report a group that never connected at startup as closed`.
- No `Co-Authored-By` line and no generated footer.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Make the test fail first

In `tests/live_ui.js`, find the comment line
`/* Session loss: signed in elsewhere, offline, connection lost, session expired */`
(line 2316). Insert this block right before it. If plan 005 has landed, its
own block is also right before that comment: put this one before the block
of plan 005 or after it, either works.

```js
  /* A group BetterChatango never connects at startup: disconnected once the connection delay has passed, with Try again and no automatic attempt */
  SB.renderGroup({ group: 'lagroom', header: 'Lagroom' });
  await wait(12500);
  click(byText('.tc-nav', 'lagroom')); await wait(50);
  const neverUp = { banner: connBanner(), connects: calls.filter(c => c[0] === 'connect' && c[1] === 'lagroom').length };
  step('a group whose startup connection never opens shows as disconnected with Try again, without an automatic attempt',
    !!neverUp.banner && neverUp.banner.buttons.includes('Try again') && neverUp.connects === 0, neverUp);
  click($('button[aria-label="Group options"]')); await wait(30);
  click(menuItem('Leave group')); await wait(30);
  click(byText('.dialog-foot button', 'Leave group')); await wait(50);
  click(byText('.tc-nav', 'Mentions')); await wait(50);

```

The wait of 12.5 s is the connection delay of the bridge (10 s) plus one
poll of the watcher (2 s). The last four lines leave the group and go back
to the Mentions page, where the scenario was, so that the session-loss steps
after it see the same groups as before.

**Verify**: `pnpm test live_ui` → a line starting with
`FAIL a group whose startup connection never opens shows as disconnected with Try again, without an automatic attempt`
whose detail is `{"banner":null,"connects":0}`. This is the expected red
state (observed while writing this plan). No other step should fail.

### Step 2: Report an expected group that never appeared

In `src/bridge/live-bridge.js`:

1. Right after the line
   `var connState = {}, pmState = null, left = {}, attempts = {};`, add:

   ```js
   // Groups BetterChatango showed in its list and when: one it never registers has failed to connect at startup, which it only logs.
   var expected = {};
   ```

2. In `watchConnections`, right before the line
   `var pm = C.private && C.private.socket;`, add:

   ```js
   Object.keys(expected).forEach(function (gid) {
     if (seen[gid] || connState[gid] || left[gid]) { delete expected[gid]; return; }
     if (attempts[gid] || Date.now() - expected[gid] < CONNECT_TIMEOUT) return;
     delete expected[gid];
     connState[gid] = 'closed';
     note(connName(gid) + ' did not connect at startup');
     emit({ op: 'conn', gid: gid, state: 'closed', never: true });
   });
   ```

3. In the `SB.renderGroup` wrapper, add this line right before the
   existing `try { if (data && data.group && data.group !== ENV) emit({ op: 'group', ...`
   line:

   ```js
   try { if (data && data.group && data.group !== ENV && !data.hidden) expected[lower(data.group)] = Date.now(); } catch (e) { warn(e); }
   ```

### Step 3: Keep the retries off for such a group

In `src/app/reconnection.js`, in `follow`, replace

```js
else if (op.state === 'closed' && (was === 'open' || was === 'connecting' && retries.current[op.gid])) scheduleRetry(op.gid, was === 'open');
```

with

```js
else if (op.state === 'closed' && !op.never && (was === 'open' || was === 'connecting' && retries.current[op.gid])) scheduleRetry(op.gid, was === 'open');
```

**Verify**: `pnpm test live_ui` → the step of Step 1 starts with `ok`, and
the summary says `pass  live_ui`. The reconnection steps must still start
with `ok`, in particular
`connection banner goes from reconnecting to reconnected, then away` and
`automatic reconnect after a server drop, then after a failed attempt`.
(Observed while writing this plan: with exactly these changes the whole
suite passes.) Then `pnpm test` → every line of `== summary` starts with
`pass`, exit 0.

## Test plan

- One new `live_ui` step (Step 1): a group that enters the list and never
  gets a socket. It asserts the banner with "Try again" and that the
  bridge started no connection on its own.
- Pattern: the hidden-tab loss at `tests/live_ui.js:713-719` for reading
  the banner, and lines 2301-2303 for leaving a group.
- Cost: the step adds 12.5 s of real time to the suite.

## Done criteria

- [ ] `pnpm test` exits 0 and every summary line starts with `pass`
- [ ] `grep -c "startup connection never opens" tests/live_ui.js` prints `1`
- [ ] `grep -c "never: true" src/bridge/live-bridge.js` prints `1`, and `grep -c "!op.never" src/app/reconnection.js` prints `1`
- [ ] `git status --short` lists only the three in-scope files (plus `plans/README.md`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The watcher or `follow` does not match the excerpts.
- Step 1 crashes with `SyntaxError: Identifier ... has already been declared`:
  a name of the new block is taken. Rename it in the block, do not rename
  existing code. (`ghost` is taken: it was the first name tried.)
- Step 1 does not produce the `FAIL` with `"banner":null`.
- After Step 3, a reconnection or session-loss step fails. Do not add a
  flag to the group in the state to work around it: that was tried while
  writing this plan (a `seenOpen` flag set on the first `open` operation)
  and it broke the step
  `connection banner goes from reconnecting to reconnected, then away`,
  because the first `open` operation can arrive before the group is in the
  state.

## Maintenance notes

- "Try again" then goes through the bridge's own reconnect, like any
  closed group, and its failure follows the normal rules.
- A group denied by Chatango at startup (banned, full) also ends up
  closed with "Try again". The refusal text BetterChatango showed for it,
  if any, already reached the user as a toast.
- The 10 s delay starts when BetterChatango lists the group, which is
  right before it connects it. A group that needs longer than 10 s plus a
  poll to answer `ok` is reported closed, then open again when it
  registers: the banner shows "Reconnected" briefly. Not seen in the
  trial, noted for the owner.
- Suggested `CHANGELOG.md` line, under `### Fixed`: "A group that failed
  to connect when you signed in now says so and offers Try again."
