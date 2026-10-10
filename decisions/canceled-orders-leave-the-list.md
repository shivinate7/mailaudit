# Canceled orders leave the list, not the record

A canceled order leaves the list. It also leaves every count. The app keeps it on record for audit.

**Holds while:** `src/app.jsx` shows `{canceledCount} canceled` as a button in the Find row, and it shows the reference section while `showCanceled` is set.

The Find row shows `N canceled` with a caret, in a ruled cell beside the search. The caret shows whether the section is open. It is not an underlined link on a line of its own. Tapping the cell opens a dashed reference section below the list, and scrolls to it. That section supports refund auditing.

Tracked and untracked orders show a dot in the header meta. ● means tracked. ○ means untracked. The dot sits beside a word.

Refunded and partial-refund packages leave the same way. See `a-refund-leaves-every-count`.

## See also

- `a-refund-leaves-every-count` — the refund exclusion that works the same way.
- `candidates-skip-date-filter` — canceled orders are never a candidate.
- `cost-basis-excludes-ship-and-tax` — the counts a canceled order leaves out.
