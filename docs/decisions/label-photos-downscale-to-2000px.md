# Label photos downscale to 2000px

An envelope photo is a snap of the mailing label. The label keeps a tracking number or a sender that the user would not type.

**Holds while:** `MAX_EDGE` in `src/app.jsx` is 2000, and the JPEG encode quality is 0.8.

The camera opens from `<input capture="environment">`. The image is canvas-downscaled to a 2000px long edge at JPEG 0.8. That size is big enough to read a label. It is small enough not to matter.

The file goes straight to IndexedDB. Envelopes carry only photo ids. So the blob never enters the ledger JSON.

Thumbnails sit on the envelope card. Tapping one opens a full-screen viewer. Object URLs are revoked on unmount. A leaked URL pins the whole image in memory for the life of the page.

## See also

- `photos-stay-out-of-the-ledger` — why the blob never enters the ledger.
- `orphan-sweep-drops-unused-photos` — how unused photos are removed.
- `photo-rules-fails-quietly` — the pure photo rules that name the stored files.
- `newer-features-test-proof-only` — the camera path has never run on a real iPhone.
