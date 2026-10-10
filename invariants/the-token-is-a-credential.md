# The GitHub token is a credential

The GitHub access token is a device credential, not ledger data. It must never enter the ledger blob, a backup file, the pushed payload, the repo, the bundle, or React state. The app keeps this true by construction. The token lives outside the ledger's storage namespace. The key input field is uncontrolled and read only once. The saved payload is built from named fields rather than a spread of state.
