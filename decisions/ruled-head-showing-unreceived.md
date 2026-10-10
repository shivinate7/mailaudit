# Showing starts on unreceived every load

The Showing cell replaces the old "Hide received" button. It shows state, not an instruction: `○ Everything` or `● Unreceived`. **It starts on `● Unreceived` on every load.**

**Holds while:** `hideDone` starts as `true` in `src/app.jsx`, and the `snapshot()` payload has no `hideDone` key.

The app opens with mail in hand, so the question is always what is still outstanding. Landing on the full list required a tap before the working view, every time.

Like the range disclosure, Showing is not persisted. It does not belong in the saved shape (`saved-state-shape`). It is the state each session starts from. One tap brings the received rows back for as long as that session lasts. Tests 12.4–12.7 pin this. Test 12.7 pins the reload specifically, which is the whole point of not persisting it.

**Pinned by:** 12.4 (starts on Unreceived), 12.5 and 12.6 (one tap shows the received rows, and a second tap hides them), and 12.7 (Everything does not survive a reload). Mutants confirmed red: the default flipped back to Everything, which fails 12.4. A module-level cache that survives a remount fails 12.7, while 12.4 stays green. The pair isolates the reload from the default.

## See also

- `ruled-head-resume-is-reopening` — the other trigger that resets this state.
- `no-layout-shift-under-pointer` — the invariant this state avoids breaking.
