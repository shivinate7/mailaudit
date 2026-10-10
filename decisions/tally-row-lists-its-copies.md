# A Tally row lists every copy it counts

A collapsed Tally row shows `got/ordered`, the unit rate, the outstanding figure, the seller and order counts, and the sets involved. The row shows the rate in the form "$X / copy".

**Holds while:** the expanded Tally row in `src/app.jsx` still renders its `across` line.

Each row shows "N left · $Y" for what is still missing. Expanding a row adds the line "$X across N copies · $Y avg". The expanded row lists every source copy. Each entry gives the seller, the date, the set and the order id.

Each source copy has the same tap-to-check control and qty stepper as the package view. Each copy also has its own lost-mail flag.

The unit rate is explained in `unit-rate-is-not-the-position`.

## See also

- `unit-rate-is-not-the-position` — the rate the collapsed row shows.
- `tally-counts-ignore-the-filters` — the counts the row shows, filtered or not.
- `card-tally-row-counts-first` — the order of the row's meta line.
- `search-filters-inside-package` — how a copy's order id reveals its whole order.
