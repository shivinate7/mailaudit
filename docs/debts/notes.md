# Notes

One line per finding that is not likely in normal work. A note becomes a debt after a real incident.

- 2026-10-28, step 5 review round 3: test comments narrate history or are stale in `native/ManifestUITests/AuditSkippingTabBarUITests.swift` (the more-than-half rule, "no longer raises one") and `native/ManifestUITests/MastheadBackupUITests.swift` ("used to run past", "needs the owner's word", "skips only text").
- 2026-10-28, step 5 review round 3: the Orphaned composer's scroll-to-Save on focus and keyboard show has no test, and may push a focused name field out of view in a tall composer. Unverified.
- 2026-10-28, step 6 review round 1: an unknown stamp kind now shows its raw slug in the band instead of throwing, and no test pins that.
- 2026-10-28, step 6 review round 1: `LedgerStore.setStamp` is now called only by tests; `Versions.swift` still tests `kind != ""` on its own.
- 2026-10-29, step 6 review round 3: a failed Tally or Orphaned read after a native stamp write marks the save slot failed but drops the error text (`RootView.swift`), so the slot gives no reason.
- 2026-10-29, step 6 design review: the native refunded pill sets `.cochin(12.5)` with no text style to scale with (`PackagesView.swift`), and the stamp editor spaces its parts with child padding (`StampViews.swift`).
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
- 2026-10-29, wave 3 CI race fix: `PackagesModelTests.swift` still uses a fixed sleep against a 500 ms JS busy-wait. That pattern failed HandModelTests on the hosted runner. The HandModelTests wait reaches the engine's private context through `Mirror`, and a small engine test hook would replace that.
- 2026-10-29, check-in error design review round 2: the Card in Hand error banner's text starts about 4 pt left of the envelope page's column; a 16 pt side inset would align it.
- 2026-10-29, check-in error design review: on a scrolled Card in Hand envelope page, the top error banner covers the first line rows until the next good save.
- 2026-10-29, check-in error design review: the check-in error text carries the system's `localizedDescription` (for example "The file 'ledger.json' doesn't exist."), which is technical; Packages shows the same text.
- 2026-10-28, Duo wave 3 design review: the native screens keep the web's bordered MiniLabel buttons, which the ios-apps mockup rules call web-like; kept for parity with the web.
- 2026-10-29, stamp ask review: the ask-below assert accepts an ask that covers the lower half of the row (`askBox.minY > saveBox.midY`; `>= saveBox.maxY` is stricter, unmeasured).
- 2026-10-29, stamp ask review: arming Remove with the note field focused keeps the keyboard up, so the ask may sit behind it for its 4 s (unmeasured).
- 2026-10-29, Card in Hand review: no test pins that a failed Tally or Orphaned reload marks a Hand or stamp write failed (`HandScreen.swift` `afterWrite`, `StampViews.swift` `write`).
- 2026-10-29, CI wiring review round 2: no run has shown that `cancelled()` reads true in the ci-done job after a superseded PR run is cancelled. The first double push on a PR settles it. A false value posts a false red comment.
- 2026-10-29, CI wiring review round 2: the job groups on main still key by commit, so a third run on one commit can replace a pending job, such as a nightly. The harm is one cancelled job.
- 2026-10-29, CI wiring review round 2: `ci-skips-draft-prs` names the draft state in the keys of three jobs only. The ste-lint key and the workflow key carry it too.
- 2026-10-30, shoot config review: Tally, Orphaned and Ledger have no shot because no URL reaches them; a deep-link route waits for its own decision.

**Status:** open. Each line stays a note until a real incident.

**Decision:** `debts-hold-known-gaps`.
- 2026-10-30, all-jobs-passed review round 1: `stripComment` in `test/ci-wiring.test.mjs` cuts at a `#` after an escaped quote, and opens a false quote after `, : [ -` in plain text. No line of `.github/workflows/test.yml` hits either case.
- 2026-10-30, all-jobs-passed review round 1: the scope job's native pattern omits `src/sync-rules.mjs`, `src/version-rules.mjs` and `src/photo-rules.mjs`, which `build.mjs` bundles into `rules.js`. `check:rules` forces `rules.js` into the same diff, and `native/` matches it.
- 2026-10-30, all-jobs-passed review round 1: just after `ready_for_review`, a draft run's skipped `all-jobs-passed` may read as passing until the new run reports it. The merge tool waits on that run, so only a merge pressed by hand in GitHub in those seconds is exposed. Unmeasured.
