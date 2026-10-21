# The GitHub token and the device key are credentials

This is the rule `the-token-is-a-credential`. The GitHub token and the Worker device key are device credentials, not ledger data. Neither may enter the ledger blob, a backup file, the pushed payload, the repo, the bundle, or React state.

Three structural guarantees keep them out. They are listed from strongest to weakest.

1. Both credentials live outside the `mailday:` namespace, so no enumeration finds them.
2. No screen takes a GitHub token now. The old key input is not rendered, and its flag `keyOpen` is never read. So the token is never typed into the app. The device key never reaches React state either. `window.sync` reads it from storage, and `hasKey()` returns only a boolean.
3. The payload is built from named fields. It never spreads state.

`resetAll` deliberately does **not** clear either credential. The GitHub token is still what `window.remote` reads the frozen `data` branch with. Clearing it would cut History off from its older versions. Debt: `reset-all-keeps-token-unpinned`.

The key check accepts a GitHub token's shape. Debt: `key-re-accepts-token-shape`.

## The native client

The native client holds only the device key. It never holds a GitHub token, see `worker-keeps-snapshots`. The rule covers the key in these ways.

- The key lives in the app's own Keychain. The accessibility class is AfterFirstUnlockThisDeviceOnly.
- `hasKey()` returns only a Bool. The sync client reads the key at request time.
- The key never goes into SwiftUI state (State or Published), the ledger or a backup.
- The key arrives by URL and the app drops the URL, see `native-key-via-url-scheme`.

**Pinned by:** 25.24–25.27 (the GitHub token stays out of the saved ledger, the pushed payload, a backup file and the storage namespace), 51.26–51.27 (the device key's name sits outside the namespace), and 52.4–52.7 (the device key stays out of those places, on the harness mock only). Debt: `token-state-and-bundle-unpinned`, and `reset-all-keeps-token-unpinned` for the `resetAll` rule. The N2 Swift tests pin the key's Keychain class, that a saved key reads back, and that `hasKey` follows save and clear (Swift suite KeyStoreTests). They also pin that a bad fragment stores nothing and that a refused link keeps the stored key (Swift suite KeyIntakeTests). `PackagesModelTests.testNoKeyInModelRowsOrLedgerAfterCheckIn` (lane N5) pins that the key stays out of the Packages model, its rows and the ledger file after a check-in. `BackupExportTests.testNoKeyInTheBackupExport` (lane N8) pins that the key stays out of the backup file, its name and the store. `MastheadModelTests.testNoKeyInTheMastheadModel` (lane N8) pins that the key stays out of the masthead model and its cells. Each has a positive control that shows the scan sees a planted key. Debt: `native-key-scan-skips-views`, because no scan reads SwiftUI view state. The Mirror scan is called by the N2 KeyStore tests, by that N5 test and by those two N8 tests.
