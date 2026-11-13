# Plan 002: A group message or an edit that is not sent stays in the composer

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report. Do not improvise. When done, update the status row for this plan
> in `plans/README.md`, unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 0b829ea..HEAD -- src/views/group.js src/views/dm.js src/app/actions.js tests/live_ui.js`
> If any of these files changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding. On a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `0b829ea`, 2026-11-13

## Why this matters

Nightango is a userscript in daily use on a real Chatango account, often on
mobile where connections drop. While a group is reconnecting, the banner says
"Messages you send now may not arrive". If the user presses Enter anyway, the
message is not sent, a toast says "Message not sent", and the text they typed
is gone, with its reply context. The private message composer already puts the
text back in that case. The group composer does not, and neither composer does
it for a failed edit. After this plan, a send or an edit that did not leave
keeps its text and its mode in the composer.

## Current state

- `torchds/project/components/bundle.js` (design system, do not edit): the
  shared `Composer` clears its field **before** it calls `onSend`:

  ```js
  // torchds/project/components/bundle.js:383-388
  function send() {
    var text = value.trim();
    if (!text && !file || blocked) return;
    // Cleared before onSend: the view can put back a draft it set aside.
    setValue('');
    if (props.onSend) props.onSend(text);
  }
  ```

- `src/views/group.js`: group view. Its `send` ignores what the actions
  return:

  ```js
  // src/views/group.js:138-146
  function send(text) {
    if (kind === 'edit') { if (text !== mode.m.text) app.actions.editMessage(g.id, mode.m, text); closeMode(); return; }
    if (runCommand(app, text, g.id)) return;
    log.follow();
    var opts = { replyTo: replyId ? { id: replyId } : null, quote: quoted, channel: channel }, sentMode = mode;
    if (attach.file) { attach.send(text, opts, function () { setMode(function (cur) { return cur === sentMode ? null : cur; }); }); return; }
    app.actions.sendGroup(g.id, text, opts);
    setMode(null);
  }
  ```

  `setDraft` is in scope there (`src/views/group.js:82`:
  `var a9 = useDraft(groupDraftKey(p.gid)), draft = a9[0], setDraft = a9[1];`).

- `src/views/dm.js`: private message composer. A new message already
  restores its text. An edit does not:

  ```js
  // src/views/dm.js:307-313
  onSend: function (text) {
    if (kind === 'edit') { if (text !== mode.m.text) app.actions.sendDm(id, text, { editKey: mode.m.key }); p.onCancelMode(); return; }
    if (runCommand(app, text, null)) return;
    var opts = { ... };
    if (attach.file) { attach.send(text, opts, p.onCancelMode); return; }
    if (!app.actions.sendDm(id, text, opts)) { setDraft(text); return; }
    p.onCancelMode();
  ```

- `src/app/actions.js`: the actions. There are two sets: the prototype
  ones (simulated data) and, inside `if (LIVE) { ... }`, the live ones that
  replace them.
  - Live `sendGroup` (`src/app/actions.js:492-497`) returns `false` when
    the reply target is not delivered yet, otherwise the boolean of
    `sendStyled`, which shows the "Message not sent." toast itself and
    returns `!!style` (`src/app/actions.js:453-458`).
  - Live `editMessage` (`src/app/actions.js:499`) calls `sendStyled` and
    **drops its result**:
    `actions.editMessage = function (gid, m, text) { sendStyled(gid, text, { editId: editedId(m), channel: m.channel }, 'Message not edited.'); };`
  - Live and prototype `sendDm` both return `true` or `false`
    (`src/app/actions.js:141-148` and `:500-508`).
  - Prototype `sendGroup` (`src/app/actions.js:124-140`) returns
    `undefined`. It has two exits: a bare `return;` inside
    `if (gid === 'bots' && text.charAt(0) === '!') { ... }` and the end of
    the function.
  - Prototype `editMessage` (`src/app/actions.js:326-328`) returns
    `undefined`.

- Existing test: `tests/live_ui.js:1040-1049` closes the socket of the
  group `test`, types `Lost in test`, presses Enter and checks only the
  toast (`lostGroup.toast`). It does not look at the composer. `editBox()`
  (`tests/live_ui.js:588`) returns the group composer field.

- Conventions that apply (from `docs/coding-conventions.md`):
  - All code in `src/` is ES5: `var`, `function`, no arrow functions, no
    `const`/`let`, no classes, no JSX.
  - A comment exists only for a trap that would make someone "fix" the code
    by mistake. `//` comments fit on one line, in English, with no em-dash
    and no semicolon in their text.
  - "An action that is not actually sent is hidden or shown as unavailable.
    Never a fake success."
  - Tests are for complex behaviour only, and every new test is seen
    failing before the fix it protects (ADR-0009).

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Install | `pnpm install --frozen-lockfile` | exit 0 |
| One suite | `pnpm test live_ui` | builds, then `pass  live_ui (N ok)`, exit 0, about 90 s |
| All suites | `pnpm test` | every line of `== summary` starts with `pass`, exit 0, about 2.5 min |

`pnpm` only, never `npm` or `yarn`. Node 24 is expected (`engines`). Node 22
works with a warning. The runner judges a suite on its output too: a line
starting with `FAIL` or `CRASH`, or `ERRORS:` followed by anything but `none`,
is a failure even with exit code 0.

## Scope

**In scope** (the only files you should modify):
- `src/views/group.js`
- `src/views/dm.js`
- `src/app/actions.js`
- `tests/live_ui.js`

**Out of scope** (do NOT touch, even though they look related):
- `torchds/project/components/bundle.js`: the composer clears first by
  design, its comment says so. The view puts the text back.
- `src/bridge/live-bridge.js`: `send` already reports a failure by
  returning null.
- The upload path (`attach.send`, `actions.sendUpload`): it has its own
  failure handling, covered by the same test step.
- `CHANGELOG.md` and `@version` in `src/loader/skin-loader.js`: the release
  is a separate step done by the owner.

## Git workflow

- Branch: `fix/keep-text-on-failed-group-send`
- One commit. Conventional Commits, subject then a body wrapped at 72
  columns that says what changed and why. Example from this repo:
  `fix(names): spell members in toasts, dialogs, menus and logs`.
  Suggested subject: `fix(composer): keep the text of a message that was not sent`.
- No `Co-Authored-By` line and no generated footer.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Make the test fail first

In `tests/live_ui.js`, in the block that starts with the comment
`/* Connection not open: no frame leaves, nothing is added, the state stays and the failure shows */`
(line 1018), change the line

```js
const lostGroup = { toast: !!byText('.toast', "Message not sent. Try again once you're reconnected to #test.") };
```

to also record the composer text, then empty the composer so the steps after
it start from an empty field:

```js
const lostGroup = { toast: !!byText('.toast', "Message not sent. Try again once you're reconnected to #test."), draft: editBox().value };
type(editBox(), '');
```

In the `step(...)` call right below, replace `&& lostGroup.toast,` with
`&& lostGroup.toast && lostGroup.draft === 'Lost in test',`.

**Verify**: `pnpm test live_ui` → the output contains a line starting with
`FAIL pm, upload, block, status and group message on a connection that is not open`
and the summary says `FAIL  live_ui`. This is the expected red state. If the
step passes at this point, STOP (see STOP conditions).

### Step 2: Give every send and edit action a boolean result

In `src/app/actions.js`:

1. Prototype `sendGroup` (line 124): change the bare `return;` of the
   `bots` branch to `return true;` and add `return true;` as the last
   statement of the function.
2. Prototype `editMessage` (line 326): add `return true;` after the
   `update(...)` call.
3. Live `editMessage` (line 499): return the result of `sendStyled`:
   `actions.editMessage = function (gid, m, text) { return sendStyled(gid, text, { editId: editedId(m), channel: m.channel }, 'Message not edited.'); };`

Do not change `sendDm` or live `sendGroup`: they already return a boolean.

**Verify**: `grep -n "return true;" src/app/actions.js | head` shows the new
lines, and `pnpm build` exits 0.

### Step 3: Put the text back in the group composer

In `src/views/group.js`, replace the body of `send` (lines 138-146) so that a
failed edit or send restores the text and keeps the mode:

```js
function send(text) {
  if (kind === 'edit') {
    if (text !== mode.m.text && !app.actions.editMessage(g.id, mode.m, text)) { setDraft(text); return; }
    closeMode();
    return;
  }
  if (runCommand(app, text, g.id)) return;
  log.follow();
  var opts = { replyTo: replyId ? { id: replyId } : null, quote: quoted, channel: channel }, sentMode = mode;
  if (attach.file) { attach.send(text, opts, function () { setMode(function (cur) { return cur === sentMode ? null : cur; }); }); return; }
  if (!app.actions.sendGroup(g.id, text, opts)) { setDraft(text); return; }
  setMode(null);
}
```

Only the two lines with `setDraft(text)` are new behaviour. Keep every other
line as it is today.

**Verify**: `pnpm test live_ui` → the step
`pm, upload, block, status and group message on a connection that is not open send nothing, keep the text and the state, and say so`
now starts with `ok`, and the summary says `pass  live_ui`.

### Step 4: Put the text back for a failed PM edit

In `src/views/dm.js` line 308, apply the same rule to the edit branch:

```js
if (kind === 'edit') { if (text !== mode.m.text && !app.actions.sendDm(id, text, { editKey: mode.m.key })) { setDraft(text); return; } p.onCancelMode(); return; }
```

**Verify**: `pnpm test` → every line of `== summary` starts with `pass`,
exit 0.

## Test plan

- One existing step of `tests/live_ui.js` is extended (Step 1). It is the
  regression test for the group send. Model: the `lostPm.draft === 'Lost words'`
  check two lines above it, which does the same for a PM.
- No new test for the edit paths: ADR-0009 limits tests to complex
  behaviour, and the edit paths reuse the same two lines.
- The `smoke` suite walks the prototype and sends a group message: it must
  still pass, which proves the prototype `sendGroup` now returns `true`
  (otherwise the prototype composer would refill itself after each send).

## Done criteria

- [ ] `pnpm test` exits 0 and every summary line starts with `pass`
- [ ] The `live_ui` step named in Step 1 starts with `ok` and its condition contains `lostGroup.draft === 'Lost in test'`
- [ ] `grep -n "app.actions.sendGroup(g.id, text, opts);" src/views/group.js` returns no match
- [ ] `git status --short` lists only the four in-scope files (plus `plans/README.md`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at the locations in "Current state" does not match the excerpts.
- Step 1 does not produce a `FAIL` on the unmodified `src/`: the bug is
  then already fixed or the test does not reach it.
- After Step 3, the `smoke` suite fails or the prototype composer keeps its
  text after a send: a prototype `sendGroup` exit was missed.
- Any other `live_ui` step turns to `FAIL` after Step 1's `type(editBox(), '')`:
  a later step depended on the composer content.
- The fix seems to need a change in `torchds/project/components/bundle.js`.

## Maintenance notes

- Contract to keep: `sendGroup`, `sendDm` and `editMessage` return `true`
  when the message left and `false` when it did not, in the prototype and
  in live. A new send action must follow it, or its composer will refill.
- A message Chatango refuses as too fast comes back another way
  (`g.live.refused`, `src/views/group.js:101-106`). That path is unchanged.
- Reviewer: check that the reply or edit bar is still shown after a failed
  send (the mode is kept), and that the upload path was not touched.
- Suggested `CHANGELOG.md` line for the release that ships this, under
  `### Fixed`: "A group message or an edit that could not be sent stays in
  the composer."
