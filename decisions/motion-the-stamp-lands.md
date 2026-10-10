# The RECEIVED stamp lands, it does not appear

The stamp rocks down and settles at its resting angle, instead of blinking into place. The order-stamp band shares the same keyframes through a `--rest` custom property.

**Holds while:** the stamp keyframes in `src/app.jsx` start at `rotate(-13deg)`, and the `--rest` property carries the resting angle (-4deg and -3deg).

The RECEIVED stamp lands rather than blinking into being. It goes down at −13°, rocks flat, and settles back to its −4°. The order-stamp band uses the same keyframes and returns to its own −3°. The resting angle rides in a `--rest` custom property, so one animation serves both.

## See also

- `motion-timings` — the exact angles and duration this landing uses.
- `motion-stationery-not-software` — the register this landing is built to fit.
