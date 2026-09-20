# When a mutant dies, check the cause

A mutant dying does not prove the intended assertion caught it. The photo-ordering mutant first appeared caught, but it actually tripped an unrelated generation guard, and no assertion about photos ran at all. Only a fixture that isolated the real path made the kill genuine.

## The argument, as recorded

```
- **The photo-ordering mutant was "caught" for the wrong reason.** It failed
  34.7 (the merged ledger reaching GitHub) because moving the code also tripped
  the generation guard — nothing was asserting about photos at all. It only
  became a real test once 34.31 put the blob **exclusively on the remote**; with
  a local copy the id is in `present` anyway and the assertion passes under the
  mutation. When a mutant dies, check it died of the right thing.
```

## See also

- `testing-when-a-mutant-survives-find-the-unreached-state` — the paired lesson, on a mutant that lives instead
- `two-device-merge-must-be-proven-first` — the merge feature where this false kill happened
