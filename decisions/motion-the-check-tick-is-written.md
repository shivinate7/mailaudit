# The check tick is written, not popped in

The check mark draws as one stroke in 300 milliseconds, a speed chosen because it fires hundreds of times on a mail day. It is an SVG path so it can be drawn, and a typographic dash still marks the partial state.

## The argument, as recorded

```
- **The check tick is written**, one stroke left to right, 300ms. That ceiling
  is not a preference either: this fires hundreds of times on a mail day and
  anything slower starts to feel like latency. The glyph is an SVG path rather
  than the `✓` character purely so it *can* be drawn; the `aria-label` carries
  the meaning either way, and the partial state stays a typographic dash
  because a half-drawn stroke would read as a tick still arriving.
```
