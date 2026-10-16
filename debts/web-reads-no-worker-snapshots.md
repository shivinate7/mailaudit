# Web History reads no Worker snapshot

**What.** Web does not read the Worker `/snapshots` or `/kept` routes. After the switch, History lists the local tiers and the frozen `data` branch, and no new branch version arrives. So the Worker's daily snapshots are a backup the web app cannot browse. The gap closes when History reads them, and the frozen branch can then leave.

**Status:** open. No lane is briefed.

**Decision:** `worker-keeps-snapshots`.
