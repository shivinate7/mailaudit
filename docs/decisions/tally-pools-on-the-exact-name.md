# Tally pools by exact product name

The Tally view pools line items by *exact* Product Name, across every seller and order. TCGplayer names come from a scrape. So duplicates are byte-identical. The app does not normalize names before pooling them. This is deliberate, and it stays in place.

**Holds while:** `tallyGroups` in `src/view-rules.mjs` keys each group on `it.name`, with no name normalization before the lookup. The `itemGroups` memo in `src/app.jsx` calls it (V7.1 and V7.2).

## See also

- `unit-rate-is-not-the-position` — the figure this pooling feeds.
- `cost-basis-excludes-ship-and-tax` — the basis this pooling computes.
