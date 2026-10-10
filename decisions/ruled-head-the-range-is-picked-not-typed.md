# The custom date range is picked, not typed

The custom range uses a month picker. The months come from the orders that the ledger actually contains, newest first. The iOS numeric keypad has no hyphen key. So a masked `YYYY-MM-DD` field cannot be completed on the only device this app ships to.

**Holds while:** `RANGES` in `src/app.jsx` lists seven options, and the file still shows an "Exact dates" disclosure.

A month needs no keyboard. It cannot express 2026-02-31. It also makes the ~140px UA minimum width irrelevant. That width is what collapsed the date range in the first place. The native date pair survives behind an **Exact dates** disclosure, for the rare precise case.

Reading the month off the ISO string is deliberate. `Date.parse("2026-05-01")` is UTC midnight. In any zone behind UTC, `getMonth()` rolls it back to April. Test 23.16 catches that. Older M/D/YY exports parse as local midnight, so they take the local-getter branch.

All **seven** RANGES options ship. They are laid out four to a row, so they cost two rows rather than three.

## See also

- `ruled-head-is-the-mastheads-vocabulary` — the region this control lives in.
- `ruled-head-panels-carry-no-fill` — the disclosure style this control shares.
