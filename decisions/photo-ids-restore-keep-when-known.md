# A restore keeps a photo id when known

A restore keeps a photo id in three cases only. The blob must sit in the payload, already live on this device, or be confirmed on the photo remote. Anything else gets stripped. A pushed payload never carries photo blobs, so pulling onto the very device that took the photos once stripped every id. The sweep then deleted the actual files two seconds later.

## See also

- `photo-ids-unreadable-local` — the local half of the same keep-or-strip rule.
- `photos-stay-out-of-the-ledger` — the boundary this rule protects.
- `a-restore-is-not-local` — the restore path this rule guards.
