# A native reply applies only to a ledger that has not changed

Kind: build

Plan: decisions/native-reply-waits-generation.md#the-client (native)

**Status:** ruled. The owner accepted this on 2026-10-11 with the plan, and ruled two details on 2026-10-21. Lane N4a built the HTTP half (`SyncClient`). Lane N4b builds the socket half. Some details are open, see Still open.

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
- A 401 sets `advisory` to `no-access` and stops all calls made with the key the Worker refused. The client keeps a digest of that key, never the key (`the-token-is-a-credential`). The owner ruled on 2026-10-21: "A newly saved key lifts the native 401 stop, as the web does (no relaunch)." A different key saved in the KeyStore lifts the stop, and so does a new client. Saving the same key again does not, see Still open. If the Worker refuses the new key too, the stop is back. The web lifts it in `src/app.jsx` ("a new key lifts a 401 stop").
- A 413 sets `advisory` to `too-big`, and the size line shows it. No screen shows it yet, see debt `native-sync-client-unwired`.
- A failure other than 400 and 401 schedules a retry, a POST, after `backoffMs(n)`, where n counts the failures so far. A retry that fails schedules the next. While a retry is pending, `push` sends nothing and `pull` still runs. A good POST clears it, and so does a good GET, except after a 413. A 400 schedules nothing.
- `stop()` cancels every call in flight and the pending retry. A stop is not a failure and sets no `advisory`.

Lane N4b builds these:

- The wiring: the app creates `SyncClient` and calls it, and a screen shows the 401 and 413 lines, see debt `native-sync-client-unwired`.
- PhotoTransport over HTTP and the PhotoIds.kept server-apply call. `SyncClient` calls `/ledger` only.

- The WebSocket uses URLSessionWebSocketTask with the protocols `mailaudit` and the key, as the Worker expects.
- A `{rev}` message greater than the held rev starts one GET. `SyncClient` keeps no rev yet.
- A reply from the other device waits while a press is in progress and for `PRESS_TAIL_MS` after it (`pressHeld`), see `auto-apply-happens-now`. The cold reply after a key save applies at once. The next reply waits again. An open Undo bar never holds a reply, as on the web: "it should just be able to apply anyways why does the undo bar being open have to matter" (owner, 2026-10-21 13:30 CDT).
- Resume: when scenePhase becomes active, the client reconnects the socket and does one GET.
- The owner ruled no background refresh in v1. A resume GET covers the need, see `native-swift-rebuild`.

The orchestrator assigned the wiring, the 401 and 413 lines, PhotoTransport and the PhotoIds.kept call to lane N4b on 2026-10-21. This is a process assignment, not an owner ruling.

## The merge notice

Lane W1 (PR #61) made the POST reply carry `stats` from `mergeLedger`. The client builds the merge notice from those stats, so it never runs the merge.
`SyncClient` reads only `ledger` from a reply today, so it drops `stats` and `rev`.

## Proof

- A stub URL protocol cannot stub a WebSocket. Lane N4b tests the message handler. The socket glue gets a live check only.
- Lane N4a's tests run `SyncClient` on a stub URL protocol, a fake Keychain and a sleep gate. No run has reached the live Worker, see debt `native-sync-live-unrun`.
- The lanes and their tests are in `native-build-lanes`.

**Pinned by:** `SyncWireTests`, `SyncReplyTests`, `SyncStatusTests` and `SyncTimingTests` in `native/ManifestKit/Tests/ManifestKitTests`. `testANewKeyLiftsTheStop` and `testTheNewKeyIsRefusedToo` in `SyncStatusTests` pin the 401 lift. `testStopCancelsAPendingRetry` in `SyncTimingTests` pins that `stop()` cancels a pending retry. No test pins the generation check in a pull alone, see debt `native-pull-generation-unpinned`.

## Still open

- The 2026-10-21 ruling says "as the web does". The web lifts the 401 stop on any key save, with no check for an unchanged key (`saveSyncKey` in `src/app.jsx`). `SyncClient` lifts it only for a different key, and no test pins the same-key case. The two differ.
- The wording of the native size line is not ruled. The web line is `syncSays` in `src/app.jsx`.
- Which module holds the wording of the native merge notice is not ruled. The wording is `mergeSummary` in `src/merge-rules.mjs`, and native never loads that file. The rules bundle must either carry the function or the Worker must send the text.

## See also

- `sync-revamp-cloudflare` — the Worker, its keys and its WebSocket.
- `rules-run-in-javascriptcore` — where the sync constants come from.
- `merge-readopts-sync-generation` — the web rule for a merge that finishes mid-sync.
