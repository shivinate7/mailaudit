# The access token sits outside the storage namespace

The GitHub access token lives at a raw localStorage key, deliberately outside the app's own key namespace. The storage adapter's list call enumerates that namespace, and nothing calls it today. If a future feature backs up everything under that namespace, the token stays out of reach by construction, not by memory.

## The argument, as recorded

```
The access token lives at raw localStorage key **`mailday-remote:v1`**,
deliberately *outside* the `mailday:` namespace. `window.storage.list()`
enumerates that prefix; nothing calls it today, but the day someone adds "back
up everything in the namespace" the token would be swept into a file the user
emails to themselves. Keeping it out makes that impossible by construction
rather than by remembering. Verified in a browser: after saving a key,
`storage.list()` still returns only `["mailday:v1"]`.
```

## See also

- `the-token-is-a-credential` — the invariant this placement protects
- `shared-origin-needs-namespace` — the namespace this token deliberately sits outside
- `fine-grained-token-single-repo` — the scope of the token kept out of that namespace
