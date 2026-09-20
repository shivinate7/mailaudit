# The package progress bar sits out of flow

The first check-in in a package used to grow the card. The card-reserved-geometry record has the measured shift. That growth pushed every row down under the user's thumb. The progress bar now sits absolutely positioned on the card's own top edge. It can mount and unmount without moving anything, and it never has to render at a finished 100 percent.

## The argument, as recorded

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
```

## See also

- `card-reserved-geometry` — the measured card growth this record fixes.
- `no-layout-shift-under-the-pointer` — the invariant the out-of-flow bar exists to satisfy.
- `motion-a-completed-package-is-gilded` — the animation that marks completion once the bar can no longer do it.
