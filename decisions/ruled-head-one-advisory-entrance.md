# One advisory line is sync's only entrance

On the happy path, no sync vocabulary appears on screen. The action row has no `Sync` cell. There is no toggle, no `Merge`, and no notice that the other device is ahead. Sync either happens or it does not. Only the failed case deserves a pixel. A ledger that quietly stopped reaching GitHub is exactly the failure the remote exists to prevent. It is invisible by nature.

**Holds while:** `SYNC_STALE_MS` in `src/app.jsx` is 24 hours. `syncBroken` checks its cases in the order listed below. It is a `useMemo` whose dependencies include `ahead`.

So there is **one line**. It is advisory manila, full width, above the ruled row. A sentence has to wrap, while the row's cells are a fixed 40px of uppercase mono. The line is the sole entrance to the repair kit. One example of the line's copy is `Not backed up since Aug 30 — tap to fix`.

`syncBroken` decides whether the line shows. It checks these cases in priority order:

1. The page shows the public seed.
2. A conflict.
3. An errored last attempt.
4. The last Worker call failed as unknown, refused the key, or found the ledger too big. Mirror mode is then off.
5. The device cannot see the private repo.
6. **Being behind.**
7. This device's photos could not be read.
8. No GitHub key on this device.
9. The backup could not be checked: the peek came back unknown twice.
10. Never synced.
11. A last agreement with the remote that is older than `SYNC_STALE_MS`.

"I could not look" is never silent. Cases 7 and 9 used to return with no sign, so a blind push looked the same as a working one. An unknown peek retries once before case 9 shows, so one failed request does not raise the line. The retry is immediate, so it does not cover a network that is still waking up. A no-access or rate-limit answer is not retried, because a retry cannot change it. No key outranks case 9, because a keyless device cannot look at all, and adding its key is the true fix. Group 48 pins these cases, and pins that a healthy device shows none of them.

Case 4 names the server. Its copy is `The sync server could not be reached — tap to fix`. The failure turns mirror mode off, so the plain GitHub path runs. Test 53.8b pins that the line names the server. A 413 reply does the same, and its copy is `The ledger is too big for the sync server — tap to fix`. Test 55.8 pins it. A 401 shows `This device’s sync key was refused — tap to fix`, and group 56 pins it. See `sync-revamp-cloudflare`.

A Worker reply that waits for the idle gate shows no line. Test 55.5 pins it.

The stale limit is 24h. Push is automatic and idle-debounced. A shorter limit would fire on an ordinary evening with the phone face down. A longer limit would stop being a warning.

Without a Worker key, being behind must reach this line. Auto-push declines while the remote is ahead. The automatic merge runs only on a fresh session. So a device that falls behind mid-session stops backing up for the rest of that session. The manila "pushed newer lines" notice sits inside the sync panel. The panel opens only from this line. A person had to know to look for the notice. With a key, GitHub is a mirror, no peek runs, and a remote that is ahead raises no behind line. Test 54.1c pins that.

The 24-hour check is frozen too. `syncBroken` reads `Date.now()` inside its `useMemo`. A stalled device changes none of its dependencies, so the comparison does not re-run. Tests 38b.1–38b.3 pin this.

The line is deliberately **not gated on local data**. A device with an empty ledger and no key is a fresh phone. This line is its only route to the Pull that recovers it. Test 28.1 covers this.

**Pinned by:** 28.1, 28.8–28.12 and 38b.1–38b.3, and tests 53.8b (the server copy) and 54.1c (no behind line with a key). Test 28.1 shows the line on an empty ledger with no key. Tests 28.8–28.12 cover the line as the panel's own toggle. Both halves are mutation-confirmed. Tests 38b.1–38b.3 cover the ahead case. The helper `openSync()` clicks `/tap to/`, because the line is the only entrance. `openHistory()` is its counterpart. Both helpers are idempotent.

## See also

- `recovery-control-not-state-gated` — the same reachability rule this line follows.
- `ruled-head-stale-clock-agreement` — the clock this line reports on.
- `pull-needs-a-key-too` — the recovery this line is the entrance to.
- `auto-apply-happens-now` — why the automatic merge runs on a fresh session only.
- `sync-runs-itself` — the automatic push that declines while behind.
- `ruled-head-hand-elapsed-forward` — the fresh-session signal the merge reads.
- `sync-revamp-cloudflare` — the Worker whose failure case 4 names.
