# Refunded packages leave every count

A package stamped `Refunded` or `Partial refund` drops out of every count and the normal package list. A canceled order leaves the same way. The money already came back, so nothing about that package stays outstanding.

**Holds while:** `liveItems` in `src/app.jsx` drops refunded packages, and `activeItems` drops canceled orders. `isRefundStamp` matches the `refunded` and `partial` stamp kinds.

One shared source, `liveItems`, excludes refunded packages the way `activeItems` excludes canceled ones. Totals, Tally, and the Orphaned candidates all inherit that exclusion.

Stamping an order `Refunded` makes its card vanish from the list under the user's finger. The precedent is "Mark all received" under Unreceived. The `N stamped` cell is the signpost for those packages.

## See also

- `stamped-package-hides-lost-flag` — another effect a stamp has on a package.
- `one-stamp-per-package` — the stamp that triggers this exclusion.
