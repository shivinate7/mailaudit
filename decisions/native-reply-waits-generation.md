# A native reply applies only to a ledger that has not changed

**Status:** ruled. The owner accepted this on 2026-10-11 with the plan. Lane N4a built the HTTP half (`SyncClient`). Lane N4b builds the socket half. One detail is open, see Still open.

The native sync client applies a Worker reply only if the local ledger did not change since the request left. If the ledger changed, the client POSTs again. This removes the in-flight race with no local merge. The merge stays on the Worker.

**Holds while:** the Worker answers a POST with only the ledger and the rev, and the native sync client does not exist.

## The client

- `GET /ledger` and `POST /ledger` with the body `{ledger}` both send `Authorization: Bearer`. The client also sends `mailday:1`, because the Worker requires it.
- The WebSocket uses URLSessionWebSocketTask with the protocols `mailaudit` and the key, as the Worker expects.
- A `{rev}` message greater than the held rev starts one GET.
- A 404 `empty` with local data starts a seed POST.
- A 401 stops all calls until the app relaunches. A 413 shows the size line.
- A GET reply is adopted only if the ledger did not change since the request left, and no check-in, stamp or envelope waits that an adopted reply has not carried (`imports-merge-never-replace`). Otherwise the client drops the reply and POSTs, and the Worker's merge answers. A fresh start counts everything the file holds as not carried yet.
- A 404 with a check-in, stamp or envelope in the ledger seeds by POST. A 404 with only lines sends nothing more.
- A failure other than 400 and 401 schedules one retry, a POST, after `backoffMs(failures so far)`. While it is pending, `push` sends nothing and `pull` still runs. A good POST clears it, and so does a good GET, except after a 413. A 400 schedules nothing.
- A reply goes through the mend and the kept copy that a load does, then the store saves (`native-ledger-is-raw-json`).
- A reply from the other device waits until the device has had no input for 10 seconds (`IDLE_APPLY_MS`). The cold reply after a key save applies at once. The next reply waits again.
- Resume: when scenePhase becomes active, the client reconnects the socket and does one GET.
- The owner ruled no background refresh in v1. A resume GET covers the need, see `native-swift-rebuild`.

## The merge notice

Lane W1 makes the POST reply carry `stats` from `mergeLedger`. The client builds the merge notice from those stats, so it never runs the merge.

## Proof

- A stub URL protocol cannot stub a WebSocket. Lane N4b tests the message handler. The socket glue gets a live check only.
- The lanes and their tests are in `native-build-lanes`.

## Still open

- The wording of the native size line is not ruled. The web line is `syncSays` in `src/app.jsx`.
- Which module holds the wording of the native merge notice is not ruled. The wording is `mergeSummary` in `src/merge-rules.mjs`, and native never loads that file. The rules bundle must either carry the function or the Worker must send the text.

## See also

- `sync-revamp-cloudflare` — the Worker, its keys and its WebSocket.
- `rules-run-in-javascriptcore` — where the sync constants come from.
- `merge-readopts-sync-generation` — the web rule for a merge that finishes mid-sync.
