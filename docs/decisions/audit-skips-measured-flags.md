# The native audits skip only named, owner-ruled findings

The native UI tests run Apple's accessibility audit. It flags "Contrast failed" on a few elements whose colours clear 4.5:1. The owner ruled on 2026-10-27 12:25 CDT: skip the contrast check only for the Orphaned mini buttons Cancel, Edit and Discard, and the Tally "left" line. Each skip cites the measured table. Every audit check not named in this record stays on, on every element.

The measurement, 2026-10-27, in a scratch app with the real views: a bordered `MiniLabel` inside its 44pt frame flags contrast in every container, while ink on card measures 12.2:1 and red on card 5.5:1. The Tally "left" line flagged in 2 of 8 runs of identical code. No pixel a person sees falls under the floor (`palette-tokens-contrast-floor`).

The audit stays because it caught real defects in the same step: a shadow on a container, clipped text, and a dropped label.

Four more skips, each named by the owner:

- **The Tally meta line.** The owner ruled on 2026-10-27 19:28 CDT (waiting item 33): a long set name in a Tally row's meta line ends in "…", as on the web (`card-tally-row-counts-first`). The audit calls truncated text clipped, so the Tally audits skip the clipped-text check on the meta line only. Every other check stays on for that line.
- **Disabled elements.** The owner ruled on 2026-10-21 22:02 CDT: `OrphanedUITests` skips contrast findings on disabled elements only (`inactiveContrast`), as WCAG 1.4.3 exempts inactive components. The ready state is audited in full. The ruling sits in the N7 note of `native-build-lanes`.
- **The system tab bar.** The owner ruled on 2026-10-21 that the Packages audit skips findings raised on the iOS tab bar, which the app does not draw. On 2026-10-27 14:26 CDT the owner extended it to the Ledger, Orphaned and Tally audits (`auditSkippingTabBar`). On 2026-10-28 16:40 CDT (waiting item 34) the owner widened it: the skip also covers findings on text wholly below the window and on text with any overlap with the tab bar, not only text more than half under it. The masthead pushes rows there, and no person sees them in that state. It does not cover a finding with no element.
- **The system keyboard.** The owner ruled on 2026-10-27 14:26 CDT: in the two composer audits only, skip findings on the keyboard's prediction cells (`TUIPredictionViewCell`). They reported "Element has no description" in the full suite of 2026-10-27, and the app does not draw them.

**Holds while:** the skips in `native/ManifestUITests` name only these elements: the contrast type on the four named elements, which `TokenContrast` unit tests pin at 4.5:1 or more; the clipped-text check on the Tally meta line; contrast on disabled elements in `OrphanedUITests`; the tab bar, text with any overlap with it, and text wholly below the window; and the keyboard prediction cells in the two composer audits.

## See also

- `palette-tokens-contrast-floor` — the floor the token pairs clear.
- `tally-audit-contrast-flags` — the Tally flags this skip covers.
- `native-orphaned-colours-unbuilt` — the Orphaned flags this skip covers.
