# Phone navigation is a bottom glass bar

The owner ruled on 2026-10-11: "bottom bar D is gorgeous! yes go for it". On a phone, navigation is a floating glass capsule in the parchment palette. This is variant D. It has four tabs, from left to right: Ledger, Orphaned, Tally and Packages. The owner ruled the order on 2026-10-11: "move ledger to be most left on the bottom bar". The bar replaces the top view switch on phone.

**Status:** ruled. The native bar is built in lane N5 (PR #82). The web bar is not built. The owner approved mockup G on 2026-10-11: "G looks decent", and "this is the right direction go". The owner expects polish of the Ledger view and the app after the build.

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

The Swift app uses the system tab bar, built in lane N5, see `native-build-lanes`. The system tab bar gives the real iOS 26 glass. In N5, Ledger, Orphaned and Tally are placeholder screens. Tally and Orphaned are built in lanes N6 and N7. The Ledger tab has no lane yet.

## The Ledger tab

The fourth tab is Ledger, with a gear icon. The working screens lose their control rows. The options move to the Ledger tab. See `ledger-tab-holds-options`.

## Find

Find is a floating search field above the bar, in the same glass style (mockup G). It is a full-width glass pill, inset 24px, 8px above the capsule and about 48px tall, with a magnifier icon. Its border turns accent while it has focus. It hides on the Ledger tab.

## Defaults and invariants

- Above phone width, the same capsule and search pill show, centred with a 480px maximum width. This is an orchestrator default of 2026-10-11 that keeps one layout. The owner may overrule it.
- Re-import CSV and Reset stay reachable on an empty ledger and from Orphaned, through the Ledger tab. `recovery-control-not-state-gated` requires it.

## See also

- `ledger-tab-holds-options` — the options that the Ledger tab holds.
- `design-view-switch-equal-thirds` — the top switch that this bar replaces on phone.
- `motion-the-switch-is-one-object` — the motion of the top switch. The bar's motion is not ruled.
- `three-views-share-one-switch` — the three views that the bar's first three tabs name.
- `ux-house-rules-govern` — the house rules that the web lane L11 cites.
- `native-build-lanes` — lane N5, which built the native tab bar.
- `no-layout-shift-under-pointer` — the invariant the bar must keep.
