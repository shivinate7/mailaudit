# A Photo Error Never Reaches Push State

The photo upload phase keeps its own status and its own error table, separate from the ledger's push state. Push state controls the only button that force-overwrites the ledger. Letting a throttled photo error reach that state would offer a button that silently discards another device's check-ins.

## The argument, as recorded

```
  - **The photo phase has its own state and its own copy table (`PHOTO_SAYS`).**
    It must never write `pushState`, because `pushState === "conflict"` is the
    only gate on **Push anyway**, which force-overwrites the *ledger*. GitHub
    answers 409 to rapid successive Contents writes on one repo, so routing a
    throttled photo upload through the ledger's error path would offer a button
    that silently discards another device's check-ins. Test 30.11.
```
