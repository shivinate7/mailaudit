# Eight parts of the Card in Hand mockup are not built

**What.** Poses 1, 2, 3 and 5 of PR 144, the Duo round 2 design pull request, show eight parts that the build lacks:
- Pose 1: the "line now" mark on the typed card's line, the cards so far under "This envelope" (or "Nothing checked in yet"), and "Still owed here" with N left and its cost.
- Poses 2, 3 and 5: Keep held, the held marking on lines, a per-envelope "Post here" at a tie, the end-of-day view, and Suspense ranking of accounts by named copies.

The pose 1 parts touch every card. The "This envelope" row shows no value, and the envelope page gives no outstanding value, as `outstanding-value-per-level` asks. The built Suspense part is the held-name line. The gap closes when each part is built or the owner drops it, and a test pins each one that is built.

**Status:** open.

**Decision:** `duo-card-in-hand`.
