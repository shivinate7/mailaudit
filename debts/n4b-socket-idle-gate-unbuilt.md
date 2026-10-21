# Lane N4b, the socket, press gate and resume, is not built

**What.** Lane N4b is ruled in `native-build-lanes`, and it is not built. Its tests are named there:

- a rev that is not newer gives no GET;
- a newer rev with a changed ledger POSTs;
- a reply holds while a press is down and for `PRESS_TAIL_MS` after it, and hover and scroll never hold it;
- a cold reply applies at once after a key save;
- resume does one GET.

The press gate reads its constants and `pressHeld` from the rules bundle, see `auto-apply-happens-now`.

Lane N4a must land first. When N4b lands with those tests, the gap closes.

**Status:** open. Waits for lane N4a.

**Decision:** `native-build-lanes`.
