# Push and merge guard on different confirms

The merge and the push refuse different in-progress states, and the difference is deliberate. The merge refuses while a compose, an undo, or any armed confirm is live. It applies a remote ledger, and that would erase in-progress work. The push refuses only on armed confirms, because it changes nothing on this device. A half-built envelope is not yet in the ledger, and a pending undo sits on top of a check-in that already happened and saved. Guarding the push on the same wider set stalled backup for an entire session in one real case.

## The argument, as recorded

```
**The push and the merge guard on different things, and the difference is the
point.** The merge refuses while `composing`, `undo` or any armed confirm is
live, because it APPLIES a remote ledger and `applyBackup` nulls the first two.
The push refuses only on armed confirms: it changes nothing on this device, a
half-built envelope is not in the ledger yet, and a pending undo sits on top of
a check-in that genuinely happened and is already saved. Guarding the push on
them too was over-broad and it stalled — `undo` survives a trip to Packages by
design (group 14 pins that), so an assignment followed by a view switch stopped
all backup for the rest of the session, invisibly, because there is no undo
control outside Orphaned. Test 38b.3b. (`composing` is additionally cleared when
you leave Orphaned, because the composer's draft lives in local state inside
that view and is already gone by then — the flag was outliving the thing it
described.)
```
