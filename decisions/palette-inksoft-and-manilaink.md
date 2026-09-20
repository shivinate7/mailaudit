# inkSoft and manilaInk are checked against the right surface

The `inkSoft` token was darkened from an earlier value that failed its contrast check. The palette-contrast record has the measured ratios for both tokens. The `manilaInk` token is checked against the `manila` background it actually sits on, not against the card surface.

## The argument, as recorded

```
- **`inkSoft`** was darkened from the originally-chosen `#7A6E86`, which measured
  4.43:1 and failed. It is used 42 times, more than any token but `ink`.
- **`manilaInk`** is checked against **`manila`**, not against `card` — it sits on
  the advisory background. Pick it on the wrong pair and it looks fine in
  isolation while failing everywhere it's actually used.
```

## See also

- `palette-contrast` — the measured ratios behind both tokens.
- `palette-token-table-and-contrast-floor` — the full token table these two tokens belong to.
