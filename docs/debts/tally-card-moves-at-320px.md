# The Tally card moves at 320px

**What.** At 320px the Tally card moves 14px on check-ins 1 and 6. No shipped check reads 320px, since claim 2 runs at 375px and 760px only. The record's option keeps all three buttons mounted and hides the one that does not apply, but it changes the look. The owner chose none of the fix options (item 62, relayed 2026-11-21 19:55 to 19:56 CST). Decision `card-the-action-row-is-reserved` says 320px is below the 380px floor and is not a width iOS runs, so no change is owed.

**Status:** closed by the owner's answer, item 62. Kept until a pull request that deletes this file cites a passing run as `Retire-run:`.

**Decision:** `card-reserved-geometry`.
