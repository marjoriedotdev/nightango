# Plan 011: The floating window keeps updating while Settings are open in the tab

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report. Do not improvise. When done, update the status row for this plan
> in `plans/README.md`, unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 0b829ea..HEAD -- src/views/shell.js src/views/pip.js`
> If either file changed since this plan was written, compare the "Current
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

Since 0.34.0 a conversation can be popped out into a floating window
(Document Picture-in-Picture). That window has its own React root, and it is
re-rendered by one component, `PipHost`, each time the application state
changes. `PipHost` is rendered at the end of the main shell, after two early
returns: when the tab shows Settings or Group settings, the shell returns
before reaching it. So while the user has Settings open, the floating window
stops receiving the state: new messages do not appear there, including the
user's own after sending from it, although the application counts that
conversation as in front of the user and marks it read.

## Current state

- `src/views/shell.js:24-46`: the shell. The two early returns are at
  lines 30-31, `PipHost` at line 45:

  ```js
  var Shell = React.memo(function Shell() {
    var app = useApp(), s = app.state, r = s.route, main;
    var wide = useWideLayout();
    var split = wide && s.split && paneShown(s, s.split) ? s.split : null;
    // A window too narrow for two panes, or a conversation that went away, closes the pane beside.
    useEffect(function () { if (s.split && !split) app.actions.closeSplit(); }, [!!s.split, !!split]);
    if (r.view === 'settings') return h(SettingsView, { page: r.page });
    if (r.view === 'gsettings') return h(GroupSettingsView, { key: r.id, gid: r.id, page: r.page });
    if (LIVE && !s.groupsSeen) main = h(StartupScreen, null);
    ...
    return h('div', { className: cx('shell', app.navOpen && 'nav-open', split && 'side-by-side') },
      h(NewYearSky, null),
      h(Sidebar, { wide: wide }),
      h('div', { className: 'scrim', onClick: app.ui.closeNav }),
      main, side,
      h(PipHost, null));
  });
  ```

- `src/views/pip.js:67-84`: `PipHost`. It renders nothing in the page. Its
  effect has no dependency list, so it runs after each of its renders, and
  it is the only place that renders into the floating window:

  ```js
  /**
   * Renders the popped out conversation into the floating window, with the contexts of the application.
   * It renders nothing in the page.
   */
  function PipHost() {
    var app = useApp(), api = useAppApi(), season = useContext(SeasonCtx), target = app.state.pip;
    useEffect(function () {
      // Signed out, or the conversation went away: the window closes.
      if (!target || !paneShown(app.state, target)) { if (PIP.win) closePipWindow(); return; }
      if (!PIP.mount) return;
      if (!PIP.root) PIP.root = ReactDOM.createRoot(PIP.mount);
      PIP.root.render(h(Layers, { mount: PIP.mount }, ...));
    });
    return null;
  }
  ```

- `Frag` is the repo's alias of `React.Fragment` (`src/core/globals.js`),
  used for example in `src/views/dm.js:302`:
  `return h(Frag, null, media.panel, voice.panel, h(T.Composer, { ...`.

- `src/core/selectors.js:165-167`: why the conversation is counted as
  read meanwhile: `isInView` is true for the conversation of the floating
  window whatever the tab shows.

- No suite opens the floating window: jsdom has no Document
  Picture-in-Picture (`grep -n "openPip\|PipHost" tests/` prints nothing).

- Conventions that apply (`docs/coding-conventions.md`):
  - Code in `src/` is ES5: `var`, `function`, no arrow functions, no JSX.
    Elements are created with `h`.
  - A comment exists only for a trap that would make someone "fix" the code
    by mistake. One line, English, no em-dash and no semicolon in its text.
  - Tests are for complex behaviour only (ADR-0009).

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
- `src/views/shell.js` (the two early returns of `Shell`)

**Out of scope** (do NOT touch):
- `src/views/pip.js`: `PipHost` is correct once it is rendered.
- `src/app/root.js`: do not move `PipHost` up to `Root`. `Root` renders
  again for each toast and dialog, and `Shell` is memoized precisely to
  stay out of those renders.
- `tests/`: no new test, see "Test plan".
- `CHANGELOG.md` and `@version`.

## Git workflow

- Branch: `fix/floating-window-behind-settings`
- One commit. Conventional Commits with a body wrapped at 72 columns.
  Suggested subject:
  `fix(layout): keep the floating window live while settings are open`.
- No `Co-Authored-By` line and no generated footer.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Render `PipHost` on the settings routes too

In `src/views/shell.js`, replace lines 30-31

```js
if (r.view === 'settings') return h(SettingsView, { page: r.page });
if (r.view === 'gsettings') return h(GroupSettingsView, { key: r.id, gid: r.id, page: r.page });
```

with

```js
// PipHost on every route: without it the floating window stops following the state.
if (r.view === 'settings') return h(Frag, null, h(SettingsView, { page: r.page }), h(PipHost, null));
if (r.view === 'gsettings') return h(Frag, null, h(GroupSettingsView, { key: r.id, gid: r.id, page: r.page }), h(PipHost, null));
```

`PipHost` returns `null`, so the fragment adds nothing to the page.

**Verify**:
- `grep -c "h(PipHost, null)" src/views/shell.js` prints `3`.
- `pnpm test` → every line of `== summary` starts with `pass`, exit 0. The
  `smoke` and `live_ui` steps that open Settings and Group settings
  (`settings Profile`, `group settings`, `back from gsettings`) must still
  start with `ok`.

## Test plan

- No new automated test: the floating window cannot open in jsdom.
- Manual check for the owner, in Chrome, after installing the build: pop a
  group out, open Settings in the tab, have a message arrive in that group
  (or send one from the floating window). It must appear in the floating
  window at once. Before the fix it appears only after leaving Settings.
- The existing suites prove that the settings screens still render.

## Done criteria

- [ ] `pnpm test` exits 0 and every summary line starts with `pass`
- [ ] `grep -c "h(PipHost, null)" src/views/shell.js` prints `3`
- [ ] `git status --short` lists only `src/views/shell.js` (plus `plans/README.md`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Lines 30-31 of `src/views/shell.js` do not match the excerpt.
- `Frag` is not defined in `src/core/globals.js`
  (`grep -n "Frag" src/core/globals.js` prints nothing).
- A suite reports a React warning about hooks or keys after the change
  (`live_ui` fails on any unfiltered React warning).

## Maintenance notes

- A new route that returns early from `Shell` must render `PipHost` too.
  If a third one appears, restructure `Shell` so the route content is one
  variable and `PipHost` is rendered once.
- Not checked in a real browser while writing this plan: the manual check
  above is the confirmation. Other floating window behaviour with the tab
  hidden (observers created in the tab, file drops) was not reviewed.
- Suggested `CHANGELOG.md` line, under `### Fixed`: "The floating window
  keeps receiving messages while Settings are open."
