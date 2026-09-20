# The Stored Sha Waits For The Apply

The app stores the remote sha only after applying the pulled bytes, never the moment they arrive. The stored sha is this device's claim to already hold the remote data. Storing it earlier once let a failed apply leave a current sha over stale data. The next push then carried no conflict and silently overwrote the other device's work.

## The argument, as recorded

```
- **The stored sha is accepted only after the bytes are applied.** `pull()`
  returns the sha; `acceptPull()` stores it, and the app calls that *after*
  `applyBackup` has landed. This is the rule the whole conflict scheme rests on,
  and it was learned the expensive way — see the note below.

  The stored sha is this device's **claim to be holding the remote's bytes**.
  The adapter originally wrote it the instant they arrived, which makes the
  claim true only if the app then applies them. When it doesn't — a payload it
  rejects, a merge that throws, a generation guard that bails — the device sits
  on a *current sha over stale data*, and its next push carries that sha and is
  **accepted**: no conflict raised, the other device's work destroyed. Auto-push
  made that automatic and unattended, within 90 seconds.
```
