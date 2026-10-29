# Sync particulars are ruled label and value pairs

The particulars under the sync grid are the head cells' two parts, laid on their side. Each has a micro-label beside a mono value. The labels are `LEDGER`, `PHOTOS` and `KEY`.

**Status:** ruled, code queued. The code today labels the rows Server, Last sync and Sync key. The owner ruled on 2026-10-27 12:25 CDT: change the web labels back to `LEDGER`, `PHOTOS` and `KEY`, and the native Sync panel follows. The change waits for the sync-labels lane, which runs after the native step 4 lands and re-checks the screens.

**Holds while:** `partGrid` in `src/app.jsx` lays out the particulars.

The particulars replace a target line. That line floated after the buttons as bare text.

The value track is `minmax(0, 1fr)`. So the 44-character photo target wraps inside the track at 375px. It does not push the panel past the page.

## See also

- `sync-panel-is-two-column-grid` — the grid these particulars sit under.
- `ruled-head-masthead-vocabulary` — the head cells whose two parts these copy.
- `token-field-is-sixteen-pixels` — the key field that the particulars lead into.
