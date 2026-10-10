# The package progress bar sits out of flow

The progress bar is absolutely positioned on the card's own top edge, in `edgeBar`. It is not part of the card's flow, so the bar moves no row when it mounts.

**Holds while:** `edgeBar` in `src/app.jsx` sets `position: absolute`, and the bar mounts only while `gotQty > 0 && !done`.

Before the fix, the first check-in in a package grew the card by 28px, and pushed every remaining row in it down by 28px. That was measured at 375px against the seeded ledger. The rows sat directly under the thumb that had just tapped one of them. That broke `no-layout-shift-under-pointer` on the most common gesture in the app.

The 28px came from two unrelated causes. The in-flow bar was 15px of it. The bar was a 15px child that appeared above everything it displaced. The action row was the other cause. Its labels wrapped to a second line, which grew the row. The row is now reserved at 46px (`BULK_ROW_H`), so a wrap no longer moves it. The `card-reserved-geometry` record has the measured heights.

`edgeBar` is absolutely positioned inside the card's existing `overflow: hidden` rounded box. The card's 10px corner rounds the bar. This is why `ProgressBar` has a `radius` prop separate from `height`. Without that split, the bar would be a pill floating inside another shape. The bar is 3px tall, because it is a rule on an edge, not a bar in a row. It catches no taps. It can mount and unmount without moving anything.

The bar is out of flow, not reserved. The reason is not about layout. The `gotQty > 0 && !done` gate stands because of this. A reserved slot would stay mounted through completion. The bar would then render at 100% and sheen. The Motion section's gild is the only marker of a completed package, because the bar cannot survive to mark it. Test 44.5 fails if the gate goes. Read that failure as a change to the motion design, not as a broken refactor.

The Tally card has `position: relative` for the same bar. PackageCard already had one, for `.mdl-gild`. Without `position: relative`, the bar escapes to the nearest positioned ancestor and draws somewhere else on the page. Tests 44.2 and 44.7 pin both cards.

**Pinned by:** 44.2, 44.4a, 44.4b, 44.5 and 44.7. Three mutants needed a pair of assertions to die properly:
- the bar back in flow (44.4a);
- the bar taking pointer events (44.4b);
- either card losing `position: relative` (44.2 and 44.7).

The bar surviving completion is a reserved slot by another name. 44.5 kills that mutant. Read a 44.5 failure as a change to the motion design, not as a broken refactor. Keep 44.5 if the group is ever trimmed.

## See also

- `card-reserved-geometry` — the measured card growth this record fixes.
- `no-layout-shift-under-pointer` — the invariant the out-of-flow bar exists to satisfy.
- `motion-completed-package-gilded` — the animation that marks completion once the bar can no longer do it.
