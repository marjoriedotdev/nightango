# Plan 010: The selected @name suggestion stays inside the list when the list shrinks

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report. Do not improvise. When done, update the status row for this plan
> in `plans/README.md`, unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 0b829ea..HEAD -- src/views/group.js`
> If the file changed since this plan was written, compare the "Current
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

When the user types `@jo` in a group, a list of matching members opens above
the composer, and one entry is selected (arrow keys or hover move the
selection). The selected position is kept in component state and reused as
long as the typed text is the same. The list, though, is rebuilt on every
render from the members and message authors of the group, which change while
the list is open: a member leaves, or their only loaded message is trimmed.
If the list becomes shorter than the kept position, the render reads
`list[index].handle` on `undefined` and throws. An error during render
replaces the whole interface with the recovery screen, and the text being
typed is lost. One line fixes it.

## Current state

- `src/views/group.js:325-336`: the hook keeps the selection and derives
  the list on each render:

  ```js
  function useMentionCompletion(g, inputRef, value, setValue) {
    var app = useApp(), s = app.state;
    var a = useState(null), caretAt = a[0], setCaretAt = a[1];
    var b = useState({ key: '', index: 0 }), sel = b[0], setSel = b[1];
    var c = useState(-1), closedAt = c[0], setClosedAt = c[1];
    // Caret kept with the text it was read in: a text the view writes itself (edit, send, emoji) opens nothing.
    var before = caretAt && caretAt.value === value ? value.slice(0, caretAt.caret) : '';
    var m = MENTION_TOKEN.exec(before), start = m ? before.length - m[1].length - 1 : -1, key = m ? start + ' ' + m[1] : '';
    var list = g && m && start !== closedAt ? mentionCandidates(s, g, m[1]) : [];
    var open = list.length > 0, index = sel.key === key ? sel.index : 0;
  ```

  `key` only depends on the position of the `@` and on the typed letters.
  `index` is never compared with `list.length`.

- Three reads of `list[index]` follow, all reached while `open` is true:

  ```js
  // src/views/group.js:354 (Tab or Enter)
  if ((e.key === 'Tab' || e.key === 'Enter') && !e.shiftKey) accept(list[index]);
  // src/views/group.js:356 (arrow keys)
  else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') setSel({ key: key, index: (index + (e.key === 'ArrowDown' ? 1 : n - 1)) % n });
  // src/views/group.js:369 (during render)
  var said = open ? list[index].handle + ', ' + (index + 1) + ' of ' + list.length + '. Press Tab or Enter to insert it.' : '';
  ```

- `src/views/group.js:300-314`: `mentionCandidates` builds the list from
  `g.messages` (authors of loaded messages) and `g.members`, both part of
  the live state.

- The same situation is already handled in the command palette
  (`src/views/palette.js:21`), which is the pattern to follow:

  ```js
  var cur = Math.min(sel, Math.max(shown.length - 1, 0));
  ```

- An error thrown while rendering shows the recovery screen
  (`docs/architecture.md`, section "Mounting and display": "An error while
  rendering the interface or in one of its effects shows the recovery
  screen instead of an empty page").

- Conventions that apply (`docs/coding-conventions.md`):
  - Code in `src/` is ES5: `var`, `function`, no arrow functions.
  - A comment exists only for a trap that would make someone "fix" the code
    by mistake. One line, English, no em-dash and no semicolon in its text.
  - Tests are for complex behaviour only (ADR-0009): "A simple fix is
    checked by the existing suites and by the user in Tampermonkey."

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Install | `pnpm install --frozen-lockfile` | exit 0 |
| All suites | `pnpm test` | every line of `== summary` starts with `pass`, exit 0, about 2.5 min |

`pnpm` only. The runner judges a suite on its output too: a line starting
with `FAIL` or `CRASH`, or `ERRORS:` followed by anything but `none`, is a
failure.

## Scope

**In scope** (the only file you should modify):
- `src/views/group.js` (one line of `useMentionCompletion`)

**Out of scope** (do NOT touch):
- `mentionCandidates` and the order of the suggestions.
- The other completion of the composer (`:name` of the media library,
  `src/views/media.js`): it was not reviewed for this.
- `tests/`: no new test, see "Test plan".
- `CHANGELOG.md` and `@version`.

## Git workflow

- Branch: `fix/mention-suggestion-index`
- One commit. Conventional Commits with a body wrapped at 72 columns.
  Suggested subject:
  `fix(composer): keep the selected @name suggestion inside the list`.
- No `Co-Authored-By` line and no generated footer.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Clamp the index

In `src/views/group.js` line 334, replace

```js
var open = list.length > 0, index = sel.key === key ? sel.index : 0;
```

with

```js
// The list changes under the same typed text when a member leaves: the kept position stays inside it.
var open = list.length > 0, index = Math.min(sel.key === key ? sel.index : 0, Math.max(list.length - 1, 0));
```

Change nothing else in the hook: the three reads of `list[index]` are then
always inside the list while `open` is true.

**Verify**:
- `grep -c "Math.min(sel.key === key ? sel.index : 0, Math.max(list.length - 1, 0))" src/views/group.js` prints `1`.
- `pnpm test` → every line of `== summary` starts with `pass`, exit 0. The
  existing `live_ui` steps about the suggestions (search the output for
  `suggest`) must still start with `ok`.

## Test plan

- No new test. The fix is one clamp, the same as `src/views/palette.js:21`,
  and ADR-0009 keeps tests for complex behaviour.
- The existing `live_ui` steps that open the suggestions, move the
  selection and insert a name cover the unchanged behaviour.

## Done criteria

- [ ] `pnpm test` exits 0 and every summary line starts with `pass`
- [ ] The `grep -c` of Step 1 prints `1`
- [ ] `git status --short` lists only `src/views/group.js` (plus `plans/README.md`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Line 334 of `src/views/group.js` does not match the excerpt.
- A `live_ui` step about the suggestions fails after the change.

## Maintenance notes

- Any state that holds a position in a list derived from live data needs
  the same clamp at the point of use. The palette and this hook now both
  do it.
- Reviewer: one changed line plus its comment.
- Suggested `CHANGELOG.md` line, under `### Fixed`: "The @name suggestions
  no longer break the page when a suggested member leaves while the list is
  open."
