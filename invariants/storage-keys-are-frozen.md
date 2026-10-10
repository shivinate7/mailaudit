# Storage keys are frozen

The app reads and writes the ledger under a fixed localStorage key. The app-level key is `mailday:v1` (see `STORAGE_KEY`). A localStorage namespace shims it. The namespace is `mailday:`, so the literal key is `mailday:mailday:v1`. Real users hold months of check-in data under these keys today. A schema change must never break that data. Any schema change must ship with an in-place migration in the load path.

**Pinned by:** 25.27 (the stored keys are exactly `mailday:v1`), 9.4 (a save written before a schema change loads in place).
