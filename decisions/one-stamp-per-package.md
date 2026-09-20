# One stamp per package, latest wins

Each package holds at most one order stamp, set by hand from a fixed list of kinds. Picking a different kind replaces the old stamp and moves its date forward. Editing only the note keeps the existing date in place.

## The argument, as recorded

```
- **Order stamps** — one per package, set by hand: `Claim filed · Refunded ·
  Seller contacted · Reshipped · Partial refund · Other`, dated the day it was set
  (local calendar day, not UTC — the same trap the month picker documents),
  with an optional free line. Picking another kind **replaces** it and
  re-dates it; editing only the note keeps the date. Rendered as a band under
```

## See also

- `stamp-removal-writes-a-tombstone` — how a stamp is undone.
- `a-refund-leaves-every-count` — an effect two of the stamp kinds cause.
- `a-stamped-package-hides-the-lost-mail-warning` — another effect of setting a stamp.
