# Plan 007: A BetterChatango notice never gives Nightango a button that leaves the bridge

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

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plans/001-fail-live-ui-on-a-bridge-operation-that-throws.md (recommended: it guards the bridge changes)
- **Category**: security
- **Planned at**: commit `0b829ea`, 2026-11-13

## Why this matters

Nightango rule 1 says the HTTP calls it makes are a closed list
(`docs/betterchatango-protocol.md`, section "Allowed HTTP calls"), and rule 2
that connections go through its bridge. BetterChatango shows some of its
warnings with a button. The bridge turns every such warning into a Nightango
toast and gives the toast the same button, which runs BetterChatango's own
function. Two of those functions do exactly what the project excludes:

- "#g is not a registered group." with **Register**: posts to
  `vissle.me/chatango/room` with the vissle session key. The protocol doc
  says group registration never happens in live. An owner who creates or
  joins their group from Nightango gets this toast on each visit of the
  group, one click away from the call.
- "#g has a lot of users" with **Continue**: calls `client.connect`
  outside the bridge, the same second-socket problem the bridge already
  avoids for "You have disconnected from #g".

After this plan the first notice is not shown at all, and the second is shown
as text without its button.

## Current state

- `src/bridge/live-bridge.js:326-337`: the hook on `client.setNotice`.
  It already silences one notice for this exact reason:

  ```js
  if (typeof C.setNotice === 'function' && !C.setNotice.__skin) {
    var notice = C.setNotice;
    C.setNotice = function (data) {
      try {
        // The connection banner already shows it, and this BetterChatango Reconnect bypasses the bridge: the automatic retry would open a second socket.
        var lost = /^You have disconnected from #/.test(String(data && data.content));
        if (data && data.icon === 'warning' && data.content && !lost) alertOnce({ op: 'alert', text: String(data.content), button: data.button || null, action: typeof data.action === 'function' ? data.action : null });
      } catch (e) { warn(e); }
      return notice.apply(this, arguments);
    };
    C.setNotice.__skin = true;
  }
  ```

- `src/app/live-ops.js:282`: the toast gets the button when both are set:

  ```js
  case 'alert': if (!stateRef.current.session) toast(op.text, op.button && op.action ? { icon: 'info', action: { label: op.button, run: op.action } } : { icon: 'info' }); break;
  ```

