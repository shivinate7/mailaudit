# A pending undo holds a remote reply with no limit

**What.** `mergeBlocked` in `src/app.jsx` holds a remote reply while an assign-undo bar is open, and that bar has no timeout. One unread undo bar stops every reply until the owner taps Undo or Dismiss, the same defect an open import notice had. The hold is kept because an apply clears the undo (its plan names the pre-merge line-up). The composer hold stays: an apply would discard hand-typed entries that are in no CSV. An armed Reset, Force or Restore disarms itself within seconds. The gap closes when the owner rules whether the undo bar expires, or survives an apply.

**Status:** open. Found in lane web/sync-latency, 2026-10-21.

**Decision:** `auto-apply-happens-now`.
