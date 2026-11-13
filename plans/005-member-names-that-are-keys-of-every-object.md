# Plan 005: A member named `constructor` or `__proto__` is handled like any other member

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report. Do not improvise. When done, update the status row for this plan
> in `plans/README.md`, unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 0b829ea..HEAD -- src/core/util.js src/core/selectors.js src/app/live-state.js src/views/profile.js src/views/members.js tests/live_ui.js`
> If any of these files changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding. On a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S for Steps 1 to 4 (the fix), plus S for Step 5 (an inventory, reported and not fixed)
- **Risk**: LOW
- **Depends on**: plans/004-suite-for-the-copy-on-write-draft-engine.md (recommended, not required: it guards the engine the lookups go through)
- **Category**: security
- **Planned at**: commit `0b829ea`, 2026-11-13

## Why this matters

The application keeps its members in a plain object keyed by lowercase name
(`state.users`). In JavaScript every plain object also answers to the keys
`constructor` and `__proto__`, inherited from `Object.prototype`. Both pass
the account name pattern of this repo. So a lookup such as
`state.users['constructor']` returns the built-in `Object` function for a
member that is not in the map, and the code then treats that function as the
member.

Checked while writing this plan, in a disposable clone at `0b829ea`: a group
message whose author is named `constructor` is never shown. The `msg`
operation throws, the bridge logs "could not apply the msg operation", and the
message is dropped. Any member can also post the text `@constructor`: it
becomes a button that opens a profile for that name.

After this plan, the member map is read by own key only, a member named
`constructor` shows like any other, and `__proto__` can never replace the
prototype of the map. The other maps keyed by a remote name are listed and
reported in Step 5, not changed here.

## Current state

- `src/bridge/live-model.js:33`: the account name pattern accepts both
  names:

  ```js
  var ACCOUNT_NAME = /^[a-z0-9_-]{1,20}$/;
  ```

- `src/core/selectors.js:21-23`: the read used by every view:

  ```js
  // One object for every unknown member: the rows that take its style as a prop keep the same props.
  var UNKNOWN_USER = { status: 'offline', about: '', style: {} };
  function userOf(state, name) { return state.users[name] || UNKNOWN_USER; }
  ```

- `src/app/live-state.js:213-221`: the function every live operation uses
  to get a member it is about to write on. `d` is a draft of the state:

  ```js
  function ensureLiveUser(d, name, local) {
    var u = d.users[name];
    if (!u) {
      u = d.users[name] = { status: 'online', about: '', style: {} };
      if ((liveBridge.ignoredUsers() || []).indexOf(name) >= 0) u.ignored = true;
      if (local.unstyled.indexOf(name) >= 0) u.unstyled = true;
    }
    return u;
  }
  ```

  For `constructor`, `d.users[name]` is the `Object` function, so `!u` is
  false and the callers write on that function.

- `src/views/profile.js:173-177`: the private note of a profile. For
  `constructor` and `__proto__`, the lookup is truthy, `saved.label` is
  `undefined`, and `label.trim()` throws during render:

  ```js
  function MemberNote(p) {
    var app = useApp(), saved = app.state.notes[p.name] || { label: '', note: '' };
    var a = useState(saved.label), label = a[0], setLabel = a[1];
    var b = useState(saved.note), note = b[0], setNote = b[1];
    var next = { label: label.trim(), note: note.trim() };
  ```

- `src/views/members.js:169-170`: the actions of a profile:

  ```js
  function useProfileActions(name, gid) {
    var app = useApp(), s = app.state, u = userOf(s, name), busy = !!s.friendAdds[name];
  ```

- `src/core/rich-text.js:131-135`: a mention whose name passes
  `ACCOUNT_NAME` is a button that calls `app.ui.openProfile(name, ...)`.

- `src/core/util.js:113`: where the new shared helper goes, next to the
  other name helpers:

  ```js
  function isGuest(name) { return /^[!#]/.test(name); }
  ```

  `src/core/util.js` is the second file of the build order, so a function
  declared there is visible in every other file of `src/` (the build
  concatenates all files of `src/` into one scope, see
  `docs/architecture.md`, section "Concatenation").

- The repo already avoids this trap in three places, with a comment each
  time, for example `src/bridge/live-model.js:136-137`:

  ```js
  // No prototype: the name comes from the member, constructor or __proto__ must find nothing.
  var EMOTICON_BY_NAME = EMOTICONS.reduce(function (o, e) { o[e.name] = e; return o; }, Object.create(null));
  ```

- How `tests/live_ui.js` feeds a group message and its final id (line 348
  and line 585-586), and how it opens a group (lines 578-582):

  ```js
  SB.renderGroup({ group: 'edits', header: 'Edits' });
  g('ok', 'edits', ['marjorie', '', '', '', '1700000000', '', '', '0']);
  g('inited', 'edits', []);
  await wait(50);
  click(byText('.tc-nav', 'edits')); await wait(50);
  ...
  g('b', 'edits', ['1700000300.1', 'Marjorie', '', 'u0', 'UNID0', 'tmp30', '9.9.9.9', '0', '', '<n000/><f x11000="0">Mine typo']);
  g('u', 'edits', ['tmp30', 'A-B_C=']);
  ```

  `opFailures` (`tests/live_ui.js:10`) collects the "could not apply"
  warnings. `w` is the jsdom window, `d` its document, `fakeGroup()`
  (`tests/live_ui.js:123`) builds a fake BetterChatango group, `key(el, k)`
  sends a keydown.

- Conventions that apply (`docs/coding-conventions.md`):
  - Code in `src/` is ES5: `var`, `function`, no arrow functions.
  - "Zero duplication from the second use: a constant, a helper or a small
    component that the change would copy from one file to another is shared
    right away, in `src/core/`."
  - A comment exists only for a trap that would make someone "fix" the code
    by mistake. One line, English, no em-dash and no semicolon in its text.
  - "No speculative guard." The guards of this plan answer an observed
    failure, reproduced by the test of Step 1.
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
- `src/core/util.js`
- `src/core/selectors.js`
- `src/app/live-state.js`
- `src/views/profile.js`
- `src/views/members.js`
- `tests/live_ui.js`

**Out of scope** (do NOT touch, even though they look related):
- `src/core/draft.js`: the draft engine returns the raw value for the
  key `__proto__` on purpose (line 72). The fix does not need a change
  there.
- `ACCOUNT_NAME`: do not make the pattern reject `constructor`: it can
  be a real account, and its messages must show.
- The other maps keyed by a remote name (`state.groups`, `state.dms`, the
  per-account data of `torch-skin:<username>`, the maps inside a group such
  as `g.live.mods`, the caches of the bridge). Step 5 lists them. Changing
  them is a separate decision.
- The prototype sample data (`src/core/sample-data.js`): its names are
  fixed.
- `CHANGELOG.md` and `@version`.

## Git workflow

- Branch: `fix/reserved-member-names`
- One commit. Conventional Commits with a body wrapped at 72 columns.
  Suggested subject:
  `fix(members): read the member map by own key only`.
- No `Co-Authored-By` line and no generated footer.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Make the test fail first

In `tests/live_ui.js`, find the comment line
`/* Session loss: signed in elsewhere, offline, connection lost, session expired */`
(line 2316). Insert this block right before it:

```js
  /* Names that are also keys of every object: constructor and __proto__ as an author and as mentions */
  C.groups.names = fakeGroup();
  SB.renderGroup({ group: 'names', header: 'Names' });
  g('ok', 'names', ['marjorie', '', '', '', '1700000000', '', '', '0']);
  g('inited', 'names', []);
  await wait(50);
  click(byText('.tc-nav', 'names')); await wait(50);
  const opsBefore = opFailures.length;
  g('b', 'names', ['1700009100.1', 'constructor', '', 'u7', 'UNID7', 'tmp97', '7.7.7.7', '0', '', '<n000/><f x11000="0">hello @__proto__ and @constructor']);
  g('u', 'names', ['tmp97', 'N-A_M=']);
  await wait(80);
  const reserved = { shown: !!$$('.log .tc-msg-text').find(x => x.textContent.includes('hello @__proto__')), ops: opFailures.slice(opsBefore) };
  const mention = $$('.log button.tc-mention').find(x => x.textContent === '@constructor');
  if (mention) { click(mention); await wait(80); }
  reserved.dialog = !!$('.profile-dialog'); reserved.recovery = !!$('.recovery');
  reserved.polluted = ['status', 'about', 'style', 'spelling', 'ignored'].filter(k => k in w.Object || k in w.Object.prototype);
  if (reserved.dialog) { key(d, 'Escape'); await wait(50); }
  step('a member named constructor and mentions of constructor and __proto__ write nothing on Object and open a profile, not the recovery screen',
    reserved.shown && !reserved.ops.length && reserved.dialog && !reserved.recovery && !reserved.polluted.length, reserved);
  click(byText('.tc-nav', 'Mentions')); await wait(50);

```

The last line puts the scenario back on the Mentions page, where the block
before it left it.

If plan 001 has landed, its step asserts that `opFailures` is empty at the end
of the scenario. In the red state of this step the list is not empty, so both
steps fail until Step 3. That is expected.

**Verify**: `pnpm test live_ui` → a line starting with
`FAIL a member named constructor and mentions of constructor and __proto__`
whose detail contains `"shown":false` and
`"ops":["[torch-skin] could not apply the msg operation:"]`. This is the
expected red state (observed while writing this plan).

### Step 2: Add the shared own-key lookup

In `src/core/util.js`, right above `function isGuest(name) {` (line 113), add:

```js
// Own key only: a name such as constructor is also a key of every object.
function ownOf(map, key) { return Object.prototype.hasOwnProperty.call(map, key) ? map[key] : undefined; }
```

**Verify**: `pnpm build` exits 0.

### Step 3: Read members by own key

1. `src/core/selectors.js:23`:

   ```js
   function userOf(state, name) { return ownOf(state.users, name) || UNKNOWN_USER; }
   ```

2. `src/app/live-state.js`, in `ensureLiveUser`, replace the line
   `var u = d.users[name];` with:

   ```js
   // Assigning __proto__ would replace the prototype of the map: this name gets a member that is never kept.
   if (name === '__proto__') return { status: 'offline', about: '', style: {} };
   var u = ownOf(d.users, name);
   ```

   Leave the rest of the function as it is. The assignment
   `d.users[name] = {...}` is safe for `constructor`: it creates an own
   key.

3. `src/views/profile.js:174`, in `MemberNote`:

   ```js
   var app = useApp(), saved = ownOf(app.state.notes, p.name) || { label: '', note: '' };
   ```

4. `src/views/members.js:170`, in `useProfileActions`:

   ```js
   var app = useApp(), s = app.state, u = userOf(s, name), busy = !!ownOf(s.friendAdds, name);
   ```

**Verify**: `pnpm test live_ui` → the step of Step 1 starts with `ok`, and
the summary says `pass  live_ui`. (Observed while writing this plan: with
exactly these four changes the whole suite passes.)

### Step 4: Run everything

**Verify**: `pnpm test` → every line of `== summary` starts with `pass`,
exit 0. Look at the `perf` suite in particular: `userOf` is called for every
row, and the time budgets of that suite must still hold.

### Step 5: List the other maps (report only, change nothing)

Run these searches and put the output in your final report, grouped as
"read with a remote name as key". Do not edit any of the sites.

```
grep -n "\.groups\[" -r src | wc -l
grep -n "\.dms\[" -r src | wc -l
grep -n "local\.\(channels\|sendChannels\|accents\|notes\|readTs\|badges\)\[" -r src
grep -n "\.live\.\(mods\|badges\|knownBadges\)\[" -r src
grep -n "modFlags\[\|\.staff\[\|notifyOnline\[\|retrying\[\|friendAdds\[" -r src
grep -n "profileCache\[\|fullProfileCache\[\|msgBgCache\[\|refreshedAt\[\|AVATAR_VERSION\[" -r src
```

**Verify**: the report contains the six outputs. No file changed:
`git status --short` lists only the six in-scope files.

## Test plan

- One new `live_ui` step (Step 1): a message authored by `constructor`
  that mentions `@__proto__` and `@constructor`, then a click on the
  `@constructor` mention. It asserts that the message shows, that no
  operation failed, that the profile dialog opens, that the recovery screen
  does not, and that nothing was written on `Object` or `Object.prototype`.
- Pattern: the block at `tests/live_ui.js:578-586`, which opens the group
  `edits` and feeds it a message the same way.
- No unit test of `ownOf`: it is one line, and the step above goes through
  it.

## Done criteria

- [ ] `pnpm test` exits 0 and every summary line starts with `pass`
- [ ] `grep -c "a member named constructor and mentions of constructor and __proto__" tests/live_ui.js` prints `1`
- [ ] `grep -c "function ownOf" src/core/util.js` prints `1`
- [ ] `grep -n "state.users\[name\] || UNKNOWN_USER" src/core/selectors.js` returns no match
- [ ] `git status --short` lists only the six in-scope files (plus `plans/README.md`)
- [ ] The final report contains the six search outputs of Step 5
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at the locations in "Current state" does not match the excerpts.
- Step 1 does not produce the `FAIL` described, or the scenario crashes
  (`CRASH`) instead of failing: the inserted block is then at the wrong
  place or a helper has another name.
- After Step 3, another step of `live_ui` fails that passed before, in
  particular in the session loss block that follows the insertion: the new
  group `names` then disturbs it. Report which step.
- The `perf` suite fails after Step 3.
- The fix seems to need a change in `src/core/draft.js` or in
  `ACCOUNT_NAME`.

## Maintenance notes

- This plan closes the member map and the two profile lookups that crash.
  The same inherited-key trap exists for every plain object read with a
  remote name as key: groups (a group can be named `constructor`),
  conversations, the per-account data, the staff maps of a group, the
  bridge caches. Step 5 lists them. The durable fix is a decision for the
  owner between two designs:
  1. maps without a prototype (`Object.create(null)`), which need the copy
     step of `src/core/draft.js` (`shallowCopy`) and the readers of
     `torch-skin:<username>` (`storedLocal`) to keep that property, or
  2. `ownOf` at every read site, which is many sites and easy to forget.
- New code that reads a map with a member name or a group id as key must
  use `ownOf`, or a map without a prototype.
- Reviewer: check that `ACCOUNT_NAME` and `src/core/draft.js` are
  untouched, and that the comment of `ensureLiveUser` stays (without it,
  the early return looks like dead code).
- Suggested `CHANGELOG.md` line, under `### Fixed`: "Messages from a member
  named constructor show, and a mention of that name opens their profile."
