# Lane N4a, sync over HTTP, is not built

Lane N4a builds the native sync client over HTTP. No sync source exists under `native/` on main. N4a waits for the stage 4b switch in `sync-revamp-cloudflare`, which is built and still pending. The gap closes when that switch lands and N4a is briefed and built.

**Status:** open. Waits for the stage 4b switch.

**Decision:** `native-build-lanes`.
