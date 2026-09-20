# Refunded Packages Leave Every Count

A package stamped Refunded or Partial refund drops out of every count and the normal package list, the same way a canceled order does. The money already came back, so nothing about that package stays outstanding. Totals, Tally, and the Orphaned candidates all inherit this exclusion from one shared source.

## The argument, as recorded

```
  `Refunded` and `Partial refund` take the package out of **every count and
  the normal list**, exactly as a canceled order is — the money is back, so
  nothing is outstanding. One chokepoint: `liveItems` excludes refunded
  packages the way `activeItems` excludes canceled ones, and totals, Tally,
  and the Orphaned candidates all inherit it. So stamping an order Refunded
  makes its card **vanish from the list under your finger** — the precedent
  is "Mark all received" under Unreceived, and the `N stamped` cell is the
```

## See also

- `a-stamped-package-hides-the-lost-mail-warning` — another effect a stamp has on a package.
- `one-stamp-per-package` — the stamp that triggers this exclusion.
