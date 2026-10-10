# Palette token contrast ratios

This record holds the contrast ratio of every token, as the palette table gives them. It also holds notes on the tokens that need care. Re-measure after a change to any hex value in the `C` object.

## How to re-measure

Take each token pair in the table below. Compute each ratio against the surface the table names. Do not use `card` by default. Check `inkSoft` and `manilaInk` first, because both sit on a background other than the plain page. No tool is named here. Use a standard contrast calculator with the hex pairs in the table.

## Reader

No reader. Nothing in the test suite checks a contrast ratio.

## Figures

| token | value | role | contrast |
|---|---|---|---|
| `paper` | `#F2E9DA` | the page | — |
| `card` | `#FCF6EA` | any raised surface; **the theme's "white"** | — |
| `ink` | `#332E3F` | primary text | 10.88:1 on paper |
| `inkSoft` | `#6E6379` | secondary text | 5.24:1 on card |
| `line` | `#DCCDB6` | rules, borders | — |
| `accent` | `#6F5CA6` | active controls, progress | 5.19:1 on card |
| `green` | `#2E7A5E` | received | — |
| `greenSoft` | `#E6E7D7` | checked-row wash (gold-warmed) | ink on it 10.46:1 |
| `red` | `#A8443C` | missing money, destructive | — |
| `redSoft` | `#F4E4D9` | danger wash | red on it 4.76:1 |
| `manila` | `#EADBBA` | advisory background | — |
| `manilaInk` | `#695832` | text **on manila** | 5.04:1 on manila |
| `amber` | `#846008` | 14-day lost-mail warning | 5.33:1 on card |
| `gold` | `#C9A961` | ornament only (masthead rules, completed-package gild) — **never text** | 2.09:1 on card |
| `silver` | `#C4C3C0` | the empty half of a progress bar | fill on it 3.17:1 |
| `wax*` | five values | the seal's relief ramp, `<Seal>` only | — |
| `shadow` | `rgba(28,43,36,0.06)` | card shadows | — |
| `scrim` | `rgba(28,43,36,0.92)` | the photo viewer's backdrop | — |

Everything carrying information clears 4.5:1. These values need care, and should not be nudged casually:

- **`inkSoft`** was darkened from `#7A6E86`, which measured 4.43:1 and failed. It is used 42 times, more than any token but `ink`.
- **`manilaInk`** is checked against **`manila`**, not against `card`. It sits on the advisory background. Pick it on the wrong pair, and it looks fine in isolation while it fails everywhere it is used.
- **`silver`** was chosen on looks, not legibility. The `line` it replaced measured better against the violet fill, at 3.58:1 against 3.17:1. Both clear the 3:1 floor for graphical objects, so the trade is fair. If `silver` is ever revisited, it must stay **cool**. Every warm metal tested (pewter, deep parchment) fell below 3:1 against violet.
- **`gold`** is ornament only. At 2.09:1 on `card`, it fails for text by a wide margin. It is used for the masthead rules and the completed-package gild, both ornament.
