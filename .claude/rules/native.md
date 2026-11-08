---
paths:
  - "native/**"
  - "shared/**"
  - "tools/ios-ship.json"
  - ".github/workflows/checks.yml"
  - "scripts/send-key.mjs"
  - "scripts/gen-golden.mjs"
  - "src/*-rules.mjs"
  - "build.mjs"
---

# Native client

Holds the native client rules, and the debts for the native app.

## The native client

MANIFEST is rebuilt in Swift. These records say what both clients share, what they do not, and the order of the work.

- `native-swift-rebuild` — MANIFEST is rebuilt as a native Swift client.
- `native-build-lanes` — The native build runs in ordered lanes.
- `native-parity-table` — Each feature has one scope in the native rebuild.
- `rules-run-in-javascriptcore` — The Swift client runs the view rules in JavaScriptCore.
- `shared-tokens-and-fixtures` — Both clients read one token file and one fixture set.
- `native-key-via-url-scheme` — The native client takes its key through a custom URL scheme.
- `native-ledger-is-raw-json` — The native client keeps the ledger as raw JSON.
- `native-reply-waits-generation` — A native reply applies only to a ledger that has not changed.
- `native-files-are-frozen` — Native file names freeze on first ship.
- `native-ci-on-hosted-macos` — The native job runs on a hosted macOS runner.
- `csv-import-stays-web` — CSV import stays on the web app.
- `one-simulator-per-mac` — Simulator boots and load follow the global machine rules.
- `native-ships-via-testflight` — The iOS app ships Mac first, TestFlight as the fallback.
- `duo-card-in-hand` — On the iPhone Duo, Card in Hand checks cards in by name.
- `audit-skips-measured-flags` — The native audits skip only named, owner-ruled findings.

## Native debts

