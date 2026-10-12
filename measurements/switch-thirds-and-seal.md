# View switch, seal, and tally headroom

**Status:** retired with the view switch. L11a (commit `250823d`) removed the switch. The thirds, the label fit and the thumb offset below have no subject now. They stand only as readings from before L11a.

This record holds the view switch thirds, the thumb offset, the seal size, the tally cell headroom, and the horizontal overflow. Re-measure at 375px after a change to the switch, the seal's clamp curve, or the tally cell widths.

## How to re-measure

Open the built page at a 375px viewport. Measure the seal width. Measure the headroom in each of the three tally cells with a six-figure value pair. Then force the reduced-motion block on, and repeat the seal, rule, and overflow readings. The switch and thumb steps are retired with the switch. The prose names no script. Re-run this by hand in a real browser. jsdom has no layout and cannot do this measurement.

## Reader

No reader. A test cannot hold this claim, because jsdom has no layout.

## Figures

Equal tracks starved the only cell that needed room. They left ~23px unused in each of the other two cells. The value then ran into the divider on its left, which is what got it reported from the phone. The value cell is `flex: 1.7`. Measured at 375px, all three cells now land on the same headroom: 23.3 / 23.3 / 23.2px. The six-figure case `$100.24k/$118.60k` fits rather than clipping. Re-measure if the type size or the 6px cell padding changes.

Sizing is by `clamp()`, never breakpoints. This file still has **zero media queries** apart from `prefers-reduced-motion`. Each curve is tuned to hit its design size at 375px and again at 760px, where the content column stops growing. The seal is `clamp(36px, calc(20px + 4.2vw), 52px)`. It measured 36px at 375.

Measured at 375px: horizontal overflow 0, switch thirds 114/114/114, all labels fit, and row displacement on pin **0.00px**.

Every rule is switched off under `prefers-reduced-motion`. The resting state is each animation's own final frame. So `animation: none` leaves the thing *drawn*, not hidden. The seal is visible. The rules are full width. The tick is complete. The stamp sits at its inline angle. The thumb sits on its third. This was verified by forcing the reduced-motion block on unconditionally in a real browser. The results were: seal opacity 1, rules 104px, title and tallies opaque, and the thumb at 228.66px. That is 2 × the 114.33px third. Overflow was 0. With motion off, the app is pixel-for-pixel what it was before this pass.
