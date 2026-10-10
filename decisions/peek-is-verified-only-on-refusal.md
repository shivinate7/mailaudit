# `peek()` is verified only on its refusal path

**Status:** open.

`peek()` has run against real GitHub, but only its refusal path. From the deployed origin with no key, it returns `{known: false, reason: "no-access"}` against the private repo. That is the branch that matters most. Read the other way, a keyless device would push over the one that can see.

**Holds while:** `mailaudit-data` is private, so a keyless `peek()` returns `no-access`. The open item closes when a keyed device with no local sha gets `ahead` from `peek()`.

The successful path is still unverified. Nobody has confirmed that a keyed, fresh device with no local sha reports `ahead` rather than erroring. That is the state every new phone starts in.

Still never run for real: an authenticated photo PUT, a photo pull that returns bytes, and a ledger conflict.

## See also

- `peek-is-three-valued` — the read this refusal path belongs to
- `nothing-recovers-without-the-key` — the fresh-device state `peek` has to report correctly
- `the-conflict-guard-is-unverified` — the other unverified path named at the end of this thread
