# The running head pins by opacity, never by height

The slim running head stays in flow at a fixed height, so pinning it changes only paint, never layout. An intersection observer must depend on the loaded state. It must also guard against a sentinel that sits below the fold. Skip either guard, and the bar can stay invisible, or pin at the wrong time. The ruled-head-heights record has the measured row displacement on pin.

## See also

- `ruled-head-heights` — the measured row displacement this sticky rule holds at zero.
- `motion-nothing-may-reflow` — the same no-reflow rule applied to every other animation.
- `no-layout-shift-under-the-pointer` — the invariant this sticky behavior protects.
