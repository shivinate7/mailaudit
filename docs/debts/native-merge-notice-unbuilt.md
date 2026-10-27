# No native screen shows the merge notice

**What.** `SyncClient` keeps the `stats` of the last adopted reply (`native-reply-waits-generation`). No screen builds the merge notice from them, and no lane row in `native-build-lanes` names the notice. The wording is `mergeSummary` in `src/merge-rules.mjs`, which native never loads. Which module holds the native wording is not ruled. The gap closes when the owner rules the module, a screen shows the notice, and a test pins its text.

**Status:** open. Waits for the owner's ruling on the wording's home.

**Decision:** `native-reply-waits-generation`.
