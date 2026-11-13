# Plan 019: The agent docs say what is true today: GitHub is back, the file tree is complete, the glossary knows spaces

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report. Do not improvise. When done, update the status row for this plan
> in `plans/README.md`, unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 0b829ea..HEAD -- AGENTS.md README.md GLOSSARY.md docs/architecture.md docs/adr/0013-update-check-at-sign-in.md src/core/util.js`
> If any of these files changed since this plan was written, compare the
> "Current state" excerpts against the live text before proceeding. Other
> plans add lines to `docs/architecture.md` (new suites): that is expected.
> A mismatch on a quoted line is a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: docs
- **Planned at**: commit `0b829ea`, 2026-11-13
- **Owner input**: confirmed on 2026-11-13 that the GitHub account, suspended
  on 2026-11-09, is back. Assumed, not confirmed: GitLab stays a second
  host kept in step (the two pipelines and the two-host update check stay).
  See "STOP conditions".

## Why this matters

`AGENTS.md` is the first file every coding agent reads in this repo, and it
sends them to `docs/architecture.md` before adding a file and to
`GLOSSARY.md` before naming a concept. Three things in these files are no
longer true. They say the GitHub account is suspended and that issues go to
GitLab, while the account is back and the latest merge is a GitHub pull
request. The file tree of the architecture doc misses six of the 26 view
files, five of them added in 0.34.0. The glossary defines Season as Halloween
only and has no entry for Space, a concept that exists in the state, in
storage and in the interface. An agent that trusts these files files issues
on the wrong host and names things without the project's vocabulary.

## Current state

- `AGENTS.md:67`:

  > The code lives in two repositories, `github.com/marjoriedotdev/nightango` and `gitlab.com/marjoriedotdev/nightango`, pushed by hand with no automatic mirroring: GitHub first, GitLab while GitHub is down (the GitHub account has been suspended since 2026-11-09). Each has the same CI, [...]

- `AGENTS.md:94`:

  > Issues on GitHub, public repository `marjoriedotdev/nightango`, through the `gh` CLI. See `docs/agents/issue-tracker.md`. While the GitHub account is suspended, issues #1 to #121 are out of reach and new ones go to the GitLab project.

- `README.md:17` (install step 2):

  > [...] on [GitHub](https://github.com/marjoriedotdev/nightango/releases/latest) or, while GitHub is down, on [GitLab](https://gitlab.com/marjoriedotdev/nightango/-/releases) (take the newest `vX.Y.Z`, not a `-beta`). [...]

- `src/core/util.js:4`, a comment:

  ```js
  // The same code lives in both repositories, pushed by hand: GitHub first, GitLab while GitHub is down.
  ```

- `docs/adr/0013-update-check-at-sign-in.md:33`, under `## Revision`, a
  dated entry that starts with `2026-11-10: the GitHub account was suspended on 2026-11-09.`
  It is a record of that day: it stays as written.

- Evidence that GitHub is back: `git log -1 --format=%s` at `0b829ea` is
  `Merge pull request #123 from marjoriedotdev/wt/sharp-dirac-xeh6ve`,
  dated 2026-11-13, and `git remote -v` shows the GitHub URL as `origin`.

- `docs/architecture.md:34-43`, the `views/` part of the "File tree". It
  names `login, shell, group, message, message-log, members, dm, meet,
  mentions, profile, new-dm, message-style, emoji-picker, attach, media,
  commands, discover, palette, live-joined, session`. The build list
  (`scripts/build.mjs`, `APP_SOURCES`) also holds `views/season.js`,
  `views/pip.js`, `views/spaces.js`, `views/voice.js`, `views/gif.js` and
  `views/shared-media.js`.

  What these six files hold, from their own header comments and from
  `CHANGELOG.md` (0.33.0 and 0.34.0):
  - `season.js`: decorations of a season and the New Year countdown and fireworks
  - `pip.js`: a conversation popped out into a floating window
  - `spaces.js`: spaces, their bar under Search or jump to, and their editor
  - `voice.js`: voice message recording in the composers and its WAV file
  - `gif.js`: GIF tab of the emoji and media picker
  - `shared-media.js`: media and links of a group or a PM

- `docs/architecture.md:51`:

  > `live-group-view, live-group-pages, live-group-staff, live-account   live variants (...)`

  `src/settings/live-group-staff.js` holds only the audit log page. The
  staff pages are in `group-staff.js`, shared by live and prototype
  (line 48 of the same doc says so).

