# No layout shift under the pointer

Hiding a row under the user's tap once caused cascading mis-taps on mobile. So a checked row stays visible until its package is fully received, or until the filters change. Sort order stays frozen while checking, and packages never auto-collapse mid-interaction. A card must also not change height on a tap. A row moving under the thumb is the same failure this rule exists to stop.

## The argument, as recorded

```
5. **No layout shift under the pointer while checking cards.** History: hiding a
   row on tap caused cascading mis-taps on mobile. Hence: under "Hide received",
   individually-checked rows stay visible ("sticky") until the package is fully
   received or filters change (the resume reset clears them too, which is why
   it waits out `RESUME_RESET_MS` rather than firing on every glance away);
   sort order is snapshotted (frozen) while
   checking and re-computed only on sort/filter changes; packages never
   auto-collapse mid-interaction. In the Tally view the sticky rule is
   stricter — a *completed item* also stays until filters change, because most
   items have a single copy and vanishing on every tap would recreate exactly
   the mis-tap cascade this invariant exists to prevent.
   **And the card itself must not change height on that tap** — see "The card's
   reserved geometry". The rows inside a package are as much under the thumb as
   the list is, and before that was fixed the first check-in in a package moved
   every remaining row in it down by 28px.
```
