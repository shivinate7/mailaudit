# The key field is 16px to stop iOS zoom

The sync key field is set at 16px. iOS zooms the page when a focused input is smaller than 16px.

**Holds while:** `keyField` in `src/app.jsx` sets `fontSize: 16`.

The field is a write-on rule, like the Find pill's input. It is not a box. The viewport meta leaves zoom on. So a smaller input would zoom the page on focus.

The old 12px box zoomed on every paste. The 16px size stops that. The GitHub token field this rule first covered has no screen path now (test 65.1), so the rule covers the sync key field.

**Retired:** tests 25.3, 25.5, 25.6 and 25.22, with the GitHub key field, on 2026-10-12.

**Pinned by:** 36.8. It is the one style assertion in the suite. It pins an iOS behaviour, not a look. Focusing any smaller input zooms the page.

## See also

- `design-form-controls-no-inherit` — the font rule that form controls also need.
- `ruled-head-heights` — the control height that the key field shares.
- `sync-particulars-ruled-values` — the particulars that lead into the key field.