- `docs/architecture.md:213`:

  > - `avatar`: avatars, on the design system bundle and the sources of `src/bridge/`.

  `tests/avatar.js:11-13` also loads the start of `src/core/globals.js`.

- `GLOSSARY.md:74-76`:

  > **Season**:
  > A few days a year when the night of the interface changes, computed on the device: Halloween, from October 24 to November 2. Its palette, its decorations and the costumes on avatars are seen only by the reader and can be turned off in Appearance.
  > _Avoid_: theme (the dark or light theme, chosen by the reader)

  `src/core/util.js:59-72` has three seasons: Halloween from October 24 to
  November 2, winter from December 1 to January 6 (June 1 to July 6 in the
  southern hemisphere), Valentine's Day from February 10 to 14.

- `GLOSSARY.md` has no entry for Space. `CHANGELOG.md` (0.34.0) words it:
  "Spaces gather some groups and private messages under a name. The bar
  under Search or jump to switches between them and shows their unread
  conversations." In storage a space has a name, members written
  `group:<id>` or `dm:<name>`, and whether it mutes what is outside it
  (`docs/architecture.md`, section "React state"). The glossary section
  for it is `## Private messages` (line 109), after the entry
  **Deleted conversation** (line 125), since a space gathers conversations.

- Conventions that apply:
  - Docs are in English. An entry of `GLOSSARY.md` is a bold term followed
    by a colon, a definition on the next line, and an optional
    `_Avoid_:` line.
  - `docs/coding-conventions.md`: a `//` comment fits on one line, with no
    em-dash and no semicolon in its text.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Install | `pnpm install --frozen-lockfile` | exit 0 |
| All suites | `pnpm test` | every line of `== summary` starts with `pass`, exit 0, about 2.5 min |

`pnpm` only. The suites must stay green because `src/core/util.js` is
touched (a comment only) and `tests/allowed_calls.js` reads the docs.

## Scope

**In scope** (the only files you should modify):
- `AGENTS.md` (lines 67 and 94)
- `README.md` (line 17)
- `src/core/util.js` (the comment of line 4 only)
- `docs/architecture.md` (the `views/` block, line 51, line 213)
- `GLOSSARY.md` (the Season entry, one new entry)
- `docs/adr/0013-update-check-at-sign-in.md` (one line added under `## Revision`)

**Out of scope** (do NOT touch):
- The dated entry `2026-11-10` of ADR-0013 and the rest of that ADR.
- `.github/workflows/ci.yml`, `.gitlab-ci.yml`, the update check in
  `src/app/root.js`: both hosts stay.
- `docs/agents/issue-tracker.md`: it already describes GitHub issues.
- `docs/betterchatango-protocol.md`.
- `CHANGELOG.md` and `@version`: nothing changes for the user.

## Git workflow

- Branch: `docs/refresh-drifted-docs`
- Two commits: `docs: GitHub is back, GitLab stays in step` (AGENTS,
  README, the comment, the ADR line), then
  `docs: complete the file tree and the glossary` (architecture,
  glossary). Conventional Commits with a body wrapped at 72 columns.
- No `Co-Authored-By` line and no generated footer.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: GitHub is back

1. `AGENTS.md:67`: replace
   `GitHub first, GitLab while GitHub is down (the GitHub account has been suspended since 2026-11-09).`
   with
   `GitHub first, GitLab kept in step as the second host (the GitHub account was suspended for a few days from 2026-11-09, and GitLab carried the releases meanwhile).`

2. `AGENTS.md:94`: replace the last sentence
   `While the GitHub account is suspended, issues #1 to #121 are out of reach and new ones go to the GitLab project.`
   with
   `Issues opened on the GitLab project while the GitHub account was suspended in November 2026 stay there.`

3. `README.md:17`: replace `or, while GitHub is down, on [GitLab]` with
   `or, if GitHub is unreachable, on [GitLab]`.

4. `src/core/util.js:4`: replace the comment with
   `// The same code lives in both repositories, pushed by hand: GitHub first, GitLab kept in step.`

5. `docs/adr/0013-update-check-at-sign-in.md`: at the end of the
   `## Revision` section, after the `2026-11-10` paragraph, add a blank line
   and:
   `2026-11-13: the GitHub account is back. Both hosts keep their pipeline and their releases, and the check keeps asking both.`

