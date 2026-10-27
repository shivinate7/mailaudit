# No test pins that a native operation needs its milestone

**What.** A native Reset, a restore and a removing sync reply each save a milestone first. If the save fails, the operation changes nothing (`milestones-taken-before-risk`). Only one test breaks the milestone save: a restore on a ledger that will not open. No test makes the versions folder unwritable for a Reset, for a restore on an open ledger, or for `adopt`. The Reset tests lock the ledger folder, so the milestone saves and the ledger save fails. The web goes the other way on Reset. `takeVersion` in `src/app.jsx` does not block `resetAll`. A failed save shows a banner that says a Reset would not be undoable (`unwritable-store-says-so`). The gap closes when the owner rules whether a native Reset goes ahead without its milestone, and a test pins each operation with only the versions folder unwritable.

**Status:** open. The lane N9 test-author asked the owner whether a Reset goes ahead when its milestone cannot be saved. The built code refuses. No ruling is recorded.

**Decision:** `milestones-taken-before-risk`.
