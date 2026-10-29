# Masthead sizing uses clamp, never breakpoints

Every size in the masthead is set with `clamp()`. Each curve is tuned to hit its design size at two widths: 375px and 760px. Past 760px the content column stops growing. The app has no width breakpoint. Its only `@media` rules are `prefers-reduced-motion` and `(pointer: coarse)`. The `switch-thirds-and-seal` record has the measured seal size.

**Holds while:** `.mdl-seal` in `src/app.jsx` sets `clamp(36px, calc(20px + 4.2vw), 52px)`, and its only `@media` rules are `prefers-reduced-motion` and `(pointer: coarse)`, never a width.

The seal is `clamp(36px, calc(20px + 4.2vw), 52px)`. It measures 36px at 375px.

## See also

- `switch-thirds-and-seal` — the measured seal size this clamp curve targets.
- `ruled-head-heights` — the other masthead sizes measured at the same widths.
