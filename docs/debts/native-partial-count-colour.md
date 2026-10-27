# The native partial count paints ink, where the web paints manila ink

**What.** On a line with some but not all copies in, the web `ItemRow` paints the got/qty count in `manilaInk`. The native stepper count (`count()` in `PackagesView.swift`) paints the `.name` part, which is ink for a partial line, and `PackageCard.token` has no part for the count. The design review of 2026-10-27 at `4ef7f4c` failed the partly checked state on this alone. The gap closes when `PackageCard.token` gives the count its own part, a unit test pins manilaInk for a partial line, and the view paints it.

**Status:** open. The fix rides with the step 4 Tally lane, which reuses the card's item line.

**Decision:** `native-parity-table`.
