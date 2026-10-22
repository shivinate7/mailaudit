# Lane N4b, the socket, press gate and resume, is not built

**What.** Lane N4b is ruled in `native-build-lanes`, and it is not built. Its tests are named there:

- a rev that is not newer gives no GET;
- a newer rev with a changed ledger POSTs;
- a reply holds while a press is down and for `PRESS_TAIL_MS` after it, and hover and scroll never hold it;
- a cold reply applies at once after a key save;
- resume does one GET.

Lane N4a landed. `SyncClient` keeps only the `ledger` of a reply and drops `rev` and `stats`, and N4b needs the rev. The gap closes when N4b lands with those tests and the four items below.

The press gate reads its constants and `pressHeld` from the rules bundle, see `auto-apply-happens-now`.

Lane N4b also owns four items from `native-reply-waits-generation`. The orchestrator assigned them on 2026-10-21, as a process assignment and not an owner ruling:

- the wiring of `SyncClient` into the app, see debt `native-sync-client-unwired`;
- the screens for the 401 and 413 lines;
- PhotoTransport over HTTP;
- the PhotoIds.kept server-apply call.

**Status:** open. Lane N4a landed, so N4b is free to build.

**Decision:** `native-build-lanes`.

**Decision:** `native-reply-waits-generation`.
