# Native Backup holds no photos

**What.** `LedgerStore.backup()` exports the ledger document only, and `LedgerTab` offers one Backup row. The web app adds Backup + photos when photos exist (`backup-files-restore-two-ways`). Lane N10 owns native photos, see `native-build-lanes`. The gap closes when native Backup offers the photos form and a test pins that the file holds each photo.

**Status:** open. Waits for the photo views of lane N10.

**Decision:** `backup-files-restore-two-ways`.
