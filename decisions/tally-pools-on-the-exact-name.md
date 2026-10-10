# Tally pools by exact product name

The Tally view pools line items by *exact* Product Name, across every seller and order. TCGplayer names come from a scrape. So duplicates are byte-identical. The app does not normalize names before pooling them. This is deliberate, and it stays in place.

**Holds while:** the `itemGroups` map in `src/app.jsx` keys each group on `it.name`, with no name normalization before the lookup.

## See also

- `unit-rate-is-not-the-position` — the figure this pooling feeds.
- `cost-basis-excludes-ship-and-tax` — the basis this pooling computes.
