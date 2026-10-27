# The running head pins by opacity, never by height

The slim running head is `position: sticky` with a fixed 46px height and a 1px rule, 47px drawn. It stays in flow. So pinning changes paint, never layout. An `IntersectionObserver` on a 1px sentinel toggles only `opacity`/`transform`. This is `no-layout-shift-under-pointer` in practice. Do not turn this into a height animation. Do not swap the observer for a scroll listener.

**Holds while:** `src/app.jsx` keeps the `.mdl-sticky` bar at `position: sticky` and `height: 46px`, its observer effect on `[opened]`, and the `top < 0` guard.

The tall block above is ordinary content that scrolls away. The slim bar after it is the part that pins.

Two traps are already known. Both have tests.

- The effect must depend on `opened`, the state `setLoaded` sets (`loaded` is `opened` and not damaged). The first commit renders the loading shell. An effect with `[]` deps binds to a sentinel that does not exist yet. The bar then stays invisible forever, and nothing looks broken. Test 21.7/21.8.
- The `top < 0` guard is not redundant. A sentinel below the fold also fails to intersect. That is the state at the top of a short viewport. Without the guard, the bar pins while you look at the header. Test 21.10.

Skip either guard, and the bar can stay invisible, or pin at the wrong time.

Measured at 375px: horizontal overflow 0, switch thirds 114/114/114, all labels fit, and row displacement on pin **0.00px**. The measured row displacement is held at zero by this sticky rule. See `ruled-head-heights`.

**Pinned by:** group 21, which includes 21.7, 21.8 and 21.10. `test/harness.mjs` stubs `IntersectionObserver` and exports `observers`. A test can hand the callback an entry. jsdom has no layout and no real scrolling. So the group verifies only the wiring. It checks that the observer attaches after the loading shell. It checks that the stuck and unstuck condition is right. Whether a real scroller produces those entries is the browser's job.

The native client follows it: `MastheadScreen` draws the running head as an overlay on each tab's scroll view, below a 47pt clear slot in the content. Opacity and a 3pt offset change; the height never does. It is not in the accessibility tree while hidden, and takes no tap.

## See also

- `ruled-head-heights` — the measured row displacement this sticky rule holds at zero.
- `motion-nothing-may-reflow` — the same no-reflow rule applied to every other animation.
- `no-layout-shift-under-pointer` — the invariant this sticky behavior protects.
