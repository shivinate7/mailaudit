# Cost basis excludes shipping and tax

**Cost basis** = Σ (Price × Quantity) over the item's non-canceled copies in the active date range. Shipping and tax are per-order columns in the CSV, not per-line. They are deliberately not allocated into the basis.

**Holds while:** `g.basis` set by `tallyGroups` in `src/view-rules.mjs` sums `price * qty` only (V7.4 and V7.8), and no code reads the CSV Shipping Amount or Tax Amount columns.

Basis is what was paid. It never moves when copies are checked in. The red figure beside it is what is still outstanding.

## See also

- `unit-rate-is-not-the-position` — the other Tally figure basis feeds.
- `tally-pools-on-the-exact-name` — the grouping basis is computed over.
