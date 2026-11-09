# The Orphaned composer's keys cover the tab bar, so a draft test stays red

**What.** `OrphanedUITests.testComposerDraftSurvivesAViewChange` stays red on the iPhone 18 Pro. With the composer open, its input focused and the keys up, the keys cover the tab bar. The "Packages" tab tap then misses (hit point -1,-1 in CI run 42700362453, job pro-ui-a). The test was also red in CI runs 41379087325 (2026-11-02) and 42692198265.

Main has no way to hide the keys from the Orphaned composer. `ComposerView` in `native/Manifest/OrphanedView.swift` sets its focus on appear and never clears it. That path has no `scrollDismissesKeyboard`, no tap-to-dismiss and no keyboard toolbar. The only `scrollDismissesKeyboard` is in `HandScreen.swift`. So the draft survives a view change, the behaviour the test expects, has no route a person can reach on the iPhone while typing. Save and Cancel end the composer.

The decision `duo-card-in-hand` keeps the tab bar under the keys while they are open. So the test's tap cannot land under the keys. Which side is stale, the test or the decision, is the open question.

The gap closes when the owner rules on that question and the test is green on the iPhone 18 Pro.

**Status:** open. The owner has the product question on the waiting page, sent by the coordinator: add `scrollDismissesKeyboard(.interactively)` to the Orphaned scroll. Nothing is built until the owner answers.

**Decision:** `duo-card-in-hand`.
