# No native screen shows the merge notice

**What.** `SyncClient.mergeNotice` holds the merge sentence for the last adopted reply. The sentence comes from the bundle's `mergeSummary`, which `build.mjs` bundles from `src/merge-rules.mjs` into the native rules.js. The owner ruled that home on page item 60, 2026-11-08 15:23 CST. The notice is nil when a merge added and removed nothing, the same gate as `changed` in `src/app.jsx`. `MergeSummaryBundleTests` and `MergeNoticeKitTests` pin the text and the gate. No screen shows the notice yet. The gap closes when a screen shows `mergeNotice`.

**Status:** open. The restyle lane builds the screen.

**Decision:** `native-reply-waits-generation`.
