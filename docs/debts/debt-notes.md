# Debt notes

One line per finding that is not likely in normal work. A note becomes a debt after a real incident.

- 2026-10-28, step 5 review round 3: test comments narrate history or are stale in `native/ManifestUITests/AuditSkippingTabBarUITests.swift` (the more-than-half rule, "no longer raises one") and `native/ManifestUITests/MastheadBackupUITests.swift` ("used to run past", "needs the owner's word", "skips only text").
- 2026-10-28, step 5 review round 3: the Orphaned composer's scroll-to-Save on focus and keyboard show has no test, and may push a focused name field out of view in a tall composer. Unverified.
- 2026-10-28, Duo margin review: the Duo bar's bottom scroll margin may reach the text-view scroll inside the vertical-axis fields at `TallyView.swift` (search) and `OrphanedView.swift` (composer), and change their height or hit region. Unmeasured.
- 2026-10-28, Duo margin review: the photo strip's horizontal ScrollView in `PhotoViews.swift` (56 pt high) would take the 76 pt margin on the open Duo. It is unwired today.
- 2026-10-28, Duo margin review: whether `scrollTo(…, anchor: .bottom)` in `HandScreen.swift` and `MastheadScreen.swift` respects the margin is unmeasured; `testPostOfferClearsTheKeys` was not in the margin fix's proof.
- 2026-10-28, Duo wave 3 design review: "3 refund window closing" has no plural form (`HandScreen.swift`, past transit).
- 2026-10-28, Duo wave 3 design review: on Card in Hand, a tap on the one match that equals the query does nothing.
- 2026-10-28, Duo wave 3 design review: on the Tally spread the ▸ arrow opens nothing, while on one page the same arrow expands the row.
- 2026-10-28, Duo wave 3 design review: the Tally copy date is set in Cochin, not monospace (`typography-cochin-and-mono`).
- 2026-10-28, Duo wave 3 design review: the stacks in Card in Hand's notice box, tie card and transit box use 2 pt spacing, off the 4 pt grid.
- 2026-10-28, Duo wave 3 design review: on the open Duo, the Ledger seal, wordmark and "LEDGER" sit on the fold; round 2 item 24 accepted Ledger at full width.
- 2026-10-28, Duo wave 3 design review: "refund window closing" shows at 181 days; the web text is the same.
- 2026-10-28, Duo wave 3 design review: the past-transit page has no track bars, no claim-by dates and no "Under 14 days" list on the left page.
- 2026-10-28, Duo wave 3 design review: the native screens keep the web's bordered MiniLabel buttons, which the ios-apps mockup rules call web-like; kept for parity with the web.

**Status:** open. Each line stays a note until a real incident.

**Decision:** `debts-hold-known-gaps`.
