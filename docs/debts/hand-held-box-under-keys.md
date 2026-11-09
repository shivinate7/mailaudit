# A held card's box can sit under the keys

**What.** On Card in Hand on the open Duo, the Suspense and Released boxes sit below the matches. Both boxes can sit under the keys in three cases. The first is large text (AX3 in the mockup `duo-hand-notice-match`). The second is two or more matches (estimated, unmeasured). The third is default text with one match, once the word suggestions show above the keys. That last case is measured: on 2026-11-07 the suggestions raised the keys from about 428 pt to about 406 pt, cut the Suspense box's last line, and hid the Released box (design review shots). Then nothing above the keys says a card is held or released. The owner then types the next card without seeing that one is waiting. Read from the mockup and the code; unmeasured on the simulator. A chip in the search field (`hand-held-chip`) now says above the keys that a card is held or released. The gap closes when the chip says a card is held above the keys at AX3 with two matches, and a test pins it.

**Status:** Fixed in code at fc45f60; UI tests on hand-held-chip-t not yet run on Duo.

**Decision:** `duo-card-in-hand`.
