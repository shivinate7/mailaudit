# Recent actions can be undone by tap

**Status:** open. The owner ruled on 2026-10-11 that the log is "Synced across devices", and accepted the reach, the gesture, the redo rule and the entrance, see Ruled. The owner ruled the shape on 2026-10-11: "Inside the ledger". Still open: three measurements the build must take. Nothing is built.

**Holds while:** `src/app.jsx` keeps no action log, and `undoAssign` is its only undo.

## The problem

A mis-tap checks the wrong card. Under "Unreceived", a checked card leaves the list at once. The owner cannot see which card it was. The owner asked for a Spotify-style recent list, but for single actions, so that each one can be undone fast. The list follows the owner from the phone to the Mac and back.

`receivedAt` cannot serve as that list. It holds one time per card. It holds no earlier count, so it cannot undo. Two steps on one card look like one change. Stamps and envelopes carry `updatedAt` with the same limit. So the app needs a log.

## Ruled

The owner ruled on 2026-10-11:

- The log is "Synced across devices".
- One new web storage key is allowed under `storage-keys-are-frozen`. The recommended shape does not need it, see The shape of the synced log.
- "Accept all" of the earlier recommendations. The log keeps 200 entries or 14 days, whichever keeps fewer. An undo is one tap with no arm. There is no redo. The entrance is a `Recent` cell left of History.

## What Spotify shows

Read on 2026-10-11 from secondary sources. The Spotify app was not opened.

- Mobile: a clock icon on Home opens a list sorted by date. A "Today" heading starts it. "See all played" expands one day. A tap on a row plays it.
- Desktop: the Recently Played tab in the Queue. The list is flat and newest first. It holds the last 50 tracks. A row shows title, album and duration. A three-dot menu sits on each row.
- Spotify staff say an entry cannot be removed. The list only grows.
- The Web API gives each entry a played-at time and a context, the place it was played from. It returns at most 50.
- Unverified: a three-month reach on mobile. One search summary relays a community post. The fetch of that post failed.

The ledger borrows five traits. These are newest first, day headings, one row for one thing, a tap that acts, and a capped list that is never edited. It leaves four. These are artwork (the app shows no card image), the per-row menu (a row has one action), "See all played" (new rows open under the thumb), and the Home-tab entrance.

## What the log holds

One entry per action, from any device. Each entry holds an id that no two devices share, its time, and its subject. Names of fields that do not exist yet are in plain type, because `check:docs` reads backticks.

- Check, un-check and stepper: the card key, and the count before and after. Writes to one card merge into one entry. The merge needs three facts. No other action came between the writes. This device wrote the entry. No undo names the entry. The merged entry keeps the first before, the last after and the last time. A merged entry with no net change is dropped.
- Bulk check or clear on a package (`bulkSet`): each card's count before and after, as one entry. A mis-tapped bulk is the worst mis-tap.
- Stamp set, replaced, edited or removed: the package key, and the stamp before and after.
- Envelope recorded, edited or discarded: the envelope before and after.
- Envelope assigned: the plan (card key and take), and the envelope before and after. This is the data of today's `undo`.
- Undo: its own entry. It names the row it undoes. A row is undone when an undo entry names it.

A count entry takes its time from the same call that stamps `receivedAt`, so the two are equal. A stamp or envelope entry also holds the `updatedAt` that the write set.

Not logged: a CSV import, a merge or live apply, a restore, a pull, a Reset, and the view preferences. A milestone covers each risky one, see `milestones-taken-before-risk`.

## What a row shows

A row uses the ledger's own vocabulary. It has no artwork and no fill of its own. The panel that holds it takes the paper fill (`ruled-head-panels-carry-no-fill`). Its colours come from `C` (`design-parchment-ledger`).

