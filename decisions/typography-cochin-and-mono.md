# Cochin sets words, monospace sets numbers

Cochin sets everything that is not a number. Monospace sets numbers, ids, and labels. The app has no sans-serif font.

**Holds while:** the `cochin` and `mono` constants are defined in `src/app.jsx`, no `sans` constant is defined there, and the root `div` sets `fontFamily: cochin`.

The `cochin` constant is the Cochin font stack. Its last family is the generic `serif`. The `mono` constant is the monospace stack. The `sans` constant is gone.

The root element sets `fontFamily: cochin`. Every element inherits that font. Form controls do not inherit it on their own, so they need their own rule. See `design-form-controls-no-inherit`.

## See also

- `design-view-switch-equal-thirds` — the one exception to mono for numbers, the outstanding pill.
- `design-form-controls-no-inherit` — form controls need their own font rule.
- `design-parchment-ledger` — the palette these fonts are set on.
- `masthead-is-one-letterhead` — MANIFEST is set in Cochin caps.
