# Plan 020: The build refuses a top-level name declared in two source files

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report. Do not improvise. When done, update the status row for this plan
> in `plans/README.md`, unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 0b829ea..HEAD -- scripts/build.mjs docs/architecture.md`
> If `scripts/build.mjs` changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding. On a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: dx
- **Planned at**: commit `0b829ea`, 2026-11-13

## Why this matters

This application has no bundler and no modules. The build glues the 66 files
of `src/` into one function, so every `function` and `var` written at the top
of a file lands in the same scope. If two files declare the same name, the
second silently replaces the first: no error, no warning, and the tests stay
green unless one of them happens to reach the replaced function. The
architecture doc already warns about it ("a name that duplicates another
replaces the first one without an error"), and the scope holds short generic
names such as `start`, `mount`, `opened` and `pick`. Today there is no
duplicate. After this plan the build stops with the name when one appears.
The check needs no new dependency.

## Current state

- `scripts/build.mjs:283-297`: where the sources are glued. Only
  `</script` is checked:

  ```js
  async function build() {
    const tokens = JSON.parse(read('torchds', 'project', 'tokens.json'));
    const bundleJs = read('torchds', 'project', 'components', 'bundle.js');
    const bundleCss = read('torchds', 'project', 'components', 'bundle.css');
    const appCss = read('src', 'styles', 'app.css');
    const loader = read('src', 'loader', 'skin-loader.js');
    const version = /@version\s+(\S+)/.exec(loader)[1];
    const releaseNotes = parseChangelog(read('CHANGELOG.md'));
    if (releaseNotes[0]?.version !== version) throw new Error(`CHANGELOG.md must start with the notes of @version ${version}.`);
    const appJs = "(function () {\n'use strict';\n" +
      `var APP_VERSION = ${JSON.stringify(version)}, RELEASE_NOTES = ${JSON.stringify(releaseNotes)};\n` +
      concatSources(ROOT, APP_SOURCES) + '\n})();\n';
    for (const [name, src] of [['bundle', bundleJs], ['app', appJs]]) {
      if (src.toLowerCase().includes('</script')) throw new Error(`${name} contains </script`);
    }
  ```

- `scripts/build.mjs:1-5`: its imports:

  ```js
  import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
  import { dirname, join, relative } from 'node:path';
  import { fileURLToPath, pathToFileURL } from 'node:url';
  import { transform } from 'esbuild';
  import { parseChangelog } from './changelog.mjs';
  ```

- `scripts/build.mjs:89-96`: `concatSources`, right above an empty
  section banner left by an earlier refactor (lines 98-100):

  ```js
  export function concatSources(root, files) {
    return files.map((file) => readFileSync(join(root, 'src', file), 'utf8')).join('\n');
  }

  // -- Release notes ------------------------------------------------------------



  // -- Design system tokens -----------------------------------------------------
  ```

- How the check works, tried while writing this plan on the sources at
  `0b829ea`: in JavaScript, two `let` declarations of the same name in one
  scope are a syntax error, while two `var` or two `function` declarations
  are not. So the check takes a copy of the glued sources, turns each
  declaration that starts at column 0 (`var ...` and `function name`) into
  a `let`, and asks Node to compile it without running it
  (`new vm.Script`). A name declared twice at the top level then fails to
  compile, with a message that names it. Results of the trial:
  - the current sources compile: no duplicate
  - adding `function start() {}` at the end gives
    `Identifier 'start' has already been declared`
  - adding `var MIN = 1;` gives `Identifier 'MIN' has already been declared`
  - adding `var userOf = 1;` (a name that is a function elsewhere) gives
    `Identifier 'userOf' has already been declared`
  - a `var` inside a function that reuses a top-level name is accepted, as
    it should be.

- `docs/architecture.md`, section "Concatenation", ends with:

  > The build rejects app code or a bundle that contains `</script`, a userscript stylesheet that still targets `:root` or `html,body{`, and a sign-in screen stylesheet that contains `url(` or `@import`.

- Conventions that apply (`docs/coding-conventions.md`):
  - Node scripts are modern JavaScript. "Functions in Node scripts have a
    multiline JSDoc: a one-sentence summary and one `@param` per
    parameter. [...] No comma in a summary."
  - "Sections use `// -- Name ----` banners up to column 80."
  - A `//` comment fits on one line, with no em-dash and no semicolon in
    its text.
  - No new dependency without the owner's approval. `node:vm` is part of
    Node.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Install | `pnpm install --frozen-lockfile` | exit 0 |
| Build | `pnpm build` | prints the size of four outputs, exit 0 |
| All suites | `pnpm test` | every line of `== summary` starts with `pass`, exit 0, about 2.5 min |

`pnpm` only.

## Scope

**In scope** (the only files you should modify):
- `scripts/build.mjs`
- `docs/architecture.md` (one sentence of section "Concatenation")

**Touched temporarily and restored** (Step 2 only):
- `src/core/util.js`

**Out of scope** (do NOT touch):
- Renaming anything in `src/`: there is no duplicate to fix.
- `torchds/project/components/bundle.js`: it has its own scope.
- A linter or a parser dependency.

## Git workflow

- Branch: `build/refuse-duplicate-top-level-names`
- One commit. Conventional Commits with a body wrapped at 72 columns.
  Suggested subject:
  `build: refuse a top-level name declared in two sources`.
- No `Co-Authored-By` line and no generated footer.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add the check

In `scripts/build.mjs`:

1. Add this import after the `node:url` import line:

   ```js
   import { Script } from 'node:vm';
   ```

2. Replace the empty section (the banner
   `// -- Release notes ------------------------------------------------------------`
   and the blank lines under it, lines 98-100) with:

   ```js
   // -- Shared scope -------------------------------------------------------------

   /**
    * Returns the compile error of the sources once their top-level declarations are let.
    * Two files that declare the same name share one scope where the second silently replaces the first: declared with let they do not compile.
    * @param {string} code Concatenated application sources.
    * @returns {?string} Message that names the identifier declared twice or null.
    */
   function redeclared(code) {
     const strict = code.replace(/^var /gm, 'let ').replace(/^function\s+([A-Za-z_$][\w$]*)/gm, 'let $1 = function $1');
     try { new Script('(function () {\n"use strict";\n' + strict + '\n})'); return null; } catch (e) { return e.message; }
   }
   ```

   Keep one blank line before the next banner
   (`// -- Design system tokens ---...`).

3. In `build()`, glue the sources once and check them. Replace

   ```js
     const appJs = "(function () {\n'use strict';\n" +
       `var APP_VERSION = ${JSON.stringify(version)}, RELEASE_NOTES = ${JSON.stringify(releaseNotes)};\n` +
       concatSources(ROOT, APP_SOURCES) + '\n})();\n';
   ```

   with

   ```js
     const sources = concatSources(ROOT, APP_SOURCES);
     const twice = redeclared(sources);
     if (twice) throw new Error(`The files of src/ share one scope and a top-level name is declared twice: ${twice}.`);
     const appJs = "(function () {\n'use strict';\n" +
       `var APP_VERSION = ${JSON.stringify(version)}, RELEASE_NOTES = ${JSON.stringify(releaseNotes)};\n` +
       sources + '\n})();\n';
   ```

**Verify**: `pnpm build` → exit 0, four output sizes printed as before.

### Step 2: See the check fail

Append one line to `src/core/util.js`:

```
printf '\nfunction start() {}\n' >> src/core/util.js
```

**Verify**: `pnpm build` → exits with a non-zero code and prints
`The files of src/ share one scope and a top-level name is declared twice: Identifier 'start' has already been declared.`

Then restore the file: `git checkout -- src/core/util.js`.

**Verify**: `git diff --stat -- src/` prints nothing.

### Step 3: Document it

In `docs/architecture.md`, section "Concatenation", replace the start of the
last sentence `The build rejects app code or a bundle that contains` with
`The build rejects application sources that declare the same top-level name twice, app code or a bundle that contains`.

**Verify**:
- `grep -c "declare the same top-level name twice" docs/architecture.md` prints `1`.
- `pnpm test` → every line of `== summary` starts with `pass`, exit 0.

## Test plan

- No new suite. The build is the first step of `pnpm test` and of both CI
  pipelines, so the check runs everywhere already. Step 2 is the proof that
  it fails when it should.

## Done criteria

- [ ] `pnpm test` exits 0 and every summary line starts with `pass`
- [ ] `grep -c "function redeclared" scripts/build.mjs` prints `1`
- [ ] `grep -c "Release notes ---" scripts/build.mjs` prints `0`
- [ ] `git diff --stat -- src/` prints nothing
- [ ] `git status --short` lists only `scripts/build.mjs` and `docs/architecture.md` (plus `plans/README.md`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `scripts/build.mjs` does not match the excerpts.
- In Step 1, `pnpm build` fails with the new message on the unmodified
  `src/`: either a duplicate appeared since this plan was written (report
  the name, do not rename anything), or a source is valid as `var` code
  but not once its declarations are `let` (report the message).
- In Step 2, the build still succeeds.

## Maintenance notes

- The check sees declarations that start at column 0, which is how every
  file of `src/` is written. A top-level declaration that is indented
  would escape it.
- The message comes from the JavaScript engine and names one identifier,
  the first it meets. It does not name the two files: `grep -rn "^function NAME\|^var .*\bNAME\b" src/` finds them.
- If a future source legitimately needs to declare a name twice at the
  top level of the same file, it must be rewritten: the check cannot tell
  it from a clash between two files.
- Reviewer: the userscripts must be byte-identical before and after this
  change. `sha256sum dist/nightango.min.user.js dist/nightango.user.js`
  before and after is a quick way to see it.
