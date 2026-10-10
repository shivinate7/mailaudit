# No animation can cause a reflow

Every keyframe touches only opacity, transform, colour, or box-shadow. Nothing else.

All the animation rules sit in one commented block in the `<style>` tag. The rule behind them is not a style preference: **nothing may reflow.** That is invariant 5 restated as a stylesheet constraint. Two choices follow from it. The sliding switch fill is an absolutely positioned element, not a background that moves between three buttons. The check tick is drawn with `stroke-dashoffset` inside a box whose 30px never changes.

Measured in a real 375px viewport across a check-in, the row's height, the indicator's 30×30, and the document width all drift **0.00px**. Horizontal overflow stays 0 in every state.

A card being opened follows the same rule. The card below it steps to its new position in **one commit**, and it holds that position for the whole animation. Measured across ten frames, there is a single distinct offset. Only opacity and transform are animated. The height is never touched.

The `ruled-head-heights` and `card-reserved-geometry` records hold these measured numbers.

## See also

- `ruled-head-heights` — the measured row height this rule keeps at zero drift.
- `card-reserved-geometry` — the measured card shift this rule keeps at zero.
- `no-layout-shift-under-the-pointer` — the invariant this stylesheet rule restates.
