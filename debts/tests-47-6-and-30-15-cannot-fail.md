# Tests 47.6 and 30.15 cannot fail

**What.** Test 47.6 says in its comment that it kills a survey that reads the photo store as empty. That mutant survives it. Test 47.6 and test 30.15 both assert `!/not on GitHub/i` on the screen text (`test/app.test.mjs`, lines 4104 and 1627). No text in `src/` holds that phrase, so neither assertion can fail. The finding is the orchestrator's, dated 2026-10-16. This lane did not re-run the suite.

**Status:** open. A builder makes the survey mutant die on an assertion that can fail, and re-points or drops the dead check.

**Decision:** `photo-ids-unreadable-local`.
