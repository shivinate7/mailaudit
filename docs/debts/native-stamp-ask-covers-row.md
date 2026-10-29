# The native armed Remove ask covers the editor row

**What.** Armed, the stamp editor's Remove ask sits over Remove, Cancel and Save instead of hanging below them. Measured live: the ask buttons at y 332 to 376, the row at y 336 to 380. The ask panel's bottom equals the row's bottom, so the alignment guide in `native/Manifest/StampViews.swift` has no effect. `PackageStampUITests.testRemoveIsTwoTapsAndTheAskHangsBelowTheRowMovingNothing` fails on it. Earlier runs read the frames after the ask lapsed, so they never reached this check. The Orphaned Discard ask uses the same chain and is unmeasured. The gap closes when the ask hangs below the row, nothing in the row moves, and the test passes.

**Status:** open, 2026-10-29. Measured 1 of 1 runs on step 6's last round. A lane at round 1 owns the fix.

**Decision:** `stamp-band-opens-the-editor`.
