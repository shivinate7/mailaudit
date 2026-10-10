# One stamp per package, latest wins

Each package holds at most one order stamp. Stamps are set by hand from a fixed list of kinds: `Claim filed · Refunded · Seller contacted · Reshipped · Partial refund · Other`.

**Holds while:** `STAMP_KINDS` in `src/app.jsx` lists the six kinds, and `stamps` is keyed by the package key from `gkOf`.

A stamp is dated the day it was set. The date is the local calendar day, not UTC. This is the same trap the month picker documents. A stamp can also carry an optional free line.

Picking another kind replaces the old stamp, and it re-dates the stamp. Editing only the note keeps the existing date. The stamp renders as a band under the package header.

## See also

- `stamp-removal-writes-a-tombstone` — how a stamp is undone.
- `a-refund-leaves-every-count` — an effect two of the stamp kinds cause.
- `a-stamped-package-hides-the-lost-mail-warning` — another effect of setting a stamp.
