# Sync particulars are ruled label and value pairs

The particulars under the sync grid are the head cells' two parts, laid on their side. Each has a micro-label beside a mono value. The labels are `LEDGER`, `PHOTOS` and `KEY`.

**Holds while:** `partGrid` in `src/app.jsx` lays out the particulars.

The particulars replace a target line. That line floated after the buttons as bare text.

The value track is `minmax(0, 1fr)`. So the 44-character photo target wraps inside the track at 375px. It does not push the panel past the page.

## See also

- `sync-panel-is-two-column-grid` — the grid these particulars sit under.
- `ruled-head-masthead-vocabulary` — the head cells whose two parts these copy.
- `token-field-is-sixteen-pixels` — the key field that the particulars lead into.
