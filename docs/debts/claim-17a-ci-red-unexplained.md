# Claim 17a failed on CI twice, and why only those runs is unknown

**What.** `check:screens` claim 17a failed twice on CI, on runs 39892195068 and 39900120189 (2026-10-23). Each time, 12 taps at x 60.5 on the chevron opened TCGplayer, 4.5px from the link area. The cause in part is known: Chromium's touch adjustment sent those taps to the link. The cause in full is not known: why only those two CI runs did so is unexplained. Local sweeps under parallel runs, a throttled CPU and high load did not reproduce it. The lane's report on PR #136 is the only source for that, and it is unmeasured. The record cites no CI run after the 16px gap between the link and its neighbours, so whether the red has recurred since is unknown. The gap closes when the CI-only cause is found, or repeated CI runs show it does not come back.

**Status:** open, cause of the CI-only red unknown. Recurrence since the 16px gap is unmeasured.

**Assigned:** the mailaudit coordinator session.

**Fix by:** 2026-12-01.

**Decision:** `order-id-button-stops-propagate`.
