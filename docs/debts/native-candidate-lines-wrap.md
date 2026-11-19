# Native candidate meta line wraps

**What.** On a candidate row in `native/Manifest/OrphanedView.swift`, the line with the date, the untracked tag and the order id wraps at large Dynamic Type. The web row keeps it on one line. The seller is one line, as on the web, but it first shrinks to half its size (`minimumScaleFactor(0.5)`, about 7pt) before it truncates, where the web truncates at full size. One line with `minimumScaleFactor(0.5)` still made the tie audit call the meta line clipped (measured 2026-10-27).

**Status:** closed by owner ruling, page item 56 (`orphaned-meta-line-wraps`), option a, 2026-11-18 23:17 CST: the wrap is right on the phone. The debt named two ways to close: a one-line meta line that passes the audit, or this ruling. Option b, keep looking for a one-line version, is not chosen. The deviation is kept on purpose, so the audit reads all the text.

**Decision:** `orphaned-colours-by-meaning`.
