# Every colour token meets a contrast floor

The app defines one fixed set of colour tokens, each with a named role. Every token that carries information clears a 4.5 to 1 contrast ratio. The palette-contrast record holds the measured ratio for each token.

## The argument, as recorded

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
```

## See also

- `palette-contrast` — the measured ratio for every token in this table.
- `palette-gold-is-ornament-only` — the one token in this table that fails the floor on purpose.
- `palette-inksoft-and-manilaink` — two tokens from this table checked against their real surface.
- `palette-silver-stays-cool` — a token from this table chosen for contrast over warmth.
