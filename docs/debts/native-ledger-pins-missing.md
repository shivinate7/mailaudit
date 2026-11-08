# No test pins that the app passes its own rules.js to the ledger store

**What.** `LedgerStoreTests` pins the millisecond kept-copy name, a missing ledger file, and the failed-save sentence. One ledger behaviour is still unpinned: at boot, `ManifestApp.swift` passes its own `rules.js` to the store. A Kit test cannot see the app's boot. If a hosted or UI test pins it, the gap closes.

**Status:** open.

**Decision:** `native-ledger-is-raw-json`.

**Decision:** `native-files-are-frozen`.
