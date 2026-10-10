# The access token sits outside the storage namespace

The GitHub access token lives at a raw localStorage key, deliberately outside the app's own key namespace. The storage adapter's list call enumerates that namespace, and nothing calls it today. If a future feature backs up everything under that namespace, the token stays out of reach by construction, not by memory.

## See also

- `the-token-is-a-credential` — the invariant this placement protects
- `shared-origin-needs-namespace` — the namespace this token deliberately sits outside
- `fine-grained-token-single-repo` — the scope of the token kept out of that namespace
