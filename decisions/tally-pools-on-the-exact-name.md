# Tally pools by exact product name

The Tally view groups line items by the exact product name text. TCGplayer names come from a scrape, so identical products share one byte-identical string. The app does not normalize names before pooling them. This choice is deliberate and stays in place.

## See also

- `unit-rate-is-not-the-position` — the figure this pooling feeds.
- `cost-basis-excludes-shipping-and-tax` — the basis this pooling computes.
