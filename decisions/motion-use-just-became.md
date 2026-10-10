# useJustBecame guards every celebration animation

Every celebration marks a state a package can already be in, so a plain CSS class would replay the animation on every re-render. The hook fires only when a value flips from false to true while the component stays mounted, never on a fresh mount.

## See also

- `motion-a-completed-package-is-gilded` — one animation this gate protects from replaying.
- `motion-a-card-opens-in-order` — the other animation this gate protects from firing on load.
