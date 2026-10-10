# Masthead sizing uses clamp, never breakpoints

Every size in the masthead is set with `clamp()`. Each curve is tuned to hit its design size at two widths: 375px and 760px. Past 760px the content column stops growing. The app has zero media queries apart from `prefers-reduced-motion`. The `switch-thirds-and-seal` record has the measured seal size.

The seal is `clamp(36px, calc(20px + 4.2vw), 52px)`. It measures 36px at 375px.

## See also

- `switch-thirds-and-seal` — the measured seal size this clamp curve targets.
- `ruled-head-heights` — the other masthead sizes measured at the same widths.
