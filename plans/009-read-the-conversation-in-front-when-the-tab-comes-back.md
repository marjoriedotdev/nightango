# Plan 009: Coming back to the tab marks the conversation in front as read

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report. Do not improvise. When done, update the status row for this plan
> in `plans/README.md`, unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 0b829ea..HEAD -- src/app/inbox.js src/app/live-ops.js tests/live_ui.js`
> If any of these files changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding. On a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plans/001-fail-live-ui-on-a-bridge-operation-that-throws.md (recommended)
- **Category**: bug
- **Planned at**: commit `0b829ea`, 2026-11-13

## Why this matters

While the browser tab is hidden, a message that arrives in the conversation
shown in it counts as unread: that is intended, the user is not looking. But
when the user comes back to the tab, nothing marks that conversation read.
The sidebar badge and the `(n)` of the tab title stay while the user is
reading the messages, until they navigate somewhere else and back. For a
private message, the record also stays unread in BetterChatango's history
database, so it comes back as unread after a reload. After this plan, the
tab becoming visible reads the conversations it shows, the same way a
navigation to them does.

## Current state

- `src/core/selectors.js:165-167`: a conversation is "in view" only while
  the tab is visible (the floating window always counts):

  ```js
  function isInView(state, view, id) {
    return isTarget(state.pip, view, id) || ((isTarget(state.route, view, id) || isTarget(state.split, view, id)) && document.visibilityState === 'visible');
  }
  ```

- `src/app/inbox.js:155-170`: a group message received out of view
  counts:

  ```js
  var focused = isGroupInView(s0, gid);
  update(function (d) {
    ...
    if (msg.kind === 'msg' && !focused) { g.unread += 1; if (mention) g.mentions += 1; }
    if (focused) g.lastReadTs = readThrough(g);
  });
  ```

- `src/app/inbox.js:32-37`: what a navigation does to the conversation it
  opens. `d` is a draft of the state:

  ```js
  function opened(d, route) {
    var r = Object.assign({}, route);
    if (r.view === 'group' && d.groups[r.id]) { var g = d.groups[r.id]; r.markerTs = g.lastReadTs; g.lastReadTs = readThrough(g); g.unread = 0; g.mentions = 0; }
    if (r.view === 'dm' && r.id && d.dms[r.id]) { d.dms[r.id].lastReadTs = Date.now(); d.dms[r.id].closed = false; }
    return r;
  }
  ```

  `r.markerTs` is the previous read position: the message log draws its
  "New messages" line there.

- `src/app/inbox.js:67`: a navigation to a PM also marks it read in the
  archive: `if (route.view === 'dm' && route.id) readPm(pmArchive.current, update, route.id);`.
  `readPm` is defined in `src/app/pm.js:55`. PM unread counts are only
  ever read back from the archive (ADR-0012): never write `unread` of a
  conversation directly.

- `src/app/inbox.js:199`: what `useInbox` returns:

  ```js
  return { pmArchive: pmArchive, nav: nav, openSplit: openSplit, closeSplit: closeSplit, openPip: openPip, notify: notify, notifyPm: notifyPm, receiveGroup: receiveGroup, receiveDm: receiveDm };
  ```

- `src/bridge/live-bridge.js:862`: the bridge emits an operation when the
  tab becomes visible:
  `document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') emit({ op: 'visible' }); });`

- `src/app/live-ops.js:270`: its handler. `k.inbox` is the object returned
  by `useInbox` (`src/app/live-ops.js:64`):

  ```js
  case 'visible': if (navigator.onLine) reconnection.reconnectClosed(); pms.refreshPresence(true); break;
  ```

- `src/app/root.js:187-193`: the tab title shows unread PMs plus group
  mentions as `(n) `.

- `tests/live_ui.js:714-716` shows how the suite hides the tab:

  ```js
  Object.defineProperty(d, 'visibilityState', { configurable: true, get: () => 'hidden' });
  ...
  delete d.visibilityState;
  ```

  and line 1006 how it signals a change:
  `d.dispatchEvent(new w.Event('visibilitychange'));`. At line 702 the
  group `test` is the one shown.

- Conventions that apply (`docs/coding-conventions.md`):
  - Code in `src/` is ES5: `var`, `function`, no arrow functions.
  - A comment exists only for a trap that would make someone "fix" the code
    by mistake. A function may have a JSDoc summary like its neighbours.
  - "The state changes only through `update`, on a copy-on-write draft."
  - Every new test is seen failing before the fix.
  - The whole `tests/live_ui.js` scenario is one function: a new `const`
    must not reuse a name declared anywhere else in it.

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
- `src/app/inbox.js`
- `src/app/live-ops.js` (the `visible` case only)
- `tests/live_ui.js`

**Out of scope** (do NOT touch):
- `isInView` and the counting while hidden: unchanged on purpose.
- The prototype (simulated data): it has no `visible` operation. Only live
  is fixed here.
- The floating window: it always counts as in view, nothing accumulates.
- `CHANGELOG.md` and `@version`.

## Git workflow

- Branch: `fix/read-on-tab-visible`
- One commit. Conventional Commits with a body wrapped at 72 columns.
  Suggested subject:
  `fix(inbox): read the conversation in front when the tab comes back`.
