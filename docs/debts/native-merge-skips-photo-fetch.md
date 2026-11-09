# Nothing fetches native photos before an apply

**What.** `SyncClient` calls `photoSync.pull` with a reply's live photo ids before the press gate and the apply, on a GET and on a POST (`SyncPhotoFetchTests`). The app sets no `photoSync`, so on a phone no apply fetches its photos. A tile stays blank until a later sync brings the blob. The ids are kept either way. A reply that lands while another photo run is out skips its fetch, because `PhotoSync` starts no second run; the id is kept and a later sync brings the blob (plan in PR 244, page item 59). The gap closes when the app builds a `PhotoSync` on `HTTPPhotoTransport` and hands it to the client.

**Status:** open. Lane photo-sync-wiring (plan `cloud-lane-cut`) adds the caller in `ManifestApp.swift`.

**Decision:** `pull-fetches-photos-before-apply`.
