# The native Tally audit fails on contrast with a row open

**What.** `TallyUITests.testAccessibilityAuditTallyScreenWithARowOpen` fails with "Contrast failed" at `a50834f`, the head of lane branch `native/n6-tally`. The audit passes on the closed Tally screen. Two runs on the iPhone 18 Pro simulator, the builder's and a second build of the same head, gave 14 of 15 UI tests passing and this one red. The result bundle does not name the failing element. The last lookup in the run log is the "Ponder" static text, so that row is the suspect. The gap closes when the test passes. Delete this entry then.

**Status:** open. No fix is briefed.

**Decision:** `native-build-lanes`.

**Decision:** `palette-tokens-contrast-floor`.
