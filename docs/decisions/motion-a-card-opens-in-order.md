# A card lays its rows down in order

Opening a card reveals the bulk row first. Then each item row appears, one beat behind the last. Each row uses `mdl-reveal`, which takes 240ms and moves opacity and 4px. The effect is a letter unfolding, not a light switching on.

**Holds while:** `.mdl-reveal` in `src/app.jsx` runs for 240ms, and the stagger caps at 132ms. The class is gated on `justOpened`, which comes from `useJustBecame`.

The stagger is capped at 132ms. Past the sixth row, every remaining row shares the last beat. So a twenty-line order finishes as promptly as a three-line one. Measured delays were 0/22/44/66/88/110/132/132/132, and everything settled by 372ms. The `motion-timings` record holds the exact stagger and cap.

It is gated on `useJustBecame` for a reason particular to this card. An unreceived package **starts expanded** (`useState(!done)`). A bare class would set every open card on the page animating at once on load. That would compete with the letterhead's own sequence. So a package that starts open does not animate on load. Measured on the seeded ledger: 0 reveals fire on load, and 9 fire on a card opened by hand.

## See also

- `motion-timings` — the exact beat delays and cap this stagger uses.
- `motion-use-just-became` — the gate that keeps this reveal from firing on load.
