# The nightly screens check once failed the touch context

**What.** The nightly run 41194669903 (2026-10-31, head `69f216f`) failed the `screens` job: 8 of 117 checks said "touch context does not match (pointer: coarse)". The next nightly run 41303596315, on the same head, passed. The touch contexts open with `hasTouch` and `isMobile` in `openSeeded` in `test/screens.mjs`. The cause is unknown. A media query read before the context settles is suspected, and is not measured. The gap closes when the cause is found and fixed, or when repeated runs show it does not come back.

**Status:** open, cause unknown.

**Assigned:** the mailaudit coordinator session.

**Fix by:** 2026-12-01.

**Decision:** `screens-checked-headless-in-ci`.
