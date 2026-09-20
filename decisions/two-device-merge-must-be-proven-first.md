# Prove the two-device merge before trusting auto-push

Setting up sync ends with an actual conflict test, not a successful push. One device checks in a card and pushes. A second device, without pulling, imports new lines and pushes into the conflict, then merges. Both devices must end holding both sets of changes, and the first device's next merge must agree. There is no toggle to turn sync on, so this proof is required before running the app on two devices at all.

## The argument, as recorded

```
5. In the app: Sync → paste → Save key → Push. Expect `Pushed ✓`, and check
   `mailaudit` gained no commit at all. With photos in the ledger, expect
   `mailaudit-data` to gain one commit per photo on `main` and the button to stay
   on `Pushing…` until they are done, roughly a second each — the ledger and the
   photos now share one repo's write budget and one `spaceWrites()` clock.

   Then the test worth actually doing: **pull onto a second device or origin**
   and confirm the thumbnails render. That is the one path where getting the
   order wrong is silent — the ledger would come back looking perfect with every
   photo id quietly stripped.

6. **Prove the merge before trusting auto-push**, because auto-push's conflict
   recovery is that same path running unattended. On A: check a card in, Push.
   On B *without pulling*: import a CSV that adds lines, Push — expect the
   conflict, then **Merge & push**. B must end holding A's check-in *and* its
   own new lines, and A's next Merge must agree. There is no toggle to turn on
   any more — sync is unconditional — so this proof is a prerequisite for
   running the app on two devices at all, not just for enabling something.

   `file://` and `http://localhost:4173` are two separate origins with two
   separate ledgers, so they stand in for two devices without needing a second
   phone — see "Running it locally".
```
