# The native key scan skips SwiftUI view state

**What.** No lane scans SwiftUI view state, such as `@State` in a view. The key scan covers the Packages model, its rows, the masthead model and its cells, the backup export and the ledger file. The `@State` lives in views under `native/Manifest`, and `swift test` on ManifestKit cannot build them. Only a UI test or a hosted test reaches that state. The gap closes when a lane adds that scan.

**Status:** open. The coordinator routed it on 2026-11-08 to the simulator lane that starts after step 7 merges, the same lane that takes `native-sync-glue-unpinned`.

**Decision:** `native-build-lanes`.

**Decision:** `the-token-is-a-credential`.
