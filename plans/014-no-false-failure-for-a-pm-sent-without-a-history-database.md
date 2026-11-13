# Plan 014: A private message sent without a history database is not announced as failed

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report. Do not improvise. When done, update the status row for this plan
> in `plans/README.md`, unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 0b829ea..HEAD -- src/bridge/live-bridge.js tests/live_ui.js`
> If either file changed since this plan was written, compare the "Current
> state" excerpts against the live code before proceeding. On a mismatch,
> treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `0b829ea`, 2026-11-13

## Why this matters

BetterChatango keeps private messages in a browser database (IndexedDB). Some
browsers refuse it (private browsing, storage quota). Nightango supports that
case: it shows a banner "Private messages aren't saved in this browser" and
keeps them in memory. But in that case every private message the user sends
is followed by a toast "Your message failed to be delivered. The connection
to #private_message has not been established." although the message did
leave. The user then sends it again. The cause is in how BetterChatango sends:
after the frame has left, it tries to archive the message, the archive throws
because there is no database, and its error handler announces a connection
failure. After this plan Nightango asks BetterChatango to send without
archiving when there is no database.

## Current state

- `src/bridge/live-bridge.js:976-979`: inside `sendPm`. BetterChatango
  archives a sent message under `client.private.focus`, so the bridge sets
  it to the recipient for the time of the send:

  ```js
  var failure = opts.editId ? 'Your message could not be edited.' : opts.replyId ? 'Your reply could not be sent.' : opts.quote ? 'Your quote could not be sent.' : 'Your message failed to be delivered.';
  // BetterChatango archives a sent PM under client.private.focus, not its recipient: an upload can leave after a switch.
  C.private.focus = user;
  try { if (!send('private_message', 'msg:' + user + ':' + body, failure)) return null; } finally { C.private.focus = pmFocus; }
  ```

  `C` is BetterChatango's client. `pmFocus` is the conversation the bridge
  wants focused the rest of the time (`focusPm`, line 504-509), `false`
  when no PM is shown.

- `reference/torch/inject.js` is a read-only copy of BetterChatango's code
  (never edit it, never load it). Its send archives only when a focus is
  set, and turns any error into a failure notice:

  ```js
  // reference/torch/inject.js:4632-4645
  connection.send(`${frame}\r\n`)
  if (data == "private_message" && this.private.focus || force) {
    var item = frame.split(":")
    if (item[0] == "msg") {
      ...
      this.private.saveMessage([...], force || this.private.focus, false)
  ```

  ```js
  // reference/torch/inject.js:4666-4667
  } catch(error) {
    this.systemMessage({group: this.focus, content: `${content}\rThe connection to #${data} has not been established.`})
  ```

  ```js
  // reference/torch/inject.js:9039-9041
  saveMessage(data, target, unread) {
    console.log(data)
    var start = client.database.pm.transaction(["messages"], "readwrite").objectStore("messages").add({
  ```

  `client.database.pm` is `false` until a database is assigned
  (`inject.js:2993-2996`).

- `src/bridge/live-bridge.js:537-551`: the bridge opens the database
  itself and assigns it to `C.database.pm`. When the browser refuses, it
  resolves `null` and `C.database.pm` stays `false`. The application then
  switches to its in-memory archive (`src/app/live-ops.js:309-316`,
  `d.pmUnsaved = true`): the sent message is recorded there by the
  application, not by BetterChatango.

- `tests/live_ui.js:133-137`: the fake client reproduces the archive
  rule, into the array `sentPmArchive`:

  ```js
  // Like BetterChatango, a sent PM is archived under client.private.focus, and not at all while it is false (inject.js:4633-4645).
  socket(gid, frame) {
    sent.push([gid, frame]);
    if (gid === 'private_message' && frame.indexOf('msg:') === 0 && C.private.focus) sentPmArchive.push({ target: C.private.focus, frame });
  },
  ```

  Helpers defined at lines 1052-1053, usable after them:
  `archivedUnder(text)` returns the targets a sent frame was archived
  under, `pmLeft(text)` tells whether a frame to `fay` holding the text was
  sent. `pmBox()` (line 1019) is the PM composer. At line 1067 the
  conversation with `fay` is open:

  ```js
  click(byText('.conv', 'fay')); await wait(50);
  const toGroup = await uploadThenShow('Late again', () => byText('.tc-nav', 'test'));
  ```

- Conventions that apply (`docs/coding-conventions.md`):
  - Code in `src/` is ES5: `var`, `function`, no arrow functions.
  - A comment exists only for a trap that would make someone "fix" the code
    by mistake. One line, English, no em-dash and no semicolon in its text.
  - "No fake success in live" has a mirror: no fake failure either. The
    toast must say what happened.
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
- `src/bridge/live-bridge.js` (one line of `sendPm`)
- `tests/live_ui.js`

**Out of scope** (do NOT touch):
- The fake `socket` of `tests/live_ui.js`: it already follows
  BetterChatango's rule.
- `src/app/`: the in-memory archive already records the sent message.
- `reference/torch/`.
- `CHANGELOG.md` and `@version`.

## Git workflow

- Branch: `fix/pm-sent-without-history-database`
- One commit. Conventional Commits with a body wrapped at 72 columns.
  Suggested subject:
  `fix(pm): send without BetterChatango's archive when it has no database`.
- No `Co-Authored-By` line and no generated footer.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Make the test fail first

In `tests/live_ui.js`, find the line
`const toGroup = await uploadThenShow('Late again', () => byText('.tc-nav', 'test'));`
(line 1068). Insert this block right before it:

```js
  /* No history database: BetterChatango's send would throw on its archive once the frame has left and announce a failure, so the PM leaves without its focus */
  const historyDb = C.database.pm; C.database.pm = false;
  type(pmBox(), 'No archive'); key(pmBox(), 'Enter'); await until(() => pmLeft('No archive'));
  C.database.pm = historyDb;
  const noArchive = { left: pmLeft('No archive'), under: archivedUnder('No archive'), focus: C.private.focus };
  step('a pm sent without a history database leaves without the focus BetterChatango archives under, which comes back after the send',
    noArchive.left && !noArchive.under.length && noArchive.focus === 'fay', noArchive);
```

**Verify**: `pnpm test live_ui` → a line starting with
`FAIL a pm sent without a history database leaves without the focus BetterChatango archives under`
whose detail is `{"left":true,"under":["fay"],"focus":"fay"}`. This is the
expected red state (observed while writing this plan).

### Step 2: Send without a focus when there is no database

In `src/bridge/live-bridge.js`, in `sendPm`, replace the line
`C.private.focus = user;` with:

```js
// Without its history database that archive throws once the frame has left, and BetterChatango announces a failure (inject.js:4633-4667).
C.private.focus = C.database && C.database.pm ? user : false;
```

Keep the comment line that is above it today and the `try ... finally` line
below it unchanged: the `finally` puts the shown conversation back.

**Verify**: `pnpm test live_ui` → the step of Step 1 starts with `ok`, the
step
`a pm that leaves after a switch to another pm or to a group is archived under its recipient, then BetterChatango gets back the shown conversation`
still starts with `ok`, and the summary says `pass  live_ui`. Then
`pnpm test` → every line of `== summary` starts with `pass`, exit 0.

## Test plan

- One new `live_ui` step (Step 1), next to the steps about the archive of
  a sent PM (`tests/live_ui.js:1051-1072`) and using their helpers.
- It checks the cause (no archive attempt without a database) rather than
  the toast: the fake client does not reproduce BetterChatango's error
  handler, by the project's choice not to load BetterChatango in tests.

## Done criteria

- [ ] `pnpm test` exits 0 and every summary line starts with `pass`
- [ ] `grep -c "a pm sent without a history database" tests/live_ui.js` prints `1`
- [ ] `grep -c "C.database && C.database.pm ? user : false" src/bridge/live-bridge.js` prints `1`
- [ ] `git status --short` lists only the two in-scope files (plus `plans/README.md`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The lines of `sendPm` do not match the excerpt.
- Step 1 does not produce the `FAIL` with `"under":["fay"]`.
- After Step 2, a step about unread counts or the private history fails:
  setting `C.database.pm` to `false` for the time of one send then had a
  side effect in the suite. Report which step.

## Maintenance notes

- With a database, nothing changes: the message is archived under its
  recipient as before.
- Without one, the message is kept by Nightango's in-memory archive only,
  as the banner at the top of Chats already says.
- Not observed in a real browser while writing this plan: the failure toast
  itself was deduced from BetterChatango's code. Manual check for the
  owner: in a private window (Firefox refuses IndexedDB there in some
  configurations), send a PM. One message in the thread, no failure toast.
- Suggested `CHANGELOG.md` line, under `### Fixed`: "In a browser that
  cannot save private messages, sending one no longer says it failed."
