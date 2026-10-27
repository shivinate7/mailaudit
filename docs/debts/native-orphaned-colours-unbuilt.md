# The native Orphaned view uses system colours

**What.** The native Orphaned view paints from `shared/tokens.json` through `OrphanedPaint`, and a unit test pins the meanings (`orphaned-colours-by-meaning`). Its three accessibility audits still fail, so the lane has not landed. Two kinds of issue remain. First, "Contrast failed" on the Edit, Discard and Cancel mini buttons, though each pair clears 4.5:1; a scratch matrix ties it to a bordered mini button in a 44pt frame. It waits on the owner's ruling on a narrow skip. Second, an intermittent "Potentially inaccessible text" with no element and a zero frame in both composer audits, in 3 of 4 runs with the field autofocused and 0 of 1 without autofocus. It is not classified. The gap closes when the Orphaned UI audits pass.

**Status:** partly built: paint is in, audits red.

**Decision:** `orphaned-colours-by-meaning`.
