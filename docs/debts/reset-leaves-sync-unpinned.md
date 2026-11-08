# No test pins that an armed Reset leaves Sync open

**What.** No test pins that an armed Reset leaves Sync open. Test 36.3 pinned that on the old code. It is for a builder to re-point. When a test pins that an armed Reset leaves Sync open, the gap closes.

**Status:** Fixed in test at 3a72d0c (2026-10-12). Test 36.3 in `test/app.test.mjs` opens Sync, arms Reset, and asserts the Sync cell stays expanded. This debt has no Retire line, so a delete waits on a `Retire-run` cite.

**Decision:** `history-sync-close-each-other`.
