# A resume counts as reopening

An iOS home-screen app is usually backgrounded, not closed. The page survives. So waiting for a remount meant that only WebKit evicting the page reset Showing. That can take days.

**Holds while:** `RESUME_RESET_MS` is `60_000` in `src/app.jsx`, and the resume handler resets Showing only after that absence. Tests 12.8 and 12.9 cover both sides.

A `visibilitychange` listener resets Showing when the app comes back after `RESUME_RESET_MS` (60s) away. The threshold is the whole design. A hop out to read a tracking number and straight back is the same session. Flipping the list under a thumb mid-check-in is exactly the mis-tap that `no-layout-shift-under-pointer` exists to prevent.

Two things happen on the same resume. Showing resets, and an ahead remote is merged in. These are two results of one finding. They land seconds apart. The reset is synchronous. The merge runs after a network round trip. Two reshapes of the same list on one resume are fine. The reason is that it is a resume, so nothing is under the pointer.

The query, the range, and the reveals still do **not** reset. Those are things you were in the middle of.

Tests 12.8–12.9 and group 40 pin both sides. They use `backgroundFor(ms)`, which is `background()` and `foreground()` with the clock frozen across the trip.

## See also

- `ruled-head-elapsed-passed-on` — the signal that carries the away time to the merge check.
- `ruled-head-showing-unreceived` — the state a resume resets.
- `peek-is-three-valued` — the read that a resume triggers.
