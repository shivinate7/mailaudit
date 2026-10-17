# A failed photo download is not retried

**What.** When a merge's photo download fails, the id stays in the ledger and the tile stays blank. `pullPhotos` has one caller, `doMerge`, and `doMerge` returns early when the reply matches this device's ledger. So an unchanged ledger never fetches that blob again. Only a later merge that changes the ledger retries it. Found by code reading in the review of PR #102, 2026-10-17. No repro has run.

**Status:** open.

**Decision:** `pull-fetches-photos-before-apply`.
