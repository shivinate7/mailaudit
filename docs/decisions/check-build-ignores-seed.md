# The build check compares the whole page

Kind: build

Plan: docs/decisions/check-build-ignores-seed.md#retired (web)

**Status:** retired 2026-10-14 with `the-public-seed`. `check:build` no longer strips a seed. The page carries no ledger data, so the whole `index.html` is a claim about this repository.

**Holds while:** `build.mjs --check` compares the whole committed page with the build of `src/`, and build.mjs has no withoutSeed function.

## Retired

Nothing here applies. A check that cries wolf is worse than no check. The whole-page compare holds only because the page carries no data that changes between builds.

## See also

- `check-seed-backstop-not-proof` — the check that still refuses ledger data in the page
- `the-public-seed` — the removal this retirement follows
