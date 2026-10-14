# Four native ledger behaviours have no test

No test pins the millisecond kept-name format, the missing-file case, or the unwrapped-error sentence in Load and save. `keptCopies` matches the prefix and extension only, so the format is read from `LedgerStore.load`. The app passing its own `rules.js` to the store is not pinned either (`ManifestApp.swift`, boot). The gap closes when a test pins each one.

**Status:** open.

**Decision:** `native-ledger-is-raw-json`.
