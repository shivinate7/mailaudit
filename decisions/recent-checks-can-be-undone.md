# Recent actions can be undone by tap

**Status:** open. The owner asked for it on 2026-10-11. This design is a proposal. Nothing is built. Six choices wait for the owner's word, see Open choices.

**Holds while:** `src/app.jsx` keeps no action log, and `undoAssign` is its only undo.

## The problem

A mis-tap checks the wrong card. Under "Unreceived", a checked card leaves the list at once. The owner cannot see which card it was. The owner asked for a Spotify-style recent list, but for single actions, so that each one can be undone fast.

`receivedAt` cannot serve as that list. It holds one time per card. It holds no earlier count, so it cannot undo. Two steps on one card look like one change. Stamps and envelopes carry `updatedAt` with the same limit. So the app needs a log.

## What Spotify shows

Read on 2026-10-11 from secondary sources. The Spotify app was not opened.

- Mobile: a clock icon on Home opens a list sorted by date. A "Today" heading starts it. "See all played" expands one day. A tap on a row plays it.
- Desktop: the Recently Played tab in the Queue. The list is flat and newest first. It holds the last 50 tracks. A row shows title, album and duration. A three-dot menu sits on each row.
- Spotify staff say an entry cannot be removed. The list only grows.
- The Web API gives each entry `played_at` and `context`, the place it was played from. It returns at most 50.
- Unverified: a three-month reach on mobile. One search summary relays a community post. The fetch of that post failed.

The ledger borrows five traits. These are newest first, day headings, one row for one thing, a tap that acts, and a capped list that is never edited. It leaves four. These are artwork (the app shows no card image), the per-row menu (a row has one action), "See all played" (new rows open under the thumb), and the Home-tab entrance.

## What the log holds

One entry per action on this device. Each entry holds its time `at`.

- Check, un-check and stepper: the card key, and the count before and after. Writes to one card with no other action between them merge into one entry. It keeps the first `before`, the last `after` and the last time. An entry with no net change is dropped.
- Bulk check or clear on a package (`bulkSet`): each card's count before and after, as one entry. The brief's list did not name it. A mis-tapped bulk is the worst mis-tap.
- Stamp set, replaced, edited or removed: the package key, and the stamp before and after.
- Envelope recorded, edited or discarded: the envelope before and after.
- Envelope assigned: the plan (card key and take), and the envelope before and after. This is the data of today's `undo`.

Each single-value entry (stamp, envelope) also holds `afterAt`, the `updatedAt` it wrote.

Not logged: a CSV import, a merge or live apply from the other device, a restore, a pull, a Reset, and the view preferences. A milestone covers each risky one, see `milestones-taken-before-risk`. A change from the other device belongs to that device's log.

## What a row shows

A row uses the ledger's own vocabulary. It has no artwork and no fill (`ruled-head-panels-carry-no-fill`). Its colours come from `C` (`design-parchment-ledger`).

- A mono uppercase micro-label names the action: `CHECKED`, `UN-CHECKED`, `COUNT 2 → 3`, `PACKAGE CHECKED`, `STAMP · REFUNDED`, `STAMP REMOVED`, `ENVELOPE RECORDED`, `ENVELOPE EDITED`, `ENVELOPE DISCARDED`, `ASSIGNED`.
- Cochin sets the subject: the card name, or the seller and order for a package or stamp, or the envelope's note. Mono sets the numbers, such as `1 of 4`, and the time `14:32` (`typography-cochin-and-mono`).
- A second line names the seller. This is the fact the owner forgets.
- The right edge holds the underlined word `UNDO`, as a cell that acts underlines its value (`disclosure-cells-underline-value`).
- After an undo, the right edge reads `UNDONE 14:35` in inkSoft (`palette-inksoft-and-manilaink`). Gold is never text (`palette-gold-is-ornament-only`).
- Two more end states exist. `CHANGED SINCE` shows that the subject changed after this row. `NOTHING TO UNDO` shows that the undo would change no count. Both leave the row inert.

Every row has the same fixed height. A long name is cut with an ellipsis. The height is unmeasured. The builder measures it and records it in `ruled-head-heights`.

## Grouping

