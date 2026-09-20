# One tier must not decide another

When several rules can each keep or drop the same record, a test on one rule must neutralize every other rule first. The version-pruning suite was wrong before the code was. This happened four separate times, because one tier quietly decided the outcome another tier's fixture claimed to test.

## The argument, as recorded

```
- **Group 38's own assertions have been wrong before the code was, four
  separate times, always the same way.** A tier's fixture must neutralise every
  *other* tier or the assertion is decided elsewhere: the day anchor keeps
  records the recent ring drops (the union working, not the ring failing), a
  small fixture never saturates the ring, and — the one that survived a mutation
  run — a record three hours old is also *today's earliest*, so it is kept by
  the day tier whether or not an hourly tier exists at all. Deleting the hourly
  tier left the suite green until the fixture gained an earlier record to take
  the day anchor off it. **When asserting that one tier keeps or drops
  something, make sure no other tier is quietly deciding it for you.**
```

## See also

- `version-tiers-are-unioned` — the union design this testing pitfall lives inside
- `testing-when-a-chokepoint-has-two-branches` — a related shape, where one path can hide a mutant on another
