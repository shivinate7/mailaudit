# Mark all, then Undo, keeps today's check-in time

**What.** Mark all stamps `checkedInAt` for each line whose count rose. Its Undo puts the counts back and leaves the stamp. So a line checked in yesterday can read as checked in today, and its envelope shows in today's pile.

Native: `bulk` (native/ManifestKit/Sources/ManifestKit/Packages.swift:332) saves with the default `checkIn: true`. `undoBulk` (Packages.swift:365) and the Tally undo (Tally.swift:183) save with `checkIn: false`, which writes no stamp and clears none. `HandModel.swift:191` lists an envelope when a line has a count and a stamp from today, so it lists the envelope as checked in today.

Web: `bulkSet` (src/app.jsx:4057) stamps through `touchReceived`. The Undo in `undoRecent` (src/app.jsx:5241) restores `received` and `receivedAt` only, through the bulk branch of `undoEntry` (src/recent-rules.mjs:245). It never touches `checkedInAt`.

**Status:** Open. Found in the round-1 review of PR 408 (2026-11-23). No fix yet.

**Decision:** `a-restore-is-not-local`.
