# A restore keeps a photo id when known

A restore keeps a photo id in three cases only. The blob must sit in the payload, already live on this device, or be confirmed on the photo remote. Anything else gets stripped.

The rule is this. Keep an id if its blob is inlined in the payload, already present on this device, or known to be on the photo remote. Strip only the rest.

The old rule was all-or-nothing on `data.photos`. That is right for a file restore onto a fresh origin. Everywhere else it is silent data loss. A pushed payload never carries photos, because photos stay local by design. So pulling onto the very device that took them stripped every id. The sweep effect then deleted the JPEGs from IndexedDB two seconds later, with nothing to restore from.

The same bug was latent on the file path, a plain Backup followed by restore on the same device. It was rarely exercised there. Tests 19.11–19.12, 26.11–26.13.

## See also

- `photo-ids-unreadable-local` — the local half of the same keep-or-strip rule.
- `photos-stay-out-of-the-ledger` — the boundary this rule protects.
- `a-restore-is-not-local` — the restore path this rule guards.
