# Debt notes

One line per finding that is not likely in normal work. A note becomes a debt after a real incident.

- 2026-10-28, step 5 review round 3: test comments narrate history or are stale in `native/ManifestUITests/AuditSkippingTabBarUITests.swift` (the more-than-half rule, "no longer raises one") and `native/ManifestUITests/MastheadBackupUITests.swift` ("used to run past", "needs the owner's word", "skips only text").
- 2026-10-28, step 5 review round 3: the Orphaned composer's scroll-to-Save on focus and keyboard show has no test, and may push a focused name field out of view in a tall composer. Unverified.
- 2026-10-28, Duo margin review: the Duo bar's bottom scroll margin may reach the text-view scroll inside the vertical-axis fields at `TallyView.swift` (search) and `OrphanedView.swift` (composer), and change their height or hit region. Unmeasured.
- 2026-10-28, Duo margin review: the photo strip's horizontal ScrollView in `PhotoViews.swift` (56 pt high) would take the 76 pt margin on the open Duo. It is unwired today.
- 2026-10-28, Duo margin review: whether `scrollTo(…, anchor: .bottom)` in `HandScreen.swift` and `MastheadScreen.swift` respects the margin is unmeasured; `testPostOfferClearsTheKeys` was not in the margin fix's proof.

**Status:** open. Each line stays a note until a real incident.

**Decision:** `debts-hold-known-gaps`.
