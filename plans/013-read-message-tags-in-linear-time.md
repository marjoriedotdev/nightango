# Plan 013: A message body made of unclosed tags is read in milliseconds, not seconds

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report. Do not improvise. When done, update the status row for this plan
> in `plans/README.md`, unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 0b829ea..HEAD -- src/bridge/live-parse.js tests/member_content.js`
> If either file changed since this plan was written, compare the "Current
> state" excerpts against the live code before proceeding. On a mismatch,
> treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `0b829ea`, 2026-11-13

## Why this matters

Every message body received from Chatango, in a group or in a private
message, goes through `parseContent`. One of its patterns reads the image and
emoticon tags (`<i s="...">`). On a body that repeats the start of such a tag
without ever closing it, that pattern backtracks: its cost grows with the cube
of the length. Measured while writing this plan, on this machine: 165 ms for
2,900 characters (the length of one Chatango message), 4.2 s for 8,400
characters, 58 s for 20,000. The page is frozen meanwhile. Any member of a
joined group, and anyone who can send the account a private message, chooses
that body. A stored private message is parsed again on each history search
and unread count, and an imported history file can hold longer bodies. After
this plan the same tags are read in two simple steps, with identical results
and a cost that grows with the length.

## Current state

- `src/bridge/live-parse.js:108-116`: inside `parseContent`:

  ```js
  var body = s
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<i\s(?:[^>]*?\s)?s=["']?([^"'\s>]+)["']?[^>]*\/?>/gi, function (tag, src) {
      var m = embedOf(decodeHtml(src)), sm = /^sm:\/\/(.*)/i.exec(src);
      if (m) embeds.push(m);
      if (keepMedia) return ' ' + src + ' ';
      return sm ? emoticonText(sm[1], premium) : m ? ' ' : ' ' + src + ' ';
    })
    .replace(STRIKE_PAIR, '<s>$1</s>');
  ```

  The pattern does two things at once: it finds a tag (`<i`, one white
  space, anything up to the next `>`) and, inside it, an `s=` attribute
  with a non-empty value. One detail of its behaviour must be kept: when a
  tag holds an `s=` right after `<i ` **and** another `s=` further in the
  tag after a white space, the further one wins (the optional group
  `(?:[^>]*?\s)?` is tried first). A tag without any valid `s=` is left as
  it is.

- `tests/member_content.js`: the suite for member content read by the
  bridge. It already has budget checks of this kind. Its helpers (lines
  16-25):

  ```js
  const log = [];
  function step(name, ok, detail) { log.push((ok ? 'ok   ' : 'FAIL ') + name + (ok || detail === undefined ? '' : ' ' + JSON.stringify(detail))); }
  // Inputs far above the size cap of the Premium background file: a parse whose cost grows faster than its input runs past the budget.
  const LARGE = 100000, BUDGET_MS = 1000;
  ...
  function timed(parse) { const start = Date.now(), out = parse(); return { ms: Date.now() - start, out }; }
  ```

  `m.parseContent` is the function under test (line 13-14). The suite ends
  with (lines 90-92):

  ```js
    console.log(log.join('\n'));
    process.exit(0);
  } catch (e) {
  ```

  Names already taken in that file: `parts`, `image`, `trims`, `spaces`,
  `runs`, `large`, `slowCss`, `slowText`, `cssMisses`.

- Conventions that apply (`docs/coding-conventions.md`):
  - Code in `src/` is ES5: `var`, `function`, no arrow functions.
  - A comment exists only for a trap that would make someone "fix" the code
    by mistake. One line, English, no em-dash and no semicolon in its text.
  - Every new test is seen failing before the fix. ADR-0009 names
    "sanitizing of member content" among the behaviours that get a test.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Install | `pnpm install --frozen-lockfile` | exit 0 |
| The suite alone, no build | `node tests/member_content.js .` | 5 lines starting with `ok`, no `FAIL` |
| All suites | `pnpm test` | every line of `== summary` starts with `pass`, exit 0, about 2.5 min |

`pnpm` only. `tests/member_content.js` exits with 0 even when a step fails:
read its output. The runner (`pnpm test`) does that for you.

## Scope

**In scope** (the only files you should modify):
- `src/bridge/live-parse.js` (the one `.replace(...)` call quoted above)
- `tests/member_content.js`

**Out of scope** (do NOT touch):
- The other patterns of `parseContent`. They were reviewed: linear, or
  quadratic on a bounded input.
- What a tag turns into (emoticon text, embed, plain `src`): the body of
  the callback after `src` is known stays the same.
- `CHANGELOG.md` and `@version`.

## Git workflow

- Branch: `fix/message-tag-pattern`
- One commit. Conventional Commits with a body wrapped at 72 columns.
  Suggested subject:
  `fix(bridge): read the media tags of a message in linear time`.
- No `Co-Authored-By` line and no generated footer.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Make the test fail first

In `tests/member_content.js`, right before the line
`console.log(log.join('\n'));` that is followed by `process.exit(0);`
(line 90), add:

```js
  /* Message tags: emoticon and image tags read as before, and a body of unclosed tags read in one pass */
  const read = s => { const c = m.parseContent(s, false, false); return [c.text, c.embeds.map(e => e.url)]; };
  const tags = {
    image: read('<i s="https://i.example/a.png" w="10" h="10"/>'),
    later: read('<i s=x1 s=https://i.example/b.png>'),
    first: read("<i s='https://i.example/c.png'>"),
    none: read('<i w="1">kept</i>')
  };
  const TAGS_WANT = { image: ['', ['https://i.example/a.png']], later: ['', ['https://i.example/b.png']], first: ['', ['https://i.example/c.png']], none: ['kept', []] };
  const emoticon = read('a <i s="sm://lol" w="14.52" h="14.52"/> b');
  const unclosed = timed(() => m.parseContent('<i s=a '.repeat(1200), false, false).text.length);
  step('message tags: emoticon and image tags read, a body of unclosed tags read in one pass',
    JSON.stringify(tags) === JSON.stringify(TAGS_WANT) && emoticon[0].indexOf('sm://') < 0 && emoticon[0] !== 'a  b' && !emoticon[1].length && unclosed.ms <= BUDGET_MS,
    { tags, emoticon, ms: unclosed.ms });

```

The body of the timed case is 8,400 characters: small enough for the red
state to end in a few seconds.

**Verify**: `node tests/member_content.js .` → the last line starts with
`FAIL message tags: emoticon and image tags read, a body of unclosed tags read in one pass`.
Its detail shows `"tags"` equal to `TAGS_WANT` and `"ms"` in the thousands
(observed while writing this plan: `"ms":4239`). Only the time fails: that is
the expected red state.

### Step 2: Read the tag, then its attribute

In `src/bridge/live-parse.js`, replace these two lines

```js
    .replace(/<i\s(?:[^>]*?\s)?s=["']?([^"'\s>]+)["']?[^>]*\/?>/gi, function (tag, src) {
      var m = embedOf(decodeHtml(src)), sm = /^sm:\/\/(.*)/i.exec(src);
```

with

```js
    // Two steps, the tag then its s attribute: a single pattern for both backtracks for seconds on a body of unclosed tags.
    .replace(/<i\s[^>]*>/gi, function (tag) {
      // An s attribute further in the tag wins over the one right after <i, as the single pattern did.
      var rest = tag.slice(3), at = /\ss=["']?([^"'\s>]+)/i.exec(rest) || /^s=["']?([^"'\s>]+)/i.exec(rest);
      if (!at) return tag;
      var src = at[1], m = embedOf(decodeHtml(src)), sm = /^sm:\/\/(.*)/i.exec(src);
```

Leave the three lines that follow (`if (m) embeds.push(m);`, the `keepMedia`
line, the `return sm ? ...` line) and the closing `})` exactly as they are.
`tag.slice(3)` drops `<i` and the one white space after it.

**Verify**: `node tests/member_content.js .` → 5 lines, each starting with
`ok`. Then `pnpm test` → every line of `== summary` starts with `pass`,
exit 0.

## Test plan

- One new `member_content` step (Step 1). It pins four tag shapes and an
  emoticon, whose results are the same before and after the change, and
  one timed case that is the regression test.
- Pattern: the step `message text: long run of spaces trimmed in one pass`
  right above it, which uses `timed` and `BUDGET_MS` the same way.
- The `live_ui` steps about message content (search its output for
  `emoticon` and `embed`) and the `pm` suite parse real-shaped bodies and
  must stay green.
- Checked while writing this plan, outside the repo: the old pattern and
  the two-step version give the same output on 1,000,000 random strings
  built from tag fragments, and the two-step version takes 1.2 ms where
  the old one takes 165 ms (2,900 characters), 56 ms where it takes 58 s
  (20,000 characters).

## Done criteria

- [ ] `node tests/member_content.js .` prints 5 lines starting with `ok` and none starting with `FAIL`
- [ ] `pnpm test` exits 0 and every summary line starts with `pass`
- [ ] `grep -c "(?:\[^>\]\*?" src/bridge/live-parse.js` prints `0`
- [ ] `git status --short` lists only the two in-scope files (plus `plans/README.md`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The `.replace(...)` call does not match the excerpt.
- In Step 1, the detail of the `FAIL` shows `"tags"` different from
  `TAGS_WANT`: the pinned behaviour is not the current one. Report the
  detail, do not adjust `TAGS_WANT` to match after Step 2.
- After Step 2, a `live_ui` or `pm` step about message content fails.

## Maintenance notes

- A new pattern applied to a member's text must not combine an unbounded
  lazy part with an unbounded greedy part over the same characters. When
  one is added, give it a timed case in this suite.
- The preference for a later `s=` is kept only for identical behaviour. It
  has no known use: a real tag carries one `s=`.
- Reviewer: the callback must still return the tag unchanged when it has
  no valid `s=`, as the old pattern did by not matching.
- Suggested `CHANGELOG.md` line, under `### Security`: "A message made of
  unfinished image tags can no longer freeze the page."
