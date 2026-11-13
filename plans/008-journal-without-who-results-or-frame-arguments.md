# Plan 008: The diagnostic journal keeps neither a linked accounts result nor the arguments of a Chatango frame

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report. Do not improvise. When done, update the status row for this plan
> in `plans/README.md`, unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 0b829ea..HEAD -- src/bridge/live-bridge.js tests/live_ui.js docs/adr/0011-diagnostic-journal.md`
> If any of these files changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding. On a
> mismatch, treat it as a STOP condition. If plan 007 has landed, the
> `C.setNotice` hook quoted below has changed: that is expected, this plan
> does not edit it.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `0b829ea`, 2026-11-13

## Why this matters

The diagnostic journal is a log kept in the browser (`localStorage`), which
the Diagnostics page lets the user copy into a bug report. Two decision
records fix what it must never hold:

- ADR-0011: "It never records [...] the arguments of a received frame, so
  neither message text nor correspondent name" and "the response of
  `/api/v1/who`".
- ADR-0010 (linked accounts): the result "is never stored [...] or logged".

The bridge writes the text of every BetterChatango system message to the
journal. Two kinds of system message break those rules. BetterChatango shows
the linked accounts of a member as a system message marked `unique: "who"`,
which the user can trigger after "Show BetterChatango" on the recovery
screen. And it shows a Chatango broadcast frame as a system message whose
text is the arguments of the frame. After this plan both are noted in the
journal without their text. The toast shown to the user is unchanged.

## Current state

- `src/bridge/live-bridge.js:303-325`: the notice handling:

  ```js
  /* BetterChatango warnings: server refusals, lost connection, limits */
  var lastAlert = { text: '', at: 0 };
  function alertOnce(op) {
    if (op.text === lastAlert.text && Date.now() - lastAlert.at < 2500) return;
    lastAlert = { text: op.text, at: Date.now() };
    note('BetterChatango notice: ' + op.text);
    emit(op);
  }
  var QUIET = [/^Start a conversation/i, /^Private messages$/i, /^You have logged in to private messages elsewhere/i];
  function hookNotices() {
    if (typeof C.systemMessage === 'function' && !C.systemMessage.__skin) {
      var sys = C.systemMessage;
      C.systemMessage = function (data) {
        try {
          var text = String(data && data.content || '').replace(/\r/g, ' ').trim();
          // Friend presence (unique status): BetterChatango meant it for the open PM, with no group. The friend list already shows it.
          var presence = data && data.unique === 'status';
          if (text && !presence && !QUIET.some(function (re) { return re.test(text); })) alertOnce({ op: 'notice', gid: (data && data.group) || C.focus, text: text });
        } catch (e) { warn(e); }
        return sys.apply(this, arguments);
      };
      C.systemMessage.__skin = true;
    }
  ```

  `note(text)` (`src/bridge/live-bridge.js:36`) adds an entry to the
  journal: `function note(text) { if (JOURNAL) JOURNAL.add('app', text); }`.
  `alertOnce` is also called by the `C.setNotice` hook right below, with
  one argument.

- `reference/torch/inject.js` is a read-only copy of BetterChatango's code
  (never edit it, never load it). The two system messages:

  ```js
  // reference/torch/inject.js:7467-7468 (linked accounts)
  var format = `${total} total recor${total > 1 ? "ds": "d"} for <b>${result.target}</b>.\r\r${display.join("\r")}`
  client.systemMessage({content: format, avatar: "eye", unique: "who"})
  ```

  ```js
  // reference/torch/inject.js:3850-3853 (Chatango broadcast frame)
  chatango: function(client, socket, room, data) {
    console.log(`chatango: ${data}`)
    client.systemMessage({username: "Chatango", content: data.join(":")})
  },
  ```

  In that file, `unique` is set for `"status"` (friend presence, already
  silenced), `"who"` and `"block"` ("This user has blocked you."), and
  `username` only for the broadcast above.

- `docs/adr/0011-diagnostic-journal.md:26` lists what the bridge records:
  "on the bridge side: connection attempts and their outcome, observed
  state changes, BetterChatango warnings shown, requests refused by its
  post helper".

- In `tests/live_ui.js`, the journal is a plain array named `journal`
  (line 62-63), each entry `{ t, k, m }` with `m` the text. The notice
  steps are at lines 693-701:

  ```js
  /* Warnings and connection */
  C.systemMessage({ content: 'Your message exceeded the character limit.', group: 'test' }); await until(() => !!byText('.toast', 'exceeded the character limit'));
  step('BetterChatango notice shown as a toast, not in the thread', !!byText('.toast', 'exceeded the character limit') && !$$('.log .ev').some(x => x.textContent.includes('exceeded the character limit')));
  ```

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
- `src/bridge/live-bridge.js` (`alertOnce` and the `C.systemMessage` hook only)
- `tests/live_ui.js`
- `docs/adr/0011-diagnostic-journal.md` (line 26 only)

**Out of scope** (do NOT touch):
- The toast: the user still sees the text of the notice. Only the journal
  entry changes.
- `src/loader/skin-journal.js`: the journal itself is unchanged.
- The `C.setNotice` hook: its notices are BetterChatango's fixed warning
  texts.
- `reference/torch/`.
- `CHANGELOG.md` and `@version`.

## Git workflow

- Branch: `fix/journal-notice-text`
- One commit. Conventional Commits with a body wrapped at 72 columns.
  Suggested subject:
  `fix(journal): note a who result or a broadcast without its text`.
- No `Co-Authored-By` line and no generated footer.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Make the test fail first

In `tests/live_ui.js`, right after the line that starts with
`step('BetterChatango notice shown as a toast, not in the thread',`
(line 695), add:

```js
  /* Journal: a notice that carries a linked accounts result or the arguments of a Chatango frame is noted without its text */
  const noticesFrom = journal.length;
  C.systemMessage({ content: '2 total records for <b>zoe</b>.\r\r<b>Definite</b>\rkim, ola', avatar: 'eye', unique: 'who' });
  await wait(30);
  C.systemMessage({ username: 'Chatango', content: 'maintenance:in:5' });
  await wait(30);
  const keptNotes = journal.slice(noticesFrom).map(e => e.m);
  step('journal notes a linked accounts result and a Chatango broadcast without their text', keptNotes.length === 2 && !keptNotes.some(m => /zoe|kim|ola|maintenance/.test(m)), keptNotes);
```

**Verify**: `pnpm test live_ui` → a line starting with
`FAIL journal notes a linked accounts result and a Chatango broadcast without their text`
whose detail shows both texts, the first one
`BetterChatango notice: 2 total records for <b>zoe</b>.  <b>Definite</b> kim, ola`.
This is the expected red state (observed while writing this plan).

### Step 2: Note those notices without their text

In `src/bridge/live-bridge.js`:

1. Give `alertOnce` a second parameter and use it in the `note` line:

   ```js
   function alertOnce(op, unkept) {
     if (op.text === lastAlert.text && Date.now() - lastAlert.at < 2500) return;
     lastAlert = { text: op.text, at: Date.now() };
     // Neither a linked accounts result nor the arguments of a frame reach the journal (ADR-0010, ADR-0011).
     note('BetterChatango notice: ' + (unkept ? '(text not kept)' : op.text));
     emit(op);
   }
   ```

2. In the `C.systemMessage` hook, pass it. Replace
   `alertOnce({ op: 'notice', gid: (data && data.group) || C.focus, text: text });`
   with
   `alertOnce({ op: 'notice', gid: (data && data.group) || C.focus, text: text }, !!(data.unique || data.username));`

   `data` is set at that point: `text` is non-empty only when `data` is.

Leave the call of `alertOnce` in the `C.setNotice` hook with one argument.

**Verify**: `pnpm test live_ui` → the step of Step 1 starts with `ok`, the
step `BetterChatango notice shown as a toast, not in the thread` still starts
with `ok`, and the summary says `pass  live_ui`.

### Step 3: Align the decision record

In `docs/adr/0011-diagnostic-journal.md` line 26, replace
`BetterChatango warnings shown,` with
`BetterChatango warnings shown (without the text of one that carries a linked accounts result or the arguments of a frame),`.

**Verify**: `grep -c "without the text of one that carries" docs/adr/0011-diagnostic-journal.md`
prints `1`, and `pnpm test` exits 0 with every summary line `pass`.

## Test plan

- One new `live_ui` step (Step 1), next to the existing notice step and
  using the same `journal` array as the reconnection steps
  (`tests/live_ui.js:2254-2255`).

## Done criteria

- [ ] `pnpm test` exits 0 and every summary line starts with `pass`
- [ ] `grep -c "journal notes a linked accounts result" tests/live_ui.js` prints `1`
- [ ] `grep -c "(text not kept)" src/bridge/live-bridge.js` prints `1`
- [ ] `git status --short` lists only the three in-scope files (plus `plans/README.md`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `alertOnce` or the `C.systemMessage` hook does not match the excerpts.
- Step 1 does not produce the `FAIL` described.
- After Step 2, a later step that looks for a toast fails: the two extra
  toasts of the new step then get in its way. Report which step.

## Maintenance notes

- The rule is structural: a system message with `unique` or `username` set
  is one BetterChatango built from data (a lookup, a frame), not one of its
  fixed warning texts. A fixed warning keeps its text in the journal,
  which is what makes the journal useful ("Your message exceeded the
  character limit.").
- Residual, not solved here: a few fixed-shape warnings embed a name, for
  example `${name} does not exist or is a group chat.`
  (`reference/torch/inject.js:4129`). The bridge does not call the handler
  that emits it (`docs/betterchatango-protocol.md`, "Friend presence"). If
  that changes, this rule has to become an allow list of texts.
- Reviewer: check that the toast still shows the text, and that the
  `setNotice` path is untouched.
- No `CHANGELOG.md` line needed beyond, under `### Security`: "The
  diagnostic journal no longer keeps the text of a linked accounts lookup
  made from BetterChatango's own screen."