Rows run newest first. One group holds one local calendar day, never a UTC day (`one-stamp-per-package` names the same trap). A heading is a mono uppercase micro-label over a hairline: `TODAY`, `YESTERDAY`, then a date such as `MON OCT 5`. A group has no expander and no collapse. An expander would put a new row under the thumb.

The panel has a bounded height, and its rows scroll inside it. Up to 200 rows would otherwise push every package off the screen.

## No layout shift

The panel freezes its rows when it opens, as the sort order is frozen while the user checks cards (`no-layout-shift-under-pointer`). An action made while the panel is open shows on the next open. An undo changes its own row in place. It adds no row and moves no row. So a second accidental tap lands on an inert row.

## How one tap undoes one action

An undo is a new, later write. It is never a local rollback.

- **Counts.** The undo subtracts the row's own delta from the card's current count. It clamps the result between 0 and the line's quantity. A count that reaches zero is deleted, not stored as 0. So a hand edit made after the row survives, and any row of a card can be undone in any order (`undo-removes-only-its-delta`).
- **Stamps and envelopes.** The undo writes the `before` value only when the subject's last write is still this row's write. The subject's `updatedAt` must equal the row's `afterAt`. If not, the row reads `CHANGED SINCE` and does nothing. Writing `before` over a newer change would be a rollback.
- **A stamp** returns with its old `at` date. A stamp that did not exist before returns as a tombstone (`stamp-removal-writes-a-tombstone`).
- **An envelope.** Undoing a record writes a discard tombstone. Undoing an edit writes the older copy. Undoing a discard or an assign writes the live copy with a fresh `updatedAt`, so it beats the tombstone (`envelope-deletion-unrepresented`).
- **An assign** subtracts the plan's takes and restores the envelope, as `undoAssign` does. The Undo notice and the row call one function. If the envelope changed since, the whole row reads `CHANGED SINCE`. Both parts happen, or neither.
- **Photos.** An undo of a discard or an assign restores names, counts and the note. It restores a photo id only when the device still holds the blob, the rule of `photo-ids-restore-keep-if-known`. The sweep is not changed (`orphan-sweep-drops-unused-photos`). It holds off only while `undo` is live. A row that lost a photo says `PHOTO NOT RESTORED`. Holding the blobs for the whole reach would keep near 660 KB per photo, see `sync-revamp-cloudflare`.

Every undo stamps a fresh time: `touchReceived` for counts, `setStamp` for stamps, `updatedAt` for envelopes. Then it travels like any tap: save, Worker POST, merge, and the later change wins (`merge-later-change-wins`). An undone check is an un-check, and it travels as a timed absence (`max-cannot-express-an-uncheck`). The accepted clock-skew risk of `merge-later-change-wins` applies to an undo as to any tap.

An undo never edits the old write. It never restores a snapshot. It never passes through `applyBackup`. It takes no milestone, because a milestone per tap would fill the 60-slot list in one mail day (`sync-revamp-cloudflare`).

## When the log clears

A file restore, a version restore, a pull and a Reset clear the log. They replace the ledger, so an old row would describe a ledger that is gone. In `applyBackup` these are the sources `file` and `remote`. The empty panel then says why, in one line, such as `CLEARED WHEN THE LEDGER WAS RESTORED 14:40`.

A merge and a live apply from the Worker do not clear the log. They keep this device's writes. This differs from today's `undo`, which `applyBackup` clears for every source. The difference is on purpose. Each log row guards itself. A clear on every live apply would empty the log each time the other device pushes.

## How far back, and where it lives

Recommended: per device, at most 200 entries and at most 14 days, whichever keeps fewer. The log is pruned when an entry is added and when the app loads. Unmeasured: how many actions a heavy mail day makes. Count the `receivedAt` values per local day on the live ledger to size it.

On the web, the log is not in `snapshot()`. So no push, version, backup or merge carries it (`saved-state-shape`). It has its own key in the ledger namespace. That key freezes when it ships. A torn write between the log and the ledger is safe, because each row guards itself.

On native, the log is a file beside `ledger.json` in Application Support, outside the ledger and outside the versions folder.

## Where the entrance sits

