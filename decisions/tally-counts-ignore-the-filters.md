# Tally counts cover every copy, filtered or not

Tally counts and basis cover every copy of an item. A filter does not change them. Hide received and search can filter the copy breakdown, and the counts still cover every copy.

**Holds while:** `src/app.jsx` still shows a note that says how many copies the filters hid, through `hidden by filters`.

A note reads `N copies hidden by filters` when filters hide copies from the breakdown. The counts stay complete. So the figures never change because a filter changed.

Cost basis follows the same rule. See `cost-basis-excludes-ship-and-tax` for what basis counts.

## See also

- `cost-basis-excludes-ship-and-tax` — what the basis counts and leaves out.
- `search-filters-inside-package` — the search that filters the breakdown.
- `tally-row-lists-its-copies` — the rows that the counts cover.
