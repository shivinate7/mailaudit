# The conflict guard is unverified against real GitHub

**Status:** open.

`Merge & push` and auto-push both depend on GitHub's 409 conflict response, and that response has never been triggered for real. The transport itself works, since real authenticated pushes have landed. The remaining test is to push from two devices without pulling between them, and confirm the second push is blocked. A merge on the blocked device should then recover both sides. Getting the sha bookkeeping wrong here would let one device silently overwrite another's data.

## The thread, as recorded

```
- **The conflict guard has never been verified against real GitHub**, and it is
  now the thing most worth verifying, because `Merge & push` and auto-push both
  hang off it. The ledger repo *has* taken real authenticated pushes
  (`git log origin/data`), so the transport works; what is unproven is the 409
  itself. Verify it deliberately: push from device A, then push from B *without*
  pulling. B must be blocked. If B succeeds, the sha bookkeeping is wrong and
  A's data was just overwritten — recover with `git show data~1:ledger.json`
  and restore that file the normal way.
  Then take the same setup one step further, which is the new path: on B tap
  **Merge & push**, and confirm B ends holding *both* devices' work and A's next
  Pull agrees. Do this **before turning auto-push on**, because auto-push's
  conflict recovery is exactly this path running unattended.
```

## See also

- `sha-accepted-only-after-apply` — the rule this untested conflict path relies on
- `two-device-merge-must-be-proven-first` — the proof procedure this thread points at
- `a-stale-push-conflicts-pull-gets-two-tap` — the button this conflict is meant to surface
