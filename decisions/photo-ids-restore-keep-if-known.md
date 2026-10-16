# A restore keeps every photo id

A restore keeps every photo id, and so does a server apply. A device that lacks a blob does not show that no device holds it. A restore restamps its envelopes, so a stripped id wins the merge, and the holder's sweep then drops the blob. A pushed payload never carries photos, because photos stay local, so a restore on the device that took them would strip every id. Keeping an id costs a blank manila tile until a sync brings the blob. Stripping it costs the photo. A blob inlined in a backup file is written to this device on restore. An unreadable local photo store keeps every id too, as `photo-ids-unreadable-local` sets out.

**Status:** open. The owner has not confirmed the file-restore rule that commit 7f86322 built. That rule keeps every id on a file restore, and test 19.6 pins it. Owner question: keep every id on every restore, or strip an id on a file restore. Strip only when this device lacks the blob and the store was read. Recommendation: keep every id.

**Holds while:** `applyBackup` in `src/app.jsx` writes the envelope photo ids through unchanged on a file restore and on a server apply.

**Pinned by:**

- 19.6 and 19.11–19.12: a photo-less restore keeps the ids, and the sweep leaves the blob.
- 26.11–26.12: a merge keeps ids whose blob is on this device.
- 26.13 and 26.13b: a server apply keeps an id the Worker lacks, and an unreadable list keeps it too.
- 26.13c: the Sync panel says photos need something, not that they are lost.
- 30.10 and 30.13: a photo the Worker lacks stays on the envelope, and an unreadable store keeps every id.

Kind: build

Plan: decisions/sync-revamp-cloudflare.md#web-plan (web)

## See also

- `photo-ids-unreadable-local` — the local half of the same keep-or-strip rule.
- `pull-fetches-photos-before-apply` — the order that keeps the ids a pull needs.
- `photos-stay-out-of-the-ledger` — the boundary this rule protects.
- `a-restore-is-not-local` — the restore path this rule guards.
