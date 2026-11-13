# Plan 021: An edited private message shows once when its original comes from an older history page

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report. Do not improvise. When done, update the status row for this plan
> in `plans/README.md`, unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 0b829ea..HEAD -- src/app/pm.js tests/pm.js`
> If either file changed since this plan was written, compare the "Current
> state" excerpts against the live code before proceeding. On a mismatch,
> treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `0b829ea`, 2026-11-13

## Why this matters

Private message history is read from BetterChatango's database in pages, the
newest 100 records first, older pages when the user scrolls up. An edit is
its own record that points at the original message. When an edit is in the
newest page and its original is older, the edit is shown on its own until the
original is loaded. But when the older page then brings the original, the two
are not put together: the conversation shows the original with its old text
and, further down, the edited copy. Worse, if that older page also holds an
earlier edit of the same message, its text overwrites the newer one. Seen
while writing this plan, on the code at `0b829ea`: the conversation ends with
two rows, "Draft" and "Draft, second", when the latest edit says "Draft,
final". It only happens in conversations longer than a page with edited
messages, which is why it is P3.

## Current state

- `src/app/pm.js:82-99`: how an entry becomes a shown message, and how an
  edit is applied:

  ```js
  function pmMessage(x) {
    // Edit without a loaded original: it takes the key of the original, which the archive and later edits target.
    var m = { id: uid(), from: x.from, key: x.editId || x.key, text: x.text, parts: x.parts, embeds: x.embeds, ts: x.ts, archiveTs: x.archiveTs };
    if (x.editId) { m.edited = true; m.editKeys = x.key ? [x.key] : []; }
    if (x.replyId) m.replyTo = { key: x.replyId };
    return m;
  }
  function applyEdit(o, m) { o.text = m.text; o.parts = m.parts; o.embeds = m.embeds; o.edited = true; }
  ...
  function applyPmEdit(o, x) {
    // The history replays on each OK the edits already applied live: their key keeps them from counting twice.
    if (x.key && (o.editKeys || []).indexOf(x.key) < 0) o.editKeys = (o.editKeys || []).concat([x.key]);
    applyEdit(o, x);
  }
  ```

- `src/app/pm.js:134-147`: the merge of a page into a conversation:

  ```js
  function mergePmHistory(c, list, onEntry) {
    // The timestamp archived by BetterChatango differs from ours: same author and same content within two minutes = same message. Each message already shown covers only one entry.
    var shown = c.messages.slice();
    list.forEach(function (x) {
      onEntry(x);
      var o = pmEditTarget(c, x);
      if (o) { applyPmEdit(o, x); return; }
      var m = pmMessage(x), i = pmShownIndex(shown, m);
      if (i >= 0) { shown[i].archiveTs = m.archiveTs; shown.splice(i, 1); return; }
      c.messages.push(m);
    });
    c.messages.sort(function (a, b) { return a.ts - b.ts; });
    trimThread(c);
  }
  ```

- `src/core/selectors.js:175` and `:182-187`: the two lookups it uses:

  ```js
  function pmEditTarget(c, m) { return m.editId ? c.messages.find(function (x) { return x.key === m.editId && x.from === m.from; }) : null; }
  ...
  function pmShownIndex(list, x) {
    // An edit without a loaded original is shown under the key of the original.
    var key = x.editId || x.key, k = pmContentKey(x), i = list.findIndex(function (y) { return y.archiveTs === x.archiveTs; });
    // A message that already carries an archive key is another entry. Same PM key = same message, even if an edit changed its text.
    return i >= 0 ? i : list.findIndex(function (y) { return !y.archiveTs && (key && y.key ? y.key === key : y.from === x.from && pmContentKey(y) === k && Math.abs(y.ts - x.ts) < 120000); });
  }
  ```

  Why the original is not matched: the edit shown on its own carries an
  `archiveTs` (the one of the edit record), and `pmShownIndex` only matches
  shown messages without one. Why an earlier edit wins: `pmEditTarget`
  finds the edit shown on its own by its key, and `applyPmEdit` overwrites
  its text whatever the order of the two edits in time.

- Fields of an entry (built by `pmRecordEntry`,
  `src/bridge/live-parse.js:134-139`): `from`, `ts` (milliseconds),
  `archiveTs` (the record key of BetterChatango's database, seconds with a
  fraction), `text`, `parts`, `embeds`, `key` (PM key of the message),
  `editId` (PM key of the original, for an edit), `replyId`.

- `tests/pm.js`: the suite for this code, loaded from the sources (no
  build needed). Its helpers (lines 10-14 and 47):
  `record(target, data, unread)`, `received(from, ts, body)`,
  `step(name, ok, detail)`, and `t.m` holds the functions under test,
  among them `mergePmHistory` and `pmRecordEntry`. The existing merge step
  (lines 102-109) uses bodies of this shape, where `<iKEY/>` is the PM key
  and `<eKEY/>` the key of the edited original:

  ```js
  record('gus', received('gus', '1700005000.5', '<n000/><iorig9876/>First'), 1),
  record('gus', received('gus', '1700005010.5', '<n000/><iedit4321/><m v="1"><g x12s000="0"><eorig9876/>First, fixed</g></m>'), 1),
  ```

  The step that follows it starts with the comment
  `/* Local storage refusing the migration flag: ...` (line 111).

- Conventions that apply (`docs/coding-conventions.md`):
  - Code in `src/` is ES5: `var`, `function`, no arrow functions.
  - "The state of `Root` stays JSON-serializable": a number or a boolean
    on a message is fine.
  - A comment exists only for a trap that would make someone "fix" the code
    by mistake. One line, English, no em-dash and no semicolon in its text.
  - Every new test is seen failing before the fix. ADR-0009 names "history
    merge" among the behaviours that get a test.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Install | `pnpm install --frozen-lockfile` | exit 0 |
| The suite alone, no build | `node tests/pm.js .` | 13 lines starting with `ok`, then `ERRORS: none` |
| All suites | `pnpm test` | every line of `== summary` starts with `pass`, exit 0, about 2.5 min |

`pnpm` only. `tests/pm.js` exits with 0 even when a step fails: read its
output. The runner (`pnpm test`) does that for you.

## Scope

**In scope** (the only files you should modify):
- `src/app/pm.js` (`pmMessage`, `applyPmEdit`, `mergePmHistory`)
- `tests/pm.js`

**Out of scope** (do NOT touch):
- `src/core/selectors.js`: `pmEditTarget` and `pmShownIndex` stay as they
  are.
- The group side (`mergeEdits` in `src/app/live-state.js`): it already
  folds edits.
- Removing a message from this browser (`removePm`): not changed.
- Unread counts: they come from the archive only (ADR-0012).
- `CHANGELOG.md` and `@version`.

## Git workflow

- Branch: `fix/pm-edit-across-history-pages`
- One commit. Conventional Commits with a body wrapped at 72 columns.
  Suggested subject:
  `fix(pm): fold an edit into its original read from an older page`.
- No `Co-Authored-By` line and no generated footer.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Make the test fail first

In `tests/pm.js`, right before the comment line that starts with
`/* Local storage refusing the migration flag:` (line 111), add:

```js
  /* Merge in pages: an edit read before its original, which an older page brings later, folds into it, and an earlier edit read after it does not win */
  const foldOrig = t.m.pmRecordEntry(record('gus', received('gus', '1700007000.5', '<n000/><ifold0001/>Draft'), 0));
  const foldEarly = t.m.pmRecordEntry(record('gus', received('gus', '1700007010.5', '<n000/><iedta0002/><m v="1"><g x12s000="0"><efold0001/>Draft, second</g></m>'), 0));
  const foldLate = t.m.pmRecordEntry(record('gus', received('gus', '1700007020.5', '<n000/><iedtb0003/><m v="1"><g x12s000="0"><efold0001/>Draft, final</g></m>'), 0));
  const paged = { messages: [] };
  t.m.mergePmHistory(paged, [foldLate], () => {});
  t.m.mergePmHistory(paged, [foldOrig, foldEarly], () => {});
  step('an edit read before its original folds into it when an older page brings the original, and the newest edit keeps its text',
    paged.messages.length === 1 && paged.messages[0].text === 'Draft, final' && paged.messages[0].edited && paged.messages[0].archiveTs === 1700007000.5 && paged.messages[0].ts === 1700007000500,
    paged.messages.map(x => ({ key: x.key, text: x.text, edited: !!x.edited, ts: x.ts, archiveTs: x.archiveTs })));

