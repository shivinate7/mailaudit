# Photo blobs never enter the ledger

Envelope photos live in IndexedDB. Only their ids travel inside the ledger. The image blob itself never enters the ledger JSON. Envelopes carry only photo ids.

**Holds while:** `snapshot()` in `src/app.jsx` builds the payload from named fields with no photo blobs, and `payload.photos` is set only when `withPhotos` is true.

Thumbnails appear on the card. Tapping one opens a full-screen viewer. The app revokes each thumbnail object URL on unmount. Leaking those URLs would pin whole images in memory for the life of the page.

## See also

- `photo-ids-restore-keep-when-known` — the rule for restoring the ids this file keeps out.
- `photo-sync-cannot-conflict` — why the id-only design stays conflict-free.
