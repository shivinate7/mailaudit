# The palette is parchment ledger

The theme is named "Parchment ledger" (palette D▸, Violet Evergarden–inspired). It is a warm parchment page with violet ink and accent. Gold is the secondary color.

**Holds while:** no hex or `rgba()` color value appears in code in `src/app.jsx` outside `const C`, and the file contains no `#fff` literal.

Every color lives in the `C` object at the top of `src/app.jsx`. No color literal appears anywhere else in the file. The theme has no pure white. Never reach for `"#fff"`. Use `C.card`, which is the off-white parchment surface.

## See also

- `palette-token-table-and-contrast-floor` — the full token table this ruling names.
- `design-the-view-switch-is-equal-thirds` — a control styled from this same palette.
- `palette-theme-color-tracks-paper` — the rule that keeps the browser chrome matched to this palette.
