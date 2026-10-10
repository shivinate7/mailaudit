# One advisory line is sync's only entrance

On the happy path, no sync vocabulary appears on screen. The action row has no `Sync` cell. There is no toggle, no `Merge`, and no notice that the other device is ahead. Sync either happens or it does not. Only the failed case deserves a pixel. A ledger that quietly stopped reaching GitHub is exactly the failure the remote exists to prevent. It is invisible by nature.

**Holds while:** `SYNC_STALE_MS` in `src/app.jsx` is 24 hours. `syncBroken` checks conflict, error, behind, then no key, in that order. It is a `useMemo` whose dependencies include `ahead`.

So there is **one line**. It is advisory manila, full width, above the ruled row. A sentence has to wrap, while the row's cells are a fixed 40px of uppercase mono. The line is the sole entrance to the repair kit. One example of the line's copy is `Not backed up since Aug 30 — tap to fix`.

`syncBroken` decides whether the line shows. It checks these cases in priority order:

1. A conflict.
2. An errored last attempt.
3. **Being behind.**
4. No key on this device.
5. Never synced.
6. A last agreement with the remote that is older than `SYNC_STALE_MS`.

The stale limit is 24h. Push is automatic and idle-debounced. A shorter limit would fire on an ordinary evening with the phone face down. A longer limit would stop being a warning.

Being behind must reach this line. Auto-push declines while the remote is ahead. The automatic merge runs only on a fresh session. So a device that falls behind mid-session stops backing up for the rest of that session. The manila "pushed newer lines" notice sits inside the sync panel. The panel opens only from this line. A person had to know to look for the notice.

The 24-hour check is frozen too. `syncBroken` reads `Date.now()` inside its `useMemo`. A stalled device changes none of its dependencies, so the comparison does not re-run. Tests 38b.1–38b.3 pin this.

The line is deliberately **not gated on local data**. A device with an empty ledger and no key is a fresh phone. This line is its only route to the Pull that recovers it. Test 28.1 covers this.

**Pinned by:** 28.1, 28.8–28.12 and 38b.1–38b.3. Test 28.1 shows the line on an empty ledger with no key. Tests 28.8–28.12 cover the line as the panel's own toggle. Both halves are mutation-confirmed. Tests 38b.1–38b.3 cover the ahead case. The helper `openSync()` clicks `/tap to/`, because the line is the only entrance. `openHistory()` is its counterpart. Both helpers are idempotent.

## See also

- `recovery-control-not-state-gated` — the same reachability rule this line follows.
- `ruled-head-stale-clock-agreement` — the clock this line reports on.
- `pull-needs-a-key-too` — the recovery this line is the entrance to.
- `auto-apply-happens-now` — why the automatic merge runs on a fresh session only.
- `sync-runs-itself` — the automatic push that declines while behind.
- `ruled-head-hand-elapsed-forward` — the fresh-session signal the merge reads.
