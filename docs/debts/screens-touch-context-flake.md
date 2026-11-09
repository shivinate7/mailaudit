# The screens check fails the touch context now and then

**What.** The nightly run 41194669903 (2026-10-31, head `69f216f`) failed the `screens` job: 8 of 117 checks said "touch context does not match (pointer: coarse)". The next nightly run 41303596315, on the same head, passed. It came back on 2026-11-09: the batch run 42553388642 for PR 257 (head `85d2205`, macos-26 runner), attempt 1, failed 2 of 135 checks the same way (grid 375px touch, Envelope composer open, Sync panel open), and attempt 2 passed. The touch contexts open with `hasTouch` and `isMobile` in `openSeeded` in `test/screens.mjs`. The cause is unknown. A media query read before the context settles is suspected, and is not measured. The gap closes when the cause is found and fixed, or when repeated runs show it does not come back. It has now come back once.

**Status:** open, cause unknown. Seen twice: 2026-10-31 and 2026-11-09.

**Assigned:** the mailaudit coordinator session.

**Fix by:** 2026-12-01.

**Decision:** `screens-checked-headless-in-ci`.
