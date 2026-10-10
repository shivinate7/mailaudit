# Masthead sizing uses clamp, never breakpoints

Every size in the masthead is set with `clamp()`, tuned to hit its design size at two widths. The file has no media queries besides the reduced-motion one. The switch-thirds-and-seal record has the measured seal size.

## See also

- `switch-thirds-and-seal` — the measured seal size this clamp curve targets.
- `ruled-head-heights` — the other masthead sizes measured at the same widths.
