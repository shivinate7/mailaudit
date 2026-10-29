# The native audits skip only named, owner-ruled findings

The native UI tests run Apple's accessibility audit. It flags "Contrast failed" on a few elements whose colours clear 4.5:1. The owner ruled on 2026-10-27 12:25 CDT: skip the contrast check only for the Orphaned mini buttons Cancel, Edit and Discard, and the Tally "left" line. Each skip cites the measured table. Every audit check not named in this record stays on, on every element.

The measurement, 2026-10-27, in a scratch app with the real views: a bordered `MiniLabel` inside its 44pt frame flags contrast in every container, while ink on card measures 12.2:1 and red on card 5.5:1. The Tally "left" line flagged in 2 of 8 runs of identical code. No pixel a person sees falls under the floor (`palette-tokens-contrast-floor`).

The audit stays because it caught real defects in the same step: a shadow on a container, clipped text, and a dropped label.

The Tally meta line takes no skip. The owner ruled on 2026-10-27 19:28 CDT (waiting item 33): a long set name in a Tally row's meta line ends in "…", as on the web (`card-tally-row-counts-first`), and allowed a named skip of the clipped-text check on that line. Measured 2026-10-28: a `Text` with `lineLimit` and tail truncation makes the audit raise "Text clipped" with no element, so no identifier skip can match it. The line in `native/Manifest/TallyView.swift` (`metaLine`) is a hard-clipped full-width `Text` with its own "…" drawn over the edge when `onGeometryChange` measures an overflow. The "…" is hidden from accessibility, and the `Text` keeps the full label and the `tally-meta:<name>` id. The audit raises nothing on that line, so the tests use no skip for it.

Three more skips, each named by the owner:

- **Disabled elements.** The owner ruled on 2026-10-21 22:02 CDT: `OrphanedUITests` skips contrast findings on disabled elements only (`inactiveContrast`), as WCAG 1.4.3 exempts inactive components. The ready state is audited in full. The ruling sits in the N7 note of `native-build-lanes`.
- **The system tab bar.** The owner ruled on 2026-10-21 that the Packages audit skips findings raised on the iOS tab bar, which the app does not draw. On 2026-10-27 14:26 CDT the owner extended it to the Ledger, Orphaned and Tally audits (`auditSkippingTabBar`). On 2026-10-28 16:40 CDT (waiting item 34) the owner widened it: the skip also covers findings on text wholly below the window and on text with any overlap with the tab bar, not only text more than half under it. The masthead pushes rows there, and no person sees them in that state. It does not cover a finding with no element. The code does not yet carry the widening: step 5's version skipped any element, not only text, so it is parked on `archive/step5-tabbar-skip-any-element` until the owner rules on waiting item 37 (text only, or any element). Until then the code skips an element only when the bar covers more than half of it. Step 6's stamped-filter row and 48pt stamp slot push more rows there: on 2026-10-28 the Packages-screen audit flags "Alpha Cards" (y 779) and the Stamp button (y 856), both overlapping the bar, and it stays red until item 37 is ruled.
- **The system keyboard.** The owner ruled on 2026-10-27 14:26 CDT: in the two composer audits only, skip findings on the keyboard's prediction cells (`TUIPredictionViewCell`). They reported "Element has no description" in the full suite of 2026-10-27, and the app does not draw them.

**Holds while:** the skips in `native/ManifestUITests` name only these elements: the contrast type on the four named elements, which `TokenContrast` unit tests pin at 4.5:1 or more; contrast on disabled elements in `OrphanedUITests`; the tab bar and any element it covers by more than half (item 34's wider text rule waits for item 37); and the keyboard prediction cells in the two composer audits. No skip names the Tally meta line; the truncated-meta audit raises no finding on it, while the shell and rows audits still flag it with the masthead (debt `tally-audit-contrast-flags`).

## See also

- `palette-tokens-contrast-floor` — the floor the token pairs clear.
- `tally-audit-contrast-flags` — the Tally flags this skip covers.
- `native-orphaned-colours-unbuilt` — the Orphaned flags this skip covers.
