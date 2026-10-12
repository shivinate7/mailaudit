# Search and hide-received never change shown Tally counts

Search and hide-received filter the copy breakdown under a Tally item. They can hide a whole row, but they never change the counts or cost basis of a row that stays shown. The date range does change them, because Tally sums only the date-ranged items. See `date-filter-spans-ledger-views`.

**Holds while:** `src/app.jsx` still builds the Tally groups from `rangedItems` through `tallyGroups` in `src/view-rules.mjs` (V7). `filterTally` in that file narrows copies without changing a shown row's counts (V10.14 to V10.18). `src/app.jsx` still shows a note through `hidden by filters`.

A note reads `N copies hidden by filters` when search or hide-received hides copies from the breakdown. The counts stay complete. So the figures never change because a search or hide-received changed.

Cost basis follows the same rule for search and hide-received. See `cost-basis-excludes-ship-and-tax` for what basis counts.

## See also

- `cost-basis-excludes-ship-and-tax` — what the basis counts and leaves out.
- `search-filters-inside-package` — the search that filters the breakdown.
- `tally-row-lists-its-copies` — the rows that the counts cover.
- `date-filter-spans-ledger-views` — the date range, which does change the counts.
