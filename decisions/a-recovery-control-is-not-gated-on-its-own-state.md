# A recovery control cannot need the state it recovers

File actions and the sync region both used to hide when the data they act on was absent. That made the recovery control unreachable in exactly the case it exists for. Backup needed envelopes without items to still show a button. Sync needed an empty ledger to still show Pull. Any control whose job is to recover state must never be gated on that state existing.

## The argument, as recorded

```
**The file actions are gated on `items.length > 0 || envelopes.length > 0`, the
same condition as the view switch — not on `items.length` alone.** They used to
be, which meant a user holding hand-typed orphaned envelopes with an empty item
list had no Backup button at all, for data that exists nowhere else. Test 23.1.
The filters keep the narrower `items.length > 0` gate, since they describe a
list that isn't there.

**And the whole region is gated on `… || !!window.remote`, wider still.** Same
bug, one level out, found on the live site the day Push/Pull shipped: an empty
ledger is *exactly* when Pull is needed — a new phone, ITP having cleared
storage, a move to another origin — and gated on data alone, the one control
that recovers from having no data was unreachable whenever you had no data. The
only button on screen was "Choose file". Now an empty ledger shows `Sync` alone:
**Re-import and Reset stay on the narrower gate**, because there is nothing to
re-import into (the upload zone is already up unprompted) and nothing to clear,
and a red destructive button on an empty ledger is noise at best. Group 28.

The pattern to take from this: any control that *recovers* state must not be
gated on that state existing. Backup was widened once for this reason, Sync
twice.
```

## See also

- `ruled-head-one-advisory-line-is-the-only-entrance` — the same rule applied to the sync entrance.
- `a-store-that-cannot-write-says-so` — another control that must stay visible on failure.
- `pull-needs-a-key-too` — the recovery this rule protects.
