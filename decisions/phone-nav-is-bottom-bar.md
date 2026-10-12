# Phone navigation is a bottom glass bar

The owner ruled on 2026-10-11: "bottom bar D is gorgeous! yes go for it". On a phone, navigation is a floating glass capsule in the parchment palette. This is variant D. It has four tabs: Orphaned, Tally, Packages and Ledger. The bar replaces the top view switch on phone.

**Status:** ruled, not built. Open: the order of the first three tabs, the look of the Find field, and the layout above phone width. See "Open" below.

**Holds while:** the native target is iOS 26, as `native-swift-rebuild` sets it. The web palette is the parchment ledger, as `design-parchment-ledger` sets it. `src/app.jsx` has no bottom bar element yet.

## The web bar (variant D)

- A floating glass capsule. It is inset 24px from each side of the screen.
- It sits 12px above the home indicator.
- Its fill is paper at 62%, with blur and saturate.
- A hairline border in the line token. A soft shadow.
- Each tab has a line icon above its label.
- The active tab sits in an inner card-colour pill. Its icon and label use the accent colour.
- The Orphaned tab keeps its count badge.
- The page has bottom padding, so the last card scrolls clear of the bar.

The web lane is L11 in `ux-house-rules-govern`.

## The native bar

The Swift app uses the system tab bar. The system tab bar gives the real iOS 26 glass. The native lane is N5 in `native-build-lanes`.

## The Ledger tab

The fourth tab is Ledger, with a gear icon. The working screens lose their control rows. The options move to the Ledger tab. See `ledger-tab-holds-options`.

## Find

Find is a floating search field above the bar, in the same glass style. The placement is ruled. The exact look waits for a mockup now in progress.

## Open

- The order of Orphaned, Tally and Packages is open. Today the order is Orphaned, Tally, Packages. The owner has not answered whether Packages goes left.
- The layout above phone width is not ruled. The owner has not said whether the bar or the top switch shows there.
- The look of the Find field waits for the mockup.
- Re-import CSV and Reset must stay reachable on an empty ledger and from Orphaned. The owner has not ruled that for the bar. See `recovery-control-not-state-gated`.

## See also

- `ledger-tab-holds-options` — the options that the Ledger tab holds.
- `design-view-switch-equal-thirds` — the top switch that this bar replaces on phone.
- `motion-the-switch-is-one-object` — the motion of the top switch. The bar's motion is not ruled.
- `three-views-share-one-switch` — the three views that the bar's first three tabs name.
- `ux-house-rules-govern` — the house rules that the web lane L11 cites.
- `native-build-lanes` — lane N5, the native tab bar.
- `no-layout-shift-under-pointer` — the invariant the bar must keep.
