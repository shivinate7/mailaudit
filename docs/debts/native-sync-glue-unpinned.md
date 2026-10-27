# No test drives the native sync glue in the app

**What.** The tests run `SyncClient` and `PressGate` on fakes. Three calls in `native/Manifest` have no test:

- `PressWatcher` reports a finger down, a lift and a cancel to `PressGate`. A broken recognizer leaves the gate open, and a reply then applies under a thumb (`auto-apply-happens-now`).
- `scenePhase` becoming active calls `resume()`.
- A key link that stores a key calls `keySaved()`.

The only UI tests of lane N4b cover the 401 and 413 line. The gap closes when a UI test or a hosted test pins each call.

**Status:** open. The owner's device check names none of them (`n11-device-check-not-run`).

**Decision:** `auto-apply-happens-now`.