- `native-ui-tests-not-in-ci` — Native UI tests and builds are not in CI.
- `native-sync-live-unrun` — The native sync POST, socket and photo paths are unrun against the Worker.
- `native-sync-glue-unpinned` — No test drives the native sync glue in the app.
- `native-merge-notice-unbuilt` — No native screen shows the merge notice.
- `native-kept-copy-has-no-route` — The native app has no route to the kept copy.
- `native-dialog-ban-unpinned` — Nothing pins the ban on native dialogs.
- `native-restore-pill-tap-unpinned` — No test taps the leading part of the native Restore pill.
- `native-ledger-tab-unbuilt` — The native Ledger tab lacks the View group.
- `native-restore-keeps-old-times` — A native restore keeps the old change times.
- `native-milestone-needed-unpinned` — No ruling on a native Reset whose milestone cannot be saved.
- `native-ask-has-no-cancel-focus` — The native ask does not move first focus to Cancel.
- `native-filters-tally-only` — The native client has no date filter, package sort or Packages search.
- `native-tally-copy-no-flags` — The native Tally copy has no lost-mail flag and no order id tap.
- `native-envelope-has-no-photos` — Native envelopes have no photos.
- `native-orphaned-colours-unbuilt` — The native Orphaned composer audits flag text with no element.
- `tabbar-hides-partial-controls` — The tab-bar skip never checks a control partly under the bar.
- `native-candidate-lines-wrap` — Native candidate seller and meta lines wrap.
- `native-undo-notice-padding` — The native Undo notice pads 4pt, not 8pt.
- `native-composer-fields-two-lines` — The native composer fields draw two lines tall.
- `native-discard-arm-unpinned` — No test pins the native Discard arm.
- `native-key-scan-skips-views` — The native key scan skips SwiftUI view state.
- `native-compose-is-one-fade` — The native letterhead composes in one fade.
- `native-card-lost-flags-unbuilt` — The native package card has no lost-mail flag and no tracked glyph.
- `native-seller-scale-unmeasured` — The native seller shrinks to half size, and the cause is unmeasured.
- `native-pinned-card-dynamic-type` — The pinned-head audit flags Dynamic Type on one card.
- `native-cold-launch-ledger-shift` — The Ledger tab may jump at cold launch.
- `native-masthead-foot-row-gap` — The native masthead foot's second row sits 4.6pt low.
- `native-masthead-axl-clips` — The native masthead wraps and clips at accessibility text sizes.
- `native-stamp-load-unmeasured` — The native Packages load with stamps is unmeasured.
- `native-armed-audit-misses-ask` — The native armed stamp audit cannot see the ask.
- `app-build-waits-xcode-27` — No pull-request CI job compiles the app; the milestone build has no green run yet.
- `native-card-gestures-unpinned` — No UI test pins the native card header gestures.
- `native-card-state-in-swift` — The native card copies the line and package done rules in Swift.
- `native-sync-tally-rules-in-swift` — The native Sync panel and Tally row copy six view rules in Swift.
- `native-backup-has-no-photos` — Native Backup holds no photos.
- `native-backup-ui-unpinned` — No UI test taps Backup.
- `native-backup-web-restore-unrun` — No test restores a native backup file on the web.
- `native-count-line-clips` — The native count line clips with no ellipsis at 4-digit counts.
- `native-masthead-stale-after-tabs` — The native masthead and Packages go stale after another tab writes.
- `native-ledger-pins-missing` — Four native ledger behaviours have no test.
- `mac-target-unbuilt` — The Mac has no native app.
- `native-runner-image-unverified` — Whether the hosted runner image has Xcode 27 and xcodegen is unverified.
- `native-runner-keychain-unverified` — Whether the hosted runner keychain is unlocked is unverified.
- `native-job-hosted-time-unmeasured` — The native job's time on a hosted runner is unmeasured.
- `native-photo-screens-unwired` — No native screen shows a photo, and nothing takes one.
- `native-merge-skips-photo-fetch` — Nothing fetches native photos before an apply.
- `native-photo-sweep-unbuilt` — The native client has no photo sweep.
- `native-photo-viewer-unpinned` — No test pins the photo viewer's traits or the Stop control.
- `n11-device-check-not-run` — The owner's native device check has run in part.
- `duo-keyboard-gap-unmeasured` — The Duo keyboard gap above the keys is unmeasured.
- `duo-fold-change-unpinned` — No test folds the Duo while the app runs.
- `duo-tab-items-twice` — The Duo tab bar repeats the tab titles in RootView.
- `duo-bar-dynamic-type-clips` — The Duo tab bar may clip at large text sizes.
- `duo-stacked-poses-unbuilt` — The Duo has no stacked poses.
- `duo-hand-mockup-gaps` — Eight parts of the Card in Hand mockup are not built.
- `hand-stray-keeps-tie` — A released card leaves its tie on the answer page.
- `hand-stale-checkin-error` — A good post leaves an old check-in error showing.
- `stamped-toggle-clears-error` — The stamped toggle clears a failed check-in's error.
- `checkin-error-bar-is-sans` — The native check-in error bar is set in sans on material.
- `hand-post-scroll-hides-sender` — The Post offer scrolls the sender off the page.
- `hand-notice-cuts-match-row` — A Suspense or Released box pushes the match under the keys.
- `hand-post-top-scroll-unpinned` — No test pins the scroll to the page top when Post shows.
- `hand-held-box-under-keys` — A held card's box can sit under the keys.
- `hand-match-row-ax3-unmeasured` — The match row at large text is unmeasured.
- `hand-suspense-tap-shift` — A tap on a match shifts rows under the finger.
- `hand-tap-label-unpinned` — No test pins the tapped name's sideways place.
- `duo-left-page-dead-margin` — The Duo left page scrolls 76 pt past its end; low priority, after restyle's step 8.
- `duo-checkin-error-under-bar` — A Packages check-in error can sit under the Duo bar.
- `native-tally-ellipsis-unpinned` — Nothing pins the native Tally ellipsis.
- `native-discard-panel-covers-head` — The native armed Discard panel covers the envelope header.
- `native-axl-rows-break` — Three native rows break at accessibility text sizes.
- `sim-test-diagnose-and-pin` — sim-test runs simctl diagnose and can pick the Duo.

## Measurements

- `duo-fold-and-keyboard` — Fold strip, keyboard frame and outer screen on the iPhone Duo simulator.
- `native-card-load-time` — Native Packages load time on 600 packages.
