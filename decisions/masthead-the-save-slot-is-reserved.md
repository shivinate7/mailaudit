# The save indicator sits in a reserved, fixed-size slot

The tally footer holds `N packages · autosaves`, the exact `N still missing · $X`, and the debounced save indicator. The save indicator sits in a reserved slot. That is invariant 5 too. Before the fix, the indicator sized itself to its own content. It was 0px wide at rest and about 44px wide while saving. A wrapping flex row cannot absorb that change. Whether the row was one line or two depended on where the two figures fell relative to the wrap point. On the wrong side of that point, the indicator added a line on every tap and removed it 2.5s later. The masthead had scrolled off by then, so the package list moved, twice per check-in. That is the cascading mis-tap this invariant exists to prevent, and it arrived from the one element that changes on every single tap. This defect predates the motion pass. It was never a regression from that pass.

**Holds while:** the `.mdl-foot` save slot in `src/app.jsx` sets `minWidth` to `13ch`. The idle state renders a non-breaking space, not an empty string.

The slot reserves `min-width: 13ch`. That is the width of its longest state, `couldn’t save`. The content swaps inside a box that never changes size. Reserving the width alone is not enough. An empty flex item is zero pixels tall. A line that holds only that item collapses, and the shift returns. Measured: 14px idle against 26px saving, with the width already reserved. So the idle state renders a non-breaking space, written `\u00a0`, and not nothing. That gives one line box, with no hard-coded height. If you change any of the three messages, measure again. 13ch is the longest message, counted.

Measured on the built page against the seeded ledger: 12 realistic figure pairs × 4 indicator states, at each of 320 / 375 / 390 / 430 / 760px. Height is constant in every pair. Horizontal overflow is 0 throughout. Before the fix, 4 of 10 pairs at 375px moved by 12–14px. At 375px the row is 26px (two lines) for every pair the seed can produce. At 760px it is 12px (one line). Group 42 pins the mechanism underneath. jsdom has no layout, so tests cannot assert the shift itself.

Re-measuring this is easy to get wrong, in three ways. Each one looks like a result. Measure on a *clone* of `.mdl-foot`, never the live row. Setting `textContent` on a node that React owns tears the tree down, with a `removeChild` NotFoundError. Set the idle state to `\u00a0`, not `" "`. HTML collapses a plain space, so a plain-space idle state measures as the empty slot. That reports the shipped build shifting 12px on 7 of 12 pairs. The measurement then reproduces the bug instead of finding it. Substitute the figures too. The seed's own pair, `478 packages` and `173 still missing · $6,066.20`, is already 335px against a 327px row. It is two lines in every state, so it cannot move. Only pairs small enough to share one line, without the slot, show any difference.

One measured detail needs a note. `couldn’t save` renders at 82.19px. The reservation buys 82.18px. This happens because `ch` is the advance of `0`, and the curly apostrophe is slightly wider. It does not shift today. `min-width` is a floor, and that line has about 50px of slack. Still, the slot does not cover its longest message literally. Test 42.3 compares *character counts*. So it catches a longer message. It does not catch a message of the same length with wider glyphs.

This does not fix every width change. The two figures can still change width on their own. For example, `100 packages` can change to `99 packages`, and `$1,009.00` can change to `$999.00`. On the wrap boundary, that can reflow the row by itself. This is far rarer than a save indicator that changes twice per tap. The fix would be to reserve width for figures whose job is to change. That is left alone on purpose.

## See also

- `masthead-foot-slot` — the measured slot width and row heights this reservation relies on.
- `no-layout-shift-under-the-pointer` — the invariant the reserved slot exists to satisfy.
- `card-the-action-row-is-reserved` — the same reservation pattern applied to a card's action row.