- No `Co-Authored-By` line and no generated footer.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Make the test fail first

In `tests/live_ui.js`, find the line that starts with
`const connBanner = () => { const el = $('.conn-banner');` (line 702).
Insert this block right before it:

```js
  /* Hidden tab: a mention in the group in front counts in the title, and is read once the tab is back in front */
  const tabCount = () => +((/^\((\d+)\) /.exec(d.title) || [])[1] || 0);
  const tabBefore = tabCount();
  Object.defineProperty(d, 'visibilityState', { configurable: true, get: () => 'hidden' });
  g('b', 'test', ['1700009200.1', 'Alice', '', 'u1', 'UNIDH', 'tmp92', '1.2.3.4', '0', '', '<n000/><f x11000="0">@marjorie while you were away']);
  g('u', 'test', ['tmp92', 'H-I_D=']);
  await wait(80);
  const tabAway = tabCount();
  delete d.visibilityState;
  d.dispatchEvent(new w.Event('visibilitychange')); await wait(80);
  step('a mention received in the group in front while the tab is hidden counts in the title, and is read when the tab comes back',
    tabAway === tabBefore + 1 && tabCount() === tabBefore, { tabBefore, tabAway, back: tabCount(), title: d.title });
```

**Verify**: `pnpm test live_ui` → a line starting with
`FAIL a mention received in the group in front while the tab is hidden counts in the title, and is read when the tab comes back`
whose detail shows `"tabAway"` one above `"tabBefore"` and `"back"` equal to
`"tabAway"`. This is the expected red state (observed while writing this
plan: `{"tabBefore":1,"tabAway":2,"back":2,"title":"(2) Nightango"}`).

### Step 2: Read the conversations in front

In `src/app/inbox.js`, inside `useInbox`, right before its `return {` line
(line 199), add:

```js
  /**
   * Marks read the conversations in front of the user that gathered unreads while the tab was hidden.
   */
  function readInView() {
    var s0 = stateRef.current, panes = ['route', 'split'];
    update(function (d) {
      panes.forEach(function (pane) {
        var r = d[pane], g = r && r.view === 'group' ? d.groups[r.id] : null;
        if (g && (g.unread || g.mentions)) d[pane] = opened(d, r);
      });
    });
    panes.forEach(function (pane) {
      var r = s0[pane];
      if (r && r.view === 'dm' && r.id && s0.dms[r.id] && s0.dms[r.id].unread) readPm(pmArchive.current, update, r.id);
    });
  }
```

Then add `readInView: readInView` to the returned object, and add
`readInView: Function` to the `@returns` type of the JSDoc above `useInbox`
(line 46).

The test on `g.unread || g.mentions` matters: `opened` moves the "New
messages" line to the previous read position, which must happen only when
there is something new.

**Verify**: `pnpm build` exits 0.

### Step 3: Call it when the tab becomes visible

In `src/app/live-ops.js` line 270, change the `visible` case to:

```js
case 'visible': k.inbox.readInView(); if (navigator.onLine) reconnection.reconnectClosed(); pms.refreshPresence(true); break;
```

**Verify**: `pnpm test live_ui` → the step of Step 1 starts with `ok` and
the summary says `pass  live_ui`. Then `pnpm test` → every line of
`== summary` starts with `pass`, exit 0.

## Test plan

- One new `live_ui` step (Step 1): a mention received while hidden, then
  the tab visible again. It reads the count from the tab title, which is
  what the user sees.
- Pattern: the hidden-tab lines at `tests/live_ui.js:714-716` and the
  `visibilitychange` dispatch at line 1006.
- The PM branch of `readInView` goes through `readPm`, already covered by
  the `pm` suite. No separate step for it: ADR-0009.

## Done criteria

- [ ] `pnpm test` exits 0 and every summary line starts with `pass`
- [ ] `grep -c "is read when the tab comes back" tests/live_ui.js` prints `1`
- [ ] `grep -c "readInView" src/app/inbox.js` prints at least `2`, and `grep -c "k.inbox.readInView()" src/app/live-ops.js` prints `1`
- [ ] `git status --short` lists only the three in-scope files (plus `plans/README.md`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at the locations in "Current state" does not match the excerpts.
- Step 1 crashes with `SyntaxError: Identifier ... has already been declared`:
  a name of the new block is taken. Rename it, do not rename existing code.
- Step 1 does not produce the `FAIL` described.
- After Step 3, another step fails that passed before, in particular a
  step about the Mentions page: the new mention then changed its count.
  Report which step.

## Maintenance notes

- `readInView` reuses `opened`, so reading on return and reading on
  navigation stay the same code. A change to what "read" means goes in
  `opened`.
- The tab can also become visible without the user looking at it for long.
  That is the same assumption `isInView` already makes for messages
  received while visible.
- Reviewer: check that `unread` of a PM is not written directly (ADR-0012)
  and that the function does nothing when no pane has unreads (it runs on
  every return to the tab).
- Suggested `CHANGELOG.md` line, under `### Fixed`: "Coming back to the tab
  marks the conversation you are looking at as read."
