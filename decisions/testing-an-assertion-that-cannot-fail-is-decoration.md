# An assertion that cannot fail is decoration

A test must be able to turn red under a real defect. The suite is mutation-tested. Breaking a behaviour on purpose must turn the suite red. Three cases are verified this way. Assignment checking in more than the user recorded is one. `resetAll` forgetting to clear envelopes is another. The third is undo restoring a snapshot instead of subtracting its own delta.

Do the same when you add a claim. An assertion that cannot fail is decoration. A check written without that proof only looks like coverage.

## See also

- `testing-after-a-pull-payload-equality-proves-nothing` — a specific case of an assertion that cannot fail
- `testing-an-assertion-that-throws-is-a-worse-kill` — another way an assertion can fail to protect the suite