- A mono uppercase micro-label names the action: `CHECKED`, `UN-CHECKED`, `COUNT 2 → 3`, `PACKAGE CHECKED`, `STAMP · REFUNDED`, `STAMP REMOVED`, `ENVELOPE RECORDED`, `ENVELOPE EDITED`, `ENVELOPE DISCARDED`, `ASSIGNED`.
- Cochin sets the subject: the card name, or the seller and order for a package or stamp, or the envelope's note. Mono sets the numbers, such as `1 of 4`, and the time `14:32` (`typography-cochin-and-mono`).
- A second line names the seller. This is the fact the owner forgets.
- The right edge holds the underlined word `UNDO`, as a cell that acts underlines its value (`disclosure-cells-underline-value`).
- After an undo, the right edge reads `UNDONE 14:35` in inkSoft (`palette-inksoft-and-manilaink`). Gold is never text (`palette-gold-is-ornament-only`). The other device shows the same state, because the undo entry syncs.
- Two more end states exist. `CHANGED SINCE` shows that a stamp or envelope changed after this row. `NOTHING TO UNDO` shows that a count would not change, or that the ledger no longer holds this row's change. Both leave the row inert.

A row does not say which device wrote it. A row whose card is not in the ledger is not listed.

Every row has the same fixed height. A long name is cut with an ellipsis.

## Grouping

Rows run newest first. One group holds one local calendar day, never a UTC day (`one-stamp-per-package` names the same trap). A heading is a mono uppercase micro-label over a hairline: `TODAY`, `YESTERDAY`, then a date such as `MON OCT 5`. A group has no expander and no collapse. An expander would put a new row under the thumb.

Rows from two devices sort by their own device clocks. The clock-skew risk of `merge-later-change-wins` applies to the order of rows.

The panel overlays the list and does not push it (`motion-disclosure-panels-arrive`). It has a bounded height, and its rows scroll inside it. Up to 200 rows would otherwise cover every package on the screen.

## No layout shift

The panel freezes its rows when it opens, as the sort order is frozen while the user checks cards (`no-layout-shift-under-pointer`). An action made while the panel is open shows on the next open. A live apply that brings rows from the other device waits for the same reopen. An undo changes its own row in place. It adds no row to the view and moves no row. So a second accidental tap lands on an inert row.

## How one tap undoes one action

An undo is a new, later write. It is never a local rollback.

- **Counts.** The undo subtracts the row's own delta from the card's current count. It clamps the result between 0 and the line's quantity. A count that reaches zero is deleted, not stored as 0. So a hand edit made after the row survives, and any row of a card can be undone in any order (`undo-removes-only-its-delta`). The row is live only while the card's `receivedAt` is at or after the row's time.
- **Stamps and envelopes.** The undo writes the `before` value only when the subject's last write is still this row's write. The subject's `updatedAt` must equal the `updatedAt` that the row wrote. If not, the row reads `CHANGED SINCE` and does nothing. Writing `before` over a newer change would be a rollback.
- **A stamp** returns with its old `at` date. A stamp that did not exist before returns as a tombstone (`stamp-removal-writes-a-tombstone`).
- **An envelope.** Undoing a record writes a discard tombstone. Undoing an edit writes the older copy. Undoing a discard or an assign writes the live copy with a fresh `updatedAt`, so it beats the tombstone (`envelope-deletion-unrepresented`).
- **An assign** subtracts the plan's takes and restores the envelope, as `undoAssign` does. The Undo notice and the row call one function. If the envelope changed since, the whole row reads `CHANGED SINCE`. Both parts happen, or neither.
- **Photos.** An undo of a discard or an assign restores names, counts and the note. It restores a photo id only when this device still holds the blob, the rule of `photo-ids-restore-keep-if-known`. The other device may not hold it. The sweep is not changed (`orphan-sweep-drops-unused-photos`). It holds off only while `undo` is live. A row that lost a photo says `PHOTO NOT RESTORED`. Holding the blobs for the whole reach would keep near 660 KB per photo, see `sync-revamp-cloudflare`.

Every undo stamps a fresh time: `touchReceived` for counts, `setStamp` for stamps, `updatedAt` for envelopes. It also appends its undo entry. Then it travels like any tap: save, Worker POST, merge, and the later change wins (`merge-later-change-wins`). An undone check is an un-check, and it travels as a timed absence (`max-cannot-express-an-uncheck`). The accepted clock-skew risk of `merge-later-change-wins` applies to an undo as to any tap.

An undo never edits the old write. It never restores a snapshot. It never passes through `applyBackup`. It takes no milestone, because a milestone per tap would fill the 60-slot list in one mail day (`sync-revamp-cloudflare`).

Two devices that undo one row offline each write one absolute count. The merge keeps one of them. Neither subtracts twice.

## Rows guard themselves

