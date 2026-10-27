# The native build runs in ordered lanes

**Status:** ruled. The owner accepted the plan on 2026-10-11 and ruled each open question in it. W1 landed in PR #61 and S1 in PR #62. S2 landed in PR #63, S3 in PR #64 and S4 in PR #65. N1 landed in PR #75, C1 in PR #76, W2a in PR #77 and W3a in PR #79. N2 landed in PR #81, N3 in PR #80 and N5 in PR #82. N4a landed on branch `native/n4a-sync`, N4b on branch `native/n4b-socket`, N10 on branch `native/n10-photos`, N6 on branch `native/n6-tally`, N7 on branch `native/n7-orphaned`, N8 on branch `native/n8-masthead` and N9 on branch `native/n9-milestones`. Their PR numbers are claimed at merge. Their rows have left this table. No other lane has landed. The rows below carry the 2026-10-11 changes. The 2026-10-12 N5 defaults sit in N5 notes below, and the N8 defaults sit in N8 notes. The rows are ruled or named, and not built.

The native rebuild splits into lanes. W lanes change the Worker. S lanes change shared files and extract the rules. The C lane changes CI. N lanes build the native client. A lane that lands leaves this table, and git keeps its history.

**Holds while:** the lanes in this table have not landed.

Kind: build

Plan: docs/decisions/native-build-lanes.md#still-open (native)

## How every lane runs

- A Sonnet test-author works in its own worktree and lands the tests red.
- A Swift test must go red on an assertion failure, never on a compile error. The test-author adds a stub that returns a wrong value, see `testing-throwing-assert-bad-kill`.
- A Sonnet builder makes the tests green on the same branch.
- A fresh reviewer reads the lane.
- ST in the table means `swift test --package-path native/ManifestKit`.
- A lane that boots a simulator, or builds or runs tests for one, follows the simulator rules in `one-simulator-per-mac`.

## The lanes

| Lane | Files | Red-first tests | Done check | Deps |
|---|---|---|---|---|
| W2b, not briefed | Not briefed. No scope is recorded here. | Not yet briefed. | Not yet briefed. | Not yet briefed. |
| W3b Restore stamps new change times, blocked | Worker files, not yet briefed. | Not yet briefed. | Not yet briefed. | Blocked. Today a restore keeps the old receivedAt, so a later server reply can undo it. Mirror mode is unverified. |
| W3c, not briefed | Not briefed. No scope is recorded here. | Not yet briefed. | Not yet briefed. | Not yet briefed. |
| W3d, not briefed | Not briefed. No scope is recorded here. | Not yet briefed. | Not yet briefed. | Not yet briefed. |
| W3e, not briefed | Not briefed. No scope is recorded here. | Not yet briefed. | Not yet briefed. | Not yet briefed. |
| N11 Device check | none | The owner checks on a device. The build comes from the Mac install or TestFlight, see `native-ships-via-testflight`. The hand checks are named: VoiceOver order, Dynamic Type, the draft kept when the app leaves, and the iPhone Camera opening a `manifestledger://` QR code (see `native-key-via-url-scheme`). If the Camera fails the scheme, the universal-link fallback in that record is built. | the owner | all |
| C2 UI tests in CI, not built | The native job in `.github/workflows/test.yml` | Not yet briefed. The N5 UI test in `native/ManifestUITests/PackagesShellUITests.swift` already exists. | The native job runs the steps in `native-ci-on-hosted-macos` after ST, green on a hosted macOS runner, with a new timeout. | C1 (landed), N5 (landed) |

W2 and W3 come from the owner's rulings, not from the first plan. W2a and W3a have landed. Their tests are groups 12 and 13 in `worker/core.test.mjs`. W2b, W3b, W3c, W3d and W3e have no full brief, so their files, tests and done checks are not set.

## Order

- Batch 1: W1, S1, S2, S3 and S4 (all landed). W2a and W3a ran beside them and landed. S4 ran after S3, because each one rebuilds index.html.
- Batch 2: C1 and N1, after S4 (both landed).
- Batch 3: N2 and N3 (both landed).
- Batch 4: N5 (landed), beside N4a.
- Batch 5: N6, N7, N8, N4b and N9 (all landed) after N5 (landed).
- N10 waited for W2a, which landed in PR #77, because the owner ruled the Worker photo route first.

