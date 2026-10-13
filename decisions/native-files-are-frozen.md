# Native file names freeze on first ship

**Status:** ruled. The owner accepted this on 2026-10-11 with the plan. Lane N3 landed in PR #80 with a store that takes its file URL from the caller. Lane N5 creates the Application Support folder and `ledger.json`. No app code yet creates the versions or photos folders. No native build has shipped. The kept-copy name was added before any build shipped. Its milliseconds and numeric suffix are orchestrator defaults of 2026-10-12, not owner rulings.

The native client keeps its data in the folder Application Support. The file ledger.json holds the ledger, and it is written atomically. The folders versions and photos sit beside it. The kept copies of a mended ledger sit there too. These names freeze when the first native build ships.

**Holds while:** no native build has shipped, so no device holds a native ledger file.

## Why they freeze

A renamed file orphans the data that a device already holds. The web app has the same rule for its storage keys, see `storage-keys-are-frozen`. The native names are the native copy of that rule. They are not the web keys, because the `mailday:` namespace is web storage.

## What lives there

- ledger.json holds the raw ledger, see `native-ledger-is-raw-json`.
- ledger.kept-<time>.json holds the original bytes of a ledger that load mended. The copy is written before the mend, and it is never overwritten. The time part is an ISO 8601 UTC time with milliseconds and the colons removed (orchestrator default of 2026-10-12). A numeric suffix goes before .json when the name exists: -2, -3 and on. For example, ledger.kept-2026-10-12T200402.123Z.json, then ledger.kept-2026-10-12T200402.123Z-2.json. See `native-ledger-is-raw-json`.
- versions holds the local versions, including the milestones.
- photos holds the label photos. A photo blob never enters the ledger, see `photos-stay-out-of-the-ledger`.
- The device key is not in this folder. It lives in the Keychain, see `native-key-via-url-scheme`.

**Pinned by:** testTwoDamagedLoadsInOneSecondBothSucceed (LedgerStoreTests) pins the suffix path, because two loads at one instant get two names. No test pins the millisecond format. It is read from LedgerStore.load.

## See also

- `storage-keys-are-frozen` — the web rule that this mirrors.
- `native-parity-table` — the file row has the scope native-only.
