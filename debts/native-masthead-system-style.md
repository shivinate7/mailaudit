# The native masthead uses system styles

**What.** `native/Manifest/MastheadView.swift` paints with system styles. The seal is the SF Symbol `seal`, where the web draws a wax seal between two gold rules. The title and the house line use the system serif, where the web sets Cochin (`typography-cochin-and-mono`). The text and the rules use the primary and secondary colours, and no cell reads `shared/tokens.json`. The masthead has no progress bar (`progress-bar-accent-then-green`). The gap closes when the masthead takes its colours and type from the token file and draws the web's seal, rules and bar, and a test pins the meanings.

**Status:** open.

**Decision:** `masthead-is-one-letterhead`.
