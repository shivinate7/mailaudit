# The native restore does not call the photo id rule

**What.** `PhotoIds.kept` holds the rule of `photo-ids-restore-keep-if-known`. `SyncClient` calls it on every server reply with `.sync`, and on `.sync` it keeps every id. A native restore must drop the ids this device does not hold, with `.restore`. Lane N9's apply path does not call it, and the N9 row in `native-build-lanes` names no call. The `.sync` call is the identity, so a test pins its outcome and cannot see whether the call is made. The gap closes when the restore path passes its ids through `PhotoIds.kept` with `.restore`, and a test pins that path.

**Status:** open. No lane row names the restore call. The owner names the lane.

**Decision:** `photo-ids-restore-keep-if-known`.
