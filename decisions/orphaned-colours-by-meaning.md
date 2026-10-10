# Orphaned uses colour for the same meanings

Orphaned uses the app's colour meanings. Manila marks advisory items. Green marks an exact match or a check-in. Red marks a destructive control.

Manila marks advisory items in Orphaned. These are the ambiguity warning, the "as typed" row in the composer, and the "no outstanding copy" tag.

Green marks an exact match, and the armed check-in confirm. The Undo notice, which reports a check-in, also uses green.

Red marks a destructive control. In Orphaned, these are Discard, and the composer's Remove photo control.

**Holds while:** `EnvelopeCard` in `src/app.jsx` paints Discard with `C.red`, and `EnvelopeComposer` paints its "as typed" row with `C.manila`.

## See also

- `palette-tokens-contrast-floor` — the role each colour carries across the whole app.
- `orphaned-mail-never-decides` — the invariant that stops an exact match from deciding anything.
