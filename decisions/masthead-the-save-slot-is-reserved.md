# The save indicator sits in a reserved, fixed-size slot

The save indicator used to grow and shrink with its own text. That change could add or remove a whole line in the tally footer on every check-in. The slot now reserves the width of its longest message. It also renders a non-breaking space when idle, because an empty flex item still collapses to zero height.

## The argument, as recorded

```
**The tally footer's save indicator sits in a RESERVED slot, and that is
invariant 5 too.** `.mdl-foot` is a wrapping flex row holding three things —
`N packages · autosaves`, the exact `N still missing · $X`, and the debounced
save indicator. The indicator used to be sized by its content, which meant it
was 0px wide at rest and ~44px wide while saving, and a flex row that wraps has
no way to absorb that: whether the row is one line or two depends on where the
two figures happen to fall relative to the wrap point, so on the wrong side of
it the indicator *added a line* on every tap and took it away again 2.5s later.
By then the masthead has scrolled off and the thumb is on a card, so what
actually moved was the package list, twice per check-in — the cascading mis-tap
this invariant exists to prevent, arriving from the one element that changes on
every single tap. It predates the motion pass; it was never a regression from
it.

So the slot reserves `min-width: 13ch` — the longest of its three states,
`couldn’t save` — and the content swaps inside a box that never changes size.
**Reserving the width alone is not enough**, and getting that wrong looks like
a fix: an empty flex item is zero pixels *tall*, so a line holding nothing but
the empty slot collapses, and the shift comes straight back (measured: 14px
idle against 26px saving, with the width already reserved). The idle state
therefore renders a non-breaking space rather than nothing — one line box, no
hard-coded height. Change any of the three messages and re-measure: 13ch is the
longest one, counted.

Measured on the built page against the seeded ledger, 12 realistic figure pairs
× 4 indicator states at each of 320 / 375 / 390 / 430 / 760px: **height
constant in every pair, horizontal overflow 0 throughout**. Before the fix, 4
of 10 pairs at 375px moved by 12–14px. At 375px the row is 26px (two lines) for
every pair the seed can produce; at 760px it is 12px (one line). Group 42 pins
the mechanism underneath — jsdom has no layout, so the shift itself is not
assertable there and never will be.

**Re-measuring this is easy to get wrong, in three ways that each look like a
result.** Measure on a *clone* of `.mdl-foot`, never the live row: setting
`textContent` on a node React owns tears the tree down with a `removeChild`
NotFoundError. Set the idle state to `\u00a0` and not `" "` — HTML collapses a
plain space, so a plain-space "idle" measures as the *empty* slot and duly
reports the shipped build shifting 12px on 7 of 12 pairs, which is the bug
being reproduced by the measurement rather than found. And substitute the
figures: the seed's own pair (`478 packages` / `173 still missing · $6,066.20`)
is already 335px against a 327px row, so it is two lines in every state and
cannot move — only pairs small enough to share one line *without* the slot
discriminate at all.

One measured detail the "counted" above glosses: `couldn’t save` renders
82.19px against the 82.18px the reservation buys, because `ch` is the advance
of `0` and the curly apostrophe is fractionally wider. It does not shift today
— `min-width` is a floor, and that line has ~50px of slack — but the slot is
not literally covering its longest message, and 42.3 compares *character
counts*, so it catches a longer message and would not catch a same-length one
with wider glyphs.

What this does *not* fix, and is worth knowing: the two figures can still
change width on their own (`100 packages` → `99 packages`, `$1,009.00` →
`$999.00`), and on the wrap boundary that can reflow the row by itself. It is
far rarer than a save indicator that changes twice per tap, and the fix would
be to reserve width for figures whose whole job is to change. Left alone
deliberately.
```
