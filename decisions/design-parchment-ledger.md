# The palette is parchment ledger

The theme is named "Parchment ledger" (palette D▸, Violet Evergarden–inspired). It is a warm parchment page with violet ink and accent. Gold is the secondary color.

**Holds while:** no hex, rgb() or `rgba()` color value appears in code in `src/app.jsx`, and the palette values live only in `shared/tokens.json`. Test 60.10 pins the colour literals. The file contains no `#fff` literal. The keyword `transparent` is not a color value, so it may appear anywhere in code.

Every color lives in `shared/tokens.json`. `src/app.jsx` reads that file as `C`. No color literal appears anywhere else in the file. The theme has no pure white. Never reach for `"#fff"`. Use `C.card`, which is the off-white parchment surface.

The CSS keyword `transparent` is not a color literal. It names no color and paints nothing, so the rule does not forbid it. Its uses, as backgrounds, gradient stops and `-webkit-tap-highlight-color`, are allowed.

The native client follows the same rule. `Parchment` in `native/Manifest/Theme.swift` builds every `Color` from the decoded file, and it names no colour value. The interface is held to light (`UIUserInterfaceStyle`), so the paper is the only appearance.

Translucency comes from `color-mix(in srgb, <token> <percent>, transparent)` over a token, not from `rgba()`. The bar's glass fill is the paper token at 62%. Its active tab is the card token at 90%. See `phone-nav-is-bottom-bar`.

**Pinned by:** 60.10 (no colour literal in the code of `src/app.jsx`).

Two tokens look odd. Each has a reason:

- **`greenSoft`** is warmed with a little gold. A straight green-into-card mix, `#E7EADC`, read grey next to parchment. Green still leads (G > R), so a checked row keeps its "received" cast and does not go beige.
- **`wax`** and its four relief tokens are the masthead seal's ramp. Only `<Seal>` uses them. They sit in the palette so that no color literal sits outside it. `wax` has the value of `red`, but it is named apart. The seal is ornament, not a danger state, so the two may diverge.

## See also

- `palette-tokens-contrast-floor` — the full token table this ruling names.
- `design-view-switch-equal-thirds` — the retired switch that used this same palette.
- `palette-theme-color-tracks-paper` — the rule that keeps the browser chrome matched to this palette.
