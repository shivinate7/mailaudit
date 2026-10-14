# The Worker merge fix is merged but not deployed

The fix that keeps unknown top-level keys in a merge is on main, merged in PR #96. The record says the live Worker still runs the pre-fix merge, which drops those keys, until the next `worker:deploy`. That was not checked live. The gap closes when the owner confirms the rule, which is an orchestrator call and not an owner ruling, and a deploy ships the fix.

**Status:** open. Waits for the owner's word.

**Decision:** `saved-state-shape`.
