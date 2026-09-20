# A card lays its rows down in order

Opening a card reveals the bulk row, then each item row, one beat behind the last. The stagger caps at 132 milliseconds, so a long order still finishes promptly. `useJustBecame` gates this, so a package that starts already open does not animate on load.

## The argument, as recorded

```
- **A card opening lays its contents down in order.** The bulk row, then each
  item row, each a beat behind the last (`mdl-reveal`, 240ms, opacity and 4px)
  — a letter unfolded rather than a light switched on. The stagger is **capped
  at 132ms**, so past the sixth row every remaining row shares the last beat
  and a twenty-line order finishes as promptly as a three-line one (measured:
  delays 0/22/44/66/88/110/132/132/132, everything settled by 372ms).
  It is gated on `useJustBecame` for a reason particular to this card: an
  unreceived package **starts expanded** (`useState(!done)`), so a bare class
  would set every open card on the page animating at once on load, competing
  with the letterhead's own sequence. Measured on the seeded ledger: 0 reveals
  fire on load, 9 on a card opened by hand.
```
