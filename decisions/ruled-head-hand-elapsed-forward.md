# Hand the elapsed time forward, never re-derive it

The elapsed time has to be handed forward, not re-derived. This is the trap.

**Holds while:** `freshSession` in `src/app.jsx` starts as `useRef(true)`. The resume handler writes it on every foreground, and the peek check reads and clears it.

The resume handler computes `away`. Then it nulls `hiddenAt` before it returns. The handler registers first, because it has `[]` deps. The peek effect waits on `loaded`. So anything downstream that reads `hiddenAt` measures zero forever, and the merge never fires. There is no error, nothing on screen, and nothing to notice.

So the handler records into `freshSession`, on **both** branches. A short hop must be able to cancel a stale signal. A signal variable carries the finding across the gap. The peek's `check()` consumes the signal synchronously on every path out. That effect also runs on mount and on every `syncBusy` flip. A merge flips `syncBusy` twice. A surviving flag would let the other device's push land mid-session, with no resume in sight.

`freshSession` starts **true**. A cold mount is a new session too. It is the more valuable half. A fresh phone should come back already reconciled. It should not need a person to search for a control.

**Pinned by:** group 40. Mutants confirmed red:
- the resume handler reading the shared `hiddenAt`;
- `freshSession` starting false;
- the signal never consumed.

The consume mutant survived the first draft of group 40. Every fixture ended with both devices in step. See `testing-surviving-mutant`.

## See also

- `ruled-head-resume-is-reopening` — the resume behavior this signal drives.
- `peek-is-three-valued` — the read that consumes this signal.
