# Card reserved geometry heights

This record holds the package card and Tally card heights across a check-in. It holds the row displacement, the action row content needed per width, and the 320px case left unfixed. Re-measure at 375px, and at the widths listed, after a change to the progress bar or the action row.

## How to re-measure

Open the built page against the seeded ledger. Step through rest, the first check-in, the second check-in, and the tap that completes the package. Measure the card height and the row displacement at each step. Repeat the action row content measurement at 320, 360, 375, 390, 430, and 760px. The prose names no script. Re-run this by hand in a real browser. jsdom has no layout and cannot do this measurement.

## Reader

No reader. A test cannot hold this claim, because jsdom has no layout.

## The figures, as recorded

```
The save indicator above was the *smaller* half of this. The same defect lived
one level down and twice the size: measured at 375px against the seeded ledger,
**the first check-in in a package grew its card by 28px and pushed every
remaining row in it down by 28px** — inside the card, directly under the thumb
that had just tapped one of them. Invariant 5, on the most common gesture in
the app. It predates the motion pass and the save-slot fix and was independent
of both.

Two unrelated causes, each needing its own answer:

**The progress bar is out of FLOW, not reserved a slot.** It used to mount
between the header and the item rows on the first check-in, a 15px child
appearing above everything it displaced. It now sits on the card's own top
edge — `edgeBar`, absolutely positioned inside the card's existing
`overflow: hidden` rounded box, so the 10px corner does its rounding (hence
`ProgressBar`'s `radius` prop, separate from `height`, so this one is not a pill
floating inside another shape), it catches no taps, and it can mount and unmount
without moving anything. 3px, because it is a rule on an edge now rather than a
bar in a row.

Out of flow rather than reserved **for a reason that is not about layout**: it
is what lets the `gotQty > 0 && !done` gate stand. A reserved slot has to stay
mounted through completion, so the bar would render at 100% and sheen — and the
Motion section's gild is the sole marker of a package completing *precisely
because* the bar cannot survive to be one. Test 44.5 fails if the gate goes;
read that failure as "this is a change to the motion design", not as a broken
refactor. The Tally card was given `position: relative` for the same bar;
PackageCard already had one for `.mdl-gild`. Without it the bar escapes to the
nearest positioned ancestor and draws somewhere else on the page entirely,
which is why 44.2 and 44.7 pin both.

**The action row is reserved at its tallest state** (`BULK_ROW_H`, 44px of
content). Its membership changes on the same tap — "Clear check-ins" joins
"Stamp" and "Mark all received" — and at 375px those three want 60.6 + 143.7 +
129.9 plus two 8px gaps = **350px in the 313px a card gives them**, so both bulk
labels wrap to a second line and the row goes 31px → 44px. It shrinks by the
same 13px on the tap that *completes* a package, where "Mark all received"
leaves; reserving the tallest state pins both transitions at once. A counted
constant exactly like the save slot's 13ch, and stale the same way — two lines
of 11.5px mono plus `miniBtn`'s 8px padding. **The Tally card's row is
deliberately NOT reserved**: it has no Stamp button, so its two buttons are
282px of the same 313px, neither wraps, and it is one line in every state. Add a
third control there and reserve it then, measuring rather than assuming 44 fits.

Measured on the built page against the seeded ledger, rest → first check-in →
second → the tap that completes the package: **card height constant at 347.09px
and every item row displaced 0.00px**, horizontal overflow 0 in every state; the
Tally card likewise **496.09px constant, 0.00px shift**. Row content needed
against the 44 reserved, by width: 57 at 320px, 44 at 360 / 375 / 390, 31 at 430
and 760.

**So 320px is the one width this does not fully fix** — three buttons wrap to a
*third* line there and the row still steps 13px (the bar half is
width-independent, so 320 improves from 28px to 13px). Left deliberately: 320 is
below this file's own stated 380px floor and is not a viewport current iOS runs,
and reserving 57 would buy it by spending 26px of dead space in every expanded
card at the widths that are real. If it is ever wanted, the way to get it
without the dead space is to keep all three buttons mounted and hide the
inapplicable one — the row then measures itself at every width — at the cost of
the visible label wrapping at rest, which is a look and therefore a decision to
put to the owner rather than a fix to apply.
```
