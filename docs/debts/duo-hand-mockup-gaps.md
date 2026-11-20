# Eight parts of the Card in Hand mockup are not built

**What.** Poses 1, 2, 3 and 5 of the Duo round 2 design, archived at `origin/archive/design/duo-round2` (draft PR 144, the Duo round 2 design pull request, before the archive), show eight parts that the build lacks:
- Pose 1: the "line now" mark on the typed card's line, the cards so far under "This envelope" (or "Nothing checked in yet"), and "Still owed here" with N left and its cost, on the order line (page item 78 a, 2026-11-18 23:22 CST).
- Poses 2, 3 and 5: Keep held, the held marking on lines, a per-envelope "Post here" at a tie, the End of mail day view (page item 79 a, 2026-11-19 23:23 CST), and Suspense ranking of accounts by named copies.

Part 7, the end-of-day view, is built (owner ruling item 79 a, 2026-11-19 23:23 CST). Two pieces of it are not: the masthead's "still missing" line under "Across all orders", and the no-match frame with Hold in Suspense, which needs the several-name Suspense line.

The pose 1 parts touch every card. The "This envelope" row shows no value, and the envelope page gives no outstanding value, as `outstanding-value-per-level` asks. The built Suspense part is the held-name line. The gap closes when each part is built or the owner drops it, and a test pins each one that is built.

**Status:** open.

**Decision:** `duo-card-in-hand`.
