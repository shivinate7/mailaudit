# The native build runs in ordered lanes

**Status:** ruled. The owner accepted the plan on 2026-10-11 and ruled each open question in it. W1 landed in PR #61 and S1 in PR #62. S2 landed in PR #63, S3 in PR #64 and S4 in PR #65. N1 landed in PR #75, C1 in PR #76, W2a in PR #77 and W3a in PR #79. N2 landed in PR #81, N3 in PR #80 and N5 in PR #82. N4a landed on branch `native/n4a-sync`, N4b on branch `native/n4b-socket`, N10 on branch `native/n10-photos`, N6 on branch `native/n6-tally`, N7 on branch `native/n7-orphaned` and N8 on branch `native/n8-masthead`. Their PR numbers are claimed at merge. Their rows have left this table. No other lane has landed. The rows below carry the 2026-10-11 changes. The 2026-10-12 N5 defaults sit in N5 notes below, and the N8 defaults sit in N8 notes. The rows are ruled or named, and not built.

The native rebuild splits into lanes. W lanes change the Worker. S lanes change shared files and extract the rules. The C lane changes CI. N lanes build the native client. A lane that lands leaves this table, and git keeps its history.

**Holds while:** the lanes in this table have not landed.

Kind: build

Plan: decisions/native-build-lanes.md#still-open (native)

## How every lane runs

- A Sonnet test-author works in its own worktree and lands the tests red.
- A Swift test must go red on an assertion failure, never on a compile error. The test-author adds a stub that returns a wrong value, see `testing-throwing-assert-bad-kill`.
- A Sonnet builder makes the tests green on the same branch.
- A fresh reviewer reads the lane.
- ST in the table means `swift test --package-path native/ManifestKit`.
- A lane that boots a simulator, or builds or runs tests for one, takes the lock in `one-simulator-per-mac`.

## The lanes

| Lane | Files | Red-first tests | Done check | Deps |
|---|---|---|---|---|
| W2b, not briefed | Not briefed. No scope is recorded here. | Not yet briefed. | Not yet briefed. | Not yet briefed. |
| W3b Restore stamps new change times, blocked | Worker files, not yet briefed. | Not yet briefed. | Not yet briefed. | Blocked. Today a restore keeps the old receivedAt, so a later server reply can undo it. Mirror mode is unverified. |
| W3c, not briefed | Not briefed. No scope is recorded here. | Not yet briefed. | Not yet briefed. | Not yet briefed. |
| W3d, not briefed | Not briefed. No scope is recorded here. | Not yet briefed. | Not yet briefed. | Not yet briefed. |
| W3e, not briefed | Not briefed. No scope is recorded here. | Not yet briefed. | Not yet briefed. | Not yet briefed. |
| N9 Milestones | the versions code | A milestone is saved before a reset and before an apply that removes something. The prune equals `keptIds`. The list shows each milestone, and a restore takes a milestone first and passes the same apply path. Errors show in the pressed row. The reset ask names its count and has Cancel. | ST | N4a |
| N11 Device check | none | The owner checks on a device. The build comes from TestFlight, see `native-ships-via-testflight`. The hand checks are named: VoiceOver order, Dynamic Type, the draft kept when the app leaves, and the iPhone Camera opening a `manifestledger://` QR code (see `native-key-via-url-scheme`). If the Camera fails the scheme, the universal-link fallback in that record is built. | the owner | all, and the TestFlight app record (`testflight-app-record-missing`) |
| C2 UI tests in CI, not built | The native job in `.github/workflows/test.yml` | Not yet briefed. The N5 UI test in `native/ManifestUITests/PackagesShellUITests.swift` already exists. | The native job runs the steps in `native-ci-on-hosted-macos` after ST, green on a hosted macOS runner, with a new timeout. | C1 (landed), N5 (landed) |

W2 and W3 come from the owner's rulings, not from the first plan. W2a and W3a have landed. Their tests are groups 12 and 13 in `worker/core.test.mjs`. W2b, W3b, W3c, W3d and W3e have no full brief, so their files, tests and done checks are not set.

## Order

- Batch 1: W1, S1, S2, S3 and S4 (all landed). W2a and W3a ran beside them and landed. S4 ran after S3, because each one rebuilds index.html.
- Batch 2: C1 and N1, after S4 (both landed).
- Batch 3: N2 and N3 (both landed).
- Batch 4: N5 (landed), beside N4a.
- Batch 5: N6, N7, N8 and N4b (all landed) after N5 (landed), with N9.
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
- The Ledger tab gets the Backup row in the Data group, and nothing else, see `ledger-tab-holds-options`.
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
- `SyncLine` holds the web wording minus " — tap to fix", a builder default for parity, see `native-reply-waits-generation`.
- Mutants of the test-author's oracle that stayed alive: a boolean accepted as a rev, a base URL with a path, and an unreadable photo store on `.sync`. Each is equivalent or unpinned by choice.

Proof: the N4b classes run under ST, and `SyncAdvisoryUITests` is the UI test, in `native/ManifestUITests/SyncAdvisoryUITests.swift`. The list is under Pinned by in `native-reply-waits-generation`.

## N7 notes

- Owner ruling, 2026-10-21 22:02 CDT ("Fix test and button"): the composer contrast audit was a bad test. The full audit failed the disabled Save at 9.37:1 and never audited the ready Save, which was black on blue at 2.99:1. The ready Save is now white on `Color.action` (7.03:1). The empty Save keeps the system disabled look and reports Disabled to VoiceOver. `OrphanedUITests` skips contrast issues on disabled elements only, as WCAG 1.4.3 exempts inactive components, and audits the ready state. The evidence is the 2026-10-21 contrast judge run.

## Risk

S2 and S3 (landed) changed `src/app.jsx`, the largest file in the repo. The sticky rows and the frozen sort must stay in the component, see `no-layout-shift-under-pointer`.

W2 accepts one risk. A POST with no `Content-Length` still reads the whole body before its 413, and the code does not cap that read. The client always sends one, so the read is accepted.

Other risks live in the record for their lane:

- `native-reply-waits-generation` holds the socket test limit.
- `native-key-via-url-scheme` holds the runner keychain.
- `native-swift-rebuild` holds the platform minimums.

## Still open

- The Ledger tab holds the Backup row only, see `ledger-tab-holds-options`. Debt: `native-ledger-tab-unbuilt`.
- The native job runs ST only. Debt: `native-ui-tests-not-in-ci`.
- The key scan skips SwiftUI view state. Debt: `native-key-scan-skips-views`.
- The native masthead shows on Packages only. Debt: `native-masthead-packages-only`.
- The native masthead uses system styles. Debt: `native-masthead-system-style`.
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
- The native Orphaned view uses system colours. Debt: `native-orphaned-colours-unbuilt`.
- No test pins the native Discard arm. Debt: `native-discard-arm-unpinned`.

## See also

- `native-swift-rebuild` — the ruling and the reasons for the rebuild.
- `native-parity-table` — the scope of each feature.
- `native-ci-on-hosted-macos` — the job that lane C1 adds.
- `one-simulator-per-mac` — the lock that every lane takes before it uses the simulator.
- `rules-run-in-javascriptcore` — why S2, S3 and N1 exist.
- `worker-keeps-snapshots` — the ruling behind lane W3.
- `native-ships-via-testflight` — how a native build reaches the phone for lane N11.
