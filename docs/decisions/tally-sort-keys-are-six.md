# The Tally view sorts on six keys

The Tally view sorts its rows on six keys. They are most missing, cost basis, most ordered, dollars remaining, unit rate, and name A to Z. The label "Cost basis" is an orchestrator default of 2026-10-11, not an owner ruling. It is built.

**Holds while:** the sort table in `src/app.jsx` lists `Most missing`, `Cost basis`, `Most ordered` and `Name A–Z`, among the six.

The order freezes while the user checks cards. The choice persists as `itemSort`. The unit rate sort can disagree with the cost-basis sort, on purpose. See `unit-rate-is-not-the-position`.

**Pinned by:** tests 22.1 to 22.3 (cost basis and unit rate order the rows), and 61.27 and 61.28 (the sort panel lists exactly six options, and each label is 12 characters or fewer).

## See also

- `no-layout-shift-under-pointer` — why the order freezes while the user checks cards.
- `saved-state-shape` — where `itemSort` is saved.
- `unit-rate-is-not-the-position` — why unit rate and position differ.
- `package-sort-swaps-with-view` — the separate sort the Packages view uses.
