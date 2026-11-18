---
status: accepted
date: 2026-11
---

Amends [ADR-0008](0008-separate-minified-output.md): esbuild also bundles the sources.

# ES modules bundled by esbuild

## Context

The build concatenates the files of `src/` into one IIFE, in the order of `APP_SOURCES`. Every top-level name is visible to every file and no file says what it reads. A dependency is found only by searching for the name, the order of the list is a convention to know, and the build has to refuse a name declared twice because the second one would silently replace the first. A refactor inventory (November 2026) found that most of the links that break without warning come from this: `core/` reading names of `bridge/`, `views/` and `app/`, views reading constants of `app/`, cycles between views, and values copied between files because nothing showed where the original lived.

esbuild is already a dev dependency. Bundled with `format: 'iife'` and `target: 'es5'`, ES5 modules give the same code as the concatenation: one scope, hoisted functions, names in conflict renamed. The application IIFE is already in strict mode, the mode of every module.

## Decision

- Each file of `src/` is an ES module: ES5 syntax, plus `import` and `export`. It imports every name it reads from another file and exports only the names other files read. React, ReactDOM and the design system are read from `window` in `core/globals.js` only. The globals set by the loader (`__TORCH_*__`, `__betterChatangoRefs`) are read in one module only.
- The build bundles with esbuild `build` (`bundle`, `format: 'iife'`, `target: 'es5'`). There are two application entries: one for the userscript and one for the hosted prototype. Code of the prototype alone lives in modules that only the prototype entry imports, which replaces the `/*PROTOTYPE*/` blocks.
- The sandbox code and the page code of the loader are bundled the same way. The contract they share (event names, global names, TikTok and X links, delays, error texts) is one module that both import ([ADR-0003](0003-two-context-loader.md)).
- Imports only go down: `core/` imports nothing above it, `bridge/` only `core/`, `views/` and `settings/` neither `app/` nor each other's entry files, `app/` everything below it. The build reads the import graph from the esbuild metafile and fails on an import that goes up or on a cycle.
- ADR-0008 stays: two userscripts from the same build, `minify` for the deliverable, the readable version unminified, the `==UserScript==` header copied as is.
- The suites load the modules through esbuild too: a test helper bundles an entry that exposes the names a suite needs. They no longer concatenate sources.

## Consequences

- `APP_SOURCES`, `layerSources`, `concatSources` and the check of names declared twice go away. A new file needs no list.
- What a file reads is written at its top, and the build refuses a dependency in the wrong direction.
- The evaluation order follows the imports. A module whose top level runs code (the bridge, global listeners) runs after the modules it imports.
- esbuild bundles as well as minifies. The approved dev dependencies are unchanged.
- The readable userscript keeps the code and its names, not its comments: esbuild drops them. A function named like another top-level name of the bundle gets a numeric suffix (`MessageRow2`), since esbuild cannot keep names for an ES5 target.
- `docs/coding-conventions.md` (ES5 plus `import` and `export`), `docs/architecture.md` (Concatenation section) and `AGENTS.md` (rule 5 wording) follow.
- The migration is one scripted commit: imports computed with esbuild as the scope oracle, so that a name shadowed by a local variable is not imported. It is checked by every suite and by comparing the functions of the bundle with those of the previous build.
