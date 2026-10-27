# The screens check once measured every target 45px wide

**What.** On a pull request run of the `screens` job (CI run 40463555687), every touch target measured 45px wide at all 7 states at 375px, and "This device has no sync key" measured 45x36. The same commit passed `screens` on a second run and on a re-run of the failed job. The cause is unknown: a slow font load, a viewport that was not yet settled, or a real layout fault have not been told apart. The gap closes when the cause is found and a check or wait stops the flake, or when repeated runs show it does not come back.

**Status:** open, cause unknown.

**Decision:** `screens-checked-headless-in-ci`.
