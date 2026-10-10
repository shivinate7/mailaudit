# When a mutant dies, check the cause

A mutant dying does not prove the intended assertion caught it. Check that the mutant died of the right thing. Only a fixture that isolated the real path makes the kill genuine.

**Holds while:** test 34.31 in `test/app.test.mjs` seeds the `pho-7` blob in `remotePhotos` and asserts that a merge keeps its id.

The photo-ordering mutant failed test 34.7, which checks the merged ledger reaching GitHub. It failed because moving the code also tripped an unrelated generation guard. No assertion about photos ran at all. It became a real test once 34.31 put the blob exclusively on the remote. With a local copy, the id is already in `present`, so the assertion passes under the mutation.

## See also

- `testing-surviving-mutant` — the paired lesson, on a mutant that lives instead
- `two-device-merge-proven-first` — the merge feature where this false kill happened
