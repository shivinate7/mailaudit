# The Duo keyboard gap is unmeasured

**What.** On the open Duo, every tab reserves the custom tab bar's height as a bottom scroll margin. The ruling keeps the bar under the keyboard, so with the keys up the margin still adds 76 pt of trailing scroll room above them. No run has measured how that looks at the end of a list. Card in Hand types a name on every card, so it shows on the main path. The keyboard panel also draws about 44 pt above the frame XCTest reports for it: 405 pt against 449 pt, read from one simulator screenshot on 2026-10-28.

**Status:** open. Measure it with the keys up at pose flat, scrolled to the end of a list.

**Decision:** `duo-card-in-hand`.
