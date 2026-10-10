# The date filter applies to both ledger views

The date filter applies to the Tally view and the Packages view. Orphaned hides it, because it applies to nothing there.

**Holds while:** `RANGES` in `src/app.jsx` lists the date options.

The options are All, 30, 45, 60 and 90 days. A free "# days" box accepts any count. A custom from–to pair sets a range. Search and Showing also apply to both ledger views.

The range sits behind one control. That control shows the active range. Tapping it opens the chip set, the "# days" box and the custom pair. The panel starts shut on every load. It is not saved.

The collapse saved ~22px at 375px. Seven chips had wrapped to two rows. The custom pair always claimed a third row. The native `<input type="date">` has a ~140px minimum width.

## See also

- `ruled-head-range-picked` — how the custom range is chosen.
- `ruled-head-panels-carry-no-fill` — the style the range panel follows.
- `ruled-head-masthead-vocabulary` — the head cell that shows the range.
- `search-filters-inside-package` — the search the date filter shares.
