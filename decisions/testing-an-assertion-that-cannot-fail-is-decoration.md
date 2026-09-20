# An assertion that cannot fail is decoration

A test must be able to turn red under a real defect. The suite proves each new claim by breaking the code on purpose and checking the suite fails. A check written without that proof only looks like coverage.

## The argument, as recorded

```
**The suite is mutation-tested.** Breaking a behaviour on purpose must turn it
red — verified for: assignment checking in more than was recorded, `resetAll`
forgetting to clear envelopes, and undo restoring a snapshot instead of
subtracting its own delta. Do the same when you add a claim; an assertion that
can't fail is decoration.
```
