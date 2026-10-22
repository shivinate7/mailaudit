# A native restore keeps the old change times

**What.** The web restore gives the restore time to every check-in key, stamp and envelope (`restampRestore` in `src/merge-rules.mjs`). A later Worker reply then cannot undo the restore. Native never loads that file. `LedgerStore.restore` applies a version with the change times it was saved with. The Worker merge keeps the later change per key (`mergeReceived`). So a key that changed after the version was saved keeps its newer state, and the next sync can reverse part of the restore. The code shows this. No run measures it, and no test pins a native restore against a newer reply. The gap closes when a native restore stamps the restore time as the web does, or the Worker does (lane W3b in `native-build-lanes`, blocked). A test must also pin that a later reply leaves the restore in place.

**Status:** open. It bites once lane N4b wires the sync client into the app. The owner names the lane.

**Decision:** `a-restore-is-not-local`.