## N1 notes

- parse-items.json exclusion: `rules-run-in-javascriptcore`, its one home.

## N5 notes

- Orchestrator default, 2026-10-12: the app is iPhone-only (`TARGETED_DEVICE_FAMILY` 1), iOS 26.0, bundle id `dev.shivinate.manifest`, as `native-swift-rebuild` says.
- Orchestrator default, 2026-10-12: the Ledger tab icon is the gear (`gearshape`), see `phone-nav-is-bottom-bar`.
- Orchestrator default, 2026-10-12: the native 760pt UI case is removed. `PackagesShellUITests` runs at 375pt only. The web screens check keeps 760pt, see `screens-checked-headless-in-ci`.
- Orchestrator default, 2026-10-12: the check-in toggle (`toggleCount`) and the "N of M" clamp (`countLabel`) live in `src/view-rules.mjs`. `PackagesModel` calls them through `RulesEngine`.
- Orchestrator default, 2026-10-12: a key link that beats the engine waits in `PendingKeyLinks`. `ManifestApp` logs each outcome, with no key text.
- Orchestrator default, 2026-10-12: a failed check-in save rolls the store back in `commitReceived`. `PackagesModel` sets `checkInError`, and `PackagesView` shows it in an overlay.

## N8 notes

Orchestrator defaults of 2026-10-20, not owner rulings:

- The masthead sits on the Packages tab only. The web masthead sits above every view.
- Lane N8 puts only the Backup row on the Ledger tab, in the Data group, see `ledger-tab-holds-options`. Lane N9 adds History and Reset.
- `LedgerStore.backup()` exports the raw document as `save()` writes it, from memory. It writes nothing and does not move the generation. A store that is not loaded exports the file bytes as they are, so Backup has no data gate (`recovery-control-not-state-gated`). The app keeps the store before it loads it, so the Backup row works when the load throws.
- The file name is mailday-backup-YYYY-MM-DD.json, the web name, with the UTC date of the store's clock.
- The native backup holds no photos.
- The launch argument `-ManifestUITestSaveState idle|saving|saved|failed` holds the save slot on one state for a whole run, so a UI test measures every state without a failing disk.
- The count line has the Packages form only: `N packages · autosaves`. The web line also reads envelopes waiting and unique items by view, and adds "in range" under a date filter.

Builder defaults of 2026-10-20 and 2026-10-21, not owner rulings:

- A UI run with `-ManifestUITestSeed` draws the final letterhead frame, because the accessibility audit must not read a half-faded title. No UI test sees the compose.
- At an accessibility text size the three tally cells stack in one column. Otherwise they weigh 1 : 1 : 1.7, as `masthead-tallies-unequal-thirds` rules.
- After a check-in the save slot reads `saved ✓` until the next save, as the web slot does. A clock would be one more thing that moves.
- A failed `refresh()` after a check-in is not shown: `MastheadModel.finished` ignores it with `try?`. The slot reads `saved ✓` over the old figures. `native-masthead-stale-after-tabs` holds the related gap.
- `compact` moved from `src/app.jsx` to `src/view-rules.mjs`, so the web and the native masthead share one home, see `rules-run-in-javascriptcore`.
- The masthead paints with system styles.

Proof: BackupExportTests, MastheadModelTests and MastheadMotionTests run under ST. MastheadBackupUITests is the UI test, in `native/ManifestUITests/MastheadBackupUITests.swift`. Test V16 in `test/view-rules.test.mjs` pins `compact`.

## N10 notes

