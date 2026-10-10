# The running head pins by opacity, never by height

The slim running head is `position: sticky` with a fixed height. It stays in flow. So pinning changes paint, never layout. An `IntersectionObserver` on a 1px sentinel toggles only `opacity`/`transform`. This is `no-layout-shift-under-the-pointer` in practice. Do not turn this into a height animation. Do not swap the observer for a scroll listener.

**Holds while:** `src/app.jsx` keeps the `.mdl-sticky` bar at `position: sticky` and `height: 46px`, its observer effect on `[loaded]`, and the `top < 0` guard.

The tall block above is ordinary content that scrolls away. The slim bar after it is the part that pins.

Two traps are already known. Both have tests.

- The effect must depend on `loaded`. The first commit renders the loading shell. An effect with `[]` deps binds to a sentinel that does not exist yet. The bar then stays invisible forever, and nothing looks broken. Test 21.7/21.8.
- The `top < 0` guard is not redundant. A sentinel below the fold also fails to intersect. That is the state at the top of a short viewport. Without the guard, the bar pins while you look at the header. Test 21.10.

Skip either guard, and the bar can stay invisible, or pin at the wrong time.

Measured at 375px: horizontal overflow 0, switch thirds 114/114/114, all labels fit, and row displacement on pin **0.00px**. The measured row displacement is held at zero by this sticky rule. See `ruled-head-heights`.

## See also

- `ruled-head-heights` — the measured row displacement this sticky rule holds at zero.
- `motion-nothing-may-reflow` — the same no-reflow rule applied to every other animation.
- `no-layout-shift-under-the-pointer` — the invariant this sticky behavior protects.
