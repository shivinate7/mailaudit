# A photo error never reaches pushState

The photo upload phase keeps its own status and its own error table, separate from the ledger's push state. Push state controls the only button that force-overwrites the ledger. Letting a throttled photo error reach that state would offer a button that silently discards another device's check-ins.

## See also

- `a-stale-push-conflicts-pull-gets-two-tap` — the button this rule protects from a false conflict.
- `photo-sync-cannot-conflict` — why a photo error is never a real conflict.
