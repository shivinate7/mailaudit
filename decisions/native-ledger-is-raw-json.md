# The native client keeps the ledger as raw JSON

Kind: build

Plan: decisions/native-ledger-is-raw-json.md#known-gap-the-worker-merge-dropped-unknown-top-level-fields (web)

**Status:** ruled. The owner accepted a typed enum plan on 2026-10-11. The orchestrator default of 2026-10-12 replaced that enum with a raw dictionary. Owner ruling 2026-10-12 ("Keep a copy, then go on") holds for every client and every path data comes in. A `received`, `receivedAt`, `stamps` or `envelopes` value of the wrong shape (a whole field or one entry; JSON `null` counts) is first copied. Then every readable entry is kept. The web copy goes to History as a milestone. The web detail and its fallbacks are in `saved-state-shape`.

Orchestrator defaults of 2026-10-12, not owner rulings: native has no versions store or History yet. So the native copy is a kept file beside ledger.json. The mended ledger is saved at once after the copy. The kept name carries milliseconds, and a numeric suffix settles a name that exists.

**Built state, 2026-10-12:** web is built in PR #87, merged to main at `eb48278`. The Worker half is live since 2026-10-12, version fdea6a6b, see `live-verification`. The Worker refuses a bad incoming shape with 400 (tests 67.1 and 67.2). It keeps every mended original in `kept` (group 69). It mends a damaged stored ledger before its merge (tests 68.1 to 68.3). Both run by `npm run test:worker`. Native is built in draft PR #89, not merged. Native load mends as the web does (see Load and save). The unknown-field gap (Known gap) is fixed on `web/merge-unknown-keys`, pending the owner's word.

**Notice line:** after a load that drops entries, the Packages tab shows one footnote line at its top. LedgerNotice.damagedLine builds it from the dropped count, and boot sets it once. For one entry the text is "1 entry could not be read; the original is kept on this device." Two or more gives "entries", so 3 gives "3 entries could not be read; the original is kept on this device." At 0 there is no line. The line names no sync words.

The native store holds the ledger as `[String: Any]`, parsed and written with `JSONSerialization`. No typed struct or enum holds a field. A save writes the whole dictionary, so a field the client does not name survives a save of the file. An edit changes only the fields it names.

**Holds while:** `saved-state-shape` names the saved ledger shape, the Worker rejects a `mailday` other than 1, and no lane needs a typed value. Add a typed value when a lane needs one, not before (YAGNI).

## Load and save

The Swift client's rules, as built in draft PR #89. The web rules are in `saved-state-shape`.

- A load throws when the bytes are not a JSON object. A top level of `null`, a number, a string or a list is refused the same way. No copy is made.
- A load throws when `mailday` is present and is not the integer 1. No copy is made. A missing `mailday` is accepted and saved as 1.
- A damaged `received`, `receivedAt`, `stamps` or `envelopes` is mended, not refused. Damage is a whole field of the wrong shape, JSON `null` included, or one entry of the wrong shape. An absent field is not damage. The right shapes are numbers in `received` and `receivedAt`, objects in `stamps`, and objects with a string `id` in `envelopes`.
  - The mend is `salvageLedger` in `rules.js`, called through RulesCore. The Swift client holds no copy of the rule (`rules-run-in-javascriptcore`).
  - If any entry is dropped, the original bytes are written first to ledger.kept-<time>.json beside ledger.json. The write does not overwrite. The time part is an ISO 8601 UTC time with milliseconds from the store's clock, with the colons removed (orchestrator default of 2026-10-12). If the name exists, a suffix -2, -3 and on is added until the write succeeds (orchestrator default of 2026-10-12). If the write fails, load throws, the store stays unloaded, and nothing is mended. The copy is what stops a mend from erasing the check-ins the file held.
  - A damaged whole field counts 1. Each dropped entry counts 1. The dropped count holds the total from the last good load. It is 0 when nothing was damaged.
  - A field the mend removes becomes empty. A missing `received`, `receivedAt` or `stamps` becomes an empty object. A missing `envelopes` becomes an empty list.
- After the copy is written, load saves the mended ledger at once (orchestrator default of 2026-10-12). Once that save succeeds, a relaunch reads a clean file and makes no second copy. If the save fails, the copy stays on disk, load throws, and the store stays unloaded. The next launch then writes another copy under a new name.
- `items` gets no default. The Worker refuses a POST with no `items` list.
- A failed load clears the loaded flag first, whatever the cause:
  - a missing or unreadable file, or invalid JSON;
  - a top level that is not an object;
  - a `mailday` that is not 1;
  - a kept copy that cannot be written, or a mend that cannot be saved;
  - a mend result of the wrong shape.

  A later save throws until a good load. A failed reload leaves the store unsaveable.
- A save before a load throws and writes nothing.
- A top level that is not an object throws. A bad `mailday` and a bad mend result throw `CocoaError(.fileReadCorruptFile)`. A missing file, invalid JSON and a failed copy throw whatever Foundation throws.

## What an edit may touch

An edit changes only `received`, `receivedAt`, `envelopes` and `stamps`. The rest of the object passes through unchanged.

