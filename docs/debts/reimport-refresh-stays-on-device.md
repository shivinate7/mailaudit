# A refreshed tracking stays on the importing device

**What.** A CSV re-import refreshes `tracking` on the device that imports it. `POST /ledger` and the two-device merge keep the stored copy on a key clash, so the refreshed `tracking` never reaches the stored ledger. The importing device keeps it after a sync, and a second or fresh device gets the old value. Options, none ruled: (a) the POST carries a refresh map like the orders job's (`mergeIntoStore`), but a stale CSV could revert a newer `tracking`; (b) a per-line `tracking` stamp, later change wins; (c) keep the refresh device-local. The gap closes when the owner rules one.

**Status:** open. The owner has not ruled.

**Decision:** `imports-merge-never-replace`.
