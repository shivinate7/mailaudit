# After a pull, payload equality proves nothing

A pull makes the local ledger identical to the remote one. That happens whether or not the push that followed actually landed. So an assertion that compares payloads after a pull passes in both cases. It proves nothing.

**Holds while:** test 26.16 in `test/app.test.mjs` asserts on the sha, not on the payload.

A mutation check caught a real gap here too. The first draft of "pulling refreshes the sha" asserted on the payload. A pull makes this device's ledger identical to the remote's. So the assertion was true whether the push landed or not. The mutant survived. The test now asserts on the **sha advancing**. That is the only thing that tells the two outcomes apart.

Watch for this shape generally. After a pull, payload-equality assertions prove nothing.

## See also

- `testing-unfailable-assert-decor` — the general rule this specific case follows
- `merge-rules-only-add` — the pull and merge behavior this assertion was written to check