The entrance is a `Recent ▾` cell in the ruled action row, left of History. It uses `.mdl-act`, `aria-expanded` and the caret that History carries (`action-row-is-ruled-cells`). Its panel opens in the same slot as History, with the same fade and no new motion (`motion-disclosure-panels-arrive`). Recent, History and Sync close one another (`history-sync-close-each-other`). An armed Reset hides the cell, as it hides History (`armed-reset-takes-the-row`).

The cell shows whenever the ledger holds items or envelopes, as Reset does. It never waits on the log, so the row does not re-divide when the first entry lands (`recovery-control-not-state-gated`). An empty log shows one line in the panel.

Unmeasured: whether four cells fit at 375px. The code sizes a third at 114px. Four cells are about 86px. "Re-import CSV" may ellipsize. Re-take `ruled-head-heights` and run `npm run check:screens` before the build lands.

Rejected entrances:

- A line or toast after each tap. It opens under the thumb, and it costs 40px at rest. The live-update line was declined for the same reasons (`sync-revamp-cloudflare`).
- A tab inside the History panel. That panel is the milestone list, and it shows only with `window.versions` or `window.remote`. Recent needs neither.

## Both clients

- The log rules are one pure module: add an entry, merge same-card entries, prune, the guards and the inverse of each kind. The web app calls it. The Swift client runs the same module in JavaScriptCore, as the Swift plan on PR #59 sets out. The Swift client holds no copy.
- Each client draws its own screen. The rows, the words, the grouping and the end states are the same.
- The Worker does not change. The log is not in the ledger, and an undo is an ordinary write.
- The native parity table, when PR #59 merges, gets one row for the log with the scope both clients. Today `native-swift-rebuild` is the only native record on main. The parity table, the JavaScriptCore rules record and the native file-names record are on PR #59 and not on main.

## Not the milestone list

The owner ruled on 2026-10-11 that the native app lists and restores its saved milestones. The two lists stay apart.

| | Recent | History |
|---|---|---|
| Holds | single actions | whole-ledger milestones |
| Verb | Undo | Restore |
| Write | one later change | a whole replace through `applyBackup` |
| Safety | the row's guard, no milestone | a two-tap, and its own milestone |
| Storage | the log | the versions store |

Neither list holds the other's items. A restore is not a Recent row.

## Open choices

Each has a recommendation. The owner decides.

1. **Where the log lives.** Recommended: per device. The owner's need is to undo what this device did. A synced log adds a persisted key (the five sites of `saved-state-shape`), a named field in `mergeLedger`, a merge rule and a Worker change. It also grows every push. The ledger is near 235 KB, and a Worker value caps at 2,000,000 bytes with 100,000 headroom. The gain is to undo the other device's action.
2. **Where the web log is stored.** Recommended: its own key in the ledger namespace. That re-points test 25.27 and the claim in `storage-keys-are-frozen` that the namespace holds only the ledger. The ledger key stays frozen. Alternatives: a field in `mailday:v1`, which touches the five sites of `saved-state-shape` even when it stays out of `snapshot()`. Or its own IndexedDB store, which follows `versions-get-their-own-database` and needs a new adapter under `storage-split-three-adapters`.
3. **How far back.** Recommended: 200 entries or 14 days. The sizes are unmeasured. Spotify's desktop list keeps 50.
4. **The gesture.** Recommended: one tap, with no arm. An undo is itself reversible, because the row stays and the card can be checked again. A two-tap arm, as on Discard, doubles the work the owner wants quick.
5. **Redo.** Recommended: none. To redo, check the card again. That adds a new row.
6. **The entrance.** Recommended: a fourth cell. If four cells clip at 375px, the owner picks which cell gives way. The measurement comes first.

## Proof the build must give

Each test is red on the old code first (`claims-and-tests-change-together`).

- Two steps on one card, then an undo of the first. The second survives.
- An undone check, merged with the other device's older check, wins. The other device's later check beats the undo.
- A stamp undo after a newer stamp write is refused and reads `CHANGED SINCE`.
- A version holds no log. A merge keeps the log. A restore, a pull and a Reset clear it.
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
- `no-layout-shift-under-pointer` — the rule the frozen panel keeps.
- `sync-revamp-cloudflare` — the sync an undo travels through.
- `native-swift-rebuild` — the native client that shows the same list.
