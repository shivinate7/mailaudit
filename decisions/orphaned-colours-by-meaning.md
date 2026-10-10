# Orphaned uses colour for the same meanings

Orphaned uses the app's colour meanings. Manila marks advisory items. Green marks an exact match or a check-in. Red marks a destructive control.

In Orphaned, manila marks the ambiguity warning, the "as typed" row in the composer, and the "no outstanding copy" tag. Manila also fills a photo tile while its image loads. That fill is a placeholder, not an advisory.

In Orphaned, green marks an exact match, the armed check-in confirm, and the Undo notice that reports a check-in. The Undo notice uses the shared `Notice` component, which is green in every view.

In Orphaned, red marks Discard, and the Remove photo control in the composer.

Open: the owner has not ruled whether green and red stay scarce in Orphaned. Until a ruling, the list above is what the code paints.

**Holds while:** `EnvelopeCard` in `src/app.jsx` paints Discard with `C.red`. `PhotoStrip` paints Remove photo with `C.red`, and only `EnvelopeComposer` passes it `onRemove`. `Notice` paints `C.greenSoft` with a `C.green` border. The exact-match text and the armed check-in button paint `C.green`. `EnvelopeComposer` paints its "as typed" row with `C.manila`.

## See also

- `palette-tokens-contrast-floor` — the role each colour carries across the whole app.
- `orphaned-mail-never-decides` — the invariant that stops an exact match from deciding anything.
