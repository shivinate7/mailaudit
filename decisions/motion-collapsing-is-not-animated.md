# Collapsing a card runs with no animation

Closing a card happens at once, with no exit animation. An exit animation would keep the rows mounted and shrink the card a moment later. By then the thumb has moved on, so the delayed change is worse than an instant one.

## The argument, as recorded

```
  **Collapsing is deliberately not animated**, and that is the same rule read
  the other way. An exit animation means keeping the rows mounted past the tap
  and shrinking the card a fifth of a second later — a *delayed* layout change,
  under a thumb that has already moved on, which is worse than an immediate
  one. The caret carries both directions instead (200ms, the sheet's easing);
  on the way closed it is the only thing that moves.
```
