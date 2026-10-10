# The check tick is written, not popped in

The check tick draws as one stroke, from left to right. It takes 300ms. That ceiling is not a preference. The tick fires hundreds of times on a mail day. Anything slower feels like latency. The exact stroke duration is in `motion-timings`.

**Holds while:** `.mdl-nib` in `src/app.jsx` draws the tick with `stroke-dashoffset` over 300ms, and the glyph is an SVG `path`.

The glyph is an SVG path, not the `✓` character. The path is what lets the tick be drawn. The `aria-label` carries the meaning either way.

The partial state stays a typographic dash. A half-drawn stroke would read as a tick still arriving.

## See also

- `motion-timings` — the exact stroke duration this ruling chose.
- `motion-nothing-may-reflow` — the rule that keeps this stroke from touching layout.
