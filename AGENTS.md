# Nightango

Nightango (formerly Torch Skin) is a skin for BetterChatango. It is a Tampermonkey userscript for https://st.chatango.com/: it starts BetterChatango (third-party Chatango client from vissle.me), lets the user sign in on the BetterChatango screen, then shows a rebuilt interface (React 18 in a Shadow DOM) wired to the running BetterChatango client.
The same code also serves a hosted prototype with simulated data.
The version installed on the user's machine is in real use: every release touches their Chatango account.

## Non-negotiable rules

Rules 1, 2, 4 and 6 have their ADR under `docs/adr/`, linked at the end of the rule. Rules 3 and 5 have none. Read the ADR before any change that comes close to it.

1. **Password out of reach.** Our code never reads, stores, logs or transmits the password. Sign-in happens on the BetterChatango screen. Never call a BetterChatango function that adds the password to a request (in `client.post`, no `credential` option). The HTTP calls our code makes to Chatango, vissle, GitHub and TikTok are listed in `docs/betterchatango-protocol.md#allowed-http-calls`, and this list is closed. The resources loaded by the loader and the interface (React, fonts, BetterChatango script, media, avatars) are listed separately in the same section. [ADR-0001](docs/adr/0001-password-never-read.md)
2. **Sourced frame or nothing.** Every Chatango frame sent comes from BetterChatango's code or from a reference library (chadango, chatango-lib, ch.py). Without a source, the feature stays marked "not wired" and the interface says so. [ADR-0002](docs/adr/0002-no-invented-frames.md)
3. **No fake success in live.** An action that is not actually sent is hidden or shown as unavailable.
4. **Member HTML rebuilt, never injected.** Mini profile: `RichText` (allowlist rebuilt as React elements). Full profile: `sandbox` `iframe` without `allow-scripts` or `allow-same-origin`, CSP in a `<meta>` (`fullProfileDoc`). Mini profile CSS: parsed, never injected. [ADR-0004](docs/adr/0004-member-html-never-injected.md)
5. **Pinned dependencies.** Any new dependency waits for the user's explicit approval. React 18.3.1 loads from cdnjs with SRI (hashes checked against npm). Approved dev dependencies: jsdom, react, react-dom (tests), esbuild (minification).
6. **Visitors: own profile only.** The loader bridge ignores any `profile` sent by the page and reads `client.user.name`. No lookup of another profile's activity. [ADR-0005](docs/adr/0005-visitors-own-profile-only.md)

Decisions that follow from these and must not be "fixed":
- the own message style stays local to the browser ([ADR-0006](docs/adr/0006-local-message-style.md))
- linked accounts (`/api/v1/who`) are requested only on click and shown to the user only, never stored or logged ([ADR-0010](docs/adr/0010-linked-accounts-on-request.md))
- the loader runs in two contexts, sandbox and page ([ADR-0003](docs/adr/0003-two-context-loader.md))
- the diagnostic journal stays in the browser and observes neither socket sends nor frame contents ([ADR-0011](docs/adr/0011-diagnostic-journal.md))
- PM unreads come only from BetterChatango's private history, the state keeps only a copy read back from it ([ADR-0012](docs/adr/0012-pm-unread-from-history.md)).
- the update check asks GitHub once per sign-in and never installs code on its own ([ADR-0013](docs/adr/0013-update-check-at-sign-in.md)).
- TikTok is reached on click, or for the cover under the rules of the YouTube thumbnail: one anonymous call per link through the loader, which reads the post page and returns the post link and the cover address only ([ADR-0014](docs/adr/0014-tiktok-embed.md)).

## Project preferences

- **Short plan** before any change that touches more than 2 or 3 files.
- **pnpm** only, version pinned by `packageManager` in `package.json`. pnpm 10 blocks install scripts: `pnpm.onlyBuiltDependencies` allows esbuild's, a `postinstall` that checks (and downloads if missing) esbuild's native binary for the platform.
- **Deliverable with a fixed name**: `dist/nightango.min.user.js`, from one version to the next. The user pastes it into Tampermonkey in place of the existing script.
- **Tests: complex behaviour only.** No test per fix. [ADR-0009](docs/adr/0009-test-only-complex-behaviour.md)
- **Language**: comments, JSDoc, docs and tests are written in English in this repo. UI text and logs are in English too, in the tone of the design system (`torchds/project/README.md`, section Content fundamentals).

