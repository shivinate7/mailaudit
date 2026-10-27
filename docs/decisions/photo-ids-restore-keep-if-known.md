# A restore keeps only the photo ids this device holds

Owner ruling 2026-10-15 21:25 CDT. A restore drops a photo id this device does not hold. A restore is a backup file or a saved version. An inlined blob counts as held, so its id stays. A merge and a server apply keep every id. So does an unreadable local photo store, as `photo-ids-unreadable-local` sets out.

A device that lacks a blob does not show that no device holds it. A restore restamps its envelopes, so its ids win the merge, and the holder's sweep then drops the blob. So a restore can make a device that still held a photo delete it. The owner chose to drop the id, so no tile is blank after a restore, and accepted that cost. A photo that neither this device nor the Worker holds shows as lost after 7 days, see `pull-warns-on-what-it-drops`.

A pushed payload never carries photos, because photos stay local. So a restore on the device that took a photo keeps its id, because the blob is here. Keeping an id this device lacks costs a blank manila tile until a sync brings the blob. Stripping it costs the photo. A blob inlined in a backup file is written to this device on restore, so its id stays.

**Holds while:** `applyBackup` in `src/app.jsx` drops an envelope photo id on a restore (`replacing`). It does so when the local photo store lists neither that id nor an inlined blob. It keeps every id on a merge or a server apply. It also keeps every id when `window.photos` is absent or `photos.keys()` throws (`present` stays null).

**Pinned by:**

- 19.6 a restore drops a photo id this device does not hold. 19.13 a History restore does the same.
- 19.9 a blob the backup file inlines counts as held, so its id stays.
- 19.11–19.12: a restore keeps an id whose blob is on this device, and the sweep leaves the blob.
- 26.11–26.12: a merge keeps ids whose blob is on this device.
- 26.13 and 26.13b: a server apply keeps an id the Worker lacks, and an unreadable list keeps it too.
- 26.13c: the Sync panel says photos need something, not that they are lost.
- 30.10 and 30.13: a photo the Worker lacks stays on the envelope, and an unreadable store keeps every id.
- 47.8 and 47.8pre: a restore with no photo store at all keeps the id (`photo-ids-unreadable-local`).

Kind: build

Plan: docs/decisions/sync-revamp-cloudflare.md#web-plan (web)

## See also

- `photo-ids-unreadable-local` — the local half of the same keep-or-strip rule.
- `pull-fetches-photos-before-apply` — the order that puts a merge's blobs on this device before the ledger lands.
- `photos-stay-out-of-the-ledger` — the boundary this rule protects.
- `a-restore-is-not-local` — the restore path this rule guards.
