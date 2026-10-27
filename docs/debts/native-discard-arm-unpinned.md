# No test pins the native Discard arm

**What.** No test pins the native Discard ask. The ask reads "Tap again to discard N cards". It has a Cancel and it disarms after 4 seconds. It hangs below the row so that arming moves no other row (`no-layout-shift-under-pointer`). `OrphanedUITests` never taps Discard, and no test compares row frames across a press. The model tests pin only the discard itself. The gap closes when a UI test pins the ask, its Cancel, its timeout and the row frames before and after arming.

**Status:** open.

**Decision:** `orphan-entry-takes-one-input`.
