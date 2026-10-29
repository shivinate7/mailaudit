# Nothing pins the native Tally ellipsis

**What.** The native Tally meta line draws its own "…" in `native/Manifest/TallyView.swift` (`metaLine`). It mounts the "…" only when the text overflows its column by more than 0.5pt, after the column width is measured. The "…" is hidden from accessibility, so no UI test can see it. Nothing pins that the "…" shows on overflow, that it is absent on a fitting line, or the 0.5pt threshold. The tests pin the full label and the overflow only. The gap closes when a test, a snapshot or a unit-tested rule pins the mount rule.

**Status:** open.

**Decision:** `audit-skips-measured-flags`, the owner's item 33 ruling.
