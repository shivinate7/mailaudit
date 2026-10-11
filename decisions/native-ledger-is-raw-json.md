# The native client keeps the ledger as raw JSON

**Status:** ruled. The owner accepted this on 2026-10-11 with the plan. Lane N3 builds it. No Swift code exists yet.

The native ledger store holds the ledger as raw JSON, not as typed structs. A JSON value enum carries every field. An edit changes only the fields it names. Fields that the client does not know survive the next POST, so the Worker merge cannot drop them.

**Holds while:** `saved-state-shape` names the saved ledger shape, and the Worker rejects a ledger whose `mailday` field is not 1.

## What an edit may touch

An edit changes only `received`, `receivedAt`, `envelopes` and `stamps`. The rest of the object passes through unchanged.

- An un-check writes `receivedAt` and drops `received`, see `max-cannot-express-an-uncheck`.
- A stamp removal writes a tombstone with `kind:""`, see `stamp-removal-writes-a-tombstone`.
- A discard writes an envelope tombstone, see `envelope-deletion-unrepresented`.
- Each edit bumps the generation that the sync client reads, see `native-reply-waits-generation`.
- A load sets the defaults of a missing field.
- The client sends `mailday:1`, because the Worker requires it.

## Proof

Lane N3 tests that an unknown field round-trips. The other tests follow the list above.

## See also

- `saved-state-shape` — the fixed shape of the saved ledger.
- `native-files-are-frozen` — where the ledger file lives.
- `native-build-lanes` — lane N3.
