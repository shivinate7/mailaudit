# Disclosure panels fade in, their space does not

A disclosure panel arrives with an opacity fade and a 4px move, over 220ms. The exact timing is in the `motion-timings` record.

**Holds while:** `.mdl-panel` in `src/app.jsx` runs `mdl-panel` for 220ms, and that keyframe moves the panel 4px.

The layout space a panel takes is never animated, and it must not be. That space is the same layout the page has always pushed down. It changes one commit after the tap.

## See also

- `motion-timings` — the exact duration this fade uses.
- `motion-nothing-may-reflow` — the rule that keeps this arrival from touching layout.
