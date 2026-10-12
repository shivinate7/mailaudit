# Phone navigation is a bottom glass bar

The owner ruled on 2026-10-11: "bottom bar D is gorgeous! yes go for it". On a phone, navigation is a floating glass capsule in the parchment palette. This is variant D. It has four tabs, from left to right: Ledger, Orphaned, Tally and Packages. The owner ruled the order on 2026-10-11: "move ledger to be most left on the bottom bar". The bar replaces the top view switch at every width.

**Status:** built in L11a, commit `250823d`. The Ledger tab is built in L11b, commit `12e8721`. The owner approved mockup G on 2026-10-11: "G looks decent", and "this is the right direction go". The owner expects polish of the Ledger view and the app after the build. Two questions are open for the owner:

- The Ledger icon. The bar ruling names a gear icon. The code still draws a circle with eight rays (`BAR_ICONS.ledger`). L11b did not redraw it. Keep the gear, or accept the rays.
- Should the bar show on a ledger with nothing in it? Today it shows, so Re-import and Reset stay reachable. The owner has not ruled it.

**Holds while:** `src/app.jsx` renders the bar as a `nav` labelled Views. It holds four tabs in the order Ledger, Orphaned, Tally, Packages. It marks the current tab with `aria-current`. The native target is iOS 26, as `native-swift-rebuild` sets it. The web palette is the parchment ledger, as `design-parchment-ledger` sets it.

## The web bar (variant D)

- A floating glass capsule. It is fixed to the bottom of the screen. It is inset 24px from each side.
- It is 64px tall. It sits 12px above the bottom edge, plus the safe-area inset, so it clears the home indicator.
- It is capped at 480px wide and centred on wide screens.
- Its fill is the paper token at 62%, with blur and saturate. The fill is `color-mix` over the token, not `rgba()`. See `design-parchment-ledger`.
- A hairline border in the line token. A soft shadow.
- Each tab has a 22px line icon above its label. Each tab is at least 44px by 44px.
- The active tab sits in an inner card-colour pill, at 90% of the card token. Its icon and label use the accent colour. The build sets no transition on the active fill.
- The Orphaned tab keeps its count badge. It shows the number of pending envelopes.
- The page has bottom padding of 148px, plus the safe-area inset. The last card scrolls clear of the bar and the pill.

The web lane is L11 in `ux-house-rules-govern`.

## The native bar

The Swift app uses the system tab bar. The system tab bar gives the real iOS 26 glass. The native lane is N5 in `native-build-lanes`.

## The Ledger tab

The first tab is Ledger. It holds the options, in a View group and a Data group, with Reset last. It shows no package. See `ledger-tab-holds-options`.

## Find

A floating search pill sits above the bar, 8px above it. It is inset 24px from each side, capped at 480px, and about 48px tall. It has a magnifier icon and a 16px input, so iOS does not zoom. Its border turns accent while it has focus.

The pill replaces the in-page Find field. It filters the same way. It shows only on Tally and Packages, and only when the ledger holds items. It is absent on Ledger, on Orphaned, and on an empty ledger.

The canceled-orders reference and the stamped filter keep their own ruled row. That row shows only while one of them has something to show.

## Defaults and invariants

- Above phone width, the same bar and pill show, centred with a 480px maximum width. This is an orchestrator default of 2026-10-11 that keeps one layout. The owner may overrule it.
- Re-import CSV and Reset stay reachable on an empty ledger and from every screen. `recovery-control-not-state-gated` requires it. L11b moved both to the Ledger tab. One tap on the bar reaches that tab from any screen.

**Pinned by:** 21.4 (tab order, Ledger first), 62.1 to 62.10 (the nav landmark, the current tab, the Ledger tab without a package, the pill, the retired switch, four tabs on an empty ledger, the Orphaned count), 63.4 to 63.7 (the Ledger tab's options and its current tab), 63.16 to 63.20 (the Ledger tab is reachable on an empty ledger), 43.1 and 43.2 (the current tab follows the view), and `npm run check:screens` (claim 5, the bar's geometry at 375px and 760px).

## See also

- `ledger-tab-holds-options` — the options that the Ledger tab holds.
- `design-view-switch-equal-thirds` — the retired top switch that this bar replaces.
- `motion-the-switch-is-one-object` — the retired switch's motion. The bar's motion is not ruled.
- `three-views-share-one-switch` — the three working views that the bar's tabs name.
- `ux-house-rules-govern` — the house rules that the web lane L11 cites.
- `native-build-lanes` — lane N5, the native tab bar.
- `no-layout-shift-under-pointer` — the invariant the bar must keep.
