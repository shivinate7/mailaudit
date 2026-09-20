# The view switch moves one object, not three lights

The active-view fill is a single element that slides between thirds, never three buttons lighting up on their own. The `data-view` attribute on the switch is now the only signal of which view is active.

## The argument, as recorded

```
- **The view switch is one object being moved, not three lamps being lit.**
  `.mdl-thumb` is the violet fill, absolutely positioned at exactly a third of
  the track and translated by whole multiples of its own width, so it lands on
  the thirds the grid already defines and cannot drift out of step with them.
  The buttons no longer paint their own background — a button that did would
  leave a fill behind wherever the thumb had just been, and there would be two
  of it mid-slide. **The consequence to know: `data-view` on `.mdl-switch` is
  now the only thing saying which segment is active.** Drop it and the app has
  no active-view indicator at all, and every button still looks correct in a
  DOM dump. Tests 43.1–43.2.
```

## See also

- `switch-thirds-and-seal` — the measured thirds and thumb offset this object slides between.
- `design-the-view-switch-is-equal-thirds` — the layout ruling this animation moves across.
