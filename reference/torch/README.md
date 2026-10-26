# Torch reference copy

Code of the Torch client as served by vissle.me, downloaded on 2026-10-19. MIT licence, copyright Vissle Drissle (see `LICENSE`).

## Status

Read-only:

- never modify these files, not even to fix a typo or reformat
- never load them in the build (`scripts/build.mjs`) or in the tests (`tests/`)
- never run them

For a newer version, replace the four files together, then update the date, the hashes and the `inject.js:NNNN` references in the docs.

## Usage

- Check a Torch behaviour before relying on it in the bridge.
- Serve as the target of the `file:line` references in the docs (`docs/betterchatango-protocol.md`, `docs/adr/`). Example: `inject.js:7452` points to line 7452 of `inject.js` here.

## Files

- `start.js`: bookmarklet script, `https://vissle.me/client/start`
- `client.html`: client page, `https://vissle.me/client`
- `inject.js`: client code, `https://vissle.me/client/inject`
- `client.css`: client stylesheet, `https://vissle.me/css/client.css`
- `LICENSE`: exact text of `https://github.com/Vissle-Drissle/Torch-Client/blob/main/LICENSE` (commit `fae3c7f547ce9819f105a2c4931f5dbdb7f802c0`)

The footer of `client.html` cites the MIT licence (`opensource.org/licenses/MIT`) and links to the `https://github.com/Vissle-Drissle/Torch-Client` repository. That repository contains only the `LICENSE` file: the code is published only on vissle.me.

The profile tracker scripts (`vissle.me/js/track.js` and the `/track` pages) are not copied. They are not part of the Torch client and no known licence covers them.

## SHA-256 hashes

```
20767031c75c82acbd4916611bb65646667ab1352b210b4f29c76e485f86fb7c  start.js
61b63885afcb43bc8f7d45c65bf5b6a517cb737a8a36ee4fc79ce20aae458bf5  inject.js
4bf65a4b811f07ca3a6b1e86185984dee81749b0dc2a314868e760f7e33d5730  client.html
d7bce017a486ffb299f785698c755636338a429b1f3624ceeaa86741cbc18fd0  client.css
e2917d4f0934dbe6d6a94eef8e411a1fcd6796ef4ed73cabd95a92f13bec3bbf  LICENSE
```
