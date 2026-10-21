# The native Orphaned view uses system colours

**What.** `native/Manifest/OrphanedView.swift` paints with system styles. It also uses four hand-set colours. The tie line, the "no outstanding copy" tag and the "Add … as typed" row use the primary text style, because the secondary style failed the contrast audit. `orphaned-colours-by-meaning` gives them manila. The exact-match line, Discard and the prominent buttons use the hand-set colours. They were measured by hand at 6.3 to 14.1 against white, grouped grey, black and the dark card (`palette-tokens-contrast-floor`), and no test pins them. The web uses its green, red and accent tokens there. The Undo notice uses a grey fill, where the web notice is green. No native view reads `shared/tokens.json` yet, so the Packages view has the same gap. The gap closes when the Orphaned view takes its colours from the token file, and a test pins the meanings.

**Status:** open.

**Decision:** `orphaned-colours-by-meaning`.