A restore, a pull and a Reset do not clear the log. A synced log that merges by union could not clear anyway, because the other device would send the rows back. Each row guards itself. Its card or package must still hold the change the row describes. After a restore to an older version, the old rows read inert.

Today's `undo` is different. `applyBackup` clears it for every source. The log is not cleared, because a clear on every live apply would empty it each time the other device pushes.

## How far back

The log keeps the newest 200 rows and nothing older than 14 days. Undo entries do not count toward 200. An undo entry whose row is gone is dropped with it. The owner accepted both limits on 2026-10-11. Neither was measured. How many actions a heavy mail day makes is unmeasured.

## The shape of the synced log

Ruled: a field in the ledger, named recent. The owner chose it on 2026-10-11, with its change to `saved-state-shape`. It holds the entries described above.

**The merge rule.** `mergeLedger` carries it, so the Worker and the web app share one rule.

- Append-only. A merge never drops an entry, except by the cap.
- Union by entry id. If one id is on both sides, the copy with the later time wins. A merged entry is the one case where an id moves forward.
- Capped. After the union, drop entries older than 14 days, then keep the newest 200 rows, then drop undo entries whose row is gone. The cap depends only on the set and the clock. So merging A into B and B into A gives the same list, and merging twice adds nothing.

**Why this shape.**

- It is one document, one merge and one channel. It works offline, and it needs no second sync client on either platform.
- An undo and the write it makes travel together. A separate log could reach a device before or after the ledger write it describes. The row would then show `UNDO` for an action that is already undone.
- The native client keeps the ledger as raw JSON, so a field it does not know passes through (`native-ledger-is-raw-json`).

**What it touches.**

- `saved-state-shape`, an invariant. The log is a new persisted field. It needs the five sites in `src/app.jsx`, and the sixth site in `mergeLedger`. The pins to extend are 9.1–9.3, 37.48–37.51, 37.62–37.63, 39.8 and 39.8b, and group 49. An older build's `snapshot()` omits the field. Update both devices first, as that record says for each new field.
- `merge-later-change-wins`. `mergeLedger` names the field, and the record gains the union and the cap.
- `milestones-taken-before-risk`. A version holds the whole saved shape, so it holds the log.
- `native-ledger-is-raw-json`. The fields that an edit may touch gain the log. Lane N3 landed in PR #80 with no log tests, see `native-build-lanes`.
- `rules-run-in-javascriptcore`. The rules bundle gains the log rules.
- `native-parity-table`. It gains one row for the log, with the scope both clients.
- `storage-keys-are-frozen` is not touched. The log lives inside the ledger key. The allowed new key is not used, and test 25.27 stands.

**Size.** The log rides in every POST, GET, version, backup and mirror push. Its size is unmeasured. The ledger is near 235 KB, and `MAX_LEDGER_BYTES` is 1,800,000. Bulk rows are the largest. The build measures a worst case of 200 bulk rows. If that case is large, a byte cap joins the two caps.

**Rejected shapes.**

- A separate append-only log on the Worker, beside the ledger. It leaves `saved-state-shape` and the ledger size alone. It keeps the log out of versions and the mirror. It costs a new Worker route and a new socket message. It needs a second sync client on the web and in lanes N4a and N4b. It needs a local outbox for unsent entries, and its own 401, 413 and offline lines. It also allows the undo race above. Under this shape the allowed new key is used. The key is mailday:recent, and it holds the outbox. Test 25.27 changes from "the namespace holds only the ledger" to "the namespace holds the ledger and the outbox". Choose this shape if the owner will not touch `saved-state-shape`, or if the size measurement fails.
- A log per device. The owner ruled it out with "Synced across devices". It leaves every invariant alone, but the Mac cannot undo what the phone did.

## Where the entrance sits

The entrance is a `Recent ▾` cell in the ruled action row, left of History. It uses `.mdl-act`, `aria-expanded` and the caret that History carries (`action-row-is-ruled-cells`). Its panel overlays the list in the same slot as History, with the same fade and no new motion (`motion-disclosure-panels-arrive`). Recent, History and Sync close one another (`history-sync-close-each-other`). An armed Reset does not hide the cell, and, by an orchestrator default of 2026-10-11, it does not hide History either (`armed-reset-takes-the-row`).

