# The native build runs in ordered lanes

**Status:** ruled. The owner accepted the plan on 2026-10-11 and ruled each open question in it. W1 landed in PR #61, S1 in PR #62, S2 in PR #63, and S3 in PR #64. S4 landed in PR #65. Their rows have left this table. No other lane has landed. W2a is built on draft PR #77. W3a is built on draft PR #78. Neither is merged. The rows below carry the 2026-10-11 changes and the 2026-10-12 orchestrator defaults. Unbuilt rows are ruled or named, and not built.

The native rebuild splits into lanes. W lanes change the Worker. S lanes change shared files and extract the rules. The C lane changes CI. N lanes build the native client. A lane that lands leaves this table, and git keeps its history.

**Holds while:** no lane in this table has landed, and the repo has no native folder.

## How every lane runs

- A Sonnet test-author works in its own worktree and lands the tests red.
- A Swift test must go red on an assertion failure, never on a compile error. The test-author adds a stub that returns a wrong value, see `testing-throwing-assert-bad-kill`.
- A Sonnet builder makes the tests green on the same branch.
- A fresh reviewer reads the lane.
- ST in the table means `swift test --package-path native/ManifestKit`.

## The lanes

| Lane | Files | Red-first tests | Done check | Deps |
|---|---|---|---|---|
| W2a Worker photo route, draft PR #77 | Worker files: worker/core.mjs, worker/index.mjs, worker/core.test.mjs. Branch worker/w2a-photos, not merged. | Group 12, cases 12.1 to 12.10. Red on the base with 21 assertion failures. Covers write-once bytes; the type from the name; a bad name 400; a photo over 1.9 MB refused 413 photo-too-large; no delete route, so 405; a photo POST writes no ledger, sends no broadcast and leaves rev alone; the device key; a missing id 404. The 1.9 MB cap and the no-delete route are orchestrator defaults of 2026-10-12. | The node test `node worker/core.test.mjs` passes on the branch. Nothing runs the Durable Object adapter, so its SQLite calls are unproven on Cloudflare. | none |
| W2b, not briefed | Not briefed. No scope is recorded here. | Not yet briefed. | Not yet briefed. | Not yet briefed. |
| W3a Worker daily snapshots on draft PR #78 | Worker files: worker/core.mjs, worker/index.mjs, worker/core.test.mjs. Branch worker/w3a-snapshots, not merged. | Group 13, cases 13.1 to 13.9. One snapshot per UTC day, before its first changing write. A no-op, a 413, a 400 and a first POST take no snapshot. The list and get routes need the key. GET /health needs no key and replies only with the last write time. The window keeps exactly 180 snapshots: today and the 179 days before it. | `npm run test:worker`: 312 passed, 0 failed. Not merged. | none |
| W3b Restore stamps new change times, blocked | Worker files, not yet briefed. | Not yet briefed. | Not yet briefed. | Blocked. Today a restore keeps the old receivedAt, so a later server reply can undo it. Mirror mode is unverified. |
| W3c, not briefed | Not briefed. No scope is recorded here. | Not yet briefed. | Not yet briefed. | Not yet briefed. |
| W3d, not briefed | Not briefed. No scope is recorded here. | Not yet briefed. | Not yet briefed. | Not yet briefed. |
| W3e, not briefed | Not briefed. No scope is recorded here. | Not yet briefed. | Not yet briefed. | Not yet briefed. |
| C1 Native CI job | .github/workflows/test.yml | Proof: the job goes red on a broken Swift test in a PR. | The PR's native job is green. It becomes a required check after its first green run, gated by a scope job and a nightly run. Its timeout is set from that run. The draft guard follows `ci-skips-draft-prs`. | S4 (landed) |
| N1 Project and rules bridge | native/project.yml, native/ManifestKit (Package.swift, the rules engine), build.mjs | The rules engine output equals each golden file. `check:rules` goes red on a stale bundle. | ST and `npm run check:rules`. Its PR also sets `rules-run-in-javascriptcore` back to present tense. | S4 (landed) |
| N2 Key store and intake | the key store, the URL handler, scripts/send-key.mjs, test/send-key.test.mjs | The accessibility class. `hasKey` is a Bool. A bad key is refused. The key is absent from the ledger, the backup and the model (a Mirror scan). The `--native` URL. | ST and `npm run test:send-key` | N1 |
| N3 Ledger store | the ledger store, the JSON value type | An unknown field round-trips. An un-check writes `receivedAt` and drops `received`. A stamp removal writes `kind:""`. A discard writes a tombstone. Each edit bumps the generation. A load sets defaults. | ST | N1 |
| N4a Sync over HTTP | the sync client, a stub URL protocol | The Bearer header. The `{ledger}` body. The generation rule. A 401 stops calls. The 413 line. A 404 seeds by POST. A timeout reads as unknown. Backoff. Stop cancels an in-flight push or pull. | ST | N2, N3, W1 (landed), the stage 4b switch |
| N4b Socket, idle gate, resume | the sync client socket | A rev that is not newer gives no GET. A newer rev with a changed ledger POSTs. The idle gate is 10 seconds. A cold reply applies at once after a key save. Resume does one GET. | ST | N4a |
| N5 Shell and Packages | native/Manifest (App, Packages), native/ManifestUITests | Rows equal the golden files. A check-in calls the ledger store. UI test: other row frames do not move on a check-in, at 375pt and 760pt. performAccessibilityAudit on each screen. A 44pt hit region on each tab and on the rows. Phone navigation is the system tab bar with four tabs, per `phone-nav-is-bottom-bar`. The Ledger tab holds the options, per `ledger-tab-holds-options`. Ruled, not built. | ST and `xcodebuild test -scheme Manifest -destination 'platform=iOS Simulator,name=iPhone 17'` | N3 |
| N6 Tally and filters | Tally and Filters views | Sort keys. Search and hide-received do not change Tally counts. The copies list. performAccessibilityAudit. The sort label does not truncate at 375pt. An empty search shows one Clear control. | same as N5 | N5 |
| N7 Orphaned | Orphaned views | One input records an envelope. No auto-assign. A tie has no emphasis. A partial-quantity assign. Undo removes only its delta. performAccessibilityAudit. Assign has Undo and no arm. The composer draft survives a view change. The empty state is one sentence. | same as N5 | N5 |
| N8 Masthead and backup | Masthead views, the backup file code | The export bytes equal the snapshot. No key in the export. Reduced motion shows the final frame. The save slot has a fixed width. performAccessibilityAudit. Backup is a 44pt control. | same as N5 | N5 |
| N9 Milestones | the versions code | A milestone is saved before a reset and before an apply that removes something. The prune equals `keptIds`. The list shows each milestone, and a restore takes a milestone first and passes the same apply path. Errors show in the pressed row. The reset ask names its count and has Cancel. | ST | N4a |
| N10 Photos | Photos views | A downscale to 2000px. A photo blob never enters the ledger. The viewer is modal, with Escape and focus return. The photo upload has Stop. | ST | W2a |
| N11 Device check | none | The owner checks on a device. The ios-adblock phone-apps list gets the new entry. The hand checks are named: VoiceOver order, Dynamic Type, and the draft kept when the app leaves. | the owner | all |

