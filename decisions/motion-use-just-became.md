# useJustBecame guards every celebration animation

Every celebration marks a state that a package can already be in. So a bare CSS class would replay its animation each time React rebuilt the tree. For example, switching Packages → Tally and back would restamp every finished order at once. A re-sort would do it again.

**Holds while:** `src/app.jsx` defines `useJustBecame`, `PackageCard` gates its stamp on `useJustBecame(done)`, and tests 43.4 and 43.6 exist in `test/app.test.mjs`.

So `useJustBecame` is the load-bearing piece, and it must be protected. The hook returns true only when its value rises false → true **while the component stays mounted**. It never returns true on a fresh mount. That is also the more honest reading. The moment worth marking is the check-in, not the fact of having been checked in.

Tests 43.3–43.6. Tests 43.4 and 43.6 are a pair. A mutant that classes the stamp on `done` alone passes the first and dies on the second.

## See also

- `motion-completed-package-gilded` — one animation this gate protects from replaying.
- `motion-a-card-opens-in-order` — the other animation this gate protects from firing on load.