- `reference/torch/inject.js` is a read-only copy of BetterChatango's code
  (never edit it, never load it). The two notices:

  ```js
  // reference/torch/inject.js:6122-6131
  if (rank.OWNER && this.settings.safety.groups.warn_unregister && !torch.groups[data.group].uid) {
    client.setNotice({enable: true, icon: "warning", color: "var(--theme-highlight)", content: `#${data.group} is not a registered group.`, button: "Register",
      action: () => {
        ...
        this.post(`${torch.domain}/chatango/room`, form, {
          key: true
        })
  ```

  ```js
  // reference/torch/inject.js:3240-3248
  client.setNotice({
    enable: true,
    icon: "warning",
    color: "var(--theme-highlight)",
    content: `#${room} has a lot of users`,
    button: "Continue",
    action: x => {
      client.connect(room).then(socket => {
  ```

- Forwarding a button is otherwise intended and tested. Do not remove it
  in general (`tests/live_ui.js:696-701`):

  ```js
  let reloads = 0;
  C.setNotice({ icon: 'warning', content: 'Relogin required.', button: 'Reload', action: () => { reloads++; } }); await until(() => !!byText('.toast', 'Relogin required.'));
  const t = byText('.toast', 'Relogin required.');
  step('BetterChatango warning becomes a toast with its action', !!t && !!byText('.toast button', 'Reload'));
  click(byText('.toast button', 'Reload'));
  step('toast action calls BetterChatango', reloads === 1);
  ```

- `docs/betterchatango-protocol.md:85` describes the silenced
  "You have disconnected" notice, and line 168 lists what "only happen from
  the BetterChatango screen, so never in live", ending with
  "group registration (`vissle /chatango/room`)".

- Conventions that apply (`docs/coding-conventions.md`):
  - Code in `src/` is ES5: `var`, `function`, no arrow functions.
  - A comment exists only for a trap that would make someone "fix" the code
    by mistake. One line, English, no em-dash and no semicolon in its text.
  - "An action that is not available in live says so clearly or
    disappears."
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
- `src/bridge/live-bridge.js` (the `C.setNotice` hook only)
- `tests/live_ui.js`
- `docs/betterchatango-protocol.md` (one bullet added after line 85)

**Out of scope** (do NOT touch):
- `src/app/live-ops.js`: the `alert` operation already shows a toast
  without a button when `action` is null.
- The buttons of the other notices ("Reload", "Retry" of an upload,
  "Thanks"). Whether they should stay is a separate question, noted in
  "Maintenance notes".
- `reference/torch/`.
- `CHANGELOG.md` and `@version`.

## Git workflow

- Branch: `fix/notice-actions-outside-the-bridge`
- One commit. Conventional Commits with a body wrapped at 72 columns.
  Suggested subject:
  `fix(bridge): drop the BetterChatango notice buttons that leave the bridge`.
- No `Co-Authored-By` line and no generated footer.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Make the test fail first

In `tests/live_ui.js`, right after the line
`step('toast action calls BetterChatango', reloads === 1);` (line 701), add:

```js
  /* Notices whose button leaves the bridge: registration posts to vissle, Continue connects outside the bridge */
  let outside = 0;
  C.setNotice({ icon: 'warning', content: '#test is not a registered group.', button: 'Register', action: () => { outside++; } });
  C.setNotice({ icon: 'warning', content: '#test has a lot of users', button: 'Continue', action: () => { outside++; } });
  await until(() => !!byText('.toast', 'has a lot of users'));
  const offBridge = { register: !!byText('.toast', 'not a registered group'), crowded: !!byText('.toast', 'has a lot of users'), buttons: $$('.toast button').map(b => b.textContent).filter(x => x === 'Register' || x === 'Continue') };
  step('BetterChatango notices that register a group or reconnect outside the bridge give no button', !offBridge.register && offBridge.crowded && !offBridge.buttons.length, offBridge);
```

**Verify**: `pnpm test live_ui` → a line starting with
`FAIL BetterChatango notices that register a group or reconnect outside the bridge give no button`
whose detail shows `"register":true` and both button labels. This is the
expected red state.

### Step 2: Filter the two notices in the hook

In `src/bridge/live-bridge.js`, inside the `C.setNotice` hook, replace the
two lines that start with `var lost =` and `if (data && data.icon === 'warning'`
with:

```js
          var text = String(data && data.content);
          var lost = /^You have disconnected from #/.test(text);
          // Its Register posts to vissle /chatango/room, a call outside the closed list (ADR-0001).
          var register = / is not a registered group\.$/.test(text);
          // Its Continue calls client.connect outside the bridge, like the Reconnect of the lost connection notice.
          var crowded = / has a lot of users$/.test(text);
          var action = data && typeof data.action === 'function' && !crowded ? data.action : null;
          if (data && data.icon === 'warning' && data.content && !lost && !register) alertOnce({ op: 'alert', text: text, button: action ? data.button || null : null, action: action });
```

Keep the comment line that is above `var lost` today, and the rest of the
hook, unchanged. `data` can be missing, which is why both lines test it
before reading a field.

**Verify**: `pnpm test live_ui` → the step of Step 1 starts with `ok`, the
two existing steps `BetterChatango warning becomes a toast with its action`
and `toast action calls BetterChatango` still start with `ok`, and the
summary says `pass  live_ui`.

### Step 3: Record it in the protocol notes

In `docs/betterchatango-protocol.md`, add this bullet right after the bullet
of line 85 (the one that starts with
`- BetterChatango never reconnects on its own.`):

```
- Two other warnings carry a button that leaves the bridge. "#g is not a registered group." (`inject.js:6123`, shown to the owner of a group vissle does not know, on each `setFocus`) offers Register, which posts to `vissle /chatango/room` with the session key: the bridge silences this notice, the call is outside the closed list. "#g has a lot of users" (`inject.js:3240`) offers Continue, which calls `client.connect` outside the bridge: the bridge shows its text without the button, and the connection banner offers the retry.
```

**Verify**: `grep -c "is not a registered group" docs/betterchatango-protocol.md`
prints `1`, and `pnpm test` exits 0 with every summary line `pass`.

## Test plan

- One new `live_ui` step (Step 1), placed after the existing notice steps
  and modelled on them (`tests/live_ui.js:696-701`).
- The existing "Relogin required." steps are the guard that a legitimate
  button is still forwarded.

## Done criteria

- [ ] `pnpm test` exits 0 and every summary line starts with `pass`
- [ ] `grep -c "give no button" tests/live_ui.js` prints `1`
- [ ] `grep -c "is not a registered group" src/bridge/live-bridge.js` prints `1`
- [ ] `git status --short` lists only the three in-scope files (plus `plans/README.md`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at the locations in "Current state" does not match the excerpts.
- Step 1 does not produce the `FAIL` described.
- After Step 2, `toast action calls BetterChatango` fails: the filter is
  then too wide.
- The plan-001 step `no bridge operation failed to apply during the scenario`
  fails after Step 2.

## Maintenance notes

- The filter is by notice text, like the existing "You have disconnected"
  one. BetterChatango is loaded from vissle.me as published there: if it
  rewords these notices, the buttons come back. The reference copy
  (`reference/torch/inject.js`, 2026-10-19) lists every `setNotice` call:
  when it is refreshed, read the calls that carry an `action` again.
- Open question for the owner, not decided here: the other forwarded
  buttons. "Retry" of an upload calls BetterChatango's `client.post` again
  with the same form (`inject.js:4805-4817`), outside the bridge's post
  helper, and Nightango does not receive its result. A stricter rule would
  forward a button only for an explicit list of notices.
- Reviewer: the "Relogin required." path must be unchanged.
- Suggested `CHANGELOG.md` line, under `### Fixed`: "BetterChatango's group
  registration prompt no longer shows in Nightango."