- The seam: `PhotoSync` moves blobs to and from the Worker `/photos` route through the `PhotoTransport` protocol (list, put, get). A 413 on put reaches `PhotoSync` as `tooLarge`. `HTTPPhotoTransport` (lane N4b) implements it, and nothing creates it yet.
- File names, the image type of a stored name and the push-pull plan come from the rules bundle (`photoName`, `photoIdFromName`, `mimeFromName`, `photoPlan`). Swift holds no copy, see `rules-run-in-javascriptcore`.
- Three constants are copies of `shrinkImage` in `src/app.jsx`: the 2000px long edge, JPEG quality 0.8, and the pass-through size under 800000 bytes. `PhotoCapture.newID` copies the id shape of `newPhotoId` there. A test checks that every new id passes `photoIdFromName`. No test ties the three constants to the web.
- The tests are the `Photo*` classes in `ManifestKitTests`, and ST runs them:
  - PhotoDownscaleTests pins the 2000px long edge, JPEG quality 0.8 (read from the quantization tables), EXIF orientation, the small-picture pass-through, and bytes that are no picture.
  - PhotoStoreTests pins the `photos` folder beside the ledger, the file names, and the three-valued held ids.
  - PhotoIdsTests pins the restore rule of `photo-ids-restore-keep-if-known`.
  - PhotoCaptureTests pins that a blob never enters ledger.json, the restamp, and the refusal that leaves no blob.
  - PhotoSyncTests runs `PhotoSync` against a fake transport. It pins the batch of 25, a 413 that does not block the next photo, and Stop.
  - PhotoViewerModelTests pins the modal state, and the focus that Escape and a tap return.
- The SwiftUI viewer traits and the Stop control have no test, see `native-photo-viewer-unpinned`.

## N4b notes

Test-author and builder defaults of 2026-10-22, not owner rulings:

- The launch argument `-ManifestUITestSyncStatus <http status>` runs the real `SyncClient` on an in-process stub that answers every request with that status and an empty body. The key is a made-up one held in memory. So the line a UI test sees was drawn by the client, and no flag sets the advisory. The element is `sync-advisory`, and its value is the advisory code, so no UI test depends on the wording.
- A launch with `-ManifestUITestSeed` and no `-ManifestUITestSyncStatus` builds no client, so the other UI tests stay off the network.
- The press gate re-checks every 250 ms, a Swift constant (`PressGate.recheckMs`).
- The Worker URL in `native/Manifest/ManifestApp.swift` is a second copy of `SYNC_URL` in `src/entry.jsx`. No reason for the copy is recorded, and the owner has not ruled on it.
- `SyncClient.init` sets the `LedgerStore.onLocalSave` hook that arms the POST timer, so a store has one sync client. If the engine cannot read `SYNC_POST_MS`, no timer runs. A fired timer POSTs with no `lacksRef` skip. All three are native-only choices, see `native-reply-waits-generation`.
- `SyncLine` holds the web wording minus " — tap to fix", a builder default for parity, see `native-reply-waits-generation`.
- Mutants of the test-author's oracle that stayed alive: a boolean accepted as a rev, a base URL with a path, and an unreadable photo store on `.sync`. Each is equivalent or unpinned by choice.

Proof: the N4b classes run under ST, and `SyncAdvisoryUITests` is the UI test, in `native/ManifestUITests/SyncAdvisoryUITests.swift`. The list is under Pinned by in `native-reply-waits-generation`.

## N7 notes

- Owner ruling, 2026-10-21 22:02 CDT ("Fix test and button"): the composer contrast audit was a bad test. The full audit failed the disabled Save at 9.37:1 and never audited the ready Save, which was black on blue at 2.99:1. The ready Save is now white on `Color.action` (7.03:1). The empty Save keeps the system disabled look and reports Disabled to VoiceOver. `OrphanedUITests` skips contrast issues on disabled elements only, as WCAG 1.4.3 exempts inactive components, and audits the ready state. The evidence is the 2026-10-21 contrast judge run.

## N9 notes

Builder defaults of 2026-10-22, not owner rulings:

