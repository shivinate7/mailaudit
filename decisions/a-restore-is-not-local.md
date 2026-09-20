# A Restore Is Not Local

Restoring a version rewrites items, received counts, and envelopes, all fields the auto-push debounce watches. Ninety seconds later, the restored ledger publishes to the remote with nobody confirming that step. The two-tap restore control now says this out loud, because replace everything reads as local even though it is not. A Reset carries the identical risk, since it keeps the same sha and publishes an empty ledger the same way.

## The argument, as recorded

```
  **A restore is not local, and now says so.** It rewrites `items`, `received`
  and `envelopes` — three of the auto-push debounce's deps — so ninety seconds
  later the rolled-back ledger is published, unattended and *accepted*, because
  the stored sha is still current and there is no conflict to raise. Nothing is
  destroyed (every push is a commit, and the other device recovers by merging),
  but the two-tap said "replace everything", which reads as local. The expanded
  row says "This becomes the backup too, a minute later" when there is a key.
  The same is true of `resetAll`, which keeps the sha by design: **a Reset
  publishes an empty ledger 90 seconds later.** Contained for the same reasons,
  and worth knowing.
  The sha itself is deliberately untouched by a restore, and rolling it *back*
  would be the actual mistake: it would 409 the next push against a remote this
  device is not behind, forcing the user through Merge — which only ADDS, and
  would therefore silently re-add the very lines the rollback removed. The
  repair path would undo the repair.
```
