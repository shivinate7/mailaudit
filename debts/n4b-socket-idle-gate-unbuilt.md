# Lane N4b, the socket, idle gate and resume, is not built

**What.** Lane N4b is ruled in `native-build-lanes`, and it is not built. Its tests are named there:

- a rev that is not newer gives no GET;
- a newer rev with a changed ledger POSTs;
- the idle gate is 10 seconds;
- a cold reply applies at once after a key save;
- resume does one GET.

Lane N4a landed the HTTP client, `SyncClient`. Nothing in the app calls it yet. N4b wires it: a pull on launch, and a push after a change. When N4b lands with those tests and that wiring, the gap closes.

**Status:** open. Lane N4a landed, so N4b is free to build.

**Decision:** `native-build-lanes`.