W2 and W3 come from the owner's rulings, not from the first plan. W2a and W3a have their briefs in the table. W2b, W3b, W3c, W3d and W3e have no full brief, so their files, tests and done checks are not set.

## Order

- Batch 1: W1, S1, S2, S3 and S4 (all landed). W2a and W3a ran beside them and are built on draft PRs. S4 ran after S3, because each one rebuilds index.html.
- Batch 2: C1 and N1, after S4 (landed).
- Batch 3: N2 and N3.
- Batch 4: N5, beside N4a.
- Batch 5: N6, N7 and N8 after N5, with N4b and N9.
- N4a waits for the stage 4b switch, see `sync-revamp-cloudflare`.
- N10 waits for W2a, because the owner ruled the Worker photo route first.

## Risk

S2 and S3 (landed) changed `src/app.jsx`, the largest file in the repo. The sticky rows and the frozen sort must stay in the component, see `no-layout-shift-under-pointer`.

Other risks live in the record for their lane:

- `native-reply-waits-generation` holds the socket test limit.
- `native-key-via-url-scheme` holds the runner keychain.
- `native-swift-rebuild` holds the empty start of a new app.

## See also

- `native-swift-rebuild` — the ruling and the reasons for the rebuild.
- `native-parity-table` — the scope of each feature.
- `native-ci-on-hosted-macos` — the job that lane C1 adds.
- `rules-run-in-javascriptcore` — why S2, S3 and N1 exist.
- `worker-keeps-snapshots` — the ruling behind lane W3.
