# The apply delay on a hidden tab is unmeasured

**What.** Nobody has timed a reply on a hidden or frozen tab. A held reply wakes through `bgTimeout` timers, and a browser may slow or stop timers on a hidden tab. The probe could not make a tab hidden or frozen in headless Chromium (`sync-latency`, cases c4 and c5freezeA), so those runs show nothing. When the owner returns to the tab, `visibilitychange` starts the resume GET. The gap closes when a real hidden tab, in each browser the owner uses, is timed from the tap on the other device to the change.

**Status:** open. Found in lane web/sync-latency, 2026-10-21.

**Decision:** `auto-apply-happens-now`.
