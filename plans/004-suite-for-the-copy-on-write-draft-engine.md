# Plan 004: The copy-on-write draft engine has its own suite

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report. Do not improvise. When done, update the status row for this plan
> in `plans/README.md`, unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 0b829ea..HEAD -- src/core/draft.js tests/run.mjs docs/architecture.md`
> If `src/core/draft.js` changed since this plan was written, the expected
> results of Step 2 may differ: compare the "Current state" excerpts against
> the live code and treat a mismatch as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `0b829ea`, 2026-11-13

## Why this matters

Every change of the application state goes through `src/core/draft.js`, a
hand-written engine of 175 lines built on `Proxy`: it copies only the objects
a change reaches and shares the rest with the previous state. A regression
there leaves a proxy inside the state or loses a write, and nothing fails at
the point of the bug. It shows up later as a wrong unread count or a row that
no longer updates. No suite tests the engine directly today. The file is pure
(no React, no DOM), so a suite is cheap, and plan 005 changes how names are
looked up in the state right next to it.

## Current state

- `src/core/draft.js` exposes three top-level functions used by the rest of
  the application: `openDraft(base)` returns `{ root, finish }`,
  `plainOf(v)` returns the plain object behind a draft, and the constant
  `DRAFT` is the symbol under which a draft proxy gives its node.

  ```js
  // src/core/draft.js:172-175
  function openDraft(base) {
    var scope = { open: true, fresh: new Set() }, root = draftNode(base, null, scope);
    return { root: root.proxy, finish: function () { scope.open = false; return settleNode(root); } };
  }
  ```

  ```js
  // src/core/draft.js:26-29
  function markChanged(n) {
    if (!n.scope.open) throw new Error('State changed outside update');
    for (var x = n; x && !x.copy; x = x.parent) x.copy = shallowCopy(x.base);
  }
  ```

- `src/app/root.js:88-93` is the only caller of `openDraft`:

  ```js
  update: function (fn) {
    var draft = openDraft(ref.current);
    // An update that throws changes nothing.
    try { fn(draft.root); } catch (e) { draft.finish(); throw e; }
    ref.current = draft.finish();
  ```

- `docs/architecture.md`, section "React state", states the invariants this
  suite pins: "only the objects a change reaches are copied, from the
  changed one up to the root, and the next state shares every other object
  with the previous one", "An update that throws changes nothing, and a
  draft written after its update throws".

- No file under `tests/` mentions `openDraft` or `plainOf`
  (`grep -rn "openDraft\|plainOf" tests/` prints nothing).

- `tests/run.mjs:6` lists the suites the runner knows. A suite that is not
  in this list never runs:

  ```js
  const SUITES = ['smoke', 'live_ui', 'layers', 'pm', 'member_content', 'markup', 'loader', 'live_login', 'avatar', 'moon', 'new_year', 'check_ds', 'allowed_calls', 'perf', 'voice'];
  ```

  The runner starts each suite as `node tests/<name>.js .` from the
  repository root, counts the lines starting with `ok`, and fails a suite
  on a non-zero exit code or on an output line starting with `FAIL` or
  `CRASH`.

- Exemplar to follow: `tests/new_year.js`. It loads one source file with
  `vm.runInNewContext` and prints one `ok  ` or `FAIL` line per check:

  ```js
  const fs = require('fs'), vm = require('vm');
  const util = {};
  vm.runInNewContext(fs.readFileSync(process.argv[2] + '/src/core/util.js', 'utf8'), util);
  const check = (c, msg, detail) => console.log((c ? 'ok  ' : 'FAIL') + ' ' + msg + (c || !detail ? '' : ' ' + JSON.stringify(detail)));
  ```

- `docs/architecture.md`, section "Tests", has one bullet per suite. The
  last one today is `voice` (line 219).

- Conventions that apply (`docs/coding-conventions.md`):
  - Files under `tests/` are modern JavaScript. Functions in Node scripts
    have a multiline JSDoc: a one-sentence summary with no comma, and one
    `@param` per parameter.
  - A `//` comment fits on one line, in English, with no em-dash and no
    semicolon in its text.
  - "Every new test is seen failing before the fix or the feature it
    protects." For a suite written after its code, Step 3 does this by
    breaking the engine on purpose, then restoring it.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Install | `pnpm install --frozen-lockfile` | exit 0 |
| The suite alone, no build | `node tests/draft.js .` | 14 lines starting with `ok`, exit 0, under a second |
| Through the runner | `pnpm test draft` | builds, then `pass  draft (14 ok)`, exit 0 |
| All suites | `pnpm test` | every line of `== summary` starts with `pass`, exit 0, about 2.5 min |

`pnpm` only.

## Scope

**In scope** (the only files you should modify or create):
- `tests/draft.js` (create)
- `tests/run.mjs` (the `SUITES` line only)
- `docs/architecture.md` (one bullet added in section "Tests")

**Touched temporarily and restored** (Step 3 only):
- `src/core/draft.js`

**Out of scope** (do NOT touch):
- Any lasting change to `src/core/draft.js`. This plan describes what the
  engine does today. If a check fails on the unmodified engine, that is a
  finding to report, not something to fix here.
- `tests/perf.js`: it already measures sharing on a busy state. Do not
  move or duplicate its checks.

## Git workflow

- Branch: `test/draft-engine-suite`
- One commit. Conventional Commits with a body wrapped at 72 columns.
  Suggested subject: `test(draft): suite for the copy-on-write drafts`.
- No `Co-Authored-By` line and no generated footer.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Create the suite

Create `tests/draft.js` with exactly this content. It was run against
`src/core/draft.js` at commit `0b829ea` while writing this plan: all 14
checks pass.

```js
// State drafts: copy on write, sharing, drafts held at a second place and writes after the update, on src/core/draft.js.
const fs = require('fs'), vm = require('vm');
const ctx = {};
vm.runInNewContext(fs.readFileSync(process.argv[2] + '/src/core/draft.js', 'utf8'), ctx);
const check = (c, msg, detail) => console.log((c ? 'ok  ' : 'FAIL') + ' ' + msg + (c || detail === undefined ? '' : ' ' + JSON.stringify(detail)));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
/**
 * Applies a change to a draft of a state and returns the next state.
 * @param {object} base State the draft starts from.
 * @param {Function} fn Change applied to the draft.
 */
function next(base, fn) { const d = ctx.openDraft(base); fn(d.root); return d.finish(); }
/**
 * Tells whether a draft proxy is left anywhere in a value.
 * @param {*} v Value to walk.
 */
function holdsDraft(v) { return v !== null && typeof v === 'object' && (!!v[ctx.DRAFT] || Object.keys(v).some((k) => holdsDraft(v[k]))); }
const world = () => ({ users: { ana: { status: 'online', style: { bold: true } }, bob: { status: 'offline', style: {} } }, groups: { a: { messages: [{ id: 1, ts: 10 }, { id: 2, ts: 20 }], unread: 0 }, b: { messages: [], unread: 3 } }, route: { view: 'group', id: 'a' } });

/* Sharing: only the objects a change reaches are copied, from the changed one up to the root */
let base = world(), frozen = JSON.stringify(base);
let out = next(base, (d) => { d.groups.a.unread = 5; });
check(out !== base && out.groups !== base.groups && out.groups.a !== base.groups.a && out.groups.a.unread === 5, 'a change copies its object and the ones above it');
check(out.users === base.users && out.groups.b === base.groups.b && out.route === base.route && out.groups.a.messages === base.groups.a.messages, 'every other object is shared with the previous state');
check(JSON.stringify(base) === frozen, 'the previous state is never changed');
check(next(base, (d) => { d.groups.a.unread = 0; d.route.view = 'group'; void d.users.ana.style.bold; }) === base, 'reads and writes of the same value keep the state itself');
out = next(base, (d) => { delete d.users.bob; });
check(!('bob' in out.users) && out.users.ana === base.users.ana && 'bob' in base.users, 'a deleted key leaves the copy only');

/* Arrays: moves run on the copy, a sort that changes nothing keeps the array */
out = next(base, (d) => { d.groups.a.messages.push({ id: 3, ts: 30 }); });
check(out.groups.a.messages.length === 3 && base.groups.a.messages.length === 2 && out.groups.a.messages[0] === base.groups.a.messages[0], 'push copies the array and shares its elements');
out = next(base, (d) => { d.groups.a.messages.sort((x, y) => x.ts - y.ts); });
check(out === base, 'sorting a sorted array keeps the state itself');
out = next(base, (d) => { d.groups.a.messages[1].ts = 5; d.groups.a.messages.sort((x, y) => x.ts - y.ts); });
check(same(out.groups.a.messages, [{ id: 2, ts: 5 }, { id: 1, ts: 10 }]) && out.groups.a.messages[1] === base.groups.a.messages[0] && !holdsDraft(out), 'a sort moves a changed element with its change and leaves no draft', out.groups.a.messages);
out = next(base, (d) => { d.groups.a.messages[1].ts = 99; d.groups.a.messages.splice(0, 1); });
check(same(out.groups.a.messages, [{ id: 2, ts: 99 }]) && !holdsDraft(out), 'splice keeps the change of an element read before it', out.groups.a.messages);

/* A draft held at a second place, or inside an object given during the draft, settles to the same object */
out = next(base, (d) => { d.pinned = d.groups.a; d.groups.a.unread = 7; });
check(out.pinned === out.groups.a && out.pinned.unread === 7 && !holdsDraft(out), 'a draft stored under a second key settles to the object of the first');
out = next(base, (d) => { d.mentionLog = [{ from: d.users.ana }]; d.users.ana.status = 'idle'; });
check(out.mentionLog[0].from === out.users.ana && out.users.ana.status === 'idle' && !holdsDraft(out), 'a draft inside a given object settles too');

/* plainOf: a scan reads the changes made so far without a draft per element */
let seen = null;
next(base, (d) => { d.groups.a.messages[0].ts = 11; seen = ctx.plainOf(d.groups.a.messages).map((m) => m.ts); });
check(same(seen, [11, 20]) && ctx.plainOf(base.groups.a) === base.groups.a, 'plainOf sees a child changed through the draft, and returns a plain value as is', seen);

/* After the update: a kept draft cannot be written, and the state it built stays as built */
let kept = null;
out = next(base, (d) => { kept = d.groups.a; d.groups.a.unread = 1; });
let threw = null;
try { kept.unread = 2; } catch (e) { threw = e.message; }
check(threw === 'State changed outside update' && out.groups.a.unread === 1, 'a draft written after its update throws and changes nothing', threw);
const d2 = ctx.openDraft(base);
try { d2.root.groups.a.unread = 9; throw new Error('handler failed'); } catch (e) { d2.finish(); }
check(JSON.stringify(base) === frozen, 'an update that throws leaves the previous state as it was');
```

**Verify**: `node tests/draft.js .` → 14 lines, each starting with `ok`,
exit 0.

### Step 2: Register the suite

In `tests/run.mjs` line 6, add `'draft'` to `SUITES`, right after `'pm'`:

```js
const SUITES = ['smoke', 'live_ui', 'layers', 'pm', 'draft', 'member_content', ...
```

In `docs/architecture.md`, section "Tests", add this bullet after the `pm`
bullet (the one that starts with ``- `pm`: PM unreads``):

```
- `draft`: copy-on-write drafts of the state, on `src/core/draft.js` alone: what a change copies and what it shares, array moves, a draft held at a second place or inside a given object, `plainOf`, a write after the update and an update that throws.
```

**Verify**: `pnpm test draft` → `pass  draft (14 ok)`, exit 0.

### Step 3: See the suite fail on a broken engine

Break the engine on purpose, once, to prove the suite has teeth. In
`src/core/draft.js` line 129, change

```js
  if (d) c[k] = settleNode(d);
```

to

```js
  if (d) c[k] = v;
```

**Verify**: `node tests/draft.js .` → at least these three lines start with
`FAIL`:
`a sort moves a changed element with its change and leaves no draft`,
`splice keeps the change of an element read before it`,
`a draft stored under a second key settles to the object of the first`.

Then restore the file: `git checkout -- src/core/draft.js`.

**Verify**: `git diff --stat -- src/` prints nothing, and `pnpm test` exits
0 with every summary line starting with `pass`, including
`pass  draft (14 ok)`.

## Test plan

- The suite is the deliverable: 14 checks in 5 groups (sharing, arrays, a
  draft held at a second place, `plainOf`, after the update).
- Structural pattern: `tests/new_year.js`.
- Verified while writing this plan: three separate one-line mutations of
  the engine (removing the throw of `markChanged`, the change of Step 3,
  removing the "nothing moved" early return of `moveElements`) each turn at
  least one check to `FAIL`.

## Done criteria

- [ ] `node tests/draft.js .` prints 14 lines starting with `ok` and exits 0
- [ ] `pnpm test` exits 0, and its summary contains `pass  draft (14 ok)`
- [ ] `grep -c "'draft'" tests/run.mjs` prints `1`
- [ ] `grep -c '^- `draft`:' docs/architecture.md` prints `1`
- [ ] `git diff --stat -- src/` prints nothing
- [ ] `git status --short` lists only `tests/draft.js`, `tests/run.mjs`, `docs/architecture.md` (plus `plans/README.md`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `src/core/draft.js` does not match the excerpts in "Current state".
- In Step 1, any check prints `FAIL` on the unmodified engine. Report the
  line. Do not edit the check to make it pass and do not edit the engine.
- In Step 3, the broken engine still passes all 14 checks.

## Maintenance notes

- A change to `src/core/draft.js` now has a direct test: add a check here
  for any new behaviour of the engine before relying on it in `src/app/`.
- The suite loads the file in a fresh `vm` context, with no `window`: the
  engine must stay free of DOM and React references.
- Reviewer: the diff must contain no change under `src/`.
- Deferred: a check of `__proto__` and `constructor` as keys. Plan 005
  deals with those names and adds its own checks.
