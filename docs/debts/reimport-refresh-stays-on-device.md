# A refreshed tracking or name stays on the importing device

**What.** A CSV re-import refreshes `tracking` and renames a line (`refreshName`, owner item 90) on the device that imports it. `POST /ledger` and the two-device merge keep the stored copy on a key clash, so the refreshed `tracking` and the new `name` never reach the stored ledger. The importing device keeps it after a sync, and a second or fresh device gets the old value, and that device's Tally still shows the same card twice, once under the old name and once under the new. The rename is idempotent, so a re-import on that device fixes it there. Options: (a) the POST carries a refresh map like the orders job's (`mergeIntoStore`), but a stale CSV could revert a newer `tracking`, and an old export could put an old-style name back (unmeasured: no export older than the name change has been tried); (b) a per-line `tracking` stamp, later change wins, which owner item 94 ruled for tracking as route c (2026-11-21 20:00 CST, a per-line `trackingAt` stamp; not built); (c) keep the refresh device-local, not chosen. The cloud CSV route (`cloud-session-reach`) calls `mergeItems` with no options, so a re-import there refreshes and renames nothing. The gap closes when the name refresh and the cloud CSV route are ruled and built.

**Status:** open. Tracking is ruled (route c, option b above) and not built. The name refresh and the cloud CSV route are not ruled.

**Decision:** `imports-merge-never-replace`.

**Decision:** `merge-later-change-wins` (the tracking stamp).
