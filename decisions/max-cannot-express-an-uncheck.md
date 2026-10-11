# `max` on received could not express an un-check

**Status:** closed, by the `receivedAt` change (`sync-revamp-cloudflare`).

A per-key `receivedAt` map closes this. Each check or un-check stores the time of its last change. A merge keeps the later time per key, so an un-check beats an older check. With no time on a side, the merge falls back to the per-key max.

## See also

- `merge-later-change-wins` — the rule this exception was carved from, now revised
- `imports-merge-never-replace` — the wider merge philosophy this sits inside
- `sync-revamp-cloudflare` — the design that added `receivedAt`
