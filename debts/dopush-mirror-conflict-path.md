# Is the doPush mirror-conflict path dead code?

`doPush` in `src/app.jsx` has a branch that handles a conflict in mirror mode. The check that tells whether any caller can reach that branch is assigned to lanes W3c, W3d and W3e. The records hold no scope for those lanes, and no lane is briefed. The gap closes when a lane records the answer, and removes the branch if no caller reaches it.

**Status:** open. No lane is briefed.

**Decision:** `sync-revamp-cloudflare`.