- An un-check writes `receivedAt` and drops `received`, see `max-cannot-express-an-uncheck`.
- A stamp removal writes a tombstone with `kind:""`, see `stamp-removal-writes-a-tombstone`.
- A discard writes an envelope tombstone, see `envelope-deletion-unrepresented`.
- Each edit bumps the generation that the sync client reads, see `native-reply-waits-generation`.
- The client sends `mailday:1`, because the Worker requires it.

## Proof

Lane N3 landed in PR #80 with a test for each item above, in LedgerStoreTests, under `native/ManifestKit/`. The unknown-field test, testUnknownFieldRoundTripsThroughSave, proves the round trip through a file save. It does not prove a Worker POST, see Known gap. The two failed-reload tests prove the failed-reload rule for a top-level array and for invalid JSON. Each checks that the reload throws, the save throws, and the file bytes stay as written. Those tests are testFailedReloadOfTopLevelArrayLeavesStoreUnloaded and testFailedReloadOfInvalidJSONLeavesStoreUnloaded.

The 2026-10-12 ruling is pinned in the same file by these tests:

- testDamagedReceivedEntryIsDroppedAndTheRestKept, testDamagedReceivedAtEntryIsDroppedAndTheRestKept, testDamagedStampsEntryIsDroppedAndTheRestKept, testDamagedEnvelopesAreDroppedAndTheRestKept: one bad entry is dropped, and the rest is kept.
- testReceivedArrayIsMendedToEmptyMapAndCountsOne, testReceivedAtStringIsMendedToEmptyMapAndCountsOne, testStampsArrayIsMendedToEmptyMapAndCountsOne, testEnvelopesNotAnArrayIsMendedToEmptyListAndCountsOne: a whole bad field is mended to empty and counts 1.
- testReceivedNullIsDamagedNotAbsent: a JSON `null` in `received` is damage.
- testEditAfterMendSavesAndKeepsTheOriginalCopy: an edit after a mend saves, and the kept copy keeps the original bytes.
- testNonObjectTopLevelRefusesWithNoCopy: a non-object top level refuses, and no copy is made.
- testUnwritableCopyRefusesAndChangesNothing: a copy that cannot be written refuses, and the file does not change. It executes and passes here. It skips only where the folder stays writable, such as when the tests run as root.

The mend tests check the count, the kept copy's bytes and the saved field. The refusal tests check that the file bytes stay as written.

The orchestrator defaults of 2026-10-12 are pinned by these tests:

- testCleanLoadMakesNoCopyAndCountsZero: a clean load keeps no copy and counts 0.
- testLoadSavesTheMendAtOnce: the mended `received` is on disk before any edit.
- testRelaunchAfterMendMakesNoSecondCopy: after a saved mend, a relaunch drops nothing and keeps one copy.
- testTwoDamagedLoadsInOneSecondBothSucceed: two loads at one fixed instant each keep their own copy, so this pins the suffix path. The name says one second, but the clock is fixed.
- testReceivedAtNullIsDamagedNotAbsent, testStampsNullIsDamagedNotAbsent, testEnvelopesNullIsDamagedNotAbsent: a JSON `null` is damage in each field.

The notice line is pinned by LedgerNoticeTests: testNoLineWhenNothingWasDropped, testOneLineNamesTheCountAndTheKeptCopy, testSingularCountReadsAsOneEntry, testLineNamesNoSyncWords.

Not pinned by a test: the millisecond kept-name format, the missing-file case, and the unwrapped-error sentence in Load and save. The millisecond format is read from LedgerStore.load, because keptCopies matches the prefix and extension only. The app passing its own rules.js to the store is not pinned either (ManifestApp.swift, boot).

## Known gap: the Worker merge dropped unknown top-level fields

The Worker's shape refusal and its mend of stored damage are built on PR #87, merged (see Built state). This gap is separate from them.

**Status:** open, pending the owner's word. The fix is on main, merged in PR #96. It is not deployed. The live Worker runs the pre-fix merge until the next `worker:deploy`. Debt: `worker-merge-fix-not-deployed`.

Orchestrator call of 2026-10-14, not an owner ruling: `mergeLedger` carries unknown top-level keys, and it drops the `savedAt` comparison. A key that both sides hold with different values keeps the incoming side. The owner confirms or rejects that rule. Its rule and pins are in `saved-state-shape`.

Before the fix, measured 2026-10-12, `mergeLedger` dropped an unknown top-level field. The measurement used a ledger that held one top-level field the client does not know. The merged output did not contain it, whether the field sat in the local ledger or the incoming one. Re-measured at f3e36cd with the same result. `mergeLedger` built its output from a fixed list of keys.

The Worker POST handler in `worker/core.mjs` stored the merged ledger whenever a ledger already existed. So such a field survived only the first write to an empty store. Nested unknown fields inside an envelope or a stamp are unmeasured.

## Swift names in this record

The Swift names in this record (LedgerStore, LedgerStoreTests, RulesCore, droppedCount) are unbackticked. They were plain because `check-docs.mjs` did not read `native/`. Its CODE_ROOTS lists `native/` now, so a backticked Swift name is checked.

## See also

- `saved-state-shape` — the fixed shape of the saved ledger.
- `native-files-are-frozen` — where the ledger file and its kept copies live.
- `rules-run-in-javascriptcore` — the rules bundle that holds `salvageLedger`.
- `native-build-lanes` — lane N3.
