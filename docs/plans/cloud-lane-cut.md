# Cloud restart: one lane cut from every handoff

**Status:** open. The owner has not picked items 67, duo-ci-home or wave-1-lanes on the waiting page. No wave 1 lane has started.

The Mac team wound down on 2026-11-08 at 17:20 CST. The Mac lanes each left a handoff in a draft PR. The owner ruled (2026-11-08 17:57 CST) that the cloud restart compiles every handoff into one list and cuts new lanes from it, rather than restarting the Mac lanes as they were. This plan is that list and that cut.

Sources read: the bodies and comments of PRs 221 and 232-246, the transfer notes on PR 246, and branch `records-owner-1523` (62f9a6d). PRs 221 and 242 are merged. Plan `cloud-sessions` (on PR 246's branch) holds the restart order this cut serves.

## Open items

macOS means that the item needs GitHub's `xcode-27` macOS runner. The cloud VM is Ubuntu, so `swift test` and the UI tests run only in CI (decision `native-ci-on-hosted-macos`, on PR 246's branch).

| Item | Source | What remains | Kind | macOS | Review | Blocked on | Shares files with |
|---|---|---|---|---|---|---|---|
| duo-held-chip-code | PR 232 | code review round 1; design review of the built screen; debt status to the green commit | native UI | y | round 1 owed | duo-ci-path | HandScreen.swift (235, 236, 238) |
| duo-held-chip-tests | PR 233 | red run on the test branch alone; green with the chip code (6 Duo tests) | native UI | y | red run owed | duo-ci-path | DuoHandUITests.swift (235) |
| duo-held-box-design | PR 234 | merge as the design record that PR 232 cites | design | n | design pass | batch with 232 | none |
| duo-post-pins-run | PR 235 | 4 pins red at b034d26, green at 6d7bc95 on the Duo | native UI | y | round 1 owed | duo-ci-path; the chip lane | HandScreen.swift, DuoHandUITests.swift, debts notes |
| duo-open-env | PR 236 | nothing alone; lands with PR 238's find pill | native UI | y | none | PR 238 | HandScreen.swift |
| duo-gaps-mockup | PR 237 | design review of the 8-part mockup, then a builder | design | n | design review owed | none | none |
| duo-open-probes | PR 232 notes | stacked poses (item 28); fold mid-run test; keyboard gap (debt `duo-keyboard-gap-unmeasured`); flaky Tally and Discard timing | native UI | y | none | duo-ci-path | unknown |
| duo-ci-path | PR 246 notes A, B | a CI job that runs the Duo and 18 Pro UI classes on `xcode-27`, so five Duo debts can retire | CI | y | not started | page item duo-ci-home | a workflow file |
| restyle-step8-finish | PR 238 | 18 Pro runs (6 classes); Duo find pill (2 cases); step 8 design review; red-run cite and ruling for commit 5b4f3fa | native UI | y | round 2 pass; design review owed | duo-ci-path; coordinator ruling | 69 files, HandScreen.swift among them |
| armed-audit-run | PR 239 | 18 Pro runs of the PackageStamp and AuditSkipping UI tests with red runs; commit f5e138a has no red-run trailer | native UI | y | fix check pass | PR 238 (hard conflict) | both test files with 238 |
| restyle-tail | PR 238 body | step 9 motion; step 10 sync labels (item 36 b); sweep items 4, 11, 13-16, 18; items 59 a and 60 a | native UI | y | none | PR 238; step 9 before step 10 | unknown |
| merge-notice-r2 | PR 245 | round 2: stale notice when two adopts overlap, with an overlap test; pin a non-nil case or narrow debt `native-merge-notice-unbuilt` | native logic | y (CI native job) | round 1 FAIL; round 2 owed | none | SyncClient.swift, rules.js (238) |
| photo-fetch-order | PR 244 | red tests (fetch before apply; the syncing flag); mutant; builder; reviewer | native logic | y | none | merge-notice-r2 | SyncClient.swift |
| photo-sweep | PR 244 | PhotoSweeper tests, then a builder | native logic | y | none | photo-fetch-order; a grant for the ManifestApp caller | ManifestApp.swift (238) |
| photo-sync-wiring | PR 245 queue (item 59) | PhotoSync factory and the 2-line startSync call | native UI | y | none | photo-fetch-order | ManifestApp.swift (238) |
| ask-cancel-focus-pin | PR 245 queue (item 58) | VoiceOver focus to Cancel on arm; no focus code exists yet | native UI | y | none | PR 238 | LedgerTab.swift (238) |
| native-key-scan | PR 244 | SwiftUI `@State` key scan (debt `native-key-scan-skips-views`); `native-sync-glue-unpinned` | native | y | none | a named simulator lane | unknown |
| orders-ext-ui-tests | PR 243 step 1 | tests for the UI helpers in extension/core.mjs; the 72.13 mutant; fix check; design review; code review round 2 | extension | n | round 1 FAIL, fixed at 9e4facc, unreviewed | none | checks.yml, docs/todo.md |
| orders-live-run | PR 243 steps 3-5 | Worker deploy; mint the extension key; the owner's first run; then remove the cookie secret | Worker, extension | owner's Mac | n/a | the owner's go per act; orders-ext-ui-tests | worker/, extension/ |
| records-batch | PR 246; branch records-owner-1523; PR 221 todo lines | merge the records; todo line 7 is stale, line 8 is answered by PR 243 | records | n | none | page item 67 | docs/todo.md, docs/debts/notes.md |
| stamp-editor-pick | PR 240 | owner picks item 39 a or b, then a builder | native UI | y | none | page item 39 | none |
| head-cells-ref | PR 241 | reference only (owner ruled 47 a); close it | design | n | none | coordinator | none |
| ste-lint-pin | PRs 245, 246 | move the checks.yml pin from 422cbbd to 2ac382c | CI | n | none | PR 243 (same file) | checks.yml |

## The cut

Each lane is one cloud session. No two lanes in a wave share a file.

- **Wave 1, start together:** `duo-ci-path`, `orders-ext-ui-tests`, `duo-gaps-design-review`, `merge-notice-r2`. The batch runner runs `records-batch` beside them once item 67 allows it.
- **Wave 2, after wave 1 merges:** `duo-held-chip` (PRs 232, 233 and 234 as one batch); then `duo-post-pins`; `restyle-step8` (with PR 236) after the chip lane; `photo-fetch-order`; `ste-lint-pin` after PR 243; `orders-live-run`, which asks the owner before each act.
- **Wave 3, one serial lane after restyle-step8:** `restyle-tail`, holding armed-audit-run, ask-cancel-focus-pin, photo-sweep, photo-sync-wiring and steps 9-10.
- **Gated, no lane yet:** stamp-editor-pick, head-cells-ref, native-key-scan, duo-open-probes (after duo-ci-path), and the shared phone workflow in claude-settings (the owner pastes it).

## Handoff claims that did not hold

- PR 232's lint pin move is already on main. Only the 2ac382c bump is open.
- PR 245's adoptRaw hook and versions line are already on main.
- PR 238 says it leaves the Duo files alone, yet it changes native/Manifest/HandScreen.swift.
- PR 245 says item 58 is built. No focus code exists, so it stays open.

## Unknown

- PR 144's state.
- The paths of the PhotoSync factory, PhotoSweeper, and the stacked-poses and fold tests.
- The per-part picks in PR 237's notes.
- Whether the cookie secret from PR 243 is still set.
