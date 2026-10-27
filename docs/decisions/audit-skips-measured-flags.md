# The native audit skips contrast only on measured false flags

The native UI tests run Apple's accessibility audit. It flags "Contrast failed" on a few elements whose colours clear 4.5:1. The owner ruled on 2026-10-27 12:25 CDT: skip the contrast check only for the Orphaned mini buttons Cancel, Edit and Discard, and the Tally "left" line. Each skip cites the measured table. Every other audit check stays on, on every element.

The measurement, 2026-10-27, in a scratch app with the real views: a bordered `MiniLabel` inside its 44pt frame flags contrast in every container, while ink on card measures 12.2:1 and red on card 5.5:1. The Tally "left" line flagged in 2 of 8 runs of identical code. No pixel a person sees falls under the floor (`palette-tokens-contrast-floor`).

The audit stays because it caught real defects in the same step: a shadow on a container, clipped text, and a dropped label.

**Holds while:** the skips in `native/ManifestUITests` name only those elements and only the contrast audit type, and `TokenContrast` unit tests pin each skipped element's colour pair at 4.5:1 or more.

## See also

- `palette-tokens-contrast-floor` — the floor the token pairs clear.
- `tally-audit-contrast-flags` — the Tally flags this skip covers.
- `native-orphaned-colours-unbuilt` — the Orphaned flags this skip covers.
