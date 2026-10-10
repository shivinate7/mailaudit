# A card lays its rows down in order

Opening a card reveals the bulk row, then each item row, one beat behind the last. The motion-timings record has the exact stagger and cap. A long order still finishes promptly. `useJustBecame` gates this, so a package that starts already open does not animate on load.

## See also

- `motion-timings` — the exact beat delays and cap this stagger uses.
- `motion-use-just-became` — the gate that keeps this reveal from firing on load.
