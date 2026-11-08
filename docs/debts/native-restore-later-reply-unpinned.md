# No test pins that a later Worker reply leaves a native restore in place

**What.** A native restore now runs the bundle's `restampRestore` (`RestoreRestampTests`). Every key the restore touches carries the restore time. The Worker keeps the later change per key (`mergeReceived`), so the restore should survive an older reply. No test runs that merge against a native restore. The phone adopts a Worker reply whole, so a ManifestKit test cannot reach it. If a Worker test merges a native-restored ledger with an older one, the gap closes.

**Status:** open. The coordinator filed it on 2026-11-08 under `roles-findings-are-debts-or-notes`.

**Decision:** `a-restore-is-not-local`.
