# A refreshed tracking or name stays on the importing device

**What.** A CSV re-import refreshes `tracking` and renames a line (`refreshName`, owner item 90) on the device that imports it. `POST /ledger` and the two-device merge keep the stored copy on a key clash, so the refreshed `tracking` and the new `name` never reach the stored ledger. The importing device keeps it after a sync, and a second or fresh device gets the old value, and the second device's Tally keeps the old-style name apart from the new one. The rename is idempotent, so a re-import on that device fixes it there. Options, none ruled: (a) the POST carries a refresh map (for `name` a stale copy is harmless to revert only if the file is newer, so the same stamp question applies) like the orders job's (`mergeIntoStore`), but a stale CSV could revert a newer `tracking`; (b) a per-line `tracking` stamp, later change wins; (c) keep the refresh device-local. The gap closes when the owner rules one.

**Status:** open. The owner has not ruled.

**Decision:** `imports-merge-never-replace`.
