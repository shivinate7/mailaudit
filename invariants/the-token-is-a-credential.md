# The GitHub token and the device key are credentials

This is the rule `the-token-is-a-credential`. The GitHub token and the Worker device key are device credentials, not ledger data. Neither may enter the ledger blob, a backup file, the pushed payload, the repo, the bundle, or React state.

Three structural guarantees keep them out. They are listed from strongest to weakest.

1. Both credentials live outside the `mailday:` namespace, so no enumeration finds them.
2. The GitHub key input is **uncontrolled**. It is a `ref`. The app reads it once on submit, then clears it. So the token is never in a state snapshot or a DevTools dump. The device key never reaches React state either. `window.sync` reads it from storage, and `hasKey()` returns only a boolean.
3. The payload is built from named fields. It never spreads state.

`resetAll` deliberately does **not** clear either credential. The GitHub token is a device credential. Dropping the stored sha with it would make the very next push fail with a 422, for no reason. No test pins that `resetAll` keeps the token.

**Pinned by:** 25.24–25.27 (the GitHub token stays out of the saved ledger, the pushed payload, a backup file and the storage namespace), 51.26–51.27 (the device key's name sits outside the namespace), and 52.4–52.7 (the device key stays out of those places, on the harness mock only). Nothing pins the React-state or bundle guarantees, or the `resetAll` rule above.
