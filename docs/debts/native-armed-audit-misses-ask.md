# The native armed stamp audit cannot see the ask

**What.** `PackageStampUITests.testAccessibilityAuditStampRemoveArmed` audits the editor with Remove armed. The audit runs about 4.9 s and ends about 8 s after arming, and the ask lapses after 4 s (`stamp-band-opens-the-editor`). So the audit mostly sees a disarmed editor. A version that asserts the ask still exists afterwards can never pass. It is parked on `archive/step6-armed-audit-live` with a shared audit helper edit whose net safety value scored zero. Since the ask hangs below the row, over the first item line, the armed audit also flags contrast on that line ("×2 · Test Set · Near Mint", y 444) and a contrast finding with no element; the run before the move had neither (2026-10-29, 1 of 1). The gap closes when one test reads the live ask once, inside the 4 s window, and checks its label, enabled state and 44pt frames. The lapse must not be lengthened.

**Status:** open, 2026-10-29.

**Decision:** `stamp-band-opens-the-editor`.
