# The Orphaned composer's keys cover the tab bar, so a draft test stays red

**What.** `OrphanedUITests.testComposerDraftSurvivesAViewChange` stays red on the iPhone 18 Pro. With the composer open, its input focused and the keys up, the keys cover the tab bar. The "Packages" tab tap then misses (hit point -1,-1 in CI run 42700362453, job pro-ui-a). The test was also red in CI runs 41379087325 (2026-11-02) and 42692198265.

The Orphaned list hides the composer's keys on a drag: `scrollDismissesKeyboard(.interactively)` on the list in `native/Manifest/OrphanedView.swift`, set there so the other tabs keep their keys. `ComposerView` still sets its focus on appear and never clears it, and the composer has no tap-to-dismiss and no keyboard toolbar. The other `scrollDismissesKeyboard` is in `HandScreen.swift`. `OrphanedUITests` pins the drag (`testDraggingTheListHidesTheComposerKeysAndKeepsTheDraft`) and the draft that survives a view change (`testComposerDraftSurvivesAViewChange`). Save and Cancel end the composer.

The decision `duo-card-in-hand` keeps the tab bar under the keys while they are open. A person drags the list to drop the keys and reach the tab bar, which is what the owner ruled, page item 86 a, 2026-11-18 23:22 CST (see `ux-house-rules-govern`).

The gap closes when the test is green on the iPhone 18 Pro.

**Status:** open. Owner ruling, page item 86 a, 2026-11-18 23:22 CST: the Orphaned form gets a drag on the list that hides the keys. Options b (leave it) and c (point the test at Return) are not chosen. The drag is built (`scrollDismissesKeyboard(.interactively)` on the Orphaned list in `OrphanedView.swift`); the debt stays open until the pro-ui-a run is green.

**Decision:** `duo-card-in-hand`.
