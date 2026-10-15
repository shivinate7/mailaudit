# No alarm watches the backup after the watchdog is off

The owner ruled on 2026-10-14 that the backup watchdog in the private repo is turned off, and the orchestrator carries that out. From then on no check reads the Worker's snapshots or the `data` branch, so a stopped backup raises no alarm. The Worker still keeps 180 daily snapshots.

**Status:** open. No owner ruling names a replacement alarm.

**Decision:** `worker-keeps-snapshots`.
