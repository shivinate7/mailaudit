# The native Orphaned view uses system colours

**What.** The native Orphaned view paints from `shared/tokens.json` through `OrphanedPaint`, and a unit test pins the meanings (`orphaned-colours-by-meaning`). Its accessibility audits still fail, so the lane has not landed. A separate measurement is diagnosing them. The gap closes when the Orphaned UI audits pass.

**Status:** partly built: paint is in, audits red.

**Decision:** `orphaned-colours-by-meaning`.
