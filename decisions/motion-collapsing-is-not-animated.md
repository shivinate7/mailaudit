# Collapsing a card runs with no animation

Closing a card happens at once, with no exit animation. The `motion-timings` record has the caret duration.

An exit animation would keep the rows mounted past the tap. It would shrink the card a fifth of a second later. That is a delayed layout change under a thumb that has already moved on. It is worse than an immediate change.

The caret carries both directions instead. It runs for 200ms with the sheet's easing. On the way closed it is the only thing that moves.

## See also

- `motion-timings` — the caret duration and easing this ruling names.
- `motion-a-card-opens-in-order` — the opposite direction, which does animate.
