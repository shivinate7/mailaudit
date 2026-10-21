# The native Orphaned view uses system colours

**What.** `native/Manifest/OrphanedView.swift` paints with system styles and three fixed colours. The tie line, the "no outstanding copy" tag and the "Add … as typed" row use the primary text style, because the secondary style failed the contrast audit. `orphaned-colours-by-meaning` gives them manila. The exact-match line, Discard and the prominent buttons use three hand-set colours that pass 4.5:1 in both themes (`palette-tokens-contrast-floor`), where the web uses its green, red and accent tokens. The Undo notice uses a grey fill, where the web notice is green. No native view reads `shared/tokens.json` yet, so the Packages view has the same gap. The gap closes when the Orphaned view takes its colours from the token file, and a test pins the meanings.

**Status:** open.

**Decision:** `orphaned-colours-by-meaning`.
