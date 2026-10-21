# Screens are checked headless in CI

Each view (Ledger tab, Orphaned, Tally, Packages) is checked in a headless browser at 375px and 760px.

The check runs once, as a required CI job on a macOS runner. Cochin ships only with macOS, so a Linux, cloud or Windows machine would measure the wrong fonts. It does not run at deploy time, because one check in one place is enough, and a local check cannot be enforced.

The check fails on any sideways overflow, and on any row that moves when a card is checked in. It also scans each view for accessibility violations. At 375px on touch, it checks the 44px floor of each interactive element in nine screen states. In the same states, each painted box must match the base within 0.5px. It also runs a tap probe 1px outside the midpoint of each control's side. The nine states are: Ledger; Orphaned; Tally; Tally card open; Packages; Stamp editor open; Envelope composer open; Sync panel open; Lost photo tile. Those are claims 8 to 11 of the `check:screens` header, pinned in `ux-house-rules-govern`. Claim 15 holds the lost photo tile at the 56px size of a thumbnail, at 375 and 760px. Claim 16 holds the order id link on Alpha's order A1, at 375px touch and at 760px. The link's hit area reaches neither the seller name nor the date line (measured 0px on 2026-10-21 at `e0df8ad`). The chevron toggles on a click, a tap and Enter while the seller name is selected. At 760px a mouse drag from the seller name into the date line selects text and leaves the card open. Claim 16 never clicks the link, and aborts any request to tcgplayer.com. See `order-id-button-stops-propagate`. The checks cover the named states only.

Before this ruling, every layout figure was measured by hand, and a regression showed up only when someone measured again. The owner ruled this on 2026-10-10. The axe and touch checks enforce the 2026-10-11 house rulings L8 and L6.

The cost is two pinned dev dependencies, Playwright and `@axe-core/playwright`. Locally the check took about 31 s on a Mac, one reading under a 1-minute load of about 92. At `e0df8ad` it took 106.8 s beside a running suite. CI time is not measured. It also costs the slower queue of a macOS runner.

**Holds while:** `.github/workflows/test.yml` runs the `screens` job on `macos-latest`. `npm run check:screens` checks 375px and 760px, with the axe, touch and drawn-box checks.

Kind: build

Plan: decisions/screens-checked-headless-in-ci.md#the-axe-scan (web)

Plan: decisions/screens-checked-headless-in-ci.md#the-native-client (native)

## The axe scan

The scan uses `@axe-core/playwright`, pinned exact at 4.13.0, published 2026-08-11. It runs axe-core's default rules with no tag filter. It also enables `label-content-name-mismatch`, an experimental rule.

The severity floor: the check fails on any `serious` or `critical` violation. It also fails on any `label-content-name-mismatch` at any impact. `moderate` and `minor` violations do not fail it. A page error during a scan also fails it.

The scan covers ten states at 375px and 760px. They are the nine screen states (Ledger, Orphaned, Tally, Tally with one row open, Packages, the stamp editor, the envelope composer, the Sync panel, an envelope with a lost photo tile) and the photo viewer.

## The native client

Lane N5 added a UI test, `native/ManifestUITests/PackagesShellUITests.swift`. It runs on the iOS Simulator at 375pt only. The native 760pt case is removed, see `native-build-lanes`. The web check keeps 760pt. The UI test is not yet in the native job. The test fails when another row frame moves on a check-in. It guards `no-layout-shift-under-pointer` for the native client, as the web check does for the web app. The native job is in `native-ci-on-hosted-macos`.

- Measured on 2026-10-12 on an iPhone 17 simulator: the 375pt case passed. The 760pt case skipped, because the test's own check found the window narrower than 760pt. The case has since been removed, see `native-build-lanes`.
- Still open: the N5 test covers Packages only. Each native view needs the same test, so the briefs for lanes N6 and N7 must add it for Tally and Orphaned. Debt: `native-lanes-n6-to-n9-unbuilt`.

## See also

- `native-ci-on-hosted-macos` — the job that runs the native UI test.
- `testing-jsdom-has-no-layout` — why the behaviour suite cannot catch a layout shift.
- `no-layout-shift-under-pointer` — the invariant this check guards.
- `ux-house-rules-govern` — the house rulings L6 and L8 that the touch and axe checks enforce.
