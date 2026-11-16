# A hanging ask near the list's edge cannot be tapped

**What.** A confirm/cancel ask that hangs below its row is an overlay pushed below the row (`native/Manifest/StampViews.swift:116`). Nothing scrolls when it arms. `scrollTo` runs only on note focus, and on keyboard show while the note has focus (`StampViews.swift:275`). Near the list's edge the ask stays in the tree but cannot be tapped. `ScreenKit.tap` then drags the list to reach it (`native/ManifestUITests/ScreenKit.swift:50`). The 4 s timeout (`StampViews.swift:197`, `BulkViews.swift:59`) removes the ask mid-drag.

**Red.** It was red before the Find band (commit 070ad699) and on main (commit 4a7ba600). The run log there reads "stamp-ask-confirm is missing". Five PackageStamp tests were red on main 4a7ba600: `testAccessibilityAuditPackagesWithAStampedCard`, `testAccessibilityAuditStampEditor`, `testAccessibilityAuditStampRemoveArmed`, `testEveryStampControlHasA44ptHitRegion` and `testNothingMovesWhenAStampIsSavedOrRemoved`. Two more went red on PR 238 (the step 8 amend) and passed at 4a7ba600: `testRemoveIsTwoTapsAndTheAskHangsBelowTheRowMovingNothing` and `testRemovingTheLastStampTurnsTheFilterOffAndTheRefundComesBack`. The same cause is inferred, not measured. The Find band may add to it. The same failure sits in a second place: Orphaned's Discard ask (`native/Manifest/OrphanedView.swift:338-357`).

**Designed fix, not built.** `HangingAsk` hangs the ask below its row when it fits, and 4 pt above the row when it does not. It decides once, when the ask arms. The room is the scroll view's visible rect, minus the 47 pt running-head slot (`masthead-running-head-sticky`), minus the Duo margins (`PackagesView.swift:73`, `TallyView.swift:75`, `DuoSpine.swift:78`). The room reaches the ask through a new environment value, `askCover`. Unmeasured: whether `bounds(of: .scrollView)` gives the visible rect inside a `LazyVStack`. `no-layout-shift-under-pointer` governs the fix, since arming must move nothing under the pointer. `audit-skips-measured-flags` names the only audit skips, and none covers an ask. Mockups: `docs/design/step8-fix-ask-clear.html` and `docs/design/step8-fix-ask-clear-notes.md`.

**Why not built.** The reds predate the Find band, so PR 238 does not carry the fix. Coordinator ruling 2026-11-16 12:34 CST.

**Status:** open, 2026-11-16 12:34 CST. The fix is designed, not built. Red on main and on PR 238.

**Decision:** `stamp-band-opens-the-editor` (the armed Remove ask hangs below the editor row and lapses after 4 s).

**Decision:** `orphan-entry-takes-one-input` (the Discard ask hangs below the row, so arming moves nothing).