- A version is two files in the `versions` folder, see `native-files-are-frozen`. `VersionStore.put` keeps the bytes as given and never parses them.
- After each put, `VersionStore` calls `prunePlan` in the rules bundle on the store's clock and removes the ids it lists. Swift holds no copy of the tiers (`retention-tiers-are-unioned`, `rules-run-in-javascriptcore`). A prune that throws does not fail the put.
- Native saves milestones only: `before reset`, `before restore` and `before sync`. It saves no recent version. It has no CSV import, so it saves no `before import` (`csv-import-stays-web`).
- The milestone comes first (`milestones-taken-before-risk`). If it cannot be saved, the operation changes nothing.
- `LedgerStore.adopt` saves `before sync` when the incoming ledger lowers or clears a card count, drops or tombstones a live envelope, or clears a stamp. A reply that only adds saves none. `adopt` does this on a loaded store only. The test is `LedgerStore.removes`, see debt `native-removal-rule-is-swift`.
- `LedgerStore.restore` refuses a version when the bytes are not a JSON object or `mailday` is present and not 1. A missing `mailday` passes, as a load does (`native-ledger-is-raw-json`). A refused version saves no milestone. The guard does not require an `items` array. The web `parseLedger` requires `mailday` and `items`, so `every-restore-passes-applybackup` does not describe native. After the guard, `restore` saves `before restore` and applies the bytes through `adoptRaw`, the path `adopt` takes after its milestone: the mend, the kept copy, the save and generation + 1.
- `LedgerStore.reset` saves `before reset`, then writes an empty ledger and bumps the generation. The versions stay. If the save fails, memory goes back to what it was.
- Reset, restore and the History list work on a ledger that will not open (`recovery-control-not-state-gated`). An unloaded store puts the file bytes, exactly as they are, in the milestone. The app creates the store and the version model before it loads the ledger.
- After a reset or restore moves the generation, `onLedgerChange` loads Packages, Tally, Orphaned and the masthead again.
- The ask arms in place, and at most one control is armed at a time. A first press arms. A second press on the same control performs it. Reset reads "Tap again to clear N cards" and Restore reads "Tap again to replace N cards", the web wording (`VersionNotice`). The Reset count is ledger cards plus live envelope cards. The Restore count is the ledger's cards only, so it keeps the question open in `history-restores-a-saved-version`. Cancel sits in a slot that is kept free all along, so a press moves nothing (`no-layout-shift-under-pointer`). Closing History or opening another row clears the ask. No native dialog appears (`no-native-dialogs`).
- An error shows under the pressed row: `version-error` under its version, `reset-error` under Reset. An unreadable list reads "The versions on this device could not be read.", never "No saved versions yet.".
- Test hooks in `ManifestApp.swift`: `-ManifestUITestSeed` empties the versions folder, and `-ManifestUITestCorruptVersion` puts one version with `mailday` 2 so that a restore fails.
- The History row is collapsed on every launch. One version row is open at a time.

Proof: VersionStoreTests, VersionMilestoneTests, VersionSyncTests and VersionsModelTests run under ST. VersionSyncTests drives `before sync` through the real `SyncClient`. VersionsUITests is the UI test, in `native/ManifestUITests/VersionsUITests.swift`. The test-author's red run is in the message of the commit that adds the tests.

## After N11

Owner ruling, 2026-10-22 19:55 CDT, on the first device check: fix the bugs first, then restyle the native app to the web app's look.

- The device check of 2026-10-22 19:50 CDT: the Camera opened `manifestledger://`, and the first pull filled Packages.
- N12, bugs. On the phone, Tally showed "Nothing to show" and Orphaned showed no envelopes, while the web held 4. The masthead read 616 packages and $75.13k where the web read 593 and $68.16k. The web leaves canceled orders out, see `canceled-orders-leave-the-list`.
- N13 and on, the restyle. Owner rulings, 2026-10-22 22:46 CDT: parchment always, with no dark variant, as on the web; and paint plus the web features native lacks. Fonts and spacing stay per client, outside `shared/tokens.json`. The lanes, in order:
  - N13, tokens and type (landed): Swift decodes `shared/tokens.json` at launch, Cochin and mono helpers, a light-only interface, the paper background.
  - N14, masthead paint (landed): the seal as Shapes, the gold rules, the ruled tally cells, the missing line, the progress bar.
  - N15, package card paint (landed): Cochin names, mono prices, square checkboxes, the "N left" pill, the underlined order-id link.
  - N16, the Orphaned tab badge and Orphaned colours by meaning (not landed until its audits pass; see `native-orphaned-colours-unbuilt`).
  - N17, Tally, Ledger and Sync paint.
  - N18, the masthead on every view. Closes `native-masthead-packages-only`.
  - N19, stamps: the Stamp button, the band, the editor, the tombstone.
  - N20, Mark all received.
  - N21, the ruled head cells, the floating search pill, and the Packages filters. Closes `native-filters-tally-only`.
  - N22, motion. Closes `native-compose-is-one-fade`.
