# Debt notes

One line per finding that is not likely in normal work. A note becomes a debt after a real incident.

- 2026-10-28, step 5 review round 3: test comments narrate history or are stale in `native/ManifestUITests/AuditSkippingTabBarUITests.swift` (the more-than-half rule, "no longer raises one") and `native/ManifestUITests/MastheadBackupUITests.swift` ("used to run past", "needs the owner's word", "skips only text").
- 2026-10-28, step 5 review round 3: the Orphaned composer's scroll-to-Save on focus and keyboard show has no test, and may push a focused name field out of view in a tall composer. Unverified.
- 2026-10-28, step 6 review round 1: an unknown stamp kind now shows its raw slug in the band instead of throwing, and no test pins that.
- 2026-10-28, step 6 review round 1: `LedgerStore.setStamp` is now called only by tests; `Versions.swift` still tests `kind != ""` on its own.
- 2026-10-29, step 6 review round 3: a failed Tally or Orphaned read after a native stamp write marks the save slot failed but drops the error text (`RootView.swift`), so the slot gives no reason.
- 2026-10-29, step 6 design review: the native refunded pill sets `.cochin(12.5)` with no text style to scale with (`PackagesView.swift`), and the stamp editor spaces its parts with child padding (`StampViews.swift`).

**Status:** open. Each line stays a note until a real incident.

**Decision:** `debts-hold-known-gaps`.
