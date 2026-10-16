# A merge fetches photos before it applies

A held Worker reply fetches the photos it names before it applies the ledger. A merge does the same. The pull inside a merge follows the same order. The Pull control that used to call this path left the UI on 2026-10-12.

**Holds while:** `doMerge` in `src/app.jsx` calls `pullPhotos` before `applyBackup`.

The order does not decide which ids survive. A merge and a server apply keep every id. So an apply-first order keeps the same ids (`photo-ids-restore-keep-if-known`).

The order serves the photo. A merged envelope whose blob is already here shows its photo when the ledger lands. A blob that has not arrived shows a blank tile until a sync brings it. A download that fails keeps its id, so a later try can fetch the blob.

**Pinned by:** 30.5–30.9 assert the outcome of a merge. The id is kept, and the blob is on this device afterwards. Its bytes and type survive the round trip, and the sweep leaves it. They do not separate the two orders. Test 30.6's name says "because it downloaded the blob first", but the id is kept either way. Mutant (a merge that applies before it downloads): unmeasured at this head.

Kind: build

Plan: decisions/sync-revamp-cloudflare.md#web-plan (web)

## See also

- `photo-ids-restore-keep-if-known` — the rule that keeps every id on a merge, and drops a restore's ids this device does not hold.
- `merge-later-change-wins` — the merge that unions the envelopes.
- `merge-carries-no-two-tap-arm` — the merge's entrances.
- `every-restore-passes-applybackup` — the apply that this order precedes.