- N13 notes. `Palette` in ManifestKit decodes the file (Foundation only). `Parchment` in `native/Manifest/Theme.swift` decodes the bundled copy once at launch and holds one `Color` accessor per token. `Font.cochin` and `Font.mono` (Menlo) use `Font.custom(_:size:relativeTo:)`, so Dynamic Type scales them. `UIUserInterfaceStyle: Light` sits in `project.yml`, and xcodegen writes it to Info.plist. Only the accent tint and the paper behind each tab (`parchmentPaper()`, one modifier) changed; a tab's scroll content covers a background set on the TabView. The photo viewer scrim reads the `scrim` token. The older colour literals in the views stay until N14 to N17 restyle them. `Palette` also reads `#RGB` and spaced `rgba()`. No test covers either form, and the token file uses neither. The token test names such a token loudly if one appears.
- N14 notes. `MastheadPaint` in ManifestKit holds every colour meaning of the masthead as a token name: type, rule, bar, seal layers and tally weights. So `swift test` pins them. The view only turns a name into a `Color` with `Parchment`. The seal is one `Shape` per layer of `MastheadPaint.seal`, on the web's 100 by 100 sheet. No test pins that the view calls `MastheadPaint`. Screenshots at 320 and 375 of the seeded ledger (0 of 14 cards, idle slot) show the seal outline, the gold rules, the ruled cells, the empty accent bar and the red missing line. No screenshot shows the green bar, "ALL ACCOUNTED FOR", the failed slot or a partly filled bar. Only the unit tests pin those colours. The masthead has one fixed seal size, 36pt, where the web clamps 36 to 52 by viewport width. That is 36 to 38 on every iPhone. The outstanding line takes its money from the bundle's `money`, so it rounds half up as the web does (`rules-run-in-javascriptcore`). `MastheadModel.refresh` sets every published field in one step after its last await, so a throw changes none of them. The progress element `masthead-progress` reads "N percent", rounded down. `MastheadModel.percent` is `got * 100 / total`.
- N15 notes. The pill, the detail line and the TCGplayer URL live in `src/view-rules.mjs` (`packagePill`, `itemDetail`, `tcgplayerOrderUrl`), and the web card calls them too. `gotQty` there is the got/qty text on both clients. `PackagesModel` stores `pills`, `bars`, `details` and `orderLinks`, and a check-in refreshes the one package. `load` builds every map first, then sets the rows and every map in one step, as `MastheadModel.refresh` does. `PackageCard.Status` picks the slot: RECEIVED once every line is in, the pill while copies are owed, else blank. The slot's accessibility value reads the same. A line with more than one copy has the web stepper under its detail line, − got/qty +. `PackagesModel.step` saves through `checkIn`, as the checkbox does. Each item row pads 12pt above and below, as the web row does. The seller and date are selectable; each has a rectangle content shape, so neither takes the other's long press. Which token each part of the card paints with is `PackageCard.token` in ManifestKit, with a unit test. The bar sits out of flow on the card's top edge, mounts only while some but not all copies are in, and the pill and the RECEIVED stamp share one slot. Not built, left to later lanes: the lost-mail flags and the tracked glyph on the date line, the stamp band, the collapse chevron, and the stamp landing and gild motion (N22). Orchestrator defaults of 2026-10-27, not owner rulings: the gap from the date line to the order id link is 30pt, not the web's 42px, because the web gap keeps the link clear of Chromium touch adjustment, which iOS does not have. Clear check-ins joins Mark all received in N20.
- N16 notes. `OrphanedPaint` in ManifestKit holds which token each Orphaned part paints, and `ControlPaint` holds the mini button and the manila advisory line that Orphaned and Tally both draw; each has a unit test. `OrphanedModel.badgeCount` is the live envelope count, and the Orphaned tab's `.badge` shows it and hides at 0. The iOS 26 glass tab bar honours a `UITabBarItemAppearance` badge colour, so the badge is the red token with card text (checked on a screenshot). `UITabBarItem.appearance().badgeColor` alone is ignored there. The tab symbol is plain `envelope`, so the tab does not draw two badges. The envelope card, composer and Undo notice paint from the tokens through `Parchment`, in Cochin and mono; the armed Discard still hangs below the header and moves nothing. The "armed check-in confirm" in `orphaned-colours-by-meaning` is stale: assign is one tap. The "untracked" tag on a candidate's meta line comes from the bundle's `isUntracked` through `OrphanedModel`. Not built: the label photo button, and a wrapping note placeholder (it truncates at 375pt). The composer's two text fields use the system font, not Cochin: a custom font on a vertical-axis field made the audit call its hit area too small.
- N14 to N17 touch separate files. They build in parallel after N13. Their simulator runs follow the rules in `one-simulator-per-mac`. CI runs only `swift test`. So each colour meaning lives in a ManifestKit function with a unit test. The accessibility audit and screenshots at 320 and 375 prove the paint.

