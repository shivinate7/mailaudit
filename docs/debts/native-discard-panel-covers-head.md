# The native armed Discard panel covers the envelope header

**What.** On Orphaned, an armed Discard opens a panel that covers the envelope header at every text size: the date label, Edit and Discard. The cause is in `native/Manifest/OrphanedView.swift` (the armed Discard panel): `.alignmentGuide(.bottom) { $0[.top] - 4 }` has no effect, so the panel's bottom lines up with the header's bottom. On the web the panel hangs below the row. The design review of 2026-10-28 found it (screens `discard-armed-default` and `discard-armed-axm`). An unreviewed fix sits on `archive/step4-design-fix4` (commit c199dc4). The gap closes when the panel hangs below the header without pushing the list, and a UI test pins that the header controls stay hittable while armed.

**Status:** open.

**Decision:** `motion-disclosure-panels-arrive`.
