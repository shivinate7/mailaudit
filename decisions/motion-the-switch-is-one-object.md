# The view switch moves one object, not three lights

The active-view fill is a single element that slides between thirds. Three buttons never light up on their own.

**Holds while:** `.mdl-thumb` is the only element that paints the active view. `data-view` is set on `.mdl-switch` in `src/app.jsx`. Tests 43.1 and 43.2 pin `data-view`.

`.mdl-thumb` is the violet fill. It is absolutely positioned at exactly a third of the track. It translates by whole multiples of its own width, so it lands on the thirds the grid already defines. It cannot drift out of step with them.

The buttons paint no background of their own. A button that did would leave a fill behind wherever the thumb had just been. There would be two fills mid-slide.

The consequence: `data-view` on `.mdl-switch` is the only thing that says which segment is active. Drop that attribute, and the app has no active-view indicator at all. Every button still looks correct in a DOM dump. Tests 43.1–43.2 pin it.

## See also

- `switch-thirds-and-seal` — the measured thirds and thumb offset this object slides between.
- `design-the-view-switch-is-equal-thirds` — the layout ruling this animation moves across.
