# Tally Pools By Exact Product Name

The Tally view groups line items by the exact product name text. TCGplayer names come from a scrape, so identical products share one byte-identical string. The app does not normalize names before pooling them. This choice is deliberate and stays in place.

## The argument, as recorded

```
- **Tally view**: line items pooled by *exact* Product Name across every
  seller and order (TCGplayer names are a scrape, so duplicates are
  byte-identical — no normalization is done, deliberately). Each row shows
```
