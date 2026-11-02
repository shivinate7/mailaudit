# No test pins the generation check in a pull

**What.** `SyncClient` drops a GET reply when the store's generation changed, or when the user data differs from what the last reply carried. `testAnEditWhileAPullIsOutDropsTheReplyAndPostsInstead` edits a check-in, so the user-data check drops the reply on its own. Removing the generation check passes that test. The gap closes when a test makes an edit that moves the generation and leaves the check-ins, receivedAt, stamps and envelopes as they were. That test must go red with the generation check removed.

**Status:** open.

**Decision:** `native-reply-waits-generation`.
