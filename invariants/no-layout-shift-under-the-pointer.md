# No layout shift under the pointer

Hiding a row under the user's tap caused cascading mis-taps on mobile. So checking a card must never shift the layout under the pointer.

- Under "Hide received", a checked row stays visible. It is "sticky". It stays until its package is fully received, or until the filters change. The resume reset clears sticky rows too. That is why the reset waits out `RESUME_RESET_MS`, rather than firing on every glance away.
- Sort order is snapshotted (frozen) while checking. It is recomputed only on a sort or filter change.
- Packages never auto-collapse mid-interaction.
- In the Tally view, the sticky rule is stricter. A *completed item* also stays until the filters change. Most items have a single copy. If it vanished on every tap, the mis-tap cascade would return.
- The card itself must not change height on that tap. See `card-the-action-row-is-reserved` (why the action row has a fixed height) and `card-reserved-geometry` (the measured card heights). The rows inside a package are as much under the thumb as the list is. Before that was fixed, the first check-in in a package moved every remaining row in it down by 28px.

A row moving under the thumb is the same failure this rule exists to stop.
