# A green suite can hide a broken feature

A fully passing suite proved nothing about the single most important scenario, because every test booted a ledger that already held data. The Pull control turned out to be unreachable on an empty ledger, the exact case a fresh device needs it for. A green run only covers the states its fixtures actually build.

## The argument, as recorded

```
That same session is what surfaced the group-28 bug — Pull unreachable on an
empty ledger. Worth remembering as a method: the suite was all green and the
feature was still broken in its single most important scenario, because every
test booted a ledger that already had data in it.
```
