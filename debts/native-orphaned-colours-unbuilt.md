# The native Orphaned view uses system colours

**What.** `native/Manifest/OrphanedView.swift` paints with system styles. The tie line, the "no outstanding copy" tag and the "Add … as typed" row use the default or the secondary text style, where `orphaned-colours-by-meaning` gives them manila. The exact-match line and Discard use system green and red. The Undo notice uses a grey fill, where the web notice is green. No native view reads `shared/tokens.json` yet, so the Packages view has the same gap. The gap closes when the Orphaned view takes its colours from the token file, and a test pins the meanings.

**Status:** open.

**Decision:** `orphaned-colours-by-meaning`.
