# inkSoft and manilaInk are checked against the right surface

The `inkSoft` token was darkened. It came from the originally chosen `#7A6E86`, which measured 4.43:1 and failed. It is used 42 times, more than any token but `ink`.

The `manilaInk` token is checked against `manila`, not against `card`. It sits on the advisory background. Pick it on the wrong pair, and it looks fine in isolation. It fails everywhere it is actually used.

The measured ratios for both tokens live in `palette-contrast`.

## See also

- `palette-contrast` — the measured ratios behind both tokens.
- `palette-token-table-and-contrast-floor` — the full token table these two tokens belong to.
