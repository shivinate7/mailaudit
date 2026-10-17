# A throw counts as a kill in the photoGet test

**What.** In `test/photoget.test.mjs`, `runCase` turns a throw into a red case, and a red case counts as a mutant kill. A future mutant that throws would pass as killed without its assertion being proven. Today all four mutants die on an assertion message, so the hole is not yet reached. The gap closes when `killedBy` refuses a `threw:` reason.

**Status:** open.

**Decision:** `testing-throwing-assert-bad-kill`.
