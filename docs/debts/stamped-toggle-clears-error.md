# The stamped toggle clears a failed check-in's error

**What.** On Packages, a failed line check-in shows its error until a later write lands. A tap on the stamped-filter toggle clears it too, after any successful read (`PackagesModel.toggleStamped`). So the owner can lose the only sign that a check-in did not save, with nothing retried. A scratch probe in review of `hand-stale-checkin-error` showed it (2026-11-07). The gap closes when the toggle keeps an error it did not cause, and a test pins a failed tap followed by a toggle.

**Status:** closed by restyle step 8 (restyle-8-head). A stamped toggle now clears only its own failed read; PackagesToggleTests pins a failed check-in followed by a toggle.

**Decision:** `ux-house-rules-govern`.
