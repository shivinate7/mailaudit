# A restore keeps a photo id when known

A restore keeps a photo id when its blob is in the payload, already live on this device, or confirmed on the photo remote. Strip the rest. If the local photo store is unreadable, keep every id, as `photo-ids-unreadable-local` sets out.

**Holds while:** `applyBackup` in `src/app.jsx` keeps the union of local ids, inlined ids and `extraPresent`, and keeps every id when the local read returns `null`.

The old rule was all-or-nothing on `data.photos`. That is right for a file restore onto a fresh origin. Everywhere else it is silent data loss. A pushed payload never carries photos, because photos stay local by design. So pulling onto the very device that took them stripped every id. The sweep effect then deleted the JPEGs from IndexedDB two seconds later, with nothing to restore from.

The same bug was latent on the file path, a plain Backup followed by restore on the same device. It was rarely exercised there. Tests 19.11–19.12, 26.11–26.13.

The third arm, `extraPresent`, came with photo sync. It matters in two places that a narrower rule would fail. One GET fails out of twelve. That would strip one id. The debounced save would write the stripped ledger, and the next push would publish it. That severs the link to a photo safe on GitHub, which a retry would have fetched. If the photo repo cannot be reached at all, every id would go at once.

Keeping an id costs a blank manila tile until the next pull. Stripping it costs the photo. So test 26.13 splits in two. An id is stripped only when the store was read and did not hold it (26.13). An id is kept when the store could not be read (26.13b).

**Pinned by:** 26.11–26.13 for the ids. Mutant confirmed red: a pull that reuses the old all-or-nothing predicate.

## See also

- `photo-ids-unreadable-local` — the local half of the same keep-or-strip rule.
- `pull-fetches-photos-before-apply` — the order that keeps the ids a pull needs.
- `photos-stay-out-of-the-ledger` — the boundary this rule protects.
- `a-restore-is-not-local` — the restore path this rule guards.
