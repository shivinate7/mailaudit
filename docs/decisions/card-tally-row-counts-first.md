# The Tally row degrades sets first, never counts

At iPhone width, the Tally row is tight. The right-hand column holds three lines: count, basis, and outstanding. The meta line under the name truncates. The meta line is ordered counts first: `3 sellers · 3 orders · <sets>`. So the long set list is what degrades to an ellipsis. The counts never truncate. Keep this order if you add anything to that line.

The outstanding line stays mounted once its copy is complete. It is hidden, not removed. Removing it took 13.5px off the header on the tap that completes the copy, and moved every row in the card with it. The column keeps its three lines in every state, so the card does not change height on that tap (`no-layout-shift-under-pointer`).

Kind: build

Plan: docs/decisions/card-tally-row-counts-first.md#web-plan (web)

**Holds while:** the Tally row meta line in `src/app.jsx` (`ItemTotalRow`) lists the seller count and the order count before the set label. The outstanding line in that component stays mounted, hidden once `done`.

## Web plan

Keep the outstanding line in `ItemTotalRow` mounted once the copy is done. Hide it with `visibility: hidden` and `aria-hidden`. Built at `1607933`. The 13px line height in the same commit sits on the copy rows (`ItemRow`), not on this meta line.

## See also

- `card-the-action-row-is-reserved` — the other card ruling that reserves space against a change in content.
- `no-layout-shift-under-pointer` — the invariant this ordering choice protects.
- `card-reserved-geometry` — the measured Tally card heights, and the two causes of its later check-in shift.
