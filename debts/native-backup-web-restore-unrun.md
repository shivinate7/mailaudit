# No test restores a native backup file on the web

**What.** The web app is the only restore path for a backup file (`native-parity-table`). The native export is the raw ledger document, with `receivedAt`, `savedAt` and any field the client does not name. No test passes a file made by the native export through `applyBackup`. The Swift tests restore into a native store only (`testExportRestoresAsALedgerWithNothingDropped`). The gap closes when a web test restores a fixture made by the native export, and a check keeps that fixture current.

**Status:** open.

**Decision:** `every-restore-passes-applybackup`.