**Verify**:
- `grep -rn "suspended since\|while GitHub is down\|out of reach and new ones" AGENTS.md README.md src/` prints nothing.
- `grep -c "2026-11-13: the GitHub account is back" docs/adr/0013-update-check-at-sign-in.md` prints `1`.

### Step 2: Complete the file tree

In `docs/architecture.md`, in the `views/` block of the "File tree":

1. After the line
   `    commands (/join, /leave, /chat and /help of the composers),`
   add these three lines, with the same four spaces of indentation:

   ```
       season (decorations of a season, New Year countdown and fireworks), pip (conversation popped out into a floating window),
       spaces (spaces, their bar under Search or jump to, their editor), voice (voice message recording of the composers and its WAV file),
       gif (GIF tab of the emoji and media picker), shared-media (media and links of a group or a PM),
   ```

2. Line 51: replace
   `live-group-view, live-group-pages, live-group-staff, live-account   live variants (`
   with
   `live-group-view, live-group-pages, live-group-staff (audit log), live-account   live variants (`

3. Line 213: replace
   ``- `avatar`: avatars, on the design system bundle and the sources of `src/bridge/`.``
   with
   ``- `avatar`: avatars, on the design system bundle, the sources of `src/bridge/` and the `T` wrapper at the top of `src/core/globals.js`.``

**Verify**: this command prints nothing (every view file is named in the
block):

```
for f in src/views/*.js; do n=$(basename "$f" .js); sed -n '/^  views\//,/^  settings\//p' docs/architecture.md | grep -q "\b$n\b" || echo "missing: $n"; done
```

### Step 3: Bring the glossary up to date

In `GLOSSARY.md`:

1. Replace the definition line of **Season** (line 75) with:

   `A few days a year when the night of the interface changes, computed on the device: Halloween from October 24 to November 2, winter from December 1 to January 6 (June 1 to July 6 for a sky seen from the southern hemisphere), Valentine's Day from February 10 to 14. Its palette, its decorations and the costumes on avatars are seen only by the reader and can be turned off in Appearance.`

   Keep its `_Avoid_:` line.

2. After the entry **Deleted conversation** (its definition is line 126)
   and before the heading `## Media`, add, with a blank line before and
   after:

   ```
   **Space**:
   Named set of groups and PMs the user gathers, kept in this browser for the account. The sidebar and Chats show only the conversations of the chosen space, and a space can silence the alerts of PMs from outside it.
   _Avoid_: folder, workspace
   ```

**Verify**:
- `grep -c "Valentine's Day from February 10 to 14" GLOSSARY.md` prints `1`.
- `grep -c "^\*\*Space\*\*:" GLOSSARY.md` prints `1`.
- `pnpm test` → every line of `== summary` starts with `pass`, exit 0.

## Test plan

- No test: documentation and one comment. `pnpm test` is run because a
  file under `src/` is touched and because `tests/allowed_calls.js` reads
  `docs/betterchatango-protocol.md` (not modified here).
- The shell loop of Step 2 is the check that the file tree is complete.

## Done criteria

- [ ] The `grep -rn` of Step 1 prints nothing
- [ ] The loop of Step 2 prints nothing
- [ ] Both `grep -c` of Step 3 print `1`
- [ ] `pnpm test` exits 0 and every summary line starts with `pass`
- [ ] `git status --short` lists only the six in-scope files (plus `plans/README.md`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- A quoted line does not match the live text.
- The operator tells you GitLab is being retired, or becomes the main
  host: the wording of Step 1 is then wrong, and the pipelines and the
  update check are a different piece of work.
- The definition of **Space** does not match what `src/views/spaces.js`
  does when you read it (for example if a space does not filter the
  sidebar). Report the difference instead of adjusting the wording alone.

## Maintenance notes

- The file tree went stale because nothing ties it to `APP_SOURCES`. The
  loop of Step 2 could become a check of the build or of a suite. Not done
  here: it is a tooling change with its own review.
- Not confirmed with the owner: the wording "side by side" and "floating
  window" for the two layouts of 0.34.0. They have no glossary entry. Add
  them when the owner settles the terms.
- Reviewer: the ADR keeps its 2026-11-10 entry untouched.
