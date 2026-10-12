# The conflict guard is unverified against real GitHub

**Status:** open.

The automatic merge on a conflict and auto-push both depend on GitHub's 409 conflict response. The Merge & push control left the UI on 2026-10-12. That response has never been triggered for real. The transport itself works, since real authenticated pushes have landed. The ledger repo has taken them, and `git log origin/data` shows them. What is unproven is the 409 itself. Getting the sha bookkeeping wrong here would let one device silently overwrite another's data.

**Holds while:** `classifyStatus` in `src/remote-rules.mjs` maps status 409 to `conflict`. A real GitHub 409, seen on a device, closes this record.

Verify it deliberately. Push from device A. Then push from device B without pulling. B must be blocked. If B succeeds, the sha bookkeeping is wrong, and A's data was just overwritten. Recover it with `git show data~1:ledger.json`. Then restore that file the normal way.

Then take the same setup one step further. This is the new path. On B, the automatic merge runs on the conflict. No control is left. B must end holding both devices' work. A's next pull must agree.

Do this before auto-push is enabled. Auto-push's conflict recovery is exactly this path running unattended.

## See also

- `sha-accepted-only-after-apply` — the rule this untested conflict path relies on
- `two-device-merge-proven-first` — the proof procedure this thread points at
- `stale-push-conflict-pull-two-tap` — the sync rule this conflict is meant to exercise
