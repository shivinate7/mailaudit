# Masthead sizing uses clamp, never breakpoints

Every size in the masthead is set with `clamp()`, tuned to hit its design size at two widths. The file has no media queries besides the reduced-motion one. The switch-thirds-and-seal record has the measured seal size.

## The argument, as recorded

```
Sizing is by `clamp()`, never breakpoints — this file still has **zero media
queries** apart from `prefers-reduced-motion`. Each curve is tuned to hit its
design size at 375px and again at 760px, where the content column stops growing.
The seal is `clamp(36px, calc(20px + 4.2vw), 52px)`: measured 36px at 375.
```

## See also

- `switch-thirds-and-seal` — the measured seal size this clamp curve targets.
- `ruled-head-heights` — the other masthead sizes measured at the same widths.