## Risk

S2 and S3 (landed) changed `src/app.jsx`, the largest file in the repo. The sticky rows and the frozen sort must stay in the component, see `no-layout-shift-under-pointer`.

W2 accepts one risk. A POST with no `Content-Length` still reads the whole body before its 413, and the code does not cap that read. The client always sends one, so the read is accepted.

Other risks live in the record for their lane:

- `native-reply-waits-generation` holds the socket test limit.
- `native-key-via-url-scheme` holds the runner keychain.
- `native-swift-rebuild` holds the platform minimums.

## Still open

- The Ledger tab holds Backup, History and Reset. The View and Sync groups are not built, see `ledger-tab-holds-options`. Debt: `native-ledger-tab-unbuilt`.
- The native job runs ST only. Debt: `native-ui-tests-not-in-ci`.
- The key scan skips SwiftUI view state. Debt: `native-key-scan-skips-views`.
- The native masthead shows on Packages only. Debt: `native-masthead-packages-only`.
- The native letterhead composes in one fade. Debt: `native-compose-is-one-fade`.
- Native Backup holds no photos. Debt: `native-backup-has-no-photos`.
- No UI test taps Backup. Debt: `native-backup-ui-unpinned`.
- No test restores a native backup file on the web. Debt: `native-backup-web-restore-unrun`.
- The native sync glue in the app has no test. Debt: `native-sync-glue-unpinned`.
- No native screen shows the merge notice. Debt: `native-merge-notice-unbuilt`.
- Native photos and their HTTP transport are built and tested, and nothing calls them. Debts:
  - `native-photo-screens-unwired`;
  - `native-photo-ids-kept-uncalled`;
  - `native-merge-skips-photo-fetch`;
  - `native-photo-sweep-unbuilt`;
  - `native-photo-viewer-unpinned`.
- Lane N11, the owner's device check, has not run. Debt: `n11-device-check-not-run`.
- Native envelopes have no photos. Debt: `native-envelope-has-no-photos`.
- No test pins the native Discard arm. Debt: `native-discard-arm-unpinned`.
- A native restore keeps the old change times. Debt: `native-restore-keeps-old-times`.
- A Reset's effect on the Worker's copy is unmeasured. Debt: `reset-vs-worker-copy-unmeasured`.
- No test pins that a Reset, a restore or a removing reply needs its milestone. Debt: `native-milestone-needed-unpinned`.
- The native ask does not move first focus to Cancel. Debt: `native-ask-has-no-cancel-focus`.
- The test for a removing reply is Swift code. Debt: `native-removal-rule-is-swift`.
- No test pins the version file names. Debt: `native-version-names-unpinned`.

## See also

- `native-swift-rebuild` — the ruling and the reasons for the rebuild.
- `native-parity-table` — the scope of each feature.
- `native-ci-on-hosted-macos` — the job that lane C1 adds.
- `one-simulator-per-mac` — the simulator rules that every lane follows before it uses the simulator.
- `rules-run-in-javascriptcore` — why S2, S3 and N1 exist.
- `worker-keeps-snapshots` — the ruling behind lane W3.
- `native-ships-via-testflight` — how a native build reaches the phone for lane N11.
