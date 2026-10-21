# No HTTP client carries native photos to the Worker

**What.** `PhotoSync` moves blobs through the `PhotoTransport` protocol, and no type implements it. An HTTP type must list, put and get on the Worker `/photos` route. It must read the `ids` list from GET `/photos` and send the Bearer header. It must also map a 413 to `PhotoTransportError.tooLarge`. No lane row in `native-build-lanes` names it. The gap closes when that type exists and a stub URL protocol test pins the header and the 413.

**Status:** open. No lane owns it. The owner names the lane.

**Decision:** `native-build-lanes`.
