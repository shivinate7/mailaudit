# The Pages origin is shared, so storage is namespaced

`shivinate7.github.io` is a single origin across every repo the user has on Pages. That is why the key namespace is `mailday:`. Every stored key carries that prefix.

**Holds while:** `src/entry.jsx` still sets the storage namespace `mailday:`, and the app is still served from shivinate7.github.io.

It is also why the storage quota is shared. The quota is per origin, so every other Pages project on that origin uses the same quota.

## See also

- `every-origin-has-own-storage` — the origin boundary this namespace sits inside
- `the-token-lives-outside-the-namespace` — the credential deliberately left out of this namespace
