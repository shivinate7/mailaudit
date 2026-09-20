# Restore Keeps A Photo Id When Known

A restore keeps a photo id in three cases only. The blob must sit in the payload, already live on this device, or be confirmed on the photo remote. Anything else gets stripped. A pushed payload never carries photo blobs, so pulling onto the very device that took the photos once stripped every id. The sweep then deleted the actual files two seconds later.

## The argument, as recorded

```
**Photo ids on restore: keep an id when its blob is inlined in the payload,
  already present on this device, OR known to be on the photo remote; strip
  only the rest.** This used to be
  all-or-nothing on `data.photos`, which is right for a file restore onto a
  fresh origin and silent data loss everywhere else. A pushed payload never
  carries photos (they stay local by design), so pulling onto the very device
  that took them stripped every id — and the sweep effect then deleted the JPEGs
  from IndexedDB two seconds later, with nothing to restore from. The same bug
  was already latent on the file path (plain Backup → restore on the same
  device); it was simply rarely exercised. Tests 19.11–19.12, 26.11–26.13.
```

## See also

- `photo-ids-unreadable-local` — the local half of the same keep-or-strip rule.
- `photos-stay-out-of-the-ledger` — the boundary this rule protects.
- `a-restore-is-not-local` — the restore path this rule guards.
