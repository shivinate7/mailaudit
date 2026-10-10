# The masthead is not the project name

The app presents itself as MANIFEST. The project keeps the name Mail Day Ledger, the repo keeps `mailaudit`, and the storage namespace keeps `mailday:`. None of those may follow the masthead, because real check-in data sits under those keys. The home screen label stays "Mail Day" on purpose, because iOS bakes that label in at install time.

## See also

- `storage-keys-are-frozen` — the invariant that forbids renaming the namespace.
- `assets-and-icons` — why a changed icon forces a delete and re-add on iOS.
- `design-parchment-ledger` — the letterhead the masthead belongs to.
