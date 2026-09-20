# The running head pins by opacity, never by height

The slim running head stays in flow at a fixed height, so pinning it changes only paint, never layout. An intersection observer must depend on the loaded state. It must also guard against a sentinel that sits below the fold. Skip either guard, and the bar can stay invisible, or pin at the wrong time.

## The argument, as recorded

```
**The running head is load-bearing for invariant 5.** The tall block is ordinary
content that scrolls away; the slim bar after it is `position: sticky` with a
*fixed* height, so it is always in flow and pinning changes paint, never layout.
An `IntersectionObserver` on a 1px sentinel toggles only `opacity`/`transform`.
Do not "improve" this into a height animation, and do not swap the observer for
a scroll listener. Two traps, both already paid for:

- The effect must depend on `loaded`. The first commit renders the loading
  shell, so an effect with `[]` deps binds to a sentinel that doesn't exist and
  the bar stays invisible forever, with nothing looking broken. Test 21.7/21.8.
- The `top < 0` guard is not redundant. A sentinel is also un-intersecting when
  it is *below* the fold, which is the state at the top of a short viewport;
  without the guard the bar pins while you are looking at the header. Test 21.10.

Measured at 375px: horizontal overflow 0, switch thirds 114/114/114, all labels
fit, row displacement on pin **0.00px**.
```
