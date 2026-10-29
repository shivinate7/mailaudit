# Three native rows break at accessibility text sizes

**What.** At the largest accessibility text size, three native rows keep one line and break or clip:
- the Orphaned envelope header breaks mid-word ("ENVELOP/E", "Discar/d"), in `native/Manifest/OrphanedView.swift`;
- the Tally long-set row squeezes the name to about 100pt and breaks it mid-word, in `native/Manifest/TallyView.swift`;
- the armed Reset clips its ask and its Cancel to "C…", from a fixed 80pt Cancel width and `lineLimit(1)` in `native/Manifest/LedgerTab.swift`.
Default sizes are fine. The design review of 2026-10-28 found them. Unreviewed fixes sit on `archive/step4-design-fix4` (commits 80b5281, c568c75 and 58765e9). The gap closes when each row stacks or wraps at accessibility sizes, with `card-tally-row-counts-first` and `armed-reset-takes-the-row` kept, and an audit at that size passes.

**Status:** open.

**Decision:** `ux-house-rules-govern`.
