# Check-in time field (items 107 b and 127 c)

**Status:** planned, not built. Starts after PR 390 (Hand end-of-day list) merges. A Plan agent and a refuter read it on 2026-11-22. The refuter's verdict was holds with changes; the changes are folded in below.

Decisions: `a-restore-is-not-local` (item 107 b), `duo-card-in-hand`. Invariant: `saved-state-shape`. Debt it retires: `hand-pile-counts-one-fewer`.

## What it builds

One new synced field, `checkedInAt`: per line, the time of the last real check-in. A check-in is a count that rises. A restore, an un-check and a "One fewer" never write it. The end-of-day pile (`HandModel.todaysEnvelopes`) reads it in place of `receivedAt`. An envelope reads the newest of its lines.

This one field answers both rulings. Item 107 b (owner 2026-11-21 20:26-20:28 CST) asks for a second stamp that restores ignore. Its option text says the pile "shows only real check-ins". Item 127 c (owner 2026-11-22 19:41 CST) asks for a check-in date that a decrement does not set. One pass through the five sites, one merge change, one Worker deploy.

The name avoids "stamp", which in this repo means a package stamp.

## Defaults taken (no owner question; each can be undone)

- Per line, not per envelope. The 107 b reply says "a second time stamp to each checked line".
- A restore writes the backup's or version's value, never `now`.
- Merge: the field follows the side that won that key's `receivedAt` merge. A Worker reply older than a restore then cannot put back a false "today".
- A line with no value reads as no check-in. A check-in made before the build never shows as "today".
- Undoing an un-check is not a check-in.

## Acts, in order

1. Red tests first.
   - `HandModelTests`: after a restore, `todaysPile` is empty.
   - `test/app.test.mjs`: a check-in writes the field; an un-check and a "One fewer" do not; an old save loads it as `{}`; a backup carries it; Reset clears it; a restore keeps the backup's value; the merged field deep-equals the expected map.
   - `test/recent-rules.test.mjs`: `restampRestore` leaves it alone.
   - `worker/core.test.mjs`: the Worker merges it per key.
   - Native restore tests: a version without the field restores to an empty pile.
2. Shared rules in `src/merge-rules.mjs`: add the key to `KNOWN_KEYS`. Extend `mergeReceived`, the field's one home, to return the winner per key, with a tie rule, and merge `checkedInAt` from it. Do not write the winner logic again in `mergeLedger`. Make the "did a count rise" test one pure helper. Add the field to `SALVAGE` in `src/view-rules.mjs`. Rebuild native `rules.js`.
3. Web: the five sites in `src/app.jsx` that `saved-state-shape` lists, plus the refs, `dataOf`, the sync dependencies and undo that carry saved keys. The callers of `touchReceived` pass the change in count.
4. Native: `LedgerStore.setReceived` writes the field when the count rises. Add defaults at ingest and in `SyncClient`. The restore path in `Versions.swift` keeps the version's value. A new accessor beside `LedgerStore.receivedAt()` feeds `todaysEnvelopes`.
5. Records: update `saved-state-shape` (the field list, the 107 b line, the known-key count) and `a-restore-is-not-local` (the 107 b line, as built: a check-in time, not a restore stamp). Retire debt `hand-pile-counts-one-fewer` and the option c line in `docs/todo.md`.
6. One reviewer, since this changes merge logic. Merge on a green run. Then the one Worker deploy of items 94 and 107 b, as item 124 b rules (owner 2026-11-22 12:32 CST). The Worker needs a redeploy only, because `worker/core.mjs` imports `mergeLedger` from `src/`.

## Risks

- Until the Worker redeploys, it carries the field as an unknown key: the whole map moves, and the later `savedAt` wins.
- An old web build drops the field from its snapshot. The carry merge keeps it.
