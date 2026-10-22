# The native sync client has never run against the Worker

**What.** The tests of lanes N4a and N4b run `SyncClient` on a stub URL protocol, a fake socket, a fake Keychain and a sleep gate. No run has sent a request from the client to the live Worker or to a probe Worker. The Bearer header, the body, the status map and the 404 seed are checked against fixtures only. `URLSessionSyncSocket` (the `/ws` handshake with the protocols `mailaudit` and the key, the `{rev}` hello and the reconnect) and `HTTPPhotoTransport` (the `/photos` list, put and get) have never reached a Worker either. Lane N11 names no sync check. The gap closes when one run sends a GET and a POST from `SyncClient` to a probe Worker and the replies apply, the socket opens and hears the hello, and the photo transport lists, puts and gets one photo.

**Status:** open. No probe is named.

**Decision:** `native-reply-waits-generation`.
