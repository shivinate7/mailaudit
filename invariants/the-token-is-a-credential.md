# The GitHub token and the device key are credentials

This is the rule `the-token-is-a-credential`. The GitHub token and the Worker device key are device credentials, not ledger data. Neither may enter the ledger blob, a backup file, the pushed payload, the repo, the bundle, or React state.

Three structural guarantees keep them out. They are listed from strongest to weakest.

1. Both credentials live outside the `mailday:` namespace, so no enumeration finds them.
2. The GitHub key input is **uncontrolled**. It is a `ref`. The app reads it once on submit, then clears it. So the token is never in a state snapshot or a DevTools dump. The device key never reaches React state either. `window.sync` reads it from storage, and `hasKey()` returns only a boolean.
3. The payload is built from named fields. It never spreads state.

`resetAll` deliberately does **not** clear either credential. The GitHub token is a device credential. Dropping the stored sha with it would make the very next push fail with a 422, for no reason. No test pins that `resetAll` keeps the token.

## The native client

The native client holds only the device key. It never holds a GitHub token, see `worker-keeps-snapshots`. The rule covers the key in these ways.

- The key lives in the app's own Keychain. The accessibility class is AfterFirstUnlockThisDeviceOnly.
- `hasKey()` returns only a Bool. The sync client reads the key at request time.
- The key never goes into SwiftUI state (State or Published), the ledger or a backup.
- The key arrives by URL and the app drops the URL, see `native-key-via-url-scheme`.

**Pinned by:** 25.24–25.27 (the GitHub token stays out of the saved ledger, the pushed payload, a backup file and the storage namespace), 51.26–51.27 (the device key's name sits outside the namespace), and 52.4–52.7 (the device key stays out of those places, on the harness mock only). Nothing pins the React-state or bundle guarantees, or the `resetAll` rule above. The N2 Swift tests pin the key's Keychain class, that a saved key reads back, and that `hasKey` follows save and clear (Swift suite KeyStoreTests). They also pin that a bad fragment stores nothing and that a refused link keeps the stored key (Swift suite KeyIntakeTests). Nothing yet pins that the key stays out of the ledger, a backup or view state. The Mirror scan is built, but only its own control test calls it. Those checks belong to lanes N3, N5 and N8, see `native-build-lanes`.
