# Plan 001: The live_ui suite fails when a bridge operation throws anywhere in its scenario

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report. Do not improvise. When done, update the status row for this plan
> in `plans/README.md`, unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 0b829ea..HEAD -- tests/live_ui.js src/bridge/live-bridge.js`
> If either file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding. On a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `0b829ea`, 2026-11-13

## Why this matters

The bridge turns BetterChatango frames into operations, and the application
applies each one to its state. An operation whose handler throws is only
logged, and the state keeps its previous value. The `live_ui` suite, the main
safety net of live mode (about 190 steps), collects these logs but looks at
them once, a few lines after sign-in. A handler that starts throwing later in
the scenario leaves the suite green unless a later step happens to read the
exact state it dropped. Several other plans in `plans/` change the bridge and
the operation handlers: this plan lands first so that they are checked by it.

## Current state

- `src/bridge/live-bridge.js:6-8`: an operation that throws is logged and
  nothing else happens:

  ```js
  function deliverOp(fn, op) {
    try { fn(op); } catch (e) { console.warn('[torch-skin] could not apply the ' + op.op + ' operation:', e); }
  }
  ```

- `tests/live_ui.js:9-14`: the suite records these warnings, then tolerates
  every `[torch-skin]` warning:

  ```js
  // The bridge only logs an operation that throws: the steps read these logs.
  const opFailures = [];
  vc.on('warn', e => {
    if (/^\[torch-skin\] could not apply/.test(String(e))) opFailures.push(String(e));
    if (!/act\(|ReactDOM.render|useLayoutEffect|\[torch-skin\]/.test(String(e))) errors.push('warn: ' + String(e).slice(0, 300));
  });
  ```

- `opFailures` is read once, at `tests/live_ui.js:351`
  (`const earlyFailures = opFailures.slice();`), and that copy is asserted
  at `tests/live_ui.js:584`. Nothing reads it afterwards.

- The scenario ends at `tests/live_ui.js:2344-2347`:

  ```js
    console.log(log.join('\n'));
    console.log('ERRORS: ' + (errors.length ? '\n' + errors.join('\n') : 'none'));
    process.exit(log.some(l => l.indexOf('FAIL') === 0) || errors.length ? 1 : 0);
  })().catch(e => { console.log(log.join('\n')); console.error('CRASH', e); process.exit(2); });
  ```

- A step is recorded with `step(name, ok, detail)` (`tests/live_ui.js:336`):

  ```js
  function step(name, ok, detail) { log.push((ok ? 'ok   ' : 'FAIL ') + name + (ok || detail === undefined ? '' : ' -> ' + JSON.stringify(detail))); }
  ```

- Checked while writing this plan, in a disposable clone at `0b829ea`: with
  the step of Step 2 added, `node tests/live_ui.js .` prints
  `ok   no bridge operation failed to apply during the scenario` and
  `ERRORS: none`. The list is empty today.

- Conventions that apply (`docs/coding-conventions.md`):
  - Test files are modern JavaScript (arrow functions and `const` are fine
    in `tests/`). Code in `src/` is ES5.
  - "Every new test is seen failing before the fix or the feature it
    protects."
  - A `//` comment fits on one line, in English, with no em-dash and no
    semicolon in its text.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Install | `pnpm install --frozen-lockfile` | exit 0 |
| One suite | `pnpm test live_ui` | builds, then `pass  live_ui (N ok)`, exit 0, about 90 s |
| All suites | `pnpm test` | every line of `== summary` starts with `pass`, exit 0, about 2.5 min |

`pnpm` only. Node 24 is expected (`engines`). Node 22 works with a warning.
The runner judges a suite on its output too: a line starting with `FAIL` or
`CRASH`, or `ERRORS:` followed by anything but `none`, is a failure.

## Scope

**In scope** (the only file you should commit a change to):
- `tests/live_ui.js`

**Touched temporarily and restored** (Step 1 only):
- `src/app/live-ops.js`

**Out of scope** (do NOT touch):
- `src/bridge/live-bridge.js`: `deliverOp` logging and carrying on is the
  documented behaviour (`docs/architecture.md`, "one that throws is logged
  to the console ... and stops neither the other listeners nor the step
  that emits").
- `tests/live_login.js`: it makes a handler throw on purpose and asserts
  the log line. It has its own window and is not affected.
- Tolerating fewer `[torch-skin]` warnings in general: the scenario
  produces expected ones (refused requests, failed sends).

## Git workflow

- Branch: `test/live-ui-op-failures`
- One commit. Conventional Commits with a body wrapped at 72 columns that
  says what changed and why. Suggested subject:
  `test(live_ui): fail on a bridge operation that throws`.
- No `Co-Authored-By` line and no generated footer.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: See the gap

Make one operation handler throw, to prove the suite does not notice. In
`src/app/live-ops.js`, find the line that starts with `case 'histEnd':`
(line 206) and insert, right after the colon, `throw new Error('plan 001 probe');`
so the line starts with:

```js
case 'histEnd': throw new Error('plan 001 probe'); groupUpdate(update, op.gid, ...
```

**Verify**: `pnpm test live_ui`. Write down whether the summary says
`pass  live_ui` or `FAIL  live_ui`, and which steps failed. Either result is
acceptable here: the point is that no step names the `histEnd` operation.
Keep the probe in place for Step 2.

### Step 2: Add the end-of-scenario step

In `tests/live_ui.js`, right before the line `console.log(log.join('\n'));`
near the end of the async function (line 2344), add:

```js
  step('no bridge operation failed to apply during the scenario', opFailures.length === 0, opFailures);
```

**Verify** (probe still in place): `pnpm test live_ui` → the output contains
a line starting with
`FAIL no bridge operation failed to apply during the scenario` whose detail
mentions `could not apply the histEnd operation`.

### Step 3: Remove the probe

Restore the source file: `git checkout -- src/app/live-ops.js`.

**Verify**:
- `git diff --stat -- src/` prints nothing.
- `pnpm test` → the output contains
  `ok   no bridge operation failed to apply during the scenario`, every line
  of `== summary` starts with `pass`, exit 0.

## Test plan

- The new step is the test. It was seen failing in Step 2 with a handler
  that throws, and passing in Step 3 without it.
- Pattern: any `step(...)` call of `tests/live_ui.js`, for example the one
  at line 583 that asserts `!earlyFailures.length`.

## Done criteria

- [ ] `pnpm test` exits 0 and every summary line starts with `pass`
- [ ] `grep -c "no bridge operation failed to apply during the scenario" tests/live_ui.js` prints `1`
- [ ] `grep -rn "plan 001 probe" src/ tests/` returns no match
- [ ] `git status --short` lists only `tests/live_ui.js` (plus `plans/README.md`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at the locations in "Current state" does not match the excerpts.
- In Step 3, with the probe removed, the new step is `FAIL`: an operation
  really fails during the scenario. Report the content of the detail (the
  list of operations). Do not add an allow list to make it pass.
- In Step 2, the new step is `ok` although the probe is in place: the
  `histEnd` operation is then not emitted by the scenario. Report it and
  try `case 'moreLoaded':` (line 207) as the probe before giving up.

## Maintenance notes

- A future test that makes an operation throw on purpose inside `live_ui`
  must empty `opFailures` after asserting it (`opFailures.length = 0`), or
  this step will fail.
- Reviewer: the diff must be one added line in `tests/live_ui.js` and
  nothing under `src/`.
- Deferred: the same end-of-scenario check for unexpected `[torch-skin]`
  warnings in general. It needs an allow list of the expected ones and is
  not worth its maintenance today.
