# Screens are checked headless in CI

Each view (Orphaned, Tally, Packages) is checked in a headless browser at 375px and 760px. The check fails on any sideways overflow, and on any row that moves when a card is checked in. Before this ruling, every layout figure was measured by hand, and a regression showed up only when someone measured again. The cost is one pinned dev dependency, Playwright, and about a minute of CI. The owner ruled this on 2026-10-10.

## See also

- `testing-jsdom-has-no-layout` — why the behaviour suite cannot catch a layout shift.
- `no-layout-shift-under-the-pointer` — the invariant this check guards.
