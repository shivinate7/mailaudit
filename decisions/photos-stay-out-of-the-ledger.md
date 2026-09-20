# Photo Blobs Never Enter The Ledger

Envelope photos live in IndexedDB, and only their ids travel inside the ledger. The image blob itself never enters the ledger JSON. The app revokes each thumbnail object URL on unmount. Leaving it would pin the whole image in memory for the life of the page.

## The argument, as recorded

```
  written straight to IndexedDB. Envelopes carry only photo ids; the blob never
  enters the ledger JSON. Thumbnails on the card, tap for a full-screen viewer.
  Object URLs are revoked on unmount (leaking them pins whole images in memory
  for the life of the page).
```
