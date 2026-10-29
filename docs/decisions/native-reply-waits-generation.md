# A native reply applies only to a ledger that has not changed

Kind: build

Plan: docs/decisions/native-reply-waits-generation.md#the-client (native)

**Status:** ruled. The owner accepted this on 2026-10-11 with the plan, and ruled two details on 2026-10-21. Lane N4a built the HTTP half (`SyncClient`). Lane N4b built the socket half, the press gate, resume, the POST timer, the wiring and the 401 and 413 lines. Some details are open, see Still open.

The native sync client applies a Worker reply only if the local ledger did not change since the request left. If the ledger changed, the client POSTs again. This removes the in-flight race with no local merge. The merge stays on the Worker.

**Holds while:** the Worker merges and answers a POST with the ledger, the rev and `stats` (lane W1, PR #61), and no native code merges.

## The client

Lane N4a built these in `SyncClient`.

- `GET /ledger` and `POST /ledger` with the body `{ledger}` both send `Authorization: Bearer`. The client reads the key from the KeyStore when it makes each request. The key never sits in a URL or a body.
- The ledger in the body carries `mailday: 1`, and the Worker answers 400 without it (`worker/core.mjs`). The client sends no `mailday` header.
- A GET reply is adopted only if the ledger did not change since the request left, and no check-in, stamp or envelope waits that an adopted reply has not carried (`imports-merge-never-replace`). Otherwise the client drops the reply and POSTs, and the Worker's merge answers. A fresh start counts everything the file holds as not carried yet. The owner ruled on 2026-10-21 to keep this rule: "a GET reply never replaces a check-in, envelope or stamp no adopted reply has carried; on a fresh start everything the file holds counts as unsent, so the first pull POSTs it".
- A 404 `empty` with a check-in, stamp or envelope in the ledger seeds by POST. A 404 with only lines sends nothing more.
- A reply goes through the mend and the kept copy that a load does, then the store saves (`native-ledger-is-raw-json`).
- `syncStatus` in the rules bundle maps each status. A call times out after `SYNC_TIMEOUT_MS` and reads as unknown, as does a 200 with no readable ledger.
- A 401 sets `advisory` to `no-access` and stops all calls made with the key the Worker refused. The client keeps a digest of that key, never the key (`the-token-is-a-credential`). The owner ruled on 2026-10-21: "A newly saved key lifts the native 401 stop, as the web does (no relaunch)." `keySaved()` lifts the stop on every key save, the same key included, as the web's `saveSyncKey` in `src/app.jsx` does ("a new key lifts a 401 stop"). The brief of lane N4b (2026-10-22) carries the same-key lift as a ruling read from the owner's "as the web does". The owner's own words for the same-key case are not recorded here. A different key in the KeyStore lifts the stop with no call, and so does a new client. If the Worker refuses the key again, the stop is back.
- A 413 sets `advisory` to `too-big`, and the size line shows it.
- A failure other than 400 and 401 schedules a retry, a POST, after `backoffMs(n)`, where n counts the failures so far. A retry that fails schedules the next. While a retry is pending, `push` sends nothing and `pull` still runs. A good POST clears it, and so does a good GET, except after a 413. A 400 schedules nothing.
- `stop()` cancels every call in flight and the pending retry. A stop is not a failure and sets no `advisory`.

Lane N4b built these:

- The wiring: `ManifestApp` builds `SyncClient` with the Worker URL, the Keychain `KeyStore`, `URLSessionSyncSocket`, a `PressGate` and a `PhotoStore`. At boot it connects the socket and pulls. When a reply is adopted, the app reloads the Packages, Tally and Orphaned models and the masthead. A launch with `-ManifestUITestSeed` and no `-ManifestUITestSyncStatus` builds no client, so a UI test stays off the network.
- The 401 and 413 lines: `SyncAdvisoryLine` draws one line on Packages, Tally and Orphaned, and not on the Ledger tab (`ruled-head-one-advisory-entrance`). The line is a button: a tap calls `RootView.showSync`, which shows the Ledger tab with the Sync panel open and History closed. Its accessibility value is the advisory code. Its wording is the web's `syncSays` copy for the two cases (`src/app.jsx`), " — tap to fix" included. `SyncLine` holds it. No test taps the line, see debt `native-sync-glue-unpinned`.
- The WebSocket: `URLSessionSyncSocket` connects to `/ws` over `wss` with the protocols `mailaudit` and the key. The client reads the key at each connection. When a connection ends, it waits `backoffMs(n)` and connects again, where n counts the connections that ended since the last one that opened. No key, a 401 stop or `stop()` ends the loop.
- The rev: only a frame `{"rev": <integer>}` counts. `isNewRev` in the bundle decides. A rev that is not newer gives no GET, and a newer rev starts one GET. A newer rev with a changed ledger POSTs, because the generation check finds the edit. A rev heard while a call is out is remembered, and one GET follows that call if its reply is older. The held rev is the newest rev of an adopted reply and never moves back. A reply dropped for an edit does not move it, so its change is fetched later.
- The press gate: `PressGate` asks `pressHeld` in the rules bundle. A reply waits while a press is down and for `PRESS_TAIL_MS` after it, see `auto-apply-happens-now`. The wait comes before the generation check, so a tap during the hold is found by the check and the client POSTs again. `stop()` ends a hold with no apply. The cold reply after a key save applies at once, because `keySaved()` skips the wait. The next reply waits again. An open Undo bar never holds a reply, as on the web: "it should just be able to apply anyways why does the undo bar being open have to matter" (owner, 2026-10-21 13:30 CDT). Nothing in the client reads the Undo bar.
- The POST timer: a local save arms one timer of `SYNC_POST_MS`, and when it fires the client POSTs the ledger as it stands, as the web does (`sync-runs-itself`). The goal, as the lane brief of 2026-10-22 gives it, is a check-in on the phone that shows on the Mac within seconds. Without the timer, a local check-in uploaded only on the next foreground, a `{rev}` frame or a key save.
  - `SyncClient.init` sets `LedgerStore.onLocalSave`, so no call arms the timer and the app cannot forget to.
  - The hook runs after `commitReceived`, `commit(_:)` and `commitPhoto` save: a check-in, an envelope edit (`OrphanedModel` writes add, edit, assign, undo and discard through `commit(_:)`) and a photo. A restore and a reset run it too, from `restore()` and `reset()` in `Versions.swift`. A load and an adopted reply do not run it, or the reply to each POST would arm the next POST.
  - `setStamp`, `removeStamp` and `discardEnvelope` change memory only, and no app code writes a stamp yet. A stamp write must save through `commit(_:)` to arm the timer. A direct call of `save()` would not arm it, and no code outside `LedgerStore` makes one today.
  - The delay is `SYNC_POST_MS` read from the rules bundle, never a Swift copy. If the engine cannot read it, no timer runs, and the next foreground, `{rev}` frame or key save uploads.
  - The timer arms once per burst. A save while it waits does not move it, and the one POST carries the latest ledger. A fire leaves the timer free, so the next save arms a new one.
  - With no key, a fired timer sends nothing. The check-in rides the next POST that has a key (the N4a rule).
  - While a retry is pending, a fired timer sends nothing, because `push` sends nothing then. The retry's POST carries the save, after `backoffMs(n)`, up to 60 s. No test drives the timer into a pending retry.
  - `stop()` cancels a pending timer. A stop is not a failure.
  - The web skips a fire when the Worker's last ledger already holds everything the device holds (`lacksRef` in `src/app.jsx`). Native has no such check, so a fire POSTs even when the Worker holds the change already.
- Resume: when scenePhase becomes active, `resume()` reconnects the socket and does one GET, whatever rev is held. The hello that follows gives no second GET.
- The server apply: `SyncClient` passes the photo ids of every envelope in a reply through `PhotoIds.kept` with `.sync`, using the ids `PhotoStore` holds. On `.sync` the rule keeps every id, so the call changes nothing today, and no test can fail if it is removed. The restore half is lane N9's, see debt `native-photo-ids-kept-uncalled`.
- `HTTPPhotoTransport` lists, puts and gets photos on the Worker `/photos` route, as the web does. The type of a photo comes from `mimeFromName`. A 413 on put is `tooLarge`, and a list the Worker could not give is nil. Nothing creates it yet, see debt `native-photo-screens-unwired`.
- The owner ruled no background refresh in v1. A resume GET covers the need, see `native-swift-rebuild`.

The wiring, the 401 and 413 lines, PhotoTransport and the PhotoIds.kept call came to lane N4b by orchestrator assignment on 2026-10-21. This is a process assignment, not an owner ruling.

## The merge notice

Lane W1 (PR #61) made the POST reply carry `stats` from `mergeLedger`. The client builds the merge notice from those stats, so it never runs the merge.
`SyncClient` keeps the `rev` and `stats` of the last adopted reply, and `stats` is nil when a reply carries none. No screen builds the notice, see debt `native-merge-notice-unbuilt`.

## Proof

- A stub URL protocol cannot stub a WebSocket. The N4b tests run `SyncClient` on a fake `SyncSocket` and feed it frames. `URLSessionSyncSocket` gets a live check only, see `native-sync-live-unrun`. `PressWatcher` and the calls in `ManifestApp` have no test, see `native-sync-glue-unpinned`.
- Lane N4a's tests run `SyncClient` on a stub URL protocol, a fake Keychain and a sleep gate. No run has reached the live Worker, see debt `native-sync-live-unrun`.
- The lanes and their tests are in `native-build-lanes`.

**Pinned by:** `SyncWireTests`, `SyncReplyTests`, `SyncStatusTests` and `SyncTimingTests` in `native/ManifestKit/Tests/ManifestKitTests`. `testANewKeyLiftsTheStop` and `testTheNewKeyIsRefusedToo` in `SyncStatusTests` pin the 401 lift. `testStopCancelsAPendingRetry` in `SyncTimingTests` pins that `stop()` cancels a pending retry. No test pins the generation check in a pull alone, see debt `native-pull-generation-unpinned`. Lane N4b adds `SyncRevTests`, `SyncPressHoldTests`, `SyncKeySaveTests`, `SyncSocketTests`, `PressGateTests`, `HTTPPhotoTransportTests`, `SyncLineTests` and `SyncApplyKeepsTests` in the same folder, and `SyncAdvisoryUITests` in `native/ManifestUITests`. `testSavingTheSameKeyAgainLiftsTheStop` in `SyncKeySaveTests` pins the same-key lift. `SyncPostTimerTests` pins the timer: one timer with the bundle delay, one POST per burst, a new timer after a fire, none for an adopted reply, none sent with no key, `stop()` cancelling it, each local writer arming it, and a restore and a reset arming it while a server apply arms nothing. It runs time through the sleep gate, so it cannot show a real 3 s gap. `SyncApplyKeepsTests` pins what a server reply keeps and that an open Undo bar holds nothing. It cannot pin the `.sync` call, which is the identity.

## Still open

- The owner has not ruled the wording of the 401 line and the 413 line. `SyncLine` holds the web's `syncSays` copy whole, " — tap to fix" included, because the line opens the Sync panel. `SyncLineTests` pins that each failure has its own line, that no other code has one, and that neither line names GitHub. It does not pin the prose.
- Native `restore` and `reset` run `onLocalSave`, so each arms the POST timer and the restored or empty ledger reaches the Worker after `SYNC_POST_MS`, as the web's restore does (`a-restore-is-not-local`). The call sits in `restore` and `reset`, not in `adoptRaw` or `save`, because a server apply and a load use those and must not arm it. This rests on the batch review of 2026-10-22, not on an owner ruling. `SyncPostTimerTests` pins the restore, the reset and the server apply.
- Which module holds the wording of the native merge notice is not ruled. The wording is `mergeSummary` in `src/merge-rules.mjs`, and native never loads that file. The rules bundle must either carry the function or the Worker must send the text. Debt: `native-merge-notice-unbuilt`.

## See also

- `sync-revamp-cloudflare` — the Worker, its keys and its WebSocket.
- `rules-run-in-javascriptcore` — where the sync constants come from.
- `merge-readopts-sync-generation` — the web rule for a merge that finishes mid-sync.
