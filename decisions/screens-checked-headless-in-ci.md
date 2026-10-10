# Screens are checked headless in CI

Each view (Orphaned, Tally, Packages) is checked in a headless browser at 375px and 760px. The check runs once, as a required CI job on a macOS runner. Cochin ships only with macOS, so a Linux, cloud or Windows machine would measure the wrong fonts. It does not run at deploy time, because one check in one place is enough, and a local check cannot be enforced. The check fails on any sideways overflow, and on any row that moves when a card is checked in. Before this ruling, every layout figure was measured by hand, and a regression showed up only when someone measured again. The cost is one pinned dev dependency, Playwright, and about a minute of CI, plus the slower queue of a macOS runner. The owner ruled this on 2026-10-10.

**Holds while:** `.github/workflows/test.yml` runs the `screens` job on `macos-latest`, and `npm run check:screens` checks 375px and 760px.

## See also

- `testing-jsdom-has-no-layout` — why the behaviour suite cannot catch a layout shift.
- `no-layout-shift-under-pointer` — the invariant this check guards.
