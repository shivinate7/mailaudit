# The stamped filter sits on the normal pipeline

The `N stamped` cell filters the Packages view to stamped packages. The filter sits on top of the normal pipeline.

**Holds while:** `stampedPackages` in `src/app.jsx` calls `stampedPackagesOf` in `src/view-rules.mjs` (V12.21), and it reads `rangedActive`, which holds the in-range items before the refund exclusion.

The date range, Showing and Find all still apply. So a stamped package that is fully received stays hidden under Unreceived. The count can read higher than the list. `N lines` can do the same.

The cell sits beside `N canceled`. It uses the Showing cell's style: `○/●` with `aria-pressed`. A filter is a state, not a disclosure.

Refunded packages come back while this filter is on. `stampedPackages` reads `rangedActive`, which holds the in-range items before the refund exclusion. Each one shows a manila `N left · refunded` pill, in place of the red figure.

The native Packages tab draws the cell in a ruled row of its own that is always there, even at 0 stamped, so the first stamp does not push the list down (`no-layout-shift-under-pointer`). The web draws that row only while a stamp or a canceled order exists. The filter turns itself off when the count reaches 0, on both.

This is the only place a refund can be found and un-stamped. `packageOrder` ranks whichever source is live. Otherwise a refunded package would sort last under every order.

The filter works in the Packages view only. Tally has no package to filter.

## See also

- `a-refund-leaves-every-count` — the exclusion this filter reads past.
- `one-stamp-per-package` — the stamp that sends a package here.
- `package-sort-swaps-with-view` — the sort that ranks these packages.
- `ruled-head-showing-unreceived` — the Showing control the filter cell copies.
