# Plan 018: The rules that decide what gets published are a tested function

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report. Do not improvise. When done, update the status row for this plan
> in `plans/README.md`, unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 0b829ea..HEAD -- scripts/release.mjs scripts/changelog.mjs tests/run.mjs .gitlab-ci.yml docs/architecture.md`
> If `scripts/release.mjs` changed since this plan was written, do not paste
> the file of Step 2 over it: treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: MED (the script publishes releases to users, and only runs for real in CI)
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `0b829ea`, 2026-11-13

## Why this matters

`scripts/release.mjs` publishes the userscript that users install, from the
GitLab pipeline. It decides whether to publish from two facts, the `@version`
of the userscript and the branch: a stable version from `main`, a beta from
`beta`, nothing for a stable version on `beta`, and a refusal for a beta on
`main`. A mistake in that rule would publish a beta as a stable `vX.Y.Z`,
which every installed copy then announces as an update. Today that rule
cannot be tested: the file reads CI variables and calls the network as soon
as it is loaded, so it runs for the first time in production on each push.
This plan moves the rule, the version reading and the release notes into
exported functions, keeps the network part behind an entry-point check, and
adds a suite. The behaviour of the job does not change.

## Current state

- `scripts/release.mjs` (67 lines) at commit `0b829ea`. Everything runs at
  module top level:

  ```js
  const API = `${env('CI_API_V4_URL')}/projects/${env('CI_PROJECT_ID')}`;
  const AUTH = { 'JOB-TOKEN': env('CI_JOB_TOKEN') };
  ...
  const version = (/^\/\/ @version\s+(\S+)/m.exec(readFileSync('src/loader/skin-loader.js', 'utf8')) || [])[1];
  if (!/^\d+\.\d+\.\d+(-beta\.\d+)?$/.test(version || '')) throw new Error(`Invalid @version '${version}' in src/loader/skin-loader.js.`);
  const branch = env('CI_COMMIT_BRANCH'), beta = version.includes('-beta.');
  if (branch === 'beta' && !beta) {
    console.log(`@version ${version} is not a beta, nothing to publish from beta.`);
    process.exit(0);
  }
  if (branch === 'main' && beta) throw new Error('main publishes stable releases only: set @version to X.Y.Z in src/loader/skin-loader.js.');

  const tag = `v${version}`;
  const existing = await api(`/releases/${encodeURIComponent(tag)}`);
  ```

  It then uploads three files with `PUT` and creates the release with
  `POST`. `notesOf(version)` reads `CHANGELOG.md` itself.

- `.gitlab-ci.yml`, job `release`, runs it as `node scripts/release.mjs`.
  That line must keep working unchanged.

- `scripts/changelog.mjs` exports `parseChangelog(text)`, which throws on a
  malformed `CHANGELOG.md` with messages that contain
  `unknown change type`, `item outside a change type`, `expected a` and
  `has an empty section`. It is used by the build and by the release, and
  no suite tests it.

- `scripts/build.mjs:339`: how this repo lets a script be both run and
  imported:

  ```js
  if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) build();
  ```

- Test files are CommonJS and load the `.mjs` scripts with `require`
  (`tests/member_content.js:4`:
  `const { concatSources, layerSources } = require('../scripts/build.mjs');`).
  `require` cannot load a module that uses `await` at its top level: the
  network part must therefore live in an `async` function.

- `tests/run.mjs:6` lists the suites the runner knows:

  ```js
  const SUITES = ['smoke', 'live_ui', 'layers', 'pm', 'member_content', 'markup', 'loader', 'live_login', 'avatar', 'moon', 'new_year', 'check_ds', 'allowed_calls', 'perf', 'voice'];
  ```

  If plan 004 has landed, the list also holds `'draft'`: keep it.

- `docs/architecture.md`: the "File tree" lists
  `release.mjs        GitLab release of the tested userscripts, run by the release job of .gitlab-ci.yml`,
  and the section "Tests" has one bullet per suite, the last one being
  `voice`.

- Conventions that apply (`docs/coding-conventions.md`):
  - Node scripts are modern JavaScript (ES modules). "Functions in Node
    scripts have a multiline JSDoc: a one-sentence summary and one `@param`
    per parameter. The summary is a third-person verb phrase [...]. No
    comma in a summary."
  - A `//` comment fits on one line, in English, with no em-dash and no
    semicolon in its text.
  - Every new test is seen failing before the code it protects.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Install | `pnpm install --frozen-lockfile` | exit 0 |
