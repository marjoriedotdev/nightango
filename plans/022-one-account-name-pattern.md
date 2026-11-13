# Plan 022: The account name pattern is written once

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report. Do not improvise. When done, update the status row for this plan
> in `plans/README.md`, unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `grep -rn "a-z0-9_-\]{1,20}" src/`
> Compare the output with the list in "Current state". Other plans edit
> lines near some of these sites (plan 003 edits `fetchFullProfile`): the
> line numbers can move, the literals must still be the ones listed. A site
> that is missing or new is a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plans/003-read-failure-of-own-full-profile-on-refused-requests.md (same function in `src/bridge/live-bridge.js`: land it first to avoid a conflict)
- **Category**: tech-debt
- **Planned at**: commit `0b829ea`, 2026-11-13

## Why this matters

What counts as a Chatango account name is defined once, as `ACCOUNT_NAME`,
and then retyped as a literal in six other places. Three of them decide
whether the bridge sends a request for a profile. The repo's own convention
is "zero duplication from the second use". The day the rule changes (plan
005 shows names deserve care), six literals have to be found and changed
together, and one forgotten copy lets a name through that the others refuse.
This plan replaces the six copies with the constant. Behaviour is identical:
it is the same pattern.

## Current state

- `src/bridge/live-model.js:33`: the definition:

  ```js
  var ACCOUNT_NAME = /^[a-z0-9_-]{1,20}$/;
  ```

  It has no `g` flag, so `ACCOUNT_NAME.test(x)` keeps no state between
  calls.

- The six copies, each inside a function body (output of
  `grep -rn "a-z0-9_-\]{1,20}" src/` at `0b829ea`, without the definition
  and the two variants listed further down):

  ```
  src/views/dm.js:538:    if (!/^[a-z0-9_-]{1,20}$/.test(n)) { setErr('Enter a Chatango username.'); return; }
  src/views/discover.js:54:    if (LIVE ? !/^[a-z0-9_-]{1,20}$/.test(n) : !/^[a-z0-9-]{3,20}$/.test(n)) x.name = LIVE ? 'Use up to 20 letters, numbers, - or _.' : 'Use 3 to 20 lowercase letters, numbers or dashes.';
  src/settings/group-staff.js:17:    if (!/^[a-z0-9_-]{1,20}$/.test(n)) { setErr('Enter a Chatango username.'); return; }
  src/bridge/live-bridge.js:83:    if (!/^[a-z0-9_-]{1,20}$/.test(n) || now - (refreshedAt[n] || 0) < REFRESH_MS) return;
  src/bridge/live-bridge.js:1269:      if (!/^[a-z0-9_-]{1,20}$/.test(n)) return Promise.reject(new Error('Guests have no profile.'));
  src/bridge/live-bridge.js:1627:      if (!/^[a-z0-9_-]{1,20}$/.test(n)) return Promise.resolve('');
  ```

- Two near variants that must stay as they are:

  ```
  src/app/live-state.js:62:var SPACE_MEMBER = /^(group|dm):[a-z0-9_-]{1,20}$/;
  src/bridge/live-parse.js:140:var PM_TARGET = /^[A-Za-z0-9_-]{1,20}$/;
  ```

  `SPACE_MEMBER` also covers group ids, and `PM_TARGET` accepts capitals
  on purpose (BetterChatango stores the name as typed).

- In `src/views/discover.js:54`, only the first pattern (the `LIVE`
  branch) is the account name pattern. The second one,
  `/^[a-z0-9-]{3,20}$/`, is the rule of the prototype's simulated group
  creation: leave it.

- All files of `src/` are glued into one scope by the build, in the order
  of `APP_SOURCES` (`scripts/build.mjs`). `bridge/live-model.js` comes
  before every file listed above, and each use is inside a function, so
  `ACCOUNT_NAME` is defined when they run. It is already used that way in
  `src/core/rich-text.js:133` and `src/app/live-state.js:55`.

- Conventions that apply (`docs/coding-conventions.md`):
  - Code in `src/` is ES5.
  - "Zero duplication from the second use."
  - Tests are for complex behaviour only (ADR-0009): a rename-level change
    is checked by the existing suites.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Install | `pnpm install --frozen-lockfile` | exit 0 |
| All suites | `pnpm test` | every line of `== summary` starts with `pass`, exit 0, about 2.5 min |

`pnpm` only.

## Scope

**In scope** (the only files you should modify):
- `src/views/dm.js`
- `src/views/discover.js`
- `src/settings/group-staff.js`
- `src/bridge/live-bridge.js`

**Out of scope** (do NOT touch):
- `ACCOUNT_NAME` itself, `SPACE_MEMBER`, `PM_TARGET`.
- The stricter patterns used to recognise a name inside a message
  (`src/core/rich-text.js:96-98`, `src/bridge/live-parse.js:107`): they
  answer another question.
- Error texts and behaviour.

## Git workflow

- Branch: `refactor/one-account-name-pattern`
- One commit. Conventional Commits with a body wrapped at 72 columns.
  Suggested subject:
  `refactor(names): use ACCOUNT_NAME where its pattern was retyped`.
- No `Co-Authored-By` line and no generated footer.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Replace the six literals

In each of the six lines listed in "Current state", replace
`/^[a-z0-9_-]{1,20}$/.test(n)` with `ACCOUNT_NAME.test(n)`. Nothing else on
those lines changes. For example `src/views/dm.js:538` becomes:

```js
if (!ACCOUNT_NAME.test(n)) { setErr('Enter a Chatango username.'); return; }
```

and `src/views/discover.js:54` becomes:

```js
if (LIVE ? !ACCOUNT_NAME.test(n) : !/^[a-z0-9-]{3,20}$/.test(n)) x.name = LIVE ? 'Use up to 20 letters, numbers, - or _.' : 'Use 3 to 20 lowercase letters, numbers or dashes.';
```

**Verify**:
- `grep -rn "a-z0-9_-\]{1,20}" src/` prints exactly three lines:
  `src/bridge/live-model.js` (the definition), `src/app/live-state.js`
  (`SPACE_MEMBER`) and `src/bridge/live-parse.js` (`PM_TARGET`).
- `pnpm test` → every line of `== summary` starts with `pass`, exit 0.

## Test plan

- No new test: the pattern is the same object as before. The existing
  suites exercise each site (`live_ui`: new PM to an unknown name, adding a
  moderator, group creation, profile reads; `allowed_calls`: the profile
  reads of the bridge).

## Done criteria

- [ ] The `grep -rn` of Step 1 prints exactly the three lines named
- [ ] `pnpm test` exits 0 and every summary line starts with `pass`
- [ ] `git status --short` lists only the four in-scope files (plus `plans/README.md`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The drift check shows a site that is not in the list, or one that is
  gone.
- A suite fails after the change. `tests/allowed_calls.js` compares the
  text of some call sites with `docs/betterchatango-protocol.md`: if it
  fails on a profile read, report its output instead of editing the doc.

## Maintenance notes

- New code that validates an account name uses `ACCOUNT_NAME`.
- If plan 005's follow-up ends up changing what a valid key is, this
  constant is now the one place.
- Reviewer: six one-token replacements, no other diff.
