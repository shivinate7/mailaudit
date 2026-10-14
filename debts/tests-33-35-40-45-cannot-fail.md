# Tests 33.35, 33.40 and 33.45 cannot fail

Tests 33.35, 33.40 and 33.45 cannot fail on a plausible mutant. They end the constructor, toString and hasOwnProperty runs in group 33 of `test/app.test.mjs`. The gap closes when each one has an assertion that a plausible mutant fails.

**Status:** open.

**Decision:** `testing-unfailable-assert-decor`.
