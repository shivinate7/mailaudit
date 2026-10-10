# A recovery control cannot need the state it recovers

If the data they act on is absent, the file actions and the sync region must not hide. Otherwise the recovery control is unreachable in the one case it exists for. Backup must still show for envelopes without items. Sync must still show for an empty ledger, because Pull is needed then.

**Holds while:** `src/app.jsx` gates the file actions on `items.length > 0 || envelopes.length > 0`. The sync region gate adds `|| !!window.remote`, so Sync shows on an empty ledger.

## Gates in the current build

The file actions are gated on `items.length > 0 || envelopes.length > 0`. This is the same condition as the view switch. It is not `items.length` alone. A user with hand-typed orphaned envelopes and an empty item list would otherwise have no Backup button. That data exists nowhere else. Test 23.1.

The filters keep the narrower gate `items.length > 0`. They describe a list that is not there.

The whole region is gated on `… || !!window.remote`, which is wider still. Pull is needed most on an empty ledger. Examples: a new phone, ITP clearing storage, or a move to another origin. If the gate used data alone, the one control that recovers from no data would be unreachable. On an empty ledger the only button on screen was "Choose file". Now an empty ledger shows `Sync` alone.

Re-import and Reset keep the narrower gate. There is nothing to re-import into, because the upload zone is already up. There is nothing to clear. A red destructive button on an empty ledger is noise at best. Group 28.

## The rule

Any control that recovers state must not be gated on that state existing. Backup was widened once for this reason. Sync was widened twice.

## See also

- `ruled-head-one-advisory-line-is-the-only-entrance` — the same rule applied to the sync entrance.
- `a-store-that-cannot-write-says-so` — another control that must stay visible on failure.
- `pull-needs-a-key-too` — the recovery this rule protects.
