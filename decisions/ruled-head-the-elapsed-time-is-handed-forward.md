# Hand the elapsed time forward, never re-derive it

The resume handler must pass its own measured away-time to the merge check, instead of letting a later effect read a cleared timestamp. The handler runs first and nulls its own clock, so a naive reader would always measure zero and the merge would silently never fire. A signal variable carries the finding across the gap instead.

## The argument, as recorded

```
  **The elapsed time has to be handed forward, not re-derived, and this is the
  trap.** The resume handler computes `away` and then nulls `hiddenAt` before
  returning — and it registers *first*, because it has `[]` deps while the peek
  effect waits on `loaded`. Anything downstream that reads `hiddenAt` therefore
  measures zero forever and the merge never fires: no error, nothing on screen,
  nothing to notice. So the handler records into `freshSession`, on **both**
  branches (a short hop must be able to cancel a stale signal), and the peek's
  `check()` consumes it synchronously on every path out — that effect also runs
  on mount and on every `syncBusy` flip, and a merge flips `syncBusy` twice, so
  a surviving flag would let the other device's push land mid-session with no
  resume in sight. `freshSession` starts **true**: a cold mount is a new session
  too, and the more valuable half, since a fresh phone should come back already
  reconciled rather than needing someone to go looking for a control.
```

## See also

- `ruled-head-a-resume-counts-as-reopening` — the resume behavior this signal drives.
- `peek-is-three-valued` — the read that consumes this signal.