The cell shows whenever the ledger holds items or envelopes, as Reset does. It never waits on the log, so the row does not re-divide when the first entry lands (`recovery-control-not-state-gated`). An empty log shows one line in the panel.

Rejected entrances:

- A line or toast after each tap. It opens under the thumb, and it costs 40px at rest. The live-update line was declined for the same reasons (`sync-revamp-cloudflare`).
- A tab inside the History panel. That panel is the milestone list, and it shows only with `window.versions` or `window.remote`. Recent needs neither.

## Both clients

- The log rules are one pure module under src/: add an entry, merge same-card entries, the cap, the guards and the inverse of each kind. The web app calls it. The rules bundle does not carry it yet. Once the log lands, the bundle carries it and the Swift client runs it in JavaScriptCore (`rules-run-in-javascriptcore`). The Swift client holds no copy.
- The merge stays on the Worker. Native never loads `src/merge-rules.mjs`, so the log union has one home.
- Each client draws its own screen. The rows, the words, the grouping and the end states are the same.
- The Worker has no new route. Its tests gain the union and the cap, because the Worker runs `mergeLedger`.
- No lane brief exists for the log. It needs one after the S lanes, because it adds to the rules bundle.

## Not the milestone list

The owner ruled on 2026-10-11 that the native app lists and restores its saved milestones (`native-parity-table`). The two lists stay apart.

| | Recent | History |
|---|---|---|
| Holds | single actions | whole-ledger milestones |
| Verb | Undo | Restore |
| Write | one later change | a whole replace through `applyBackup` |
| Safety | the row's guard, no milestone | a two-tap, and its own milestone |
| Storage | the ledger field | the versions store |

Neither list holds the other's items. A restore is not a Recent row.

## Measurements the build must take

- Whether four cells fit in the action row at 375px. The code sizes a third at 114px. Four cells are about 86px, and "Re-import CSV" may ellipsize. Re-take `ruled-head-heights`, and run `npm run check:screens`. If four cells clip, the owner picks which cell gives way.
- The height of a row, recorded in `ruled-head-heights`.
- The size of the worst-case log, as The shape of the synced log says.

## Proof the build must give

Each test is red on the old code first (`claims-and-tests-change-together`).

- Two steps on one card, then an undo of the first. The second survives.
- An undone check, merged with the other device's older check, wins. The other device's later check beats the undo.
- The log merge is symmetric and idempotent. Two devices that add different rows get both. The cap gives the same list on either side.
- An undo entry reaches the other device, and its row reads `UNDONE` there.
- A stamp undo after a newer stamp write is refused and reads `CHANGED SINCE`.
- After a restore to an older version, a count row reads `NOTHING TO UNDO`.
- A ledger saved before the field loads clean. The merged ledger keeps the field, and it deep-equals the expected list, not merely a truthy value.
- The Undo notice and the row call one function.
- An undone row keeps its height, and no row opens while the panel is open. jsdom has no layout, so `npm run check:screens` at 375px proves it (`testing-jsdom-has-no-layout`).

## Sources

Secondary. Read on 2026-10-11.

- ScreenRant, on finding Spotify listening history: https://screenrant.com/spotify-find-listening-history-mobile-desktop-how/
- How-To Geek, on viewing Spotify listening history: https://www.howtogeek.com/788308/how-to-view-your-spotify-listening-history/
- Spotify Web API, Get Recently Played Tracks: https://developer.spotify.com/documentation/web-api/reference/get-recently-played
- Spotify Community, a thread on removing items from Recently Played (seen in a search result only): https://community.spotify.com/t5/Your-Library/Why-can-t-I-remove-items-from-Recently-Played/td-p/6909460

## See also

- `undo-removes-only-its-delta` — the delta rule an undo of a count keeps.
- `merge-later-change-wins` — the rule that lets an undo travel.
- `max-cannot-express-an-uncheck` — why an undone check reaches the other device.
- `stamp-removal-writes-a-tombstone` — the stamp tombstone an undo may write.
- `envelope-deletion-unrepresented` — the envelope tombstone an undo beats.
- `saved-state-shape` — the invariant that the recommended shape touches.
- `no-layout-shift-under-pointer` — the rule the frozen panel keeps.
- `sync-revamp-cloudflare` — the sync an undo travels through.
- `native-swift-rebuild` — the native client that shows the same list.
- `native-parity-table` — the scope of the log in both clients.
