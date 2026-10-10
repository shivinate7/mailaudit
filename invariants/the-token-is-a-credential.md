# The GitHub token is a credential

This is the rule `the-token-is-a-credential`. The GitHub token is a device credential, not ledger data. It must never enter the ledger blob, a backup file, the pushed payload, the repo, the bundle, or React state.

Three structural guarantees keep it out. They are listed from strongest to weakest.

1. The token lives outside the `mailday:` namespace, so no enumeration finds it.
2. The key input is **uncontrolled**. It is a `ref`. The app reads it once on submit, then clears it. So the token is never in a state snapshot or a DevTools dump.
3. The payload is built from named fields. It never spreads state.

`resetAll` deliberately does **not** clear the token. The token is a device credential. Dropping the stored sha with it would make the very next push fail with a 422, for no reason. No test pins that `resetAll` keeps the token.

**Pinned by:** 25.24–25.27 (the token stays out of the saved ledger, the pushed payload, a backup file and the storage namespace). Nothing pins the React-state or bundle guarantees, or the `resetAll` rule above.
