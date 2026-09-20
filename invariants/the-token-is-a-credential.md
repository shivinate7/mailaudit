# The GitHub token is a credential

The GitHub access token is a device credential, not ledger data. It must never enter the ledger blob, a backup file, the pushed payload, the repo, the bundle, or React state. The app keeps this true by construction. The token lives outside the ledger's storage namespace. The key input field is uncontrolled and read only once. The saved payload is built from named fields rather than a spread of state.

## The argument, as recorded

```
8. **The GitHub token is a credential, not ledger data.** It must never enter
   the ledger blob, a backup file, the pushed payload, the repo, the bundle, or
   React state. Three structural guarantees, in descending strength: it lives
   outside the `mailday:` namespace so no enumeration finds it; the key input is
   **uncontrolled** (a `ref`, read once on submit, then cleared) so it is never
   in a state snapshot or a DevTools dump; and the payload is built from named
   fields and never spreads state. `resetAll` deliberately does **not** clear it
   — it is a device credential, and dropping the stored sha with it would 422
   the very next push for no reason. Test 25.24–25.27.
```
