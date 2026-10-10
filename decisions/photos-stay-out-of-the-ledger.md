# Photo blobs never enter the ledger

Envelope photos live in IndexedDB, and only their ids travel inside the ledger. The image blob itself never enters the ledger JSON. The app revokes each thumbnail object URL on unmount. Leaving it would pin the whole image in memory for the life of the page.

## See also

- `photo-ids-restore-keep-when-known` — the rule for restoring the ids this file keeps out.
- `photo-sync-cannot-conflict` — why the id-only design stays conflict-free.
