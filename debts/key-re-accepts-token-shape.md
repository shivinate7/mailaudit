# The key check accepts a GitHub token's shape

`KEY_RE` in `src/sync-rules.mjs` is `/^[A-Za-z0-9_-]+$/`. The key field checks its value against it in `src/entry.jsx`. A GitHub token uses only letters, digits and underscores, so the check accepts a token as a key. The gap closes when the key check rejects a GitHub token's shape, and a test pins that rejection.

**Status:** open.

**Decision:** `the-token-is-a-credential`.
