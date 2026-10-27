# Reduced motion leaves every animation at its final frame

Turning off animation must never hide anything. Each animation's resting state is its own finished frame. With motion off, the seal, the rules, the tick, and the stamp all render fully drawn. The switch-thirds-and-seal record has the measured resting values.

**Holds while:** the `@media (prefers-reduced-motion: reduce)` block in `src/app.jsx` sets `animation: none`, and it is the only `@media` rule in that file.

Every rule is switched off under `prefers-reduced-motion`. The resting state is each animation's own final frame. So `animation: none` leaves the thing drawn, not hidden. The seal is visible. The rules are full width. The tick is complete. The stamp sits at its inline angle. The thumb sits on its third.

This was verified by forcing the reduced-motion block on unconditionally in a real browser. Results: seal opacity 1, rules 104px, title and tallies opaque, thumb at 228.66px (2 × the 114.33px third), overflow 0. With motion off, the app is pixel-for-pixel what it was before the motion pass.

## See also

- `switch-thirds-and-seal` — the measured resting positions this rule leaves drawn.
- `motion-nothing-may-reflow` — the layout guarantee that holds with motion on or off.
