# Lane N4b, the socket, idle gate and resume, is not built

Lane N4b is ruled in `native-build-lanes`. Its tests are named there: a rev that is not newer gives no GET, a newer rev with a changed ledger POSTs, the idle gate is 10 seconds, a cold reply applies at once after a key save, and resume does one GET. Lane N4a must land first. The gap closes when N4b lands with those tests.

**Status:** open. Waits for lane N4a.

**Decision:** `native-build-lanes`.
