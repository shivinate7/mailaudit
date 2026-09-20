# Cost Basis Excludes Shipping And Tax

Cost basis sums price times quantity over non-canceled copies in the active date range. Shipping and tax live in per-order CSV columns, not per line. The app leaves them out of the basis on purpose. Basis reflects what was paid, and it does not move when copies get checked in.

## The argument, as recorded

```
- **Cost basis** = Σ (Price × Quantity) over the item's non-canceled copies in
  the active date range. Shipping and tax are per-order columns in the CSV, not
  per-line, so they are deliberately not allocated into it. Basis is what was
  paid and never moves when copies are checked in; the red figure beside it is
  what's still outstanding.
```

## See also

- `unit-rate-is-not-the-position` — the other Tally figure basis feeds.
- `tally-pools-on-the-exact-name` — the grouping basis is computed over.
