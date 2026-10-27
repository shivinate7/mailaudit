# The native ask does not move first focus to Cancel

**What.** `armed-reset-takes-the-row` has Cancel take first focus when an ask arms. That is an orchestrator default of 2026-10-11 from the house rule ux-ask-or-undo. `AskRow` in `native/Manifest/LedgerTab.swift` arms in place and shows Cancel, and it sets no focus. No test pins either way. The gap closes when the native ask moves focus to Cancel and a test pins it, or the owner rules that native may skip it.

**Status:** open.

**Decision:** `armed-reset-takes-the-row`.
