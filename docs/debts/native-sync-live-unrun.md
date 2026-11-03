# The native sync POST, socket and photo paths are unrun against the Worker

**What.** The tests of lanes N4a and N4b run `SyncClient` on a stub URL protocol, a fake socket, a fake Keychain and a sleep gate. The first pull, a GET, reached the live Worker on 2026-10-22 and filled Packages, see `native-build-lanes`. No source shows a POST from the client reach the live Worker or a probe Worker. The Bearer header, the body, the status map and the 404 seed are checked against fixtures. The socket is `URLSessionSyncSocket` (the `/ws` handshake with the protocols `mailaudit` and the key, the `{rev}` hello and the reconnect), and the photo transport is `HTTPPhotoTransport` (the `/photos` list, put and get). No source shows the socket or the photo transport reach a Worker. No run has timed a local check-in to its POST, so the delay from phone to Mac is unmeasured. Lane N11 names no sync check. The gap closes when one run does four things. It sends a POST from `SyncClient` to a probe Worker, and the reply applies. A check-in on the client POSTs after `SYNC_POST_MS` and shows in a second reader. The socket opens and hears the hello. The photo transport lists, puts and gets one photo.

**Status:** open. No probe is named.

**Decision:** `native-reply-waits-generation`.
