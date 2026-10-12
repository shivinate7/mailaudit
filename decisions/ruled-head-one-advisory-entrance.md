# One advisory line leads to the Sync group

On the happy path, no sync vocabulary appears on the working screens. There is no toggle, no `Merge`, and no notice that the other device is ahead. Sync either happens or it does not. Only the failed case deserves a pixel. A ledger that quietly stopped reaching the server is exactly the failure the remote exists to prevent. It is invisible by nature.

**Holds while:** `SYNC_STALE_MS` in `src/app.jsx` is 24 hours. `syncBroken` checks its cases in the order listed below. It is a `useMemo` whose dependencies include `ahead`. `syncSays` gives the line's copy.

There is **one line** on the working screens. It is advisory manila, full width. It shows on Orphaned, Tally and Packages when `syncBroken` is set. It does not show on the Ledger tab. On the Ledger tab the Sync row shows the state instead. One example of the line's copy is `Not backed up since Aug 30 — tap to fix`.

Tapping the line closes History, opens the Sync group, and takes the view to the Ledger tab (63.14, 63.15). The Sync row on the Ledger tab is a second way in. It shows when the device has a remote or a Worker.

`syncBroken` decides whether the line shows. It checks these cases in priority order:

1. The page shows the public seed.
2. An errored last attempt. `remoteMsg` holds the error. A GitHub code can reach this case (see the orchestrator default below).
3. The last Worker call failed as unknown, refused the key, or found the ledger too big. Mirror mode is then off.
4. This device's photos could not be read.
5. The backup could not be checked: the peek came back unknown twice.
6. A GitHub token but no Worker key on this device, while the sync panel is closed.
7. Never synced.
8. A last agreement with the remote that is older than `SYNC_STALE_MS`.

The conflict case, the behind case, the no-key case and the no-access case were removed on 2026-10-12, with the GitHub states.

Orchestrator default, 2026-10-12: the sync advisory and `remoteMsg` speak only of the Worker. A conflict, a behind copy, a missing GitHub key and an unreachable GitHub copy show nothing to the user. The mirror resolves a conflict itself, and a missing GitHub token only stops the mirror. Pinned by 65.3, 65.6 and 65.7.

Built in L11c, with one gap. `REMOTE_SAYS` still gives GitHub copy for `server`, `rate-limit`, `forbidden`, `bad-key`, `auth`, `missing` and `no-branch`. `setRemoteMsg` sends those codes to `remoteMsg`, and the Sync group shows its text (`src/app.jsx`, the `remoteMsg` block near line 6388). So a GitHub copy still reaches the user for those codes. A builder or the owner must decide them. Under case 2, `auth` raises the line.

"I could not look" is never silent. The photo-unreadable and backup-unknown cases used to return with no sign, so a blind push looked the same as a working one. An unknown peek retries once before the backup-unknown case shows, so one failed request does not raise the line. The retry is immediate, so it does not cover a network that is still waking up. A no-access or rate-limit answer is not retried, because a retry cannot change it. Group 48 pins these cases, and pins that a healthy device shows none of them.

Case 3 names the server. Its copy is `The sync server could not be reached — tap to fix`. The failure turns mirror mode off, so the plain GitHub path runs. Test 53.8b pins that the line names the server. A 413 reply does the same, and its copy is `The ledger is too big for the sync server — tap to fix`. Test 55.8 pins it. A 401 from the Worker shows the key-refused copy, and group 56 pins it.

Case 6 is the entrance to the sync key field when no other line shows. The home-screen app keeps its own storage, so a key set in Safari does not reach it. Its copy is `This device has no sync key — tap to paste it`. The Sync group holds a masked key field and `Save sync key`. Group 59 pins the copy. See `sync-revamp-cloudflare`.

A Worker reply that waits for the idle gate shows no line. Test 55.5 pins it.

The stale limit is 24h. Push is automatic and idle-debounced. A shorter limit would fire on an ordinary evening with the phone face down. A longer limit would stop being a warning.

Being behind used to reach this line. Auto-push declines while the remote is ahead, and the automatic merge runs only on a fresh session. So a device that fell behind mid-session stopped backing up for the rest of that session. The manila "pushed newer lines" notice sat in the sync panel, and L11b removed it with the Merge control. Being behind now raises no line (orchestrator default, 2026-10-12). With a Worker key and a healthy server, GitHub is a mirror. Then no peek runs, and a remote that is ahead raises no behind line. Test 54.1c pins that.

The 24-hour check is frozen too. `syncBroken` reads `Date.now()` inside its `useMemo`. A stalled device changes none of its dependencies, so the comparison does not re-run. Tests 38b.1–38b.3 pin this.

The line is deliberately **not gated on local data**. A device with an empty ledger and no key is a fresh phone. The Sync row on the Ledger tab gives it the key box (64.7).

## See also

- `ledger-tab-holds-options` — the Ledger tab and its Sync group.
- `recovery-control-not-state-gated` — the same reachability rule this line follows.
- `ruled-head-stale-clock-agreement` — the clock this line reports on.
- `pull-needs-a-key-too` — the GitHub key rule that no line now reports.
- `auto-apply-happens-now` — why the automatic merge runs on a fresh session only.
- `sync-runs-itself` — the automatic push that declines while behind.
- `ruled-head-hand-elapsed-forward` — the fresh-session signal the merge reads.
- `sync-revamp-cloudflare` — the Worker whose failure case 3 names.
- `worker-keeps-snapshots` — the Worker that replaces the GitHub mirror.

**Pinned by:** 63.14 (the line takes the tab to Ledger), 63.15 (and opens the Sync panel there), 63.16 (an empty ledger still reaches Sync), 64.7 (an empty ledger still reaches the key box), 38b.1–38b.3 (the 24-hour and ahead cases), 53.8b (the server copy), 54.1c (no behind line with a key), 65.3 (no GitHub verb in the open Sync panel), 65.6 and 65.7 (no GitHub copy on the line).
