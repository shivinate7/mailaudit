# useJustBecame guards every celebration animation

Every celebration marks a state a package can already be in, so a plain CSS class would replay the animation on every re-render. The hook fires only when a value flips from false to true while the component stays mounted, never on a fresh mount.

## The argument, as recorded

```
**`useJustBecame` is the load-bearing piece and the one to protect.** Every
celebration here marks a state a package can already be *in*, so a bare CSS
class would replay its animation each time React rebuilt the tree: switching
Packages → Tally and back would restamp every finished order at once, and a
re-sort would do it again. The hook returns true only when its value rises
false → true **while the component stays mounted**, and never on a fresh mount.
It is also the more honest reading — the moment worth marking is the check-in,
not the fact of having been checked in. Tests 43.3–43.6; 43.4 and 43.6 are a
pair, and a mutant that classes the stamp on `done` alone passes the first and
dies on the second.
```
