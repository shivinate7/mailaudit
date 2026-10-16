# Lane N4a, sync over HTTP, is not built

**What.** No sync source exists under `native/` on main. Lane N4a builds the native sync client over HTTP. N4a waited for the stage 4b switch in `sync-revamp-cloudflare`. The switch is built in the batch that carries this record, so N4a no longer waits on it. The gap closes when N4a is briefed and built.

**Status:** open. Not briefed. The switch no longer blocks it.

**Decision:** `native-build-lanes`.
