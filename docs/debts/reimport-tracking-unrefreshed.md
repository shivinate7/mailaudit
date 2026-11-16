# A re-import does not refresh tracking

**What.** A re-import keeps the stored copy of a line whose key is already stored, so a changed `tracking` value in a newer CSV never reaches the app (`mergeItems` in `src/merge-rules.mjs`: the base copy wins a key collision). The owner ruled that a re-import refreshes only the `tracking` field on such a line, and never touches the received marks or any other field (owner, 2026-11-15 13:38 CST, waiting-page item 89 `reimport-changed-lines`, pick b). Measured by the coordinator at 13:29 CST: 514 stored lines differ in `tracking` from the 2026-11-15 CSV. 511 were unknown before (326 now with tracking, 175 without tracking, 10 canceled) and 3 moved from a known status to canceled (2 from with tracking, 1 from without tracking), so 13 are newly canceled. The gap closes when `mergeItems` refreshes `tracking` on a stored line and leaves the received marks and every other field as stored.

**Status:** open. PR 338 merged (the pin test and the invariant wording). Tests 57.14 and 57.15 pin today's behaviour, and the code lane re-points both (`imports-merge-never-replace`).

**Decision:** `imports-merge-never-replace`.
