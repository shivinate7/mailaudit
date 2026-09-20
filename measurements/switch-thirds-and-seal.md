# View switch, seal, and tally headroom

This record holds the view switch thirds, the thumb offset, the seal size, the tally cell headroom, and the horizontal overflow. Re-measure at 375px after a change to the switch, the seal's clamp curve, or the tally cell widths.

## How to re-measure

Open the built page at a 375px viewport. Measure the view switch thirds and the thumb offset. Measure the seal width. Measure the headroom in each of the three tally cells with a six-figure value pair. Then force the reduced-motion block on and repeat the seal, rule, thumb, and overflow readings. The prose names no script. Re-run this by hand in a real browser. jsdom has no layout and cannot do this measurement.

## Reader

No reader. A test cannot hold this claim, because jsdom has no layout.

## The figures, as recorded

```
room and left ~23px unused in each of the other two — the value ran into the
divider on its left, which is what got it reported from the phone. The value
cell is `flex: 1.7`; measured at 375px all three now land on the *same* headroom
(23.3 / 23.3 / 23.2px), and the six-figure case `$100.24k/$118.60k` fits rather
than clipping. Re-measure if the type size or the 6px cell padding changes.

Sizing is by `clamp()`, never breakpoints — this file still has **zero media
queries** apart from `prefers-reduced-motion`. Each curve is tuned to hit its
design size at 375px and again at 760px, where the content column stops growing.
The seal is `clamp(36px, calc(20px + 4.2vw), 52px)`: measured 36px at 375.

Measured at 375px: horizontal overflow 0, switch thirds 114/114/114, all labels
fit, row displacement on pin **0.00px**.

**Every rule is switched off under `prefers-reduced-motion`, and the resting
state is each animation's own final frame** — so `animation: none` leaves the
thing *drawn*, not hidden: the seal visible, the rules full width, the tick
complete, the stamp at its inline angle, the thumb on its third. Verified by
forcing the reduced-motion block on unconditionally in a real browser: seal
opacity 1, rules 104px, title and tallies opaque, thumb at 228.66px = 2 × the
114.33px third, overflow 0. With motion off the app is pixel-for-pixel what it
was before this pass.
```
