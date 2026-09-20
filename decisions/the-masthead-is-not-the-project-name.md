# The masthead is not the project name

The app presents itself as MANIFEST. The project keeps the name Mail Day Ledger, the repo keeps `mailaudit`, and the storage namespace keeps `mailday:`. None of those may follow the masthead, because real check-in data sits under those keys. The home screen label stays "Mail Day" on purpose, because iOS bakes that label in at install time.

## The argument, as recorded

```
*(The app presents itself as **MANIFEST**, under a C.H Postal Company
letterhead. "Mail Day Ledger" remains the project's name — repo `mailaudit`,
storage namespace `mailday:` — and neither of those may be renamed to follow the
masthead; see invariant 1. The browser `<title>` in `build.mjs` is "Manifest";
`apple-mobile-web-app-title` is deliberately still "Mail Day", because iOS bakes
that label in at install time and changing it forces a delete-and-re-add of the
home-screen icon. That mismatch is intentional — don't "fix" it without asking.)*
```

## See also

- `storage-keys-are-frozen` — the invariant that forbids renaming the namespace.
- `assets-and-icons` — why a changed icon forces a delete and re-add on iOS.
- `design-parchment-ledger` — the letterhead the masthead belongs to.