Detailed coding conventions: `docs/coding-conventions.md`. Read it before writing code in `src/` or `tests/`.

## Commands

```
pnpm install          # devDependencies: jsdom, react, react-dom, esbuild
pnpm build            # writes dist/ and prints the size of each output
pnpm test             # build then every suite
pnpm test live_ui     # build then the named suites only
pnpm build:ds         # regenerates README.md and preview.html of the design system components
```

Outputs of `pnpm build` (not versioned):
- `dist/nightango.min.user.js`: the deliverable, minified by esbuild
- `dist/nightango.user.js`: same assembly, readable, for debugging and audit
- `dist/nightango.html` and `dist/app.js`: hosted prototype.

Only the `loader` suite runs the userscripts, both of them. The others read `dist/nightango.html`, `dist/app.js`, sources from `src/` or the design system bundle (details in `docs/architecture.md`, section Tests).

The runner `tests/run.mjs` judges each suite on its exit code and on its output (`FAIL`, `CRASH` lines, non-empty `ERRORS:`): some suites exit with 0 despite a failure. Read the output, not only the exit code.

## Shipping a release

1. Increment `@version` in the header of `src/loader/skin-loader.js`. The build injects it into `APP_VERSION`.
2. Add at the top of `CHANGELOG.md` the section `## [X.Y.Z] - YYYY-MM-DD` for this version: what the user sees change, in English, one line per change, under `### Added`, `Changed`, `Deprecated`, `Removed`, `Fixed` or `Security`. The build shows it in What's new and fails if it is missing.
3. Run `pnpm test`: every suite green, build included.
4. Ship `dist/nightango.min.user.js`, the only file the user installs, by one of two paths:
   - send the file directly to the user
   - merge into `main`: once the tests are green, the CI creates the `vX.Y.Z` tag from `@version` and the GitHub release with both userscripts attached. A `@version` that already has its release publishes nothing: no increment, no release. Do not push a tag by hand.

The CI (`.github/workflows/ci.yml`) runs `pnpm test` on every push and pull request to `main` and `beta`, then publishes the release on a push to either branch.

### Shipping a beta

1. On the `beta` branch, set `@version` to `X.Y.Z-beta.N`, `X.Y.Z` being the next stable version, and add its section `## [X.Y.Z-beta.N] - YYYY-MM-DD` at the top of `CHANGELOG.md`.
2. Push to `beta`: once the tests are green, the CI publishes the GitHub prerelease `vX.Y.Z-beta.N`. GitHub never marks it as latest, so the update check of stable users ignores it ([ADR-0013](docs/adr/0013-update-check-at-sign-in.md)).
3. To ship the stable version, on `beta`: set `@version` to `X.Y.Z` and merge the `X.Y.Z-beta.N` sections of `CHANGELOG.md` into a single `## [X.Y.Z]` section, since stable users never saw the betas. A push to `beta` with a stable `@version` publishes nothing. Then open the pull request from `beta` to `main`.

The CI refuses a `-beta` `@version` on `main` and in any pull request to `main`. A stable hotfix ships from `main` as usual, then `main` is merged into `beta`.

## Docs map

- `GLOSSARY.md`: domain vocabulary (BetterChatango, bridge, frame, PM, mini profile, presence...). Read it before naming a concept in code, an issue or a test.
- `docs/architecture.md`: role of each folder in `src/`, concatenation order, loader contexts, live / prototype, React state, Shadow DOM, design system, tests. Read it before adding a file or touching the build.
- `docs/betterchatango-protocol.md`: how BetterChatango and Chatango work, checked in their code, frames with their source, presence formats, allowed endpoints, public files, vissle. Read it before sending or reading a frame, calling an endpoint or touching the bridge.
- `reference/torch/`: read-only copy of BetterChatango's code (MIT licence), downloaded on 2026-10-19. The `inject.js:NNNN` references in the docs point to this copy. Never modify it and never load it in the build or in the tests (see its `README.md`).
- `docs/coding-conventions.md`: ES5 style, comments, text, state, tests, design system, things never to do.
- `docs/adr/`: decisions and their reason.
- `CHANGELOG.md`: release notes shown to the user in What's new.
- `README.md`: overview for a human, installation in Tampermonkey.

## Agent skills

### Issue tracker

Issues on GitHub, public repository `marjoriedotdev/nightango`, through the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five triage roles under their default name (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` and `docs/adr/` at the root. See `docs/agents/domain.md`.
