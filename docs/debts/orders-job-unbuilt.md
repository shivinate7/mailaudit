# The nightly orders job is unbuilt

**What.** The page route that gives the job its orders is measured to work in a signed-in browser, see `sync-revamp-cloudflare`. Three parts are unbuilt: the nightly job, the Worker route that takes the job's orders, and a test that the job builds the same item key as the CSV for the same orders. The host is open, so the job has no home yet. Two items are unmeasured. The CSV held two orders dated 2026-06-23 that the page lacked, at the edge of the 120-day window, and the cause is unknown. The cookie's lifetime is unknown, and the logon redirect is only assumed to mean an expired cookie. The gap closes when the job posts one night's orders to the Worker, the key test is green, and both items are measured or ruled out.

**Status:** open. The host waits on a Worker-versus-Mac fetch probe and the owner's ruling.

**Decision:** `sync-revamp-cloudflare`.
