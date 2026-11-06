# No ruling on a native Reset whose milestone cannot be saved

**What.** A native Reset, a restore and a removing sync reply each save a milestone first. If the save fails, the operation changes nothing (`milestones-taken-before-risk`). `VersionMilestoneNeededTests` pins this for a restore on an open ledger and for a removing `adopt`, with only the versions folder unwritable, and pins that a reply that removes nothing still adopts. Reset is not pinned. The Reset tests lock the ledger folder, so the milestone saves and the ledger save fails. The web goes the other way on Reset. `takeVersion` in `src/app.jsx` does not block `resetAll`. A failed save shows a banner that says a Reset would not be undoable (`unwritable-store-says-so`). Native refuses. The gap closes when the owner rules whether a native Reset goes ahead without its milestone, and a test pins Reset with only the versions folder unwritable.

**Status:** open. The owner has not ruled whether a Reset goes ahead when its milestone cannot be saved. The built code refuses.

**Decision:** `milestones-taken-before-risk`.
