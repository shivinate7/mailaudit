# No alarm watches the backup after the watchdog is off

The owner ruled on 2026-10-14 that the backup watchdog in the private repo is turned off, and the orchestrator carries that out. From then on no check reads the Worker's snapshots or the `data` branch, so a stopped backup raises no alarm. The Worker still keeps 180 daily snapshots.

**Status:** named limit. The owner accepted on 2026-10-14 at 21:55 CDT that no alarm watches the backup. It is not an open to-do, and it reopens only on a new owner ruling.

**Decision:** `worker-keeps-snapshots`.
