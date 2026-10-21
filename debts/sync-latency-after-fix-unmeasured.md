# The sync delay with the press guard is unmeasured

**What.** No run of the probe covers lane web/sync-latency. The figures in `sync-latency` come from main at `3997ee9`. The lane's tests pin the guard on a virtual clock (group 75) and in Chromium against a mocked Worker (claim 16). The Worker tests pin the hello. None of them times a tap on one device to the row on the other through a real Worker. The probe scripts, a runner and a seed script, sit in a session scratchpad and are not in the repo. The gap closes when a builder commits the probe and runs cases c1, c2, c5burst, c5notice and c3drop against the lane head with a local Worker. Then `sync-latency` is rewritten with those figures.

**Status:** open. Found in lane web/sync-latency, 2026-10-21.

**Decision:** `sync-latency`.
