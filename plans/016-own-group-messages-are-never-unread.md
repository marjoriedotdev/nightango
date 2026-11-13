# Plan 016: Your own group messages never count as unread or as a mention

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report. Do not improvise. When done, update the status row for this plan
> in `plans/README.md`, unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 0b829ea..HEAD -- src/app/inbox.js tests/live_ui.js`
> If either file changed since this plan was written, compare the "Current
> state" excerpts against the live code before proceeding. On a mismatch,
> treat it as a STOP condition. Plan 009 adds a function to
> `src/app/inbox.js`: that is expected and does not touch the lines below.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `0b829ea`, 2026-11-13

## Why this matters

Chatango echoes every message of a group to all the sessions of its members,
the author's included. When the user posts from another device, or when an
upload finishes after they moved to another conversation, their own message
arrives in a group that is not in front of them. Nightango then counts it as
unread, and if it contains their own name (a quote of someone who mentioned
them, for example) it shows "You mentioned you in #group" and adds a mention
badge. The messages loaded from history already skip the user's own. After
this plan a live message does too.

## Current state

- `src/app/inbox.js:155-178`: reception of a live group message:

  ```js
  function receiveGroup(gid, msg) {
    var s0 = stateRef.current, me = s0.me;
    var mention = msg.kind === 'msg' && mentionsMe(me, msg.text);
    // Like in BetterChatango, a mention in a muted group or from an ignored author does not alert, and the counters still change.
    var quiet = !!(s0.groups[gid] && s0.groups[gid].muted) || !!userOf(s0, msg.author).ignored;
    var focused = isGroupInView(s0, gid);
    update(function (d) {
      var g = d.groups[gid]; if (!g) return;
      // The reply is resolved on the up-to-date state: the final id of the original can arrive just before.
      if (LIVE && msg.replyId) withReply(g, msg);
      g.messages.push(msg);
      trimThread(g);
      logMention(d, gid, msg);
      if (msg.kind === 'msg' && !focused) { g.unread += 1; if (mention) g.mentions += 1; }
      if (focused) g.lastReadTs = readThrough(g);
    });
    if (mention && !quiet && !isPaneOpen(s0, 'group', gid)) {
      var g0 = s0.groups[gid];
      ...
        toast: who + ' mentioned you in #' + gid, ...
  ```

  `me` and `msg.author` are both lowercase account names.

- `src/app/live-ops.js:49`: the history path already excludes the
  author's own messages when it counts unreads (`hm.author !== d.me`).

- `tests/live_ui.js`: how a group message is fed (author as Chatango
  sends it, with capitals), from line 585:

  ```js
  g('b', 'edits', ['1700000300.1', 'Marjorie', '', 'u0', 'UNID0', 'tmp30', '9.9.9.9', '0', '', '<n000/><f x11000="0">Mine typo']);
  g('u', 'edits', ['tmp30', 'A-B_C=']);
  ```

  The signed-in account of the suite is `marjorie`. A sidebar entry is
  found with `byText('.tc-nav', 'edits')`. It carries the class
  `tc-nav-unread` and a `.tc-count` child (text `@1` for one mention) when
  the group has unreads (`tests/live_ui.js:452-456`). At line 1074 the
  group `test` is shown and `edits` is not:

  ```js
  click(byText('.tc-nav', 'test')); await wait(50);
  g('b', 'test', ['1700000270.1', 'Eve', '', 'u7', 'UNID7', 'tmp13', '9.9.9.9', '0', '', '<n000/><f x11000="2">Look at this']);
  ```

- Conventions that apply (`docs/coding-conventions.md`):
  - Code in `src/` is ES5: `var`, `function`, no arrow functions.
  - A comment exists only for a trap that would make someone "fix" the code
    by mistake.
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
- `src/app/inbox.js` (two conditions of `receiveGroup`)
- `tests/live_ui.js`

**Out of scope** (do NOT touch):
- `logMention`: whether one's own message belongs on the Mentions page is
  a separate question, left as it is.
- The read position (`g.lastReadTs`): an own message from elsewhere does
  not move it. The user has not read the messages before it on this
  device.
- Private messages: a sent PM is not echoed as a received one.
- `CHANGELOG.md` and `@version`.

## Git workflow

- Branch: `fix/own-group-messages-unread`
- One commit. Conventional Commits with a body wrapped at 72 columns.
  Suggested subject:
  `fix(inbox): do not count your own group messages as unread`.
- No `Co-Authored-By` line and no generated footer.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Make the test fail first

In `tests/live_ui.js`, find these two consecutive lines (1074-1075):

```js
  click(byText('.tc-nav', 'test')); await wait(50);
  g('b', 'test', ['1700000270.1', 'Eve', '', 'u7', 'UNID7', 'tmp13', '9.9.9.9', '0', '', '<n000/><f x11000="2">Look at this']);
```

Insert this block right before the first of them:

```js
  /* Own message from another device, in a group that is not shown: neither unread nor a mention */
  const editsNav = () => { const el = byText('.tc-nav', 'edits'); return { count: (el.querySelector('.tc-count') || {}).textContent || '', unread: el.classList.contains('tc-nav-unread') }; };
  const editsBefore = editsNav();
  g('b', 'edits', ['1700009300.1', 'Marjorie', '', 'u0', 'UNIDO', 'tmp93', '9.9.9.9', '0', '', '<n000/><f x11000="0">@marjorie note from my phone']);
  g('u', 'edits', ['tmp93', 'O-W_N=']);
  await wait(80);
  const ownElsewhere = { before: editsBefore, after: editsNav(), toast: !!byText('.toast', 'mentioned you in #edits') };
  step('own message received from another device counts neither as unread nor as a mention',
    JSON.stringify(ownElsewhere.after) === JSON.stringify(ownElsewhere.before) && !ownElsewhere.toast, ownElsewhere);
```

**Verify**: `pnpm test live_ui` → a line starting with
`FAIL own message received from another device counts neither as unread nor as a mention`
whose detail is
`{"before":{"count":"","unread":false},"after":{"count":"@1","unread":true},"toast":true}`.
This is the expected red state (observed while writing this plan).

### Step 2: Skip the counters and the alert for an own message

In `src/app/inbox.js`, in `receiveGroup`:

1. Replace
   `if (msg.kind === 'msg' && !focused) { g.unread += 1; if (mention) g.mentions += 1; }`
   with
   `if (msg.kind === 'msg' && !focused && msg.author !== me) { g.unread += 1; if (mention) g.mentions += 1; }`

2. Replace
   `if (mention && !quiet && !isPaneOpen(s0, 'group', gid)) {`
   with
   `if (mention && msg.author !== me && !quiet && !isPaneOpen(s0, 'group', gid)) {`

**Verify**: `pnpm test live_ui` → the step of Step 1 starts with `ok` and
the summary says `pass  live_ui`. Then `pnpm test` → every line of
`== summary` starts with `pass`, exit 0.

## Test plan

- One new `live_ui` step (Step 1): an own message with a mention of
  oneself, received in a group that is not shown. It reads the sidebar
  entry and the toast, which is what the user sees.
- Pattern: the step at `tests/live_ui.js:452-456`, which reads the same
  sidebar markers for a group with unread history.

## Done criteria

- [ ] `pnpm test` exits 0 and every summary line starts with `pass`
- [ ] `grep -c "own message received from another device" tests/live_ui.js` prints `1`
- [ ] `grep -c "msg.author !== me" src/app/inbox.js` prints `2`
- [ ] `git status --short` lists only the two in-scope files (plus `plans/README.md`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `receiveGroup` does not match the excerpt.
- Step 1 does not produce the `FAIL` described.
- After Step 1 or Step 2, a later step about the group `edits` or about
  the Mentions page fails: the extra message of the new block then changed
  what it counts. Report which step.

## Maintenance notes

- The prototype (simulated data) shares `receiveGroup`: its simulated
  replies are never authored by the user, so nothing changes there.
- The message still lands on the Mentions page when it contains the
  user's name (`logMention` is unchanged). If the owner finds that odd,
  it is a one-line follow-up in `logMention`.
- Suggested `CHANGELOG.md` line, under `### Fixed`: "A message you post
  from another device no longer shows as unread, or as a mention of
  yourself."
