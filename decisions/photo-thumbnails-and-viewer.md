# Photo thumbnails are 56px squares, and the viewer is a scrim

Photo thumbnails are 56px squares. The viewer is a full-screen scrim. A tap anywhere in the viewer dismisses it.

**Holds while:** `PhotoStrip` in `src/app.jsx` sets each thumbnail to 56 by 56 pixels, and the viewer's backdrop is `C.scrim`, which closes on any click.

## See also

- `photos-stay-out-of-the-ledger` — where the photo blobs are kept, which this record does not change.
- `palette-tokens-contrast-floor` — the `scrim` token and its value.
