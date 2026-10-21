# Screens are checked headless in CI

Each view (Ledger tab, Orphaned, Tally, Packages) is checked in a headless browser at 375px and 760px.

The check runs once, as a required CI job on a macOS runner. Cochin ships only with macOS, so a Linux, cloud or Windows machine would measure the wrong fonts. It does not run at deploy time, because one check in one place is enough, and a local check cannot be enforced.

The check fails on any sideways overflow, and on any row that moves when a card is checked in. It also scans each view for accessibility violations. At 375px on touch, it checks the 44px floor of each interactive element in nine screen states. In the same states, each painted box must match the base within 0.5px. It also runs a tap probe 1px outside the midpoint of each control's side. The nine states are: Ledger; Orphaned; Tally; Tally card open; Packages; Stamp editor open; Envelope composer open; Sync panel open; Lost photo tile. Those are claims 8 to 11 of the `check:screens` header, pinned in `ux-house-rules-govern`. Claim 15 holds the lost photo tile at the 56px size of a thumbnail, at 375 and 760px. Claim 16 holds a remote reply, in Packages and Tally, with a mouse at rest on a row at 375 and 760px and with touch at 375px. A mocked Worker pushes a rev and a ledger that adds rows above the row in view. The reply must apply within 1.5 s. Then the row must move no more than 0.5px and stay under the pointer. The claim turns native scroll anchoring off, so it measures the page's own correction, see `auto-apply-happens-now`. Claim 17 holds the order id link on Alpha's order A1, at 375px touch and at 760px. Claim 17a sends real Chromium touches (1px and 12px contact radius) at 320 and 375px, on Alpha stamped and unstamped. No tap on the drawn boxes of the seller name, the date line, the chevron or the row under the header may open the link. Measured 2026-10-21 at `3de6c03`: 0 of 10,868 to 12,696 taps per run did. A hit test cannot see Chromium's touch adjustment, so claim 17a uses real touches. iOS WebKit is not covered, debt `ios-touch-adjust-unmeasured`. The chevron toggles on a click, a tap and Enter while the seller name is selected. At 760px a mouse drag from the seller name into the date line selects text and leaves the card open. Claim 17 never clicks the link, and aborts any request to tcgplayer.com. See `order-id-button-stops-propagate`. The checks cover the named states only.

Before this ruling, every layout figure was measured by hand, and a regression showed up only when someone measured again. The owner ruled this on 2026-10-10. The axe and touch checks enforce the 2026-10-11 house rulings L8 and L6.

The cost is two pinned dev dependencies, Playwright and `@axe-core/playwright`. Locally, at `3de6c03` on a Mac, the check took 157.1 s beside a running suite. Claim 17a sends 94,116 touches in 8 runs, and the touches and their clicks take 46.8 s of that. CI time of the `screens` job, measured on `main` (4 green runs, 2026-10-18 to 2026-10-21, before claim 17a): 2 m 26 s (run 39116024269), 2 m 36 s (39239789469), 2 m 43 s (39405167633), 2 m 28 s (39582234223). Claim 17a is far slower on CI than here. Run 39672152220 (batch head `ceb20a4`) logged 209.3 s for its 8 runs (37.8, 34.7, 17.4, 27.0, 32.2, 20.6, 18.6, 21.0 s). Locally, on an idle Mac, the same 8 runs took 36.3 s, and the whole check took 166.9 s. On CI, the part before the sweep took 87 s (here 62 s, ratio 1.4), the sweep 212 s (here 39 s, ratio 5.5), and the whole seen part 299 s (here 101 s, ratio 3.0). The job was cut at its 6 minute limit, 61 s after the sweep, with the later claims unfinished. Those later claims took 67 s here (45 s for the row-shift, Discard and Reset claims, 22 s for claim 16). At the pooled ratio of 3.0 they take about 200 s on CI, so the full `check:screens` takes about 500 s (8 m 20 s). The job limit is `timeout-minutes: 17`, about twice that. It exists to stop a hung run, not to bound normal time. It is not a speed target, and the sweep is not shrunk to fit it. The old limits cancelled the check: 3 minutes cut the lane's first run of claim 17a (run 39653575015, 4 m 03 s), and 6 minutes cut run 39672152220. Re-measure with `gh run view <run> --json jobs` once a green run lands on `main`, and set the limit again from that figure. The check also costs the slower queue of a macOS runner.

**Holds while:** `.github/workflows/test.yml` runs the `screens` job on `macos-latest` with `timeout-minutes: 17`. `npm run check:screens` checks 375px and 760px, with the axe, touch and drawn-box checks. Claim 17a also checks 320px.

Kind: build

Plan: decisions/screens-checked-headless-in-ci.md#the-axe-scan (web)

Plan: decisions/screens-checked-headless-in-ci.md#the-native-client (native)

## The axe scan

The scan uses `@axe-core/playwright`, pinned exact at 4.13.0, published 2026-08-11. It runs axe-core's default rules with no tag filter. It also enables `label-content-name-mismatch`, an experimental rule.

The severity floor: the check fails on any `serious` or `critical` violation. It also fails on any `label-content-name-mismatch` at any impact. `moderate` and `minor` violations do not fail it. A page error during a scan also fails it.

The scan covers ten states at 375px and 760px. They are the nine screen states (Ledger, Orphaned, Tally, Tally with one row open, Packages, the stamp editor, the envelope composer, the Sync panel, an envelope with a lost photo tile) and the photo viewer.

## The native client

Lane N5 added a UI test, `native/ManifestUITests/PackagesShellUITests.swift`. It runs on the iOS Simulator at 375pt only. The native 760pt case is removed, see `native-build-lanes`. The web check keeps 760pt. The UI test is not yet in the native job. The test fails when another row frame moves on a check-in. It guards `no-layout-shift-under-pointer` for the native client, as the web check does for the web app. Lane N6 added `TallyUITests`, which also runs at 375pt and fails when a Tally row moves as a copy completes. The native job is in `native-ci-on-hosted-macos`.

- Measured on 2026-10-12 on an iPhone 17 simulator: the 375pt case passed. The 760pt case skipped, because the test's own check found the window narrower than 760pt. The case has since been removed, see `native-build-lanes`.
- Still open: lane N7 added `native/ManifestUITests/OrphanedUITests.swift`. It runs the accessibility audit and the 44pt hit check, and it checks that tied rows have one size. It has no check that a press moves another row, see `native-discard-arm-unpinned`. Lane N8 added `native/ManifestUITests/MastheadBackupUITests.swift`. Lane N9 must add the same test for its view. Debt: `native-lanes-n6-to-n9-unbuilt`.

## See also

- `native-ci-on-hosted-macos` — the job that runs the native UI test.
- `testing-jsdom-has-no-layout` — why the behaviour suite cannot catch a layout shift.
- `no-layout-shift-under-pointer` — the invariant this check guards.
- `ux-house-rules-govern` — the house rulings L6 and L8 that the touch and axe checks enforce.
