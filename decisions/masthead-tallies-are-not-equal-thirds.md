# The tally cells are not sized equally

The tallies are three ruled cells: cards, packages, and value. Each shows `done/total`. They are **not equal thirds**. The two counts are 7 characters, such as `480/800`. The value is 14–17 characters, such as `$45.8k/$77.66k`. Equal tracks starved the only cell that needed room. Each of the other two cells left ~23px unused, and the value ran into the divider on its left.

The value cell is `flex: 1.7`. Measured at 375px, all three cells now land on the same headroom: 23.3, 23.3, and 23.2px. The six-figure case `$100.24k/$118.60k` fits rather than clipping. Re-measure if the type size or the 6px cell padding changes. The `ruled-head-heights` record has the measured headroom for each cell.

Value is compacted with `compact()`. Whole dollars show under 1k. Above that, `k` or `M` shows at 2 decimal places or fewer, with zeros trimmed. Three figures share one row at 375px, so compaction is needed.

**`money()` is still the format anywhere a figure has to be read exactly.** That includes the "still missing" line directly beneath the tallies, which is deliberately not rounded.

## See also

- `ruled-head-heights` — the measured headroom this uneven split produces.
- `masthead-is-one-letterhead` — the letterhead these tallies sit inside.
