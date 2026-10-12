# The native build runs in ordered lanes

**Status:** ruled. The owner accepted the plan on 2026-10-11 and ruled each open question in it. W1 landed in PR #61, S1 in PR #62, S2 in PR #63, and S3 in PR #64. S4 landed in PR #65. Their rows have left this table. No other lane has landed.

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
| W2 Worker photo route | Worker files, not yet briefed | Not yet briefed. | Not yet briefed. | none |
| W3 Worker daily snapshots | Worker files, not yet briefed | Not yet briefed. | Not yet briefed. | none |
| C1 Native CI job | .github/workflows/test.yml | Proof: the job goes red on a broken Swift test in a PR. | The PR's native job is green. | S4 (landed) |
| N1 Project and rules bridge | native/project.yml, native/ManifestKit (Package.swift, the rules engine), build.mjs | The rules engine output equals each golden file. `check:rules` goes red on a stale bundle. | ST and `npm run check:rules` | S4 (landed) |
| N2 Key store and intake | the key store, the URL handler, scripts/send-key.mjs, test/send-key.test.mjs | The accessibility class. `hasKey` is a Bool. A bad key is refused. The key is absent from the ledger, the backup and the model (a Mirror scan). The `--native` URL. | ST and `npm run test:send-key` | N1 |
| N3 Ledger store | the ledger store, the JSON value type | An unknown field round-trips. An un-check writes `receivedAt` and drops `received`. A stamp removal writes `kind:""`. A discard writes a tombstone. Each edit bumps the generation. A load sets defaults. | ST | N1 |
| N4a Sync over HTTP | the sync client, a stub URL protocol | The Bearer header. The `{ledger}` body. The generation rule. A 401 stops calls. The 413 line. A 404 seeds by POST. A timeout reads as unknown. Backoff. | ST | N2, N3, W1 (landed), the stage 4b switch |
| N4b Socket, idle gate, resume | the sync client socket | A rev that is not newer gives no GET. A newer rev with a changed ledger POSTs. The idle gate is 10 seconds. A cold reply applies at once after a key save. Resume does one GET. | ST | N4a |
| N5 Shell and Packages | native/Manifest (App, Packages), native/ManifestUITests | Rows equal the golden files. A check-in calls the ledger store. UI test: other row frames do not move on a check-in, at 375pt and 760pt. | ST and `xcodebuild test -scheme Manifest -destination 'platform=iOS Simulator,name=iPhone 17'` | N3 |
| N6 Tally and filters | Tally and Filters views | Sort keys. Search and hide-received do not change Tally counts. The copies list. | same as N5 | N5 |
| N7 Orphaned | Orphaned views | One input records an envelope. No auto-assign. A tie has no emphasis. A partial-quantity assign. Undo removes only its delta. | same as N5 | N5 |
| N8 Masthead and backup | Masthead views, the backup file code | The export bytes equal the snapshot. No key in the export. Reduced motion shows the final frame. The save slot has a fixed width. | same as N5 | N5 |
| N9 Milestones | the versions code | A milestone is saved before a reset and before an apply that removes something. The prune equals `keptIds`. The list shows each milestone, and a restore takes a milestone first and passes the same apply path. | ST | N4a |
| N10 Photos | Photos views | A downscale to 2000px. A photo blob never enters the ledger. | ST | W2 |
| N11 Device check | none | The owner checks on a device. The ios-adblock phone-apps list gets the new entry. | the owner | all |

W2 and W3 come from the owner's rulings, not from the first plan. Their files, tests and done checks wait for their briefs.

## Order

- Batch 1: W1, S1, S2, S3 and S4 (all landed), with W2 and W3 free to start. S4 ran after S3, because each one rebuilds index.html.
- Batch 2: C1 and N1, after S4 (landed).
- Batch 3: N2 and N3.
- Batch 4: N5, beside N4a.
- Batch 5: N6, N7 and N8 after N5, with N4b and N9.
- N4a waits for the stage 4b switch, see `sync-revamp-cloudflare`.
- N10 waits for W2, because the owner ruled the Worker photo route first.

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
