# No alarm watches the backup after the watchdog is off

**What.** Once the watchdog is off, no check reads the Worker's snapshots or the `data` branch, so a stopped backup raises no alarm. The owner ruled on 2026-10-14 that the backup watchdog in the private repo is turned off. The orchestrator disabled it on 2026-10-16, between 03:02 and 03:08 CDT (workflow id `356631798`, `gh workflow disable`). The Worker still keeps 180 daily snapshots.

**Status:** named limit. The owner accepted on 2026-10-14 at 21:55 CDT that no alarm watches the backup. It is not an open to-do, and it reopens only on a new owner ruling.

**Decision:** `worker-keeps-snapshots`.
