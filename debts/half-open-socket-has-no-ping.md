# A half-open socket has no ping

**What.** A socket that stays open and hears nothing gets no ping. The Worker sends `{rev}` when a socket connects, so a reconnect catches up. The client has no timer that notices a silent open socket. In the probe (`sync-latency`, case c3half), B lost 1 to 3 frames on an open socket and did not apply for 60 s. It applied 0.1 s after a `visibilitychange`, the app's resume GET. Lane web/sync-latency did not build a ping. A ping would use a Durable Object auto-response (the method setWebSocketAutoResponse), which answers without waking the object. The client would close and reopen a socket that got no answer in time, and the reopen would bring the hello. The Worker test fake already accepts setWebSocketAutoResponse. The gap closes when a ping is built with its timeout measured, or when the owner rules the resume GET enough.

**Status:** open. Found in lane web/sync-latency, 2026-10-21. Waits for the owner to rule whether a ping is worth building.

**Decision:** `sync-revamp-cloudflare`.
