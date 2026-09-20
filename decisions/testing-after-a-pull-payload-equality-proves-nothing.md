# After a pull, payload equality proves nothing

A pull makes the local ledger identical to the remote one whether or not the push that followed actually landed. An assertion comparing payloads after a pull passes in both cases, so it proves nothing. The fix was to assert on the sha advancing instead, the one thing that tells the two outcomes apart.

## The argument, as recorded

```
That exercise caught a real one *here too*: the first draft of "pulling
refreshes the sha" asserted on the payload, and a pull makes this device's
ledger identical to the remote's — so the assertion was true whether the push
landed or not, and the mutant survived. It now asserts on the **sha advancing**,
which is the only thing that distinguishes the two states. Watch for this shape
generally: after a pull, payload-equality assertions prove nothing.
```

## See also

- `testing-an-assertion-that-cannot-fail-is-decoration` — the general rule this specific case follows
- `merge-rules-only-add` — the pull and merge behavior this assertion was written to check
