# One tier must not decide another

When several rules can each keep or drop the same record, a test on one rule must neutralize every other rule first. Otherwise another rule decides the outcome, and the assertion tests the wrong thing.

**Holds while:** `src/version-rules.mjs` keeps four retention tiers, and group 38 in `test/app.test.mjs` tests them.

Group 38's own assertions were wrong before the code was, four separate times, always the same way. A tier's fixture did not neutralize the other tiers. So another tier quietly decided the outcome. Examples:

- The day anchor kept records that the recent ring dropped. That was the union working, not the ring failing.
- A small fixture never saturated the ring.
- A record three hours old was also today's earliest. So the day tier kept it, whether or not an hourly tier existed. This was the one that survived a mutation run. Deleting the hourly tier left the suite green. It stayed green until the fixture gained an earlier record. That record took the day anchor off the three-hour-old record.

When you assert that one tier keeps or drops something, make sure that no other tier is quietly deciding it for you.

## See also

- `retention-tiers-are-unioned` — the union design this testing pitfall lives inside
- `testing-chokepoint-two-branches` — a related shape, where one path can hide a mutant on another
