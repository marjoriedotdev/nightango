---
status: accepted
date: 2026-10
---

# Separate esbuild minified output, readable version kept

## Context

The userscript embeds the design system, the application and the stylesheets. The user has installed a minified version since 0.8.1. A minified version alone would make the deliverable impossible to review, while what runs next to the Chatango session must stay auditable.

## Decision

The build produces two userscripts from the same `userscript()` function in `scripts/build.mjs`:

- `dist/torch-skin.min.user.js`: the deliverable, with a fixed name from one version to the next. esbuild (`transform`, ES5 target, `minify`) applies to the page code, the loader code and both stylesheets. The `==UserScript==` header is copied as is, without a source map
- `dist/torch-skin.user.js`: readable version, unchanged, for debugging and audit.

esbuild is used only for minification: the concatenation stays the one in `build.mjs`, without a bundler.

## Consequences

- The `loader` suite runs on both userscripts. It is the only one that runs them: the others read `dist/nightango.html`, `dist/app.js`, the sources of `src/bridge/` or the design system bundle.
- esbuild is an approved dev dependency. pnpm 10 blocks its install script by default, hence `pnpm.onlyBuiltDependencies` in `package.json`. This `postinstall` checks that esbuild's platform-specific native binary is present and at the right version, and downloads it if missing.
