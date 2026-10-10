# One advisory line is sync's only entrance

On the happy path, no sync vocabulary appears on screen. The action row has no `Sync` cell. There is no toggle, no `Merge`, and no notice that the other device is ahead. Sync either happens or it does not. Only the failed case deserves a pixel. A ledger that quietly stopped reaching GitHub is exactly the failure the remote exists to prevent. It is invisible by nature.

**Holds while:** `SYNC_STALE_MS` in `src/app.jsx` is 24 hours, and `syncBroken` checks conflict, error, behind, then no key, in that order.

So there is **one line**. It is advisory manila, full width, above the ruled row. A sentence has to wrap, while the row's cells are a fixed 40px of uppercase mono. The line is the sole entrance to the repair kit. One example of the line's copy is `Not backed up since Aug 30 — tap to fix`.

`syncBroken` decides whether the line shows. It checks these cases in priority order:

1. A conflict.
2. An errored last attempt.
3. **Being behind.**
4. No key on this device.
5. Never synced.
6. A last agreement with the remote that is older than `SYNC_STALE_MS`.

The stale limit is 24h. Push is automatic and idle-debounced. A shorter limit would fire on an ordinary evening with the phone face down. A longer limit would stop being a warning.

The line is deliberately **not gated on local data**. A device with an empty ledger and no key is a fresh phone. This line is its only route to the Pull that recovers it. Test 28.1 covers this.

## See also

- `a-recovery-control-is-not-gated-on-its-own-state` — the same reachability rule this line follows.
- `ruled-head-the-staleness-clock-measures-agreement` — the clock this line reports on.
- `pull-needs-a-key-too` — the recovery this line is the entrance to.
