# The tally cells are not sized equally

The three tally cells, for cards, packages, and value, are not equal thirds. The value figure is much wider than the two counts, so it needed more room. The value cell now gets a larger flex share, and all three cells share the same headroom. The ruled-head-heights record has the measured headroom for each cell. `money()` still stays the exact format wherever a figure must read precisely.

## The argument, as recorded

```
The tallies are three ruled cells — cards, packages, value — each `done/total`.
**Not equal thirds.** The two counts are 7 characters (`480/800`) and the value
is 14–17 (`$45.8k/$77.66k`), so equal tracks starved the only cell that needed
room and left ~23px unused in each of the other two — the value ran into the
divider on its left, which is what got it reported from the phone. The value
cell is `flex: 1.7`; measured at 375px all three now land on the *same* headroom
(23.3 / 23.3 / 23.2px), and the six-figure case `$100.24k/$118.60k` fits rather
than clipping. Re-measure if the type size or the 6px cell padding changes.
Value is compacted (`compact()`: whole dollars under 1k, then `k`/`M` at ≤2dp,
zeros trimmed) because three figures share one row at 375px. **`money()` is
still the format anywhere a figure has to be read exactly**, including the
"still missing" line directly beneath, which is deliberately not rounded.
```

## See also

- `ruled-head-heights` — the measured headroom this uneven split produces.
- `masthead-is-one-letterhead` — the letterhead these tallies sit inside.
