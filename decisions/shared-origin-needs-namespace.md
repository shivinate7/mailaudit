# The Pages origin is shared, so storage is namespaced

Every repository the user hosts on GitHub Pages shares one origin. That is the reason every stored key carries the same namespace prefix. It is also the reason the storage quota is shared with any other project on that origin.

## See also

- `every-origin-has-own-storage` — the origin boundary this namespace sits inside
- `the-token-lives-outside-the-namespace` — the credential deliberately left out of this namespace
