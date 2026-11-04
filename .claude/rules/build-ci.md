---
paths:
  - ".github/workflows/**"
  - "build.mjs"
  - "icon/**"
  - "favicon.svg"
  - "README.md"
---

# Build and CI

## The public seed, removed

The site is public and the ledger repo is not. The page publishes no ledger data, and one check refuses it.

- `the-public-seed` — The public seed is removed.
- `seed-load-guards` — The seed load guards are retired.
- `check-seed-backstop-not-proof` — Check the built page, not the code that builds it.
- `ledger-remote-needed-for-seed` — The ledger remote is not needed for a build.

## Build, CI and assets

What each check asks, and the two traps in the icon pipeline.

- `check-build-ignores-seed` — The build check compares the whole page.
- `ci-filters-guarantee-no-rebuild` — CI filters replace the old no-workflows guarantee.
- `ci-skips-draft-prs` — CI skips draft pull requests, and the rollup with them.
- `milestone-runs-full-suite` — The full Swift suite runs at milestones, by dispatch only.
- `pages-queued-workflow-fix` — A stuck Pages deploy needs a new commit, not a re-run.
- `favicon-is-a-different-drawing` — The favicon is redrawn, not the master shrunk.
- `icon-paths-and-export-gotchas` — Icon paths stay relative, and iOS caches hard.
- `screens-checked-headless-in-ci` — Each view is checked headless at 375 and 760px.
- `readme-is-minimal` — The README is minimal, and carries no license.
