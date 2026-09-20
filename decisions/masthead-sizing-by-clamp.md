# Masthead sizing uses clamp, never breakpoints

Every size in the masthead is set with `clamp()`, tuned to hit its design size at 375 pixels and again at 760 pixels. The file has no media queries besides the reduced-motion one.

## The argument, as recorded

```
Sizing is by `clamp()`, never breakpoints — this file still has **zero media
queries** apart from `prefers-reduced-motion`. Each curve is tuned to hit its
design size at 375px and again at 760px, where the content column stops growing.
The seal is `clamp(36px, calc(20px + 4.2vw), 52px)`: measured 36px at 375.
```
