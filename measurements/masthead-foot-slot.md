# Masthead foot save-slot width

This record holds the 13ch reservation for the tally footer save indicator. It holds the longest message width, the one-line and two-line row heights, and the three ways a re-measure goes wrong. Re-measure at the widths listed after a change to the three save messages or the footer layout.

## How to re-measure

Open the built page against the seeded ledger. Cycle the 12 figure pairs and the 4 indicator states at each of 320, 375, 390, 430, and 760px. Measure the row height at each combination. Avoid three traps. Do not measure a live React node. Do not use a plain space for the idle state. Do not use a figure pair small enough to share one line without the slot.

## Reader

No reader. A test cannot hold this claim, because jsdom has no layout.

## Figures

The tally footer's save indicator sits in a RESERVED slot. This is `no-layout-shift-under-pointer` too. `.mdl-foot` is a wrapping flex row. It holds three things: `N packages · autosaves`, the exact `N still missing · $X`, and the debounced save indicator.

The indicator was sized by its content. So it was 0px wide at rest and ~44px wide while saving. A flex row that wraps cannot absorb that change. Whether the row is one line or two depends on where the two figures fall relative to the wrap point. On the wrong side of that point, the indicator *added a line* on every tap. It took the line away again 2.5s later. By then the masthead had scrolled off, and the thumb was on a card. So what actually moved was the package list, twice per check-in. That is the cascading mis-tap that `no-layout-shift-under-pointer` exists to prevent, and it came from the one element that changes on every tap. This predates the motion pass. It was never a regression from it.

The slot reserves `min-width: 13ch`. That is the width of the longest of its three states, `couldn’t save`. The content swaps inside a box that never changes size.

Reserving the width alone is not enough. An empty flex item is zero pixels *tall*. So a line that holds only the empty slot collapses, and the shift comes back. Measured: 14px idle against 26px saving, with the width already reserved. So the idle state renders a non-breaking space rather than nothing. That gives one line box with no hard-coded height. Change any of the three messages, and re-measure. 13ch is the longest one, counted.

Measured on the built page against the seeded ledger: 12 realistic figure pairs × 4 indicator states at each of 320 / 375 / 390 / 430 / 760px. Height was constant in every pair. Horizontal overflow was 0 throughout. Before the fix, 4 of 10 pairs at 375px moved by 12–14px. At 375px the row is 26px (two lines) for every pair the seed can produce. At 760px it is 12px (one line). Group 42 pins the mechanism underneath. jsdom has no layout, so the shift itself is not assertable there. It never will be.

Re-measuring this is easy to get wrong. Three mistakes each look like a result.

- Measure on a *clone* of `.mdl-foot`, never the live row. Setting `textContent` on a node that React owns tears the tree down with a `removeChild` NotFoundError.
- Set the idle state to `\u00a0`, not `" "`. HTML collapses a plain space. So a plain-space idle measures as the *empty* slot. It then reports that the shipped build shifts 12px on 7 of 12 pairs. The measurement reproduces the bug. It does not find it.
- Substitute the figures. The seed's own pair, `478 packages` / `173 still missing · $6,066.20`, is already 335px against a 327px row. So it is two lines in every state, and it cannot move. Only pairs small enough to share one line *without* the slot discriminate at all.

One measured detail needs a note. `couldn’t save` renders at 82.19px. The reservation buys 82.18px. This is because `ch` is the advance of `0`, and the curly apostrophe is slightly wider. It does not shift today. `min-width` is a floor, and that line has ~50px of slack. But the slot does not literally cover its longest message. Test 42.3 compares *character counts*. So it catches a longer message. It would not catch a same-length message with wider glyphs.

This does not fix one thing. The two figures can still change width on their own. Examples: `100 packages` → `99 packages`, and `$1,009.00` → `$999.00`. On the wrap boundary, that can reflow the row by itself. This is far rarer than a save indicator that changes twice per tap. The fix would be to reserve width for figures whose job is to change. It is left alone on purpose.
