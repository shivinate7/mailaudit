# Lane N10, native photos, is not built

**What.** Lane N10 is ruled in `native-build-lanes`, and it is not built. Its tests are named there:

- a downscale to 2000px;
- a photo blob that never enters the ledger;
- a modal viewer with Escape and focus return;
- a Stop control on upload.

Its wait on lane W2a has ended, because W2a landed in PR #77. When N10 lands with those tests, the gap closes.

**Status:** open. Unblocked, not built.

**Decision:** `native-build-lanes`.
