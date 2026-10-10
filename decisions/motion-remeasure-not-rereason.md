# Motion timing claims need a real browser, not a test

Settle motion claims by measuring, not by reading. If a claim changes, re-measure it. Do not re-reason it.

jsdom has no layout and no compositor. So durations, easing, distances, and the no-reflow claim are not assertable, and no test protects them. Test group 42 pins only the two claims that are behaviour.

If the Browser pane is not compositing, it freezes animation timelines. That makes sampled mid-animation values read as frozen. To read a value, pause with `getAnimations()` and set `currentTime`. Do not sample frames, because the numbers will be wrong.

## See also

- `suite-size` — the assertion count the test suite can and cannot cover.
- `motion-method-is-side-by-side-proof` — how these timings were chosen in the first place.
