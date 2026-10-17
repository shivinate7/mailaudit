# A lost photo warns after 7 days, never on the pull

Owner ruling 2026-10-17: the app warns about a lost label photo after a grace period. The grace period, the clock, the slot and the pull rule below are orchestrator defaults. The owner may redirect any of them.

The grace period exists because the Worker lacking a blob does not mean no device holds it. The device that took the photo may still be uploading. Seven days gives that upload time to finish. Before this, no part of the app named a lost photo.

**Holds while:** the build below is in place, and these stay true. The build is `pushPhotos` setting `lostPhotos` from `plan.lost`, and `EnvelopeCard` handing it to `PhotoStrip` when `createdAt` is over 7 days old. The tile stays 56px: it reads "Lost", is not a button and takes no tap, and its accessible name is the full sentence.

- `photoPlan` in `src/photo-rules.mjs` lists a photo in `lost` only when neither this device nor the Worker holds its blob. `lost` stays empty when the Worker answer is unknown (`listphotos-is-three-valued`, a device that cannot see the Worker reports nothing lost).
- A photo shows as lost only when its envelope's `createdAt` is more than 7 days old. Under 7 days, nothing shows. The clock is `createdAt`, so no new saved state is added (`saved-state-shape`, the saved-state shape is fixed).
- The warning is the tile in that envelope's photo slot, in place of the thumbnail. It adds no height (`no-layout-shift-under-pointer`, no layout shift under the pointer). jsdom has no layout. `npm run check:screens` proves it: its "Lost photo tile" state checks the box, overflow and accessibility at 375 and 760px, and claim 15 holds the tile at 56 by 56, the size of a thumbnail.
- The warning is never a dialog, and never on the pull path. `pullPhotos` in `src/app.jsx` names no photo as lost, and `doMerge` calls `pullPhotos`, so a merge is the same. A pull does not block or warn before it replaces the ledger. Accepted timing (orchestrator ruling, 2026-10-17): the line can show after the push survey that follows a merge's POST. "Never on the pull" means that the pull and merge photo phase never sets it.
- An unknown or unreadable survey clears the lost set, because an unknown Worker reports nothing lost.
- Tests 30.18s, 30.18t, 30.19, 30.20 and 31.15 keep holding. Test 30.20 pins that the text "never pushed" is absent for a photo both ledgers reference, and such a photo is not lost.
- Test 30.10b's label says a photo the Worker lacks is not reported lost. Under this rule that holds only under 7 days, so the build re-labels it. Its check, no "no copy left" text and no GitHub word on the page, must stay true for the new line.
- Tests 30.21 to 30.29 pin the build. No dialog appears in any of them.
  - 30.21: lost for over 7 days shows the tile. 30.22: under 7 days shows nothing.
  - 30.23: a photo this device holds shows nothing. 30.24: a photo the Worker holds shows nothing.
  - 30.25: a merge shows nothing. 30.26: the tile is not a button, and a tap opens nothing.
  - 30.27 and 30.28: a refused or unreadable later survey clears the tile.
  - 30.29: a photo pulled with no later survey replaces the tile at once.

Named limit (debt `lost-photo-clock-is-envelope-age`): the clock is the envelope's age, not the time since the other device could upload. A device offline for more than 7 days after it made an envelope can show a warning while that upload is still pending. Restore and partial assign keep `createdAt`, so their envelopes keep their original age. The tile is set only by the push survey after a successful POST, so a session with nothing to send shows no tile until its first POST (debt `lost-tile-waits-for-first-post`). That delays a warning; it cannot raise a false one.

Kind: build

Plan: decisions/sync-revamp-cloudflare.md#web-plan (web)

## See also

- `photo-ids-restore-keep-if-known`, the restore rule that drops ids this device does not hold.
- `photo-sync-cannot-conflict`, why a photo id is never a shared write.
- `two-device-merge-proven-first`, the two-device check. A pull replaces the ledger. The merge unions line items and never drops one.
