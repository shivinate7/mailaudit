# The native Undo notice pads 4pt, not 8pt

**What.** The Undo notice in `native/Manifest/OrphanedView.swift` pads its rows 4pt above and below. `spacing-on-4px-grid` asks for 8pt. The dismiss control is 44pt tall, and 8pt padding would make the notice taller than the web's. The gap closes when the notice takes 8pt and the dismiss control still keeps its 44pt hit size, or the owner rules that 4pt stands.

**Status:** open.

**Decision:** `spacing-on-4px-grid`.
