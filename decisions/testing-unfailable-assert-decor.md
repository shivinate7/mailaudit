# An assertion that cannot fail is decoration

A test must be able to turn red under a real defect. The suite is mutation-tested. Breaking a behaviour on purpose must turn the suite red. Three cases are verified this way. Assignment checking in more than the user recorded is one. `resetAll` forgetting to clear envelopes is another. The third is undo restoring a snapshot instead of subtracting its own delta.

**Holds while:** `npm test` runs `test/app.test.mjs`, the mutation-tested suite this record describes.

Do the same when you add a claim. An assertion that cannot fail is decoration. A check written without that proof only looks like coverage.

**Read before the debounce.** Test 34.10 asserted `saved().items === undefined ? 0 : 1`. That is 1 whether the ledger survived or was wiped. Tightening it to a real count showed that the test also read before the 500ms debounce had written. Two bugs sat behind one assertion that could not fail.

**A waiter that asserts nothing.** A test that waits about 200ms, then asserts that nothing was pushed, proves nothing. The debounce is 90s. So that assertion cannot fail. Test 34.18 was first drafted that way. Watch for this shape.

## See also

- `testing-pull-payload-eq-void` — a specific case of an assertion that cannot fail
- `testing-throwing-assert-bad-kill` — another way an assertion can fail to protect the suite
