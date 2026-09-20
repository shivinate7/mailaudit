# No animation can cause a reflow

Every keyframe touches only opacity, transform, colour, or box-shadow. The stylesheet restates invariant 5 as this rule. The rule explains why the switch fill and the check tick take the shape they do.

## The argument, as recorded

```
Everything lives in one commented block in the `<style>` tag, under a single
rule that is not a style preference: **nothing may reflow.** Every keyframe
touches opacity, transform, colour or box-shadow and nothing else. That is
invariant 5 restated as a stylesheet constraint, and it is why the sliding
switch fill is an absolutely positioned element rather than a background moving
between three buttons, and why the check tick is drawn with `stroke-dashoffset`
inside a box whose 30px never changes. Measured in a real 375px viewport across
a check-in: the row's height, the indicator's 30×30 and the document width all
drift **0.00px**, and horizontal overflow stays 0 in every state. The same
holds for a card being opened: the card below it steps to its new position in
**one commit** and holds it for the whole animation (measured across ten frames
— a single distinct offset), because only opacity and transform are animated
and the height is never touched.
```

The ruled-head-heights and card-reserved-geometry records hold these measured numbers.

## See also

- `ruled-head-heights` — the measured row height this rule keeps at zero drift.
- `card-reserved-geometry` — the measured card shift this rule keeps at zero.
- `no-layout-shift-under-the-pointer` — the invariant this stylesheet rule restates.
