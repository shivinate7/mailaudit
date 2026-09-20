# `peek()` is verified only on its refusal path

**Status:** open.

A keyless request against the private repo has confirmed `peek()` correctly returns `{known: false, reason: "no-access"}`. That path matters most, since it stops a keyless device from pushing over one that can see the remote. The successful path is still unverified. Nobody has confirmed that a keyed, fresh device with no local sha reports `ahead` rather than erroring. That is the exact state every new phone starts in.

## The thread, as recorded

```
- **`peek()` has now run against real GitHub, but only its refusal path.** From
  the deployed origin with no key it returns `{known: false, reason:
  "no-access"}` against the private repo, which is the branch that matters most
  — read the other way, a keyless device would push over the one that can see.
  What is still unverified is the *successful* path: that a keyed, fresh device
  with no local sha reports `ahead` rather than erroring, since that is the
  state every new phone starts in. Still never run for real: an authenticated
  photo PUT, a photo pull that returns bytes, and a ledger conflict.
```

## See also

- `peek-is-three-valued` — the read this refusal path belongs to
- `nothing-recovers-without-the-key` — the fresh-device state `peek` has to report correctly
- `the-conflict-guard-is-unverified` — the other unverified path named at the end of this thread