| The suite alone, no build | `node tests/release.js .` | 10 lines starting with `ok`, exit 0 |
| The script outside CI | `node scripts/release.mjs` | prints `Error: CI_API_V4_URL is not set: run this script from the GitLab release job.` and exits with 1 |
| All suites | `pnpm test` | every line of `== summary` starts with `pass`, exit 0, about 2.5 min |

`pnpm` only. Never run `scripts/release.mjs` with real CI variables: it
publishes.

## Scope

**In scope** (the only files you should modify or create):
- `scripts/release.mjs`
- `tests/release.js` (create)
- `tests/run.mjs` (the `SUITES` line only)
- `docs/architecture.md` (one bullet in "Tests")

**Out of scope** (do NOT touch):
- `.gitlab-ci.yml` and `.github/workflows/ci.yml`: the pipelines stay as
  they are. The GitHub job holds the same rules a second time in shell.
  Bringing the two together is a decision for the owner, see "Maintenance
  notes".
- `scripts/changelog.mjs`: only tested here, not changed.
- `scripts/build.mjs`.

## Git workflow

- Branch: `test/release-decision`
- Two commits: `test(release): suite for the release decision` (the suite
  and its registration), then
  `refactor(release): export the release decision`. Conventional Commits
  with a body wrapped at 72 columns.
- No `Co-Authored-By` line and no generated footer.
- Do NOT push or open a PR unless the operator instructed it. Do NOT push
  to `main` or `beta` in any case: a push there runs the release job.

## Steps

### Step 1: Write the suite and see it fail

Create `tests/release.js` with exactly this content:

```js
// Release decision of scripts/release.mjs and release notes read from CHANGELOG.md, without the network.
const { versionOf, releasePlan, notesOf } = require('../scripts/release.mjs');
const { parseChangelog } = require('../scripts/changelog.mjs');

const check = (c, msg, detail) => console.log((c ? 'ok  ' : 'FAIL') + ' ' + msg + (c || detail === undefined ? '' : ' ' + JSON.stringify(detail)));
/**
 * Runs a function and returns the message of the error it throws.
 * @param {Function} fn Function expected to throw.
 */
function thrown(fn) { try { fn(); return null; } catch (e) { return e.message; } }

/* @version of the header: the first line that starts with it, as written */
check(versionOf('// ==UserScript==\n// @name         Nightango\n// @version      0.34.1\n// @match x\n') === '0.34.1', 'version read from the userscript header');
check(versionOf('// no version here\nvar s = "// @version 9.9.9";\n') === '', 'no version outside a header line');

/* What each branch publishes: stable from main, betas from beta, nothing else */
const PLANS = [
  ['0.34.1', 'main', true],
  ['0.35.0-beta.2', 'beta', true],
  ['0.35.0', 'beta', false]
];
const plans = PLANS.map(([version, branch]) => [version, branch, releasePlan(version, branch).publish]);
check(JSON.stringify(plans) === JSON.stringify(PLANS), 'a stable version publishes from main, a beta from beta, a stable version on beta publishes nothing', plans);
check(/not a beta/.test(releasePlan('0.35.0', 'beta').why), 'a stable version on beta says why nothing is published');
check(/stable releases only/.test(thrown(() => releasePlan('0.35.0-beta.1', 'main')) || ''), 'a beta version on main is refused');
const BAD = ['', '0.34', 'v0.34.1', '0.34.1-rc.1', '0.34.1-beta', '0.34.1-beta.x', '1.2.3.4'];
const accepted = BAD.filter((v) => !/Invalid @version/.test(thrown(() => releasePlan(v, 'main')) || ''));
check(accepted.length === 0, 'a version of another shape is refused', accepted);

/* Release notes: the section of the version, its groups in order */
const LOG = '# Changelog\n\n## [0.2.0] - 2026-01-02\n\n### Added\n\n- New thing.\n- Other thing.\n\n### Fixed\n\n- A bug.\n\n## [0.1.0] - 2026-01-01\n\n### Added\n\n- First.\n';
check(notesOf(LOG, '0.2.0') === '### Added\n\n- New thing.\n- Other thing.\n\n### Fixed\n\n- A bug.', 'notes of a version built from its section', notesOf(LOG, '0.2.0'));
check(/no section for 0.3.0/.test(thrown(() => notesOf(LOG, '0.3.0')) || ''), 'a version without a section is refused');

/* CHANGELOG.md format: what the build and the release refuse */
const REFUSED = {
  'unknown change type': '## [0.1.0] - 2026-01-01\n\n### Improved\n\n- x\n',
  'item outside a change type': '## [0.1.0] - 2026-01-01\n\n- x\n',
  'expected a': '## [0.1.0] - 2026-01-01\n\nSome prose.\n',
  'empty section': '## [0.1.0] - 2026-01-01\n\n### Added\n'
};
const misses = Object.keys(REFUSED).filter((why) => !(thrown(() => parseChangelog(REFUSED[why])) || '').includes(why));
check(misses.length === 0, 'a malformed CHANGELOG.md is refused with its reason', misses);
check(parseChangelog(LOG).map((r) => r.version).join() === '0.2.0,0.1.0', 'releases read newest first');
```

