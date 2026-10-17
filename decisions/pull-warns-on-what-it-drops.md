# A lost photo warns after 7 days, never on the pull

Owner ruling 2026-10-17: the app warns about a lost label photo after a grace period. The grace period, the clock, the slot and the pull rule below are orchestrator defaults. The owner may redirect any of them.

The grace period exists because the Worker lacking a blob does not mean no device holds it. The device that took the photo may still be uploading. Seven days gives that upload time to finish. Before this, no part of the app named a lost photo.

**Holds while:** the build below is in place, and these stay true. The build is `pushPhotos` setting `lostPhotos` from `plan.lost`, and `EnvelopeCard` handing it to `PhotoStrip` when `createdAt` is over 7 days old. The tile stays 56px: it reads "Lost", with the full sentence off screen for a screen reader.

- `photoPlan` in `src/photo-rules.mjs` lists a photo in `lost` only when neither this device nor the Worker holds its blob. `lost` stays empty when the Worker answer is unknown (`listphotos-is-three-valued`, a device that cannot see the Worker reports nothing lost).
- A photo shows as lost only when its envelope's `createdAt` is more than 7 days old. Under 7 days, nothing shows. The clock is `createdAt`, so no new saved state is added (`saved-state-shape`, the saved-state shape is fixed).
- The warning is one quiet line in that envelope's reserved photo slot. It adds no height (`no-layout-shift-under-pointer`, no layout shift under the pointer). jsdom has no layout, so the proof is a real-browser measurement or `npm run check:screens`.
- The warning is never a dialog, and never on the pull path. `pullPhotos` in `src/app.jsx` names no photo as lost, and `doMerge` calls `pullPhotos`, so a merge is the same. A pull does not block or warn before it replaces the ledger.
- Tests 30.18s, 30.18t, 30.19, 30.20 and 31.15 keep holding. Test 30.20 pins that the text "never pushed" is absent for a photo both ledgers reference, and such a photo is not lost.
- Test 30.10b's label says a photo the Worker lacks is not reported lost. Under this rule that holds only under 7 days, so the build re-labels it. Its check, no "no copy left" text and no GitHub word on the page, must stay true for the new line.
- The build adds three cases: over 7 days and lost shows the line; under 7 days shows nothing; no dialog appears.

Named limit: the clock is the envelope's age, not the time since the other device could upload. A device offline for more than 7 days after it made an envelope can show a warning while that upload is still pending. Restore and partial assign keep `createdAt`, so their envelopes keep their original age.

Kind: build

Plan: decisions/sync-revamp-cloudflare.md#web-plan (web)

## See also

- `photo-ids-restore-keep-if-known`, the restore rule that drops ids this device does not hold.
- `photo-sync-cannot-conflict`, why a photo id is never a shared write.
- `two-device-merge-proven-first`, the two-device check. A pull replaces the ledger. The merge unions line items and never drops one.
