# One advisory line is sync's only entrance

On the happy path, no sync vocabulary appears on screen at all. Sync either works or it does not, and only the failed case deserves a pixel. A quietly failed backup is exactly the failure the remote exists to prevent. One manila line above the ruled row is the sole entrance to the repair kit behind it. It is not gated on there being local data, because a fresh device with nothing yet needs it most.

## The argument, as recorded

```
**On the happy path there is no sync vocabulary on screen at all.** No `Sync`
cell in the action row, no toggle, no `Merge`, no "the other device is ahead"
notice. Sync happens or it doesn't, and the only case worth a pixel is the one
where it has *stopped* — because a ledger that quietly stopped reaching GitHub
is exactly the failure the remote exists to prevent, and it is invisible by
nature.

So there is **one line**, advisory manila, full width above the ruled row (a
sentence has to wrap; the row's cells are a fixed 40px of uppercase mono), and
it is the sole entrance to what is now a repair kit: `Not backed up since
Aug 30 — tap to fix`. `syncBroken` decides, in priority order: a conflict, an
errored last attempt, **being behind**, no key on this device, never synced, or
a last agreement with the remote older than `SYNC_STALE_MS` (24h — the push is automatic and idle-debounced, so
anything shorter fires on an ordinary evening with the phone face down, and
anything longer stops being a warning). It is deliberately **not gated on there
being local data**: a device with an empty ledger and no key is the fresh phone,
and this line is its only route to the Pull that recovers it. Test 28.1.
```

## See also

- `a-recovery-control-is-not-gated-on-its-own-state` — the same reachability rule this line follows.
- `ruled-head-the-staleness-clock-measures-agreement` — the clock this line reports on.
- `pull-needs-a-key-too` — the recovery this line is the entrance to.
