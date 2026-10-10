# Motion timing claims need a real browser, not a test

jsdom has no layout and no compositor. The test suite cannot check durations, easing, distance, or the no-reflow claim. The Browser pane also freezes an animation's timeline when it does not composite. Pause the animation and set `currentTime` to read a mid-animation value. Never sample frames instead.

## See also

- `suite-size` — the assertion count the test suite can and cannot cover.
- `motion-method-is-side-by-side-proof` — how these timings were chosen in the first place.