In `tests/run.mjs` line 6, add `'release'` at the end of `SUITES`, after
`'voice'`.

**Verify**: `node tests/release.js .` → it crashes before any check (the
current `scripts/release.mjs` runs its top-level code when loaded: an error
about a module that cannot be required, or about a CI variable that is not
set). Exit code not 0. This is the expected red state.

Commit this state as the first commit.

### Step 2: Export the decision and keep the network behind the entry point

Replace the whole content of `scripts/release.mjs` with:

```js
// GitLab release of the tested userscripts, run by the release job of .gitlab-ci.yml with the CI job token only.
// One release per @version: a push without a version bump publishes nothing. The beta branch publishes betas only.

import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { parseChangelog } from './changelog.mjs';

const FILES = ['nightango.min.user.js', 'nightango.user.js', 'SHA256SUMS'];

/**
 * Reads the @version of the userscript header.
 * @param {string} loader Content of src/loader/skin-loader.js.
 * @returns {string} Version as written or an empty string.
 */
export function versionOf(loader) {
  return (/^\/\/ @version\s+(\S+)/m.exec(loader) || [])[1] || '';
}

/**
 * Decides what the release job does with a version on a branch.
 * @param {string} version Version read from the userscript header.
 * @param {string} branch Branch of the pipeline.
 * @returns {{publish: boolean, why: string}} Whether a release is due and why not otherwise.
 */
export function releasePlan(version, branch) {
  if (!/^\d+\.\d+\.\d+(-beta\.\d+)?$/.test(version)) throw new Error(`Invalid @version '${version}' in src/loader/skin-loader.js.`);
  const beta = version.includes('-beta.');
  if (branch === 'beta' && !beta) return { publish: false, why: `@version ${version} is not a beta, nothing to publish from beta.` };
  if (branch === 'main' && beta) throw new Error('main publishes stable releases only: set @version to X.Y.Z in src/loader/skin-loader.js.');
  return { publish: true, why: '' };
}

/**
 * Writes the release notes of a version from its CHANGELOG.md section.
 * @param {string} changelog Content of CHANGELOG.md.
 * @param {string} version Version without its v.
 */
export function notesOf(changelog, version) {
  const release = parseChangelog(changelog).find((r) => r.version === version);
  if (!release) throw new Error(`CHANGELOG.md has no section for ${version}.`);
  return release.groups.map((g) => `### ${g.title}\n\n${g.items.map((i) => `- ${i}`).join('\n')}`).join('\n\n');
}

/**
 * Returns a CI variable of the release job.
 * @param {string} name Variable name.
 */
