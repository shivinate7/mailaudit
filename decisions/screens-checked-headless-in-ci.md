# Screens are checked headless in CI

Each view (Ledger tab, Orphaned, Tally, Packages) is checked in a headless browser at 375px and 760px.

The check runs once, as a required CI job on a macOS runner. Cochin ships only with macOS, so a Linux, cloud or Windows machine would measure the wrong fonts. It does not run at deploy time, because one check in one place is enough, and a local check cannot be enforced.

The check fails on any sideways overflow, and on any row that moves when a card is checked in. It also scans each view for accessibility violations. At 375px on touch, it checks the 44px floor of each interactive element in nine screen states. In the same states, each painted box must match the base within 0.5px. It also runs a tap probe 1px outside the midpoint of each control's side. The nine states are: Ledger; Orphaned; Tally; Tally card open; Packages; Stamp editor open; Envelope composer open; Sync panel open; Lost photo tile. Those are claims 8 to 11 of the `check:screens` header, pinned in `ux-house-rules-govern`. Claim 15 holds the lost photo tile at the 56px size of a thumbnail, at 375 and 760px. Claim 16 holds the order id link on Alpha's order A1, at 375px touch and at 760px. Claim 16a sends real Chromium touches (1px and 12px contact radius) at 320 and 375px, on Alpha stamped and unstamped. No tap on the drawn boxes of the seller name, the date line, the chevron or the row under the header may open the link. Measured 2026-10-21 at `3de6c03`: 0 of 10,868 to 12,696 taps per run did. A hit test cannot see Chromium's touch adjustment, so claim 16a uses real touches. iOS WebKit is not covered, debt `ios-touch-adjust-unmeasured`. The chevron toggles on a click, a tap and Enter while the seller name is selected. At 760px a mouse drag from the seller name into the date line selects text and leaves the card open. Claim 16 never clicks the link, and aborts any request to tcgplayer.com. See `order-id-button-stops-propagate`. The checks cover the named states only.

Before this ruling, every layout figure was measured by hand, and a regression showed up only when someone measured again. The owner ruled this on 2026-10-10. The axe and touch checks enforce the 2026-10-11 house rulings L8 and L6.

The cost is two pinned dev dependencies, Playwright and `@axe-core/playwright`. Locally, at `3de6c03` on a Mac, the check took 157.1 s beside a running suite. Claim 16a sends 94,116 touches in 8 runs, and the touches and their clicks take 46.8 s of that. CI time of the `screens` job, measured on `main` (4 green runs, 2026-10-18 to 2026-10-21, before claim 16a): 2 m 26 s (run 39116024269), 2 m 36 s (39239789469), 2 m 43 s (39405167633), 2 m 28 s (39582234223). Claim 16a adds about 35 to 50 s, so the expected run is about 3 m 10 s to 3 m 35 s. The job limit is `timeout-minutes: 6`, about twice that. It exists to stop a hung run, not to bound normal time. The old 3 minute limit sat 17 to 34 s above the normal runs, and cancelled the lane's first run of claim 16a (run 39653575015, 4 m 03 s). Re-measure with `gh run view <run> --json jobs` after claim 16a lands on `main`. The check also costs the slower queue of a macOS runner.

**Holds while:** `.github/workflows/test.yml` runs the `screens` job on `macos-latest` with `timeout-minutes: 6`. `npm run check:screens` checks 375px and 760px, with the axe, touch and drawn-box checks. Claim 16a also checks 320px.

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
