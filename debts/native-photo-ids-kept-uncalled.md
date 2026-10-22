# Nothing calls the native photo id rule

**What.** `PhotoIds.kept` holds the rule of `photo-ids-restore-keep-if-known`, and it has no caller. A native restore must drop the ids this device does not hold. A server apply must keep every id. Lane N9 built the restore path, `LedgerStore.restore`. It applies the version's bytes through `adoptRaw` and does not call `PhotoIds.kept`, so a native restore keeps every photo id. The server apply is lane N4a's. Neither row in `native-build-lanes` names the call. The gap closes when each apply path passes its ids through `PhotoIds.kept` with the kind of apply it is, and a test pins each path.

**Status:** open. No lane row names the call. The owner names the lane.

**Decision:** `photo-ids-restore-keep-if-known`.
