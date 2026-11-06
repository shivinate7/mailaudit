---
paths:
  - "src/photo-rules.mjs"
  - "src/app.jsx"
---

# Photos

## Envelope photos

A photo is a picture of a mailing label. It never enters the ledger, and it can never lose a conflict.

- `photos-stay-out-of-the-ledger` — Photo blobs never enter the ledger.
- `photo-sync-cannot-conflict` — Photo sync cannot conflict by design.
- `photo-errors-never-hit-pushstate` — A photo error never reaches pushState.
- `photo-ids-restore-keep-if-known` — A restore keeps only the photo ids this device holds.
- `photo-ids-unreadable-local` — An unreadable local photo store keeps ids.
- `photo-thumbnails-and-viewer` — Thumbnails are 56px squares, and the viewer is a modal dialog.
- `photo-sweep-two-guards` — The photo sweep has two guards.
- `pull-warns-on-what-it-drops` — A lost photo warns after 7 days, never on the pull.
- `label-photos-downscale-to-2000px` — Label photos downscale to 2000px.
- `orphan-sweep-drops-unused-photos` — The sweep drops photos no envelope or draft uses.
