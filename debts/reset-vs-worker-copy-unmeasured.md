# A Reset's effect on the Worker's copy is unmeasured

**What.** A Reset writes an empty ledger with no change times, on the web and on native. The Worker merge lets a timed absence beat an untimed count, but it does not let an untimed absence beat a timed count (`mergeReceived` in `src/merge-rules.mjs`). Read from the code, the Worker's counts can come back on the next sync, which would undo the Reset. No run has measured it. The gap closes when a run shows what the Worker holds after a Reset and a sync, and `a-restore-is-not-local` states the result.

**Status:** open. On native it bites once lane N4b wires the sync client into the app.

**Decision:** `a-restore-is-not-local`.
