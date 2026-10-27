# Photo thumbnails are 56px squares, and the viewer is a modal dialog

Photo thumbnails are 56px squares. The viewer is a full-screen modal dialog, and its background is the scrim.

Focus moves into the viewer when it opens. Tab stays on it, because the picture is the only thing to reach.

A tap anywhere in the viewer dismisses it. Escape dismisses it too. On close, focus returns to the thumbnail that opened it.

**Holds while:** `PhotoStrip` in `src/app.jsx` sets each thumbnail to 56 by 56 pixels. `PhotoViewer` in `src/app.jsx` is the dialog, with `role="dialog"` and `aria-modal="true"`. Its backdrop is `C.scrim`, and its click closes it. Test group 70.3 pins the dialog semantics.

## See also

- `photos-stay-out-of-the-ledger` — where the photo blobs are kept, which this record does not change.
- `palette-tokens-contrast-floor` — the `scrim` token and its value.
- `no-native-dialogs` — the viewer is a DOM dialog, not one of the native browser dialogs that rule bans.
