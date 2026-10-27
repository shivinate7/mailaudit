# The public seed is removed

Kind: build

Plan: docs/decisions/the-public-seed.md#the-removal (web)

**Status:** retired 2026-10-14, built in `82e45d4`. The owner ruled that the public seed goes. That carries out the 2026-10-11 ruling in `worker-keeps-snapshots`.

The site is public and the ledger repo is not. Pages serves the `main` root and has never served the `data` branch. The Pages site is world-readable, and git keeps every version. A visitor with empty storage gets the empty state: the masthead and "Drop your OrderWand CSV here". Tests 38d.0 and 38d.4 pin it.

Git history still holds the seed. `git log -S'<script id="seed"' --oneline -- index.html` finds `10f9499` and `82e45d4`, and the commits between them carry the tag. Removing it from history needs the owner's word. Debt: `seed-in-public-history`.

**Holds while:** `build.mjs` writes no `<script id="seed">` tag, and `src/` loads no seed. Test 38d.5 pins the committed page.

## The removal

The web build writes no seed. `src/app.jsx` and `src/entry.jsx` carry no seed load or inflate. `npm run deploy` does not fetch the `ledger` remote. `check:build` compares the whole page.

## See also

- `worker-keeps-snapshots` — the 2026-10-11 ruling this carries out
- `check-seed-backstop-not-proof` — the check that still refuses ledger data in the page
- `seed-load-guards` — the guards for the removed load, retired
- `ledger-remote-needed-for-seed` — the remote the removed build step read, retired
