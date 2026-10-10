# Collapsing a card runs with no animation

Closing a card happens at once, with no exit animation. The motion-timings record has the caret duration. An exit animation would keep the rows mounted and shrink the card a moment later. By then the thumb has moved on, so the delayed change is worse than an instant one.

## See also

- `motion-timings` — the caret duration and easing this ruling names.
- `motion-a-card-opens-in-order` — the opposite direction, which does animate.
