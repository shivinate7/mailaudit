# The conflict guard is unverified against real GitHub

**Status:** open.

`Merge & push` and auto-push both depend on GitHub's 409 conflict response, and that response has never been triggered for real. The transport itself works, since real authenticated pushes have landed. The remaining test is to push from two devices without pulling between them, and confirm the second push is blocked. A merge on the blocked device should then recover both sides. Getting the sha bookkeeping wrong here would let one device silently overwrite another's data.

## See also

- `sha-accepted-only-after-apply` — the rule this untested conflict path relies on
- `two-device-merge-must-be-proven-first` — the proof procedure this thread points at
- `a-stale-push-conflicts-pull-gets-two-tap` — the button this conflict is meant to surface
