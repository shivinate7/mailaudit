# The native client keeps the ledger as raw JSON

**Status:** ruled. The owner accepted a typed enum plan on 2026-10-11. The orchestrator default of 2026-10-12 replaced that enum with a raw dictionary. Lane N3 landed in PR #80 as LedgerStore. The Worker side is open, see Known gap. The malformed-field question is open, see Still open.

The native store holds the ledger as `[String: Any]`, parsed and written with `JSONSerialization`. No typed struct or enum holds a field. A save writes the whole dictionary, so a field the client does not name survives a save of the file. An edit changes only the fields it names.

**Holds while:** `saved-state-shape` names the saved ledger shape, the Worker rejects a `mailday` other than 1, and no lane needs a typed value. Add a typed value when a lane needs one, not before (YAGNI).

## Load and save

- A load throws when the top level is not an object.
- A load throws when `mailday` is present and is not the integer 1. A missing `mailday` is accepted and saved as 1.
- A load throws when `envelopes` is present and is not a list of objects. A missing `envelopes` becomes an empty list.
- A load replaces `received`, `receivedAt` or `stamps` with an empty object when the field is missing or is not an object. It does not throw for these.
- `items` gets no default. The Worker refuses a POST with no `items` list.
- A failed load clears the loaded flag first, whatever the cause: a missing or unreadable file, invalid JSON, a top level that is not an object, a `mailday` that is not 1, or malformed `envelopes`. A later save then throws until a good load, even after an earlier good load. A failed reload leaves the store unsaveable.
- A save before a load throws and writes nothing.
- Each refusal the store makes throws `CocoaError(.fileReadCorruptFile)`. A missing file or invalid JSON throws Foundation's own error, which the store does not wrap.

## What an edit may touch

An edit changes only `received`, `receivedAt`, `envelopes` and `stamps`. The rest of the object passes through unchanged.

- An un-check writes `receivedAt` and drops `received`, see `max-cannot-express-an-uncheck`.
- A stamp removal writes a tombstone with `kind:""`, see `stamp-removal-writes-a-tombstone`.
- A discard writes an envelope tombstone, see `envelope-deletion-unrepresented`.
- Each edit bumps the generation that the sync client reads, see `native-reply-waits-generation`.
- The client sends `mailday:1`, because the Worker requires it.

## Proof

Lane N3 landed in PR #80 with a test for each item above, in LedgerStoreTests, under `native/ManifestKit/`. The unknown-field test proves the round trip through a file save. It does not prove a Worker POST, see Known gap. The two failed-reload tests, testFailedReloadOfTopLevelArrayLeavesStoreUnloaded and testFailedReloadOfInvalidJSONLeavesStoreUnloaded, prove the failed-reload rule. Each checks that the reload throws, the save throws, and the file bytes stay as written. The missing-file case and the unwrapped-error sentence in Load and save are read from the code, not tested.

## Known gap: the Worker merge drops unknown top-level fields

**Open, for a later lane.** Measured 2026-10-12 by calling `mergeLedger` from `src/merge-rules.mjs` with a ledger that holds one top-level field the client does not know. The merged output did not contain it. Re-measured at f3e36cd: the field is dropped whether it sits in the local ledger or the incoming one. `mergeLedger` builds its output from a fixed list of keys.

The Worker POST handler in `worker/core.mjs` stores the merged ledger whenever a ledger already exists, and returns it. So an unknown top-level field survives only the first write to an empty store. Nested unknown fields inside an envelope or a stamp are unmeasured.

Proposed fix: `mergeLedger` carries unknown top-level keys through, with a test. The owner decides.

## Known bandaid: Swift names are unbackticked

The Swift names in this record (LedgerStore, LedgerStoreTests) are unbackticked. `check-docs.mjs` judges a backticked name against CODE_ROOTS, and CODE_ROOTS omits `native/`. So a backticked LedgerStore fails the check. Follow-up: add `native/` to CODE_ROOTS in `check-docs.mjs`. That is a code change for a builder.

## Still open

- Malformed fields, for the owner. `received`, `receivedAt` and `stamps` that are not objects become `{}` on load, with no error. A malformed `envelopes` throws. A malformed `received` becomes `{}`, and the next save erases the check-ins it held. Options: (a) a present field that is not an object throws, while a missing one still defaults to `{}`; (b) keep the current split. Recommended: (a). Checked at f3e36cd: "It does not throw for these" holds, so it stays until the owner rules.

## See also

- `saved-state-shape` — the fixed shape of the saved ledger.
- `native-files-are-frozen` — where the ledger file lives.
- `native-build-lanes` — lane N3.
