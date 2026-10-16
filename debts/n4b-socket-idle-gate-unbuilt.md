# Lane N4b, the socket, idle gate and resume, is not built

**What.** Lane N4b is ruled in `native-build-lanes`, and it is not built. Its tests are named there:

- a rev that is not newer gives no GET;
- a newer rev with a changed ledger POSTs;
- the idle gate is 10 seconds;
- a cold reply applies at once after a key save;
- resume does one GET.

Lane N4a must land first. When N4b lands with those tests, the gap closes.

**Status:** open. Waits for lane N4a.

**Decision:** `native-build-lanes`.
