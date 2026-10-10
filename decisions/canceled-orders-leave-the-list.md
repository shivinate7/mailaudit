# Canceled orders leave the list, not the record

A canceled order leaves the list. It also leaves every count. The app keeps it on record for audit.

**Holds while:** `src/app.jsx` renders the link text `N canceled — view`, and a dashed reference section.

The Find row shows the link `N canceled` in a ruled cell beside the search. It is not an underlined link on a line of its own. Tapping it scrolls to a dashed reference section. That section supports refund auditing.

Tracked and untracked orders show a dot in the header meta. ● means tracked. ○ means untracked. The dot sits beside a word.

Refunded and partial-refund packages leave the same way. See `a-refund-leaves-every-count`.

## See also

- `a-refund-leaves-every-count` — the refund exclusion that works the same way.
- `lost-mail-flags-use-order-date` — the warning that canceled orders never show.
- `orphaned-mail-never-decides` — why canceled orders are never a candidate.
- `cost-basis-excludes-ship-and-tax` — the counts a canceled order leaves out.
