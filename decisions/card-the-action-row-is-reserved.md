# The card action row reserves its tallest height

The action row's buttons change on the same tap that changes the card. The row reserves the tallest height any combination of buttons can need. One width, 320 pixels, still shifts by a smaller amount. The app leaves that gap alone, because 320 pixels falls below its own stated width floor.

## The argument, as recorded

```
**The action row is reserved at its tallest state** (`BULK_ROW_H`, 44px of
content). Its membership changes on the same tap — "Clear check-ins" joins
"Stamp" and "Mark all received" — and at 375px those three want 60.6 + 143.7 +
129.9 plus two 8px gaps = **350px in the 313px a card gives them**, so both bulk
labels wrap to a second line and the row goes 31px → 44px. It shrinks by the
same 13px on the tap that *completes* a package, where "Mark all received"
leaves; reserving the tallest state pins both transitions at once. A counted
constant exactly like the save slot's 13ch, and stale the same way — two lines
of 11.5px mono plus `miniBtn`'s 8px padding. **The Tally card's row is
deliberately NOT reserved**: it has no Stamp button, so its two buttons are
282px of the same 313px, neither wraps, and it is one line in every state. Add a
third control there and reserve it then, measuring rather than assuming 44 fits.

Measured on the built page against the seeded ledger, rest → first check-in →
second → the tap that completes the package: **card height constant at 347.09px
and every item row displaced 0.00px**, horizontal overflow 0 in every state; the
Tally card likewise **496.09px constant, 0.00px shift**. Row content needed
against the 44 reserved, by width: 57 at 320px, 44 at 360 / 375 / 390, 31 at 430
and 760.

**So 320px is the one width this does not fully fix** — three buttons wrap to a
*third* line there and the row still steps 13px (the bar half is
width-independent, so 320 improves from 28px to 13px). Left deliberately: 320 is
below this file's own stated 380px floor and is not a viewport current iOS runs,
and reserving 57 would buy it by spending 26px of dead space in every expanded
card at the widths that are real. If it is ever wanted, the way to get it
without the dead space is to keep all three buttons mounted and hide the
inapplicable one — the row then measures itself at every width — at the cost of
the visible label wrapping at rest, which is a look and therefore a decision to
put to the owner rather than a fix to apply.
```
