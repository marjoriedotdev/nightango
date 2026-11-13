# Plan 003: A refused or rate-limited read of the own full profile is a read failure, never an empty profile

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report. Do not improvise. When done, update the status row for this plan
> in `plans/README.md`, unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 0b829ea..HEAD -- src/bridge/live-bridge.js tests/live_ui.js docs/betterchatango-protocol.md`
> If any of these files changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding. On a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `0b829ea`, 2026-11-13
- **Needs owner confirmation**: yes. It changes a choice written in
  `docs/betterchatango-protocol.md:364`. See "STOP conditions".

## Why this matters

When the user saves their age, location or bio, Chatango's `updateprofile`
form also needs the full profile text, so Nightango reads `mod2.xml` first
when it does not know it. A `5xx` answer is already treated as a read failure
and nothing is saved. But a `403` or a `429` (a refused or rate-limited
request) is read as "this account has no full profile", and the save then
sends an empty `full_profile`: the user's full profile is erased on Chatango.
The trigger is rare, the loss is not recoverable. After this plan, only a
`404` or a reply that is not XML means "no full profile".

## Current state

- `src/bridge/live-bridge.js:1625-1638`: the read:

  ```js
  function fetchFullProfile(name) {
      var n = lower(name);
      if (!/^[a-z0-9_-]{1,20}$/.test(n)) return Promise.resolve('');
      var hit = fresh(fullProfileCache, n);
      if (hit) return Promise.resolve(hit.data);
      return fetch(CH.subdomain.mod2(n)).then(function (r) {
        // Server error rejected: read as an empty profile, it would erase the full profile on the next save.
        if (r.status >= 500) throw new Error('Chatango returned HTTP ' + r.status + ' for mod2.xml.');
        return r.ok ? r.text() : '';
      }).then(function (xml) {
        var doc = new DOMParser().parseFromString(xml, 'text/xml'), body = doc.querySelector('body');
        return !doc.querySelector('parsererror') && body ? unquote(body.textContent) : '';
      });
  }
  ```

- `src/bridge/live-bridge.js:1671-1680`: the save uses it when the page
  does not know the full profile (`p.full == null`), and a rejected read
  already stops the save:

  ```js
  function saveProfileNow(p) {
      var me = lower(C.user && C.user.name), sentFull;
      // Empty string sent as is: only a full profile unknown to the page is read again from Chatango.
      var full = p.full != null ? Promise.resolve(p.full) : fetchFullProfile(me).catch(function () { return null; });
      return full.then(function (fullText) {
        if (fullText === null) throw new Error('Your full profile could not be read. Nothing was saved.');
  ```

- `docs/betterchatango-protocol.md:364` records the current choice:

  > A 5xx response from `mod2.xml` is a read failure, not an empty full
  > profile: the Profile page shows the failure and a save sends nothing.
  > [...] A 4xx or a non-XML 200 response counts as a missing file, so an
  > empty profile.

- Observation made while writing this plan (2026-11-13, one anonymous GET
  of `mod2.xml` for a name that does not exist): Chatango answered
  `200` with `Content-Type: image/jpeg`. So a missing file is the
  "non-XML 200" case. That case must keep meaning "empty profile",
  otherwise an account without a full profile could never save. No `4xx`
  was observed for a missing file.

- Existing test, `tests/live_ui.js:1596-1605`: it sets the status of the
  fake `mod2.xml` to 500 through the variable `ownMod2Status`
  (`tests/live_ui.js:197`, used at `:239`), opens the Profile page, changes
  the location, saves, and checks that no `updateprofile` post went out:

  ```js
  /* Unreadable full profile (server error): saving another field sends nothing, never an empty full profile */
  const betterChatangoFull = d.querySelector('[data-text-field="full"]'), profileUpdates = () => posts.filter(p => /updateprofile/.test(p.url));
  betterChatangoFull.value = ''; ownMod2Status = 500;
  click(byText('.tc-nav', 'Password and email')); await until(() => !$('#pf-loc'));
  click(byText('.tc-nav', 'Profile')); await until(() => !!byText('.tc-hint', 'did not return your full profile'));
  const fullDown = { failed: !!byText('.tc-hint', 'did not return your full profile') };
  type($('#pf-loc'), 'Lille'); await until(() => !!$('.tc-savebar'));
  click($('.tc-savebar .tc-btn-primary')); await until(() => !!byText('.toast', 'Nothing was saved') || profileUpdates().length > 0);
  fullDown.toast = !!byText('.toast', 'could not be read. Nothing was saved'); fullDown.sent = profileUpdates().map(p => p.f.full_profile);
  step('full profile server error: saving another field sends nothing', fullDown.failed && fullDown.toast && fullDown.sent.length === 0, fullDown);
  betterChatangoFull.value = 'FULL PAGE'; ownMod2Status = 200;
  ```

- Conventions that apply (`docs/coding-conventions.md`):
  - Code in `src/` is ES5: `var`, `function`, no arrow functions.
  - A comment exists only for a trap that would make someone "fix" the code
    by mistake. One line, English, no em-dash and no semicolon in its text.
  - UI text and errors are in English and "say what to do".
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
- `src/bridge/live-bridge.js` (function `fetchFullProfile` only)
- `tests/live_ui.js`
- `docs/betterchatango-protocol.md` (line 364 only)

**Out of scope** (do NOT touch):
- `saveProfileNow` and the Profile page (`src/settings/live-account.js`):
  they already handle a rejected read.
- The reading of another member's full profile for display: it goes
  through the same function, and a rejected read there already shows an
  error state. Do not add a second code path.
- `mod1.xml`, `custom_profile.css`, `msgbg.xml`: reading them as empty
  erases nothing.
- `CHANGELOG.md` and `@version`.

## Git workflow

- Branch: `fix/full-profile-read-refused`
- One commit. Conventional Commits with a body wrapped at 72 columns.
  Suggested subject:
  `fix(profile): treat a refused read of the full profile as a failure`.
- No `Co-Authored-By` line and no generated footer.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Make the test fail first

In `tests/live_ui.js`, right after the `step('full profile server error: ...` line
(line 1605) and before the line `betterChatangoFull.value = 'FULL PAGE'; ownMod2Status = 200;`,
add a second case that repeats the same sequence with status 429. Reuse the
existing variables `betterChatangoFull` and `profileUpdates`:

```js
  /* Refused or rate-limited read: the same, a 4xx other than 404 is not a missing file */
  ownMod2Status = 429;
  const refusedFrom = profileUpdates().length;
  click(byText('.tc-nav', 'Password and email')); await until(() => !$('#pf-loc'));
  click(byText('.tc-nav', 'Profile')); await until(() => !!$('#pf-loc'));
  type($('#pf-loc'), 'Nantes'); await until(() => !!$('.tc-savebar'));
  // The toast of the case above is still shown: only a post tells that this save went out.
  click($('.tc-savebar .tc-btn-primary')); await until(() => profileUpdates().length > refusedFrom, 1500);
  const fullRefused = { sent: profileUpdates().slice(refusedFrom).map(p => p.f.full_profile) };
  step('full profile refused (429): saving another field sends nothing', fullRefused.sent.length === 0, fullRefused);
```

Do not wait on the "Nothing was saved" toast here: the toast of the 500 case
is still on screen, so that wait would return at once, before the post. This
was tried while writing this plan.

**Verify**: `pnpm test live_ui` → a line starting with
`FAIL full profile refused (429): saving another field sends nothing` whose
detail shows `"sent":[""]` (an empty full profile was sent). A later step,
`profile posted through BetterChatango`, also fails in this red state because
of that unwanted post. This is expected until Step 2.

### Step 2: Reject a refused read

In `src/bridge/live-bridge.js`, in `fetchFullProfile`, replace the two lines

```js
        // Server error rejected: read as an empty profile, it would erase the full profile on the next save.
        if (r.status >= 500) throw new Error('Chatango returned HTTP ' + r.status + ' for mod2.xml.');
        return r.ok ? r.text() : '';
```

with

```js
        // Only a missing file is an empty profile: any other failure read as empty would erase the full profile on the next save.
        if (!r.ok && r.status !== 404) throw new Error('Chatango returned HTTP ' + r.status + ' for mod2.xml.');
        return r.ok ? r.text() : '';
```

Leave the second `.then` (the XML parse) exactly as it is: a `200` that is
not XML must still give `''`.

Update the JSDoc `@returns` of the function (line 1623) to:
`@returns {Promise<string>} Empty string if the file is missing, rejected when Chatango refuses or fails the request.`

**Verify**: `pnpm test live_ui` → both
`ok   full profile server error: saving another field sends nothing` and
`ok   full profile refused (429): saving another field sends nothing`, and
`pass  live_ui`.

### Step 3: Align the protocol note

In `docs/betterchatango-protocol.md` line 364, replace the last sentence
`A 4xx or a non-XML 200 response counts as a missing file, so an empty profile.`
with:

`A 404 or a non-XML 200 response counts as a missing file, so an empty profile: on 2026-11-13 Chatango answered 200 with an image content type for a member without the file. Any other 4xx (refused or rate-limited) is a read failure, like a 5xx.`

Change the start of the same line from `A 5xx response from` to
`A 5xx response, or a 4xx other than 404, from`.

**Verify**: `grep -n "4xx other than 404" docs/betterchatango-protocol.md`
prints line 364, and `pnpm test` exits 0 with every summary line `pass`.

## Test plan

- One new `live_ui` step (Step 1), modelled on the 500 case right above it.
- The existing steps that read another member's full profile
  (`tests/live_ui.js:1434-1466`) and the one that saves the full profile as
  an empty string (`tests/live_ui.js:1614-1630`) must still pass: they prove
  that a normal read and a deliberate empty save are unchanged.

## Done criteria

- [ ] `pnpm test` exits 0 and every summary line starts with `pass`
- [ ] `grep -c "full profile refused (429)" tests/live_ui.js` prints `1`
- [ ] `grep -n "r.status >= 500" src/bridge/live-bridge.js` returns no match inside `fetchFullProfile`
- [ ] `git status --short` lists only the three in-scope files (plus `plans/README.md`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at the locations in "Current state" does not match the excerpts.
- The operator has not confirmed that the owner accepts changing the choice
  written in `docs/betterchatango-protocol.md:364`. This plan narrows a
  documented decision. Ask before Step 2.
- Step 1 does not produce the `FAIL` with `"sent":[""]`.
- Any existing profile step of `live_ui` turns to `FAIL` after Step 2, in
  particular one where the fake `mod2.xml` answers with a non-XML body: the
  second `.then` was changed by mistake.

## Maintenance notes

- The meaning of "missing file" rests on one observation (200 with an image
  content type). If Chatango is ever seen answering 403 for a member
  without a full profile, that member could no longer save their profile
  from Nightango: the error says "Your full profile could not be read.
  Nothing was saved." That is the safe failure, and the status list in
  `fetchFullProfile` is the place to widen.
- Reviewer: check that the XML parse branch is untouched, and that the
  error text shown to the user did not change.
- Suggested `CHANGELOG.md` line, under `### Fixed`: "Saving your profile no
  longer risks emptying your full profile when Chatango refuses the read."
