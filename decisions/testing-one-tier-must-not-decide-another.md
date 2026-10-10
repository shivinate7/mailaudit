# One tier must not decide another

When several rules can each keep or drop the same record, a test on one rule must neutralize every other rule first. The version-pruning suite was wrong before the code was. This happened four separate times, because one tier quietly decided the outcome another tier's fixture claimed to test.

## See also

- `version-tiers-are-unioned` — the union design this testing pitfall lives inside
- `testing-when-a-chokepoint-has-two-branches` — a related shape, where one path can hide a mutant on another
