# The Tally row degrades sets first, never counts

At iPhone width, the Tally row is tight. The right-hand column holds up to three lines: count, basis, and outstanding. The meta line under the name truncates. The meta line is ordered counts first: `3 sellers · 3 orders · <sets>`. So the long set list is what degrades to an ellipsis. The counts never truncate. Keep this order if you add anything to that line.

**Holds while:** the Tally row meta line in `src/app.jsx` lists the seller count and the order count before the set label.

## See also

- `card-the-action-row-is-reserved` — the other card ruling that reserves space against a change in content.
- `no-layout-shift-under-pointer` — the invariant this ordering choice protects.
