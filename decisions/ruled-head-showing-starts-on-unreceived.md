# Showing starts on unreceived every load

The Showing cell shows state, not an instruction, and it always starts on unreceived. The app opens with mail in hand, so the outstanding view is the right default. The choice is not persisted, because it belongs to a session, not to the saved ledger shape.

## The argument, as recorded

```
- **Showing** — the old "Hide received" button, said as state (`○ Everything` /
  `● Unreceived`) rather than as an instruction. **It starts on `● Unreceived`
  on every load.** The app is opened with mail in hand and the question is
  always "what is still outstanding"; landing on the full list meant a tap
  before the working view every single time. Like the range disclosure it is
  *not* persisted and does not belong in the saved shape (invariant 2) — it is
  the state each session starts from, and one tap brings the received rows back
  for as long as that session lasts. Tests 12.4–12.7; 12.7 pins the reload
  specifically, which is the whole point of it not being persisted.
```

## See also

- `ruled-head-a-resume-counts-as-reopening` — the other trigger that resets this state.
- `no-layout-shift-under-the-pointer` — the invariant this state avoids breaking.
