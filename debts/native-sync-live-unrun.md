# The native sync client has never run against the Worker

**What.** Lane N4a's tests run `SyncClient` on a stub URL protocol, a fake Keychain and a sleep gate. No run has sent a request from the client to the live Worker or to a probe Worker. The Bearer header, the body, the status map and the 404 seed are checked against fixtures only. Lane N11 names no sync check. The gap closes when one run sends a GET and a POST from `SyncClient` to a probe Worker and the replies apply.

**Status:** open. No probe is named.

**Decision:** `native-reply-waits-generation`.
