# Motion timing claims need a real browser, not a test

jsdom has no layout and no compositor. The test suite cannot check durations, easing, distance, or the no-reflow claim. The Browser pane also freezes an animation's timeline when it does not composite. Pause the animation and set `currentTime` to read a mid-animation value. Never sample frames instead.

## The argument, as recorded

```
Two things measurement, not reading, settled here, and both will need
re-measuring rather than re-reasoning if they change. **jsdom has no layout and
no compositor**, so durations, easing, distances and the no-reflow claim are
not assertable and no test protects them — group 42 pins only the two claims
that are behaviour. And **the Browser pane freezes animation timelines when it
is not compositing**, which makes sampled mid-animation values read as frozen;
pause with `getAnimations()` and set `currentTime` instead of sampling frames,
or the numbers will lie to you.
```

## See also

- `suite-size` — the assertion count the test suite can and cannot cover.
- `motion-method-is-side-by-side-proof` — how these timings were chosen in the first place.
