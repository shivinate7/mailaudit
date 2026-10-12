# Canceled orders leave the list, not the record

A canceled order leaves the list. It also leaves every count. The app keeps it on record for audit.

**Holds while:** `src/app.jsx` shows `{canceledCount} canceled` as a button in the ruled row above the list, and it shows the reference section while `showCanceled` is set.

On the list views (Tally and Packages), the ruled row above the list shows `N canceled` with a caret, right-aligned. The caret shows whether the section is open. It is not an underlined link on a line of its own. The row shows only while the ledger holds items, and only while a canceled order (or, on Packages, a stamped one) needs it. Tapping the cell opens a dashed reference section below the list, and scrolls to it. That section supports refund auditing. The Find pill above the bottom bar replaced the old Find row (`phone-nav-is-bottom-bar`).

Tracked and untracked orders show a dot in the header meta. ● means tracked. ○ means untracked. The dot sits beside a word.

Refunded and partial-refund packages leave the same way. See `a-refund-leaves-every-count`.

## See also

- `a-refund-leaves-every-count` — the refund exclusion that works the same way.
- `candidates-skip-date-filter` — canceled orders are never a candidate.
- `cost-basis-excludes-ship-and-tax` — the counts a canceled order leaves out.
