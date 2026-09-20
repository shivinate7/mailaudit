# Reduced motion leaves every animation at its final frame

Turning off animation must never hide anything. Each animation's resting state is its own finished frame. With motion off, the seal, the rules, the tick, and the stamp all render fully drawn. The switch-thirds-and-seal record has the measured resting values.

## The argument, as recorded

```
**Every rule is switched off under `prefers-reduced-motion`, and the resting
state is each animation's own final frame** — so `animation: none` leaves the
thing *drawn*, not hidden: the seal visible, the rules full width, the tick
complete, the stamp at its inline angle, the thumb on its third. Verified by
forcing the reduced-motion block on unconditionally in a real browser: seal
opacity 1, rules 104px, title and tallies opaque, thumb at 228.66px = 2 × the
114.33px third, overflow 0. With motion off the app is pixel-for-pixel what it
was before this pass.
```

## See also

- `switch-thirds-and-seal` — the measured resting positions this rule leaves drawn.
- `motion-nothing-may-reflow` — the layout guarantee that holds with motion on or off.
