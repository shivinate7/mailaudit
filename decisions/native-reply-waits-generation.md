# A native reply applies only to a ledger that has not changed

**Status:** ruled. The owner accepted this on 2026-10-11 with the plan. Lanes N4a and N4b build it. One detail is open, see Still open.

The native sync client applies a Worker reply only if the local ledger did not change since the request left. If the ledger changed, the client POSTs again. This removes the in-flight race with no local merge. The merge stays on the Worker.

**Holds while:** the Worker answers a POST with only the ledger and the rev, and the native sync client does not exist.

## The client

- `GET /ledger` and `POST /ledger` with the body `{ledger}` both send `Authorization: Bearer`. The client also sends `mailday:1`, because the Worker requires it.
- The WebSocket uses URLSessionWebSocketTask with the protocols `mailaudit` and the key, as the Worker expects.
- A `{rev}` message greater than the held rev starts one GET.
- A 404 `empty` with local data starts a seed POST.
- A 401 stops all calls until the app relaunches. A 413 shows the size line.
- A reply from the other device waits while a press is in progress and for `PRESS_TAIL_MS` after it (`pressHeld`), see `auto-apply-happens-now`. The cold reply after a key save applies at once. The next reply waits again.
- Resume: when scenePhase becomes active, the client reconnects the socket and does one GET.
- The owner ruled no background refresh in v1. A resume GET covers the need, see `native-swift-rebuild`.

## The merge notice

Lane W1 makes the POST reply carry `stats` from `mergeLedger`. The client builds the merge notice from those stats, so it never runs the merge.

## Proof

- A stub URL protocol cannot stub a WebSocket. Lane N4b tests the message handler. The socket glue gets a live check only.
- The lanes and their tests are in `native-build-lanes`.

## Still open

- Which module holds the wording of the native merge notice is not ruled. The wording is `mergeSummary` in `src/merge-rules.mjs`, and native never loads that file. The rules bundle must either carry the function or the Worker must send the text.

## See also

- `sync-revamp-cloudflare` — the Worker, its keys and its WebSocket.
- `rules-run-in-javascriptcore` — where the sync constants come from.
- `merge-readopts-sync-generation` — the web rule for a merge that finishes mid-sync.
