# Package sort swaps with the view

The Packages view has its own sort, separate from the Tally sort. The sort control swaps with the view. The keys are newest, oldest, dollars remaining, unit rate, and seller A to Z.

**Holds while:** `packageOrder` in `src/app.jsx` ranks the packages, and it reads `itemSort` for no package key.

Both orders freeze while the user checks cards. For a package, unit rate is that package's basis over its own copies. `packageOrder` computes it.

`packageOrder` ranks whichever source is live. A refunded package in the stamped filter sorts with the rest. See `stamped-filter-on-the-pipeline`.

## See also

- `unit-rate-is-not-the-position` — how unit rate differs from position in each view.
- `tally-sort-keys-are-six` — the separate Tally sort.
- `no-layout-shift-under-pointer` — why both orders freeze while the user checks cards.
- `stamped-filter-on-the-pipeline` — the refunded packages that the sort must still rank.
