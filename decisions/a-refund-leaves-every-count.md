# Refunded packages leave every count

A package stamped `Refunded` or `Partial refund` drops out of every count and the normal package list. A canceled order leaves the same way. The money already came back, so nothing about that package stays outstanding.

**Holds while:** `liveItems` in `src/app.jsx` calls `dropGks` in `src/view-rules.mjs` (V12.18 to V12.20) to drop refunded packages, and `activeItems` calls `dropCanceled` there (V12.14 and V12.15) to drop canceled orders. `isRefundStamp` matches the `refunded` and `partial` stamp kinds.

One shared source, `liveItems`, excludes refunded packages the way `activeItems` excludes canceled ones. Totals, Tally, and the Orphaned candidates all inherit that exclusion.

The native `LiveItems` applies the same exclusion. The masthead, `OrphanedModel`, `TallyModel` and `PackagesModel` read it on every load. It reads `stamps` from the store and drops the packages `groupPackages` names, so no copy of `gkOf` lives in Swift. The refund kinds, refunded and partial, are a Swift literal: no test ties them to the web's list.

Stamping an order `Refunded` makes its card vanish from the list under the user's finger. The precedent is "Mark all received" under Unreceived. The `N stamped` cell is the signpost for those packages.

**Pinned by:** group 37. Mutants confirmed red:
- `canceledCount` measured off `liveItems` instead of `activeItems` (37.18);
- `packageOrder` built from `packages` instead of the live source (37.40);
- the refund exclusion dropped from `liveItems` alone (37.70).

That last mutant leaves every masthead figure right. Those figures derive from `rangedItems`. Only the Orphaned candidates read `liveItems`. So only an envelope test sees it. See `testing-chokepoint-two-branches`.

## See also

- `stamped-package-hides-lost-flag` — another effect a stamp has on a package.
- `one-stamp-per-package` — the stamp that triggers this exclusion.