```

**Verify**: `node tests/pm.js .` → a line starting with
`FAIL an edit read before its original folds into it` whose detail lists two
messages, texts `Draft` and `Draft, second`. This is the expected red state
(observed while writing this plan).

### Step 2: Remember that a message is an edit shown on its own, and when it was edited

In `src/app/pm.js`:

1. In `pmMessage`, replace
   `if (x.editId) { m.edited = true; m.editKeys = x.key ? [x.key] : []; }`
   with
   `if (x.editId) { m.edited = true; m.editKeys = x.key ? [x.key] : []; m.editTs = x.ts; m.editOnly = true; }`

2. In `applyPmEdit`, replace the last line `applyEdit(o, x);` with:

   ```js
   // History pages are read newest first: an edit older than the one applied must not bring its text back.
   if (x.ts < (o.editTs || 0)) return;
   o.editTs = x.ts;
   applyEdit(o, x);
   ```

3. In `mergePmHistory`, replace the line `c.messages.push(m);` with:

   ```js
   // An edit read on a newer page stands for its original until an older page brings it: the original takes its place and keeps the edited text.
   var e = x.editId ? null : c.messages.find(function (y) { return y.editOnly && y.key === m.key && y.from === m.from; });
   if (e) { delete e.editOnly; e.ts = m.ts; e.archiveTs = m.archiveTs; if (m.replyTo) e.replyTo = m.replyTo; return; }
   c.messages.push(m);
   ```

   There is one `c.messages.push(m);` inside `mergePmHistory`. Do not touch
   the ones in `addSentPm` and `receivePm`.

**Verify**: `node tests/pm.js .` → 13 lines starting with `ok`, no `FAIL`,
`ERRORS: none`. Then `pnpm test` → every line of `== summary` starts with
`pass`, exit 0.

## Test plan

- One new `pm` step (Step 1): three entries of one message (original,
  earlier edit, later edit), merged as two pages in the order the
  application reads them, newest page first.
- Pattern: the merge step right above it (`tests/pm.js:102-109`).
- The existing steps of `pm` and the PM steps of `live_ui` (edits applied
  live, history replayed on each `OK`) must stay green: they cover the
  paths where the original is already loaded.

## Done criteria

- [ ] `node tests/pm.js .` prints 13 lines starting with `ok` and none starting with `FAIL`
- [ ] `pnpm test` exits 0 and every summary line starts with `pass`
- [ ] `grep -c "editOnly" src/app/pm.js` prints `2`
- [ ] `git status --short` lists only the two in-scope files (plus `plans/README.md`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The three functions do not match the excerpts.
- Step 1 does not produce the `FAIL` with the two messages.
- After Step 2, a `live_ui` step about a PM edit fails (search its output
  for `edit`): the time guard of `applyPmEdit` then refuses an edit it
  should apply. Report the step and its detail.

## Maintenance notes

- `editTs` compares the time of two edits of the same message. A live
  edit uses the time of its frame or of the local clock, an archived one
  the time BetterChatango stored: the same edit replayed from the history
  has a time equal or close, and is applied again or skipped with the same
  text either way. Two different edits less apart than the clock
  difference between the device and Chatango could be ordered wrongly.
  That needs two edits within a second or so.
- `editOnly` and `editTs` live on the message in the state, in memory
  only. Nothing is stored.
- Not fixed here: "Remove from this browser" on a message that was shown
  as an edit on its own.
- Suggested `CHANGELOG.md` line, under `### Fixed`: "An edited private
  message no longer shows twice after loading older messages."
