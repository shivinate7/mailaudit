# A resume counts as reopening

An iOS home-screen app is backgrounded, not closed, so a page remount is not the only moment a session ends. A visibility listener resets Showing after a threshold away, and the same finding lets an ahead remote merge in. The threshold protects a short glance away from resetting the list mid-check-in.

## The argument, as recorded

```
  **A resume counts as reopening too.** On iOS a home-screen app is normally
  *backgrounded*, not closed — the page survives, so waiting for a remount
  meant the only thing that reset Showing was WebKit evicting the page, which
  can be days. A `visibilitychange` listener resets it when the app comes back
  after `RESUME_RESET_MS` (60s) away. The threshold is the whole design: a hop
  out to read a tracking number and straight back is the same session, and
  flipping the list under a thumb mid-check-in is exactly the mis-tap
  invariant 5 exists to prevent. Showing resets, **and an ahead remote is merged
  in** — two consequences of one finding, landing seconds apart (this one
  synchronously, the merge after a network round trip). Two reshapes of the same
  list on one resume is fine precisely *because* it is a resume: nothing is
  under the pointer. The query, the range and the reveals still do **not**
  reset — those are things you were in the middle of. Tests 12.8–12.9 and group
  40 pin both sides via `backgroundFor(ms)`, which is
  `background()`/`foreground()` with the clock frozen across the trip.

```
