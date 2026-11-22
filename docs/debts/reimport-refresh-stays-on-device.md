# A refreshed name stays on the importing device, and the cloud CSV route refreshes nothing

**What.** A CSV re-import renames a line (`refreshName`, owner item 90) on the device that imports it. `POST /ledger` and the two-device merge keep the stored copy on a key clash, so the new `name` never reaches the stored ledger. The importing device keeps it after a sync, and a second or fresh device gets the old name, and that device's Tally still shows the same card twice, once under the old name and once under the new. The rename is idempotent, so a re-import on that device fixes it there. Options for the name, none ruled: (a) the POST carries a refresh map like the orders job's (`mergeIntoStore`), but an old export could put an old-style name back (unmeasured: no export older than the name change has been tried); (b) a per-line stamp, as tracking has (`trackingAt`, built on branch `tracking-stamp-build`, not on main); (c) keep the rename device-local, not chosen. The cloud CSV route (`cloud-session-reach`) calls `mergeItems` with no options, so a re-import there refreshes no tracking and renames nothing. The gap closes when the owner rules the name route and the cloud CSV route, and each is built.

**Status:** open. Tracking is built, route c (a per-line `trackingAt` stamp, later change wins), on branch `tracking-stamp-build`, not on main; see `merge-later-change-wins`. The name refresh and the cloud CSV route are not ruled.

**Decision:** `imports-merge-never-replace`.

**Decision:** `merge-later-change-wins` (the tracking stamp).
