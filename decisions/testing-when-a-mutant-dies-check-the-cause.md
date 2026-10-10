# When a mutant dies, check the cause

A mutant dying does not prove the intended assertion caught it. The photo-ordering mutant first appeared caught, but it actually tripped an unrelated generation guard, and no assertion about photos ran at all. Only a fixture that isolated the real path made the kill genuine.

## See also

- `testing-when-a-mutant-survives-find-the-unreached-state` — the paired lesson, on a mutant that lives instead
- `two-device-merge-must-be-proven-first` — the merge feature where this false kill happened
