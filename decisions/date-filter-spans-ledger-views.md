# The date filter applies to both ledger views

The date filter applies to the Tally view and the Packages view. Orphaned hides it, because it applies to nothing there.

**Holds while:** `RANGES` in `src/app.jsx` lists the date options.

The options are All time, 30 days, 45 days, 60 days and 90 days. "Last…" takes a free day count. "By month" sets a custom range from the months in the ledger. The native from–to pair sits behind an "Exact dates" disclosure. Search and Showing also apply to both ledger views.

The range sits behind one control. That control shows the active range. Tapping it opens the chip set, the "Last…" day box and the month picker. The panel starts shut on every load. It is not saved.

Before the collapse, seven chips wrapped to two rows. The custom pair claimed a third row. The collapse saved ~22px at 375px. The native `<input type="date">` has a ~140px minimum width.

## See also

- `ruled-head-range-picked` — how the custom range is chosen.
- `ruled-head-panels-carry-no-fill` — the style the range panel follows.
- `ruled-head-masthead-vocabulary` — the head cell that shows the range.
- `search-filters-inside-package` — the search the date filter shares.
