# A re-import does not refresh tracking

**What.** A re-import keeps the stored copy of a line whose key is already stored, so a changed `tracking` value in a newer CSV never reaches the app (`mergeItems` in `src/merge-rules.mjs`: the base copy wins a key collision). The owner ruled that a re-import refreshes only the `tracking` field on such a line, and never touches the received marks or any other field (owner, 2026-11-15 13:38 CST, waiting-page item 89 `reimport-changed-lines`, pick b). Measured by the coordinator at 13:29 CST: 514 stored lines differ in `tracking` from the 2026-11-15 CSV, all from unknown to a real status, and 13 of them are newly canceled. The gap closes when `mergeItems` refreshes `tracking` on a stored line and leaves the received marks and every other field as stored.

**Status:** open. The coordinator holds the code lane until PR 338 (the pin test and the invariant wording) merges (coordinator, 2026-11-15 14:54 CST).

**Decision:** `imports-merge-never-replace`.