function env(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set: run this script from the GitLab release job.`);
  return value;
}

/**
 * Publishes the release of the current @version unless it exists or is not due.
 */
async function main() {
  const API = `${env('CI_API_V4_URL')}/projects/${env('CI_PROJECT_ID')}`;
  const AUTH = { 'JOB-TOKEN': env('CI_JOB_TOKEN') };
  const api = (path, init = {}) => fetch(API + path, { ...init, headers: { ...AUTH, ...init.headers } });

  const version = versionOf(readFileSync('src/loader/skin-loader.js', 'utf8'));
  const plan = releasePlan(version, env('CI_COMMIT_BRANCH'));
  if (!plan.publish) {
    console.log(plan.why);
    return;
  }

  const tag = `v${version}`;
  const existing = await api(`/releases/${encodeURIComponent(tag)}`);
  if (existing.ok) {
    console.log(`Release ${tag} already exists, nothing to publish.`);
    return;
  }
  if (existing.status !== 404) throw new Error(`Reading release ${tag} failed: HTTP ${existing.status}.`);

  // The files go to the generic package registry, where the release links to them: a public project serves them without sign-in.
  const links = [];
  for (const file of FILES) {
    const url = `${API}/packages/generic/nightango/${version}/${file}`;
    const put = await fetch(url, { method: 'PUT', headers: AUTH, body: readFileSync(`dist/${file}`) });
    if (!put.ok) throw new Error(`Uploading ${file} failed: HTTP ${put.status}.`);
    links.push({ name: file, url, direct_asset_path: `/${file}`, link_type: 'package' });
  }

  const created = await api('/releases', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: tag, tag_name: tag, ref: env('CI_COMMIT_SHA'), description: notesOf(readFileSync('CHANGELOG.md', 'utf8'), version), assets: { links } })
  });
  if (!created.ok) throw new Error(`Creating release ${tag} failed: HTTP ${created.status} ${await created.text()}`);
  console.log(`Published ${tag}.`);
}

// A failure must fail the job: the error is printed and the exit code set, as an uncaught top-level error did.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch((e) => { console.error(e); process.exit(1); });
```

This file was run while writing this plan: the suite of Step 1 passes
against it, and `node scripts/release.mjs` outside CI prints the missing
variable and exits with 1.

What changed, and nothing else: the three pure parts are exported functions,
the rest moved into `main()` in the same order, the two `process.exit(0)`
became `return`, and `notesOf` takes the text of `CHANGELOG.md` as an
argument.

**Verify**:
- `node tests/release.js .` → 10 lines starting with `ok`, exit 0.
- `node scripts/release.mjs; echo "exit $?"` → the line
  `Error: CI_API_V4_URL is not set: run this script from the GitLab release job.`
  and `exit 1`.

### Step 3: Document the suite

In `docs/architecture.md`, section "Tests", add this bullet after the last
one (`voice`):

```
- `release`: what `scripts/release.mjs` publishes from a `@version` and a branch (stable from `main`, betas from `beta`, a beta refused on `main`), the release notes of a version, and the `CHANGELOG.md` formats that `scripts/changelog.mjs` refuses. No network: the script only publishes when run as the entry point.
```

**Verify**: `pnpm test` → every line of `== summary` starts with `pass`,
exit 0, including `pass  release (10 ok)`.

## Test plan

- The suite of Step 1: 10 checks in 4 groups (version reading, the branch
  rules, the notes, the changelog format).
- Structural pattern: `tests/new_year.js` for the `check` helper, and
  `tests/member_content.js:4` for loading a `.mjs` script from a test.
- Not tested: the network calls of `main()`. They are unchanged, and
  testing them would need a fake GitLab API that this plan does not add.

## Done criteria

- [ ] `node tests/release.js .` prints 10 lines starting with `ok` and exits 0
- [ ] `pnpm test` exits 0, and its summary contains `pass  release (10 ok)`
- [ ] `node scripts/release.mjs` outside CI exits with 1 and names `CI_API_V4_URL`
- [ ] `grep -c "process.exit(0)" scripts/release.mjs` prints `0`
- [ ] `git diff --stat 0b829ea -- .gitlab-ci.yml .github/` prints nothing
- [ ] `git status --short` lists only the four in-scope files (plus `plans/README.md`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `scripts/release.mjs` differs from commit `0b829ea` before you start
  (`git diff 0b829ea -- scripts/release.mjs` prints something).
- In Step 1, the suite does not crash on the unmodified script.
- `require('../scripts/release.mjs')` fails after Step 2 with an error
  about a module that cannot be required: an `await` is then left at the
  top level of the file.
- You are asked to check the script "for real": do not set CI variables,
  do not push to `main` or `beta`.

## Maintenance notes

- First real run: the next push to `main` or `beta` with a new
  `@version`. Reviewer and owner: read the log of that release job. A
  `beta` push with a stable version must still end with "is not a beta,
  nothing to publish from beta." and a green job.
- Open decision for the owner, not taken here: the GitHub workflow
  (`.github/workflows/ci.yml`, step "Create release for @version") holds
  the same rules in shell, and the two have already drifted on one point:
  GitHub writes its release notes with `--generate-notes`, GitLab from
  `CHANGELOG.md`. The functions exported here make it possible to have the
  GitHub job ask `releasePlan` and `notesOf` instead, in a later change
  reviewed for itself.
- `@version` is still read in four places with four patterns
  (`scripts/build.mjs:289`, this script, the shell of the GitHub job,
  `tests/allowed_calls.js:135`). `versionOf` is the one to share when one
  of them is next touched.
