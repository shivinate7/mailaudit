# A stamp hides the lost-mail warning

Any stamped package hides the lost-mail warning. The warning is hidden in the package header line and in the Tally source row alike. The order is already being handled by hand, so the warning would add nothing. For a reshipped order, the original order date has no meaning.

**Holds while:** `lostMail` in `src/view-rules.mjs` returns null when its `done` argument is true. Both of its callers in `src/app.jsx` pass `done || stamped`. V2.4 in `test/view-rules.test.mjs` pins the null.

Group 32 covers the search reveal, see `search-filters-inside-package`.

**Pinned by:** 37.11. Mutant confirmed red: the warning ignoring the stamp.

## See also

- `lost-mail-flags-use-order-date` — the warning this rule hides.
- `one-stamp-per-package` — the stamp that triggers the hide.
- `a-refund-leaves-every-count` — another exclusion the same stamp causes.
