# A recovery control cannot need the state it recovers

File actions and the sync region both used to hide when the data they act on was absent. That made the recovery control unreachable in exactly the case it exists for. Backup needed envelopes without items to still show a button. Sync needed an empty ledger to still show Pull. Any control whose job is to recover state must never be gated on that state existing.

## See also

- `ruled-head-one-advisory-line-is-the-only-entrance` — the same rule applied to the sync entrance.
- `a-store-that-cannot-write-says-so` — another control that must stay visible on failure.
- `pull-needs-a-key-too` — the recovery this rule protects.
