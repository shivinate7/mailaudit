# Palette token contrast ratios

This record holds the contrast ratio of every token, as the palette table gives them. It holds the two tokens the table flags as load-bearing. Re-measure after a change to any hex value in the `C` object.

## How to re-measure

Take each token pair the table names. Compute the contrast ratio against the surface the table names, not against `card` by default. Check `inkSoft` and `manilaInk` first, because both sit on a background other than the plain page. The prose names no tool. Use a standard contrast calculator against the hex pairs in the fence.

## Reader

No reader. Nothing in the test suite checks a contrast ratio.

## The figures, as recorded

```
| token | hex | role | contrast |
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
| `gold` | `#C9A961` | ornamental rules only — **never text** | 2.2:1 on card |
| `silver` | `#C4C3C0` | the empty half of a progress bar | fill on it 3.17:1 |
| `wax*` | five values | the seal's relief ramp, `<Seal>` only | — |

Everything carrying information clears 4.5:1. Two values are load-bearing in a
non-obvious way and should not be nudged casually:

- **`inkSoft`** was darkened from the originally-chosen `#7A6E86`, which measured
  4.43:1 and failed. It is used 42 times, more than any token but `ink`.
- **`manilaInk`** is checked against **`manila`**, not against `card` — it sits on
  the advisory background. Pick it on the wrong pair and it looks fine in
  isolation while failing everywhere it's actually used.
- **`silver`** was chosen on looks, not legibility: the `line` it replaced
  measured *better* against the violet fill (3.58:1 vs 3.17:1). Both clear the
  3:1 floor for graphical objects, so it's a fair trade — but if it's ever
  revisited, it has to stay **cool**. Every warm metal tested (pewter, deep
  parchment) fell below 3:1 against violet.
- **`gold`** is ornament only. At 2.2:1 on `card` it fails for text by a wide
  margin; it exists for the masthead rules and nothing else.
```
