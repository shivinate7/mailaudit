# One advisory line leads to the Sync group

On the happy path, no sync vocabulary appears on the working screens. There is no toggle, no `Merge`, and no notice that the other device is ahead. Sync either happens or it does not. Only the failed case deserves a pixel. A ledger that quietly stopped reaching the server is exactly the failure the remote exists to prevent. It is invisible by nature.

**Holds while:** `SYNC_STALE_MS` in `src/app.jsx` is 24 hours. `syncBroken` checks its cases in the order listed below. It is a `useMemo` whose dependencies are `seedShown`, `syncedAt`, `photoUnreadable`, `serverDown`, `workerKeySet` and `syncOpen`. `syncSays` gives the line's copy.

There is **one line** on the working screens. It is advisory manila, full width. It shows on Orphaned, Tally and Packages when `syncBroken` is set. It does not show on the Ledger tab. On the Ledger tab the Sync row shows the state instead. One example of the line's copy is `Not backed up since Aug 30 — tap to fix`.

Tapping the line closes History, opens the Sync group, and takes the view to the Ledger tab (63.14, 63.15). The Sync row on the Ledger tab is a second way in. It shows when the device has a remote or a Worker.

`syncBroken` decides whether the line shows. It checks these cases in priority order:

1. The page shows the public seed (`seeded`).
2. The last Worker call failed as unknown, refused the key, or found the ledger too big (`server`, `key-refused`, `too-big`). Mirror mode is then off.
3. This device's photos could not be read (`photos-unreadable`).
4. No Worker key on this device, while the sync panel is closed (`sync-key`).
5. The last Worker agreement is older than `SYNC_STALE_MS` (`stale`).

A device that has never agreed with the Worker shows no line. Its Sync row reads `Not synced yet`.

The conflict case, the behind case, the no-key case, the no-access case, the errored-attempt case (the old remote message) and the backup-unknown case were removed on 2026-10-12 (default 5), with the GitHub states.

Orchestrator default, 2026-10-12 (default 5): the sync advisory speaks only of the Worker. The old remote message is gone (6b1c668). A conflict, a behind copy, a missing GitHub key and an unreachable GitHub copy show nothing to the user. The mirror resolves a conflict itself, and a missing GitHub token only stops the mirror. Pinned by 65.3, 65.6 and 65.7.

Built in 6b1c668 (default 5). Its two gaps are closed at f956873. `REMOTE_SAYS` (the History errors, fed to `setVersionMsg`) and `PHOTO_SAYS` (the photo line, fed to `photoMsg`) name no GitHub, Push or Pull. The photo copy names no control.

**The guard.** `guardWords66` in `test/app.test.mjs` (group 66) reads the rendered text with the Sync panel open. It fails on any match of `NO_GITHUB_WORDS66`: GitHub, push, pull, pulling, pulled, repo, private repo or your key. It runs at five sync states. They are 66.5 keyless, 66.6 healthy, 66.7 unreachable (`server`), 66.8 26 photos queued, and 66.9 photo key missing. It does not reach `seeded`, `key-refused`, `too-big`, `photos-unreadable` or `stale`. It does not reach a keyed device that has not agreed yet. 66.2 checks that state with a shorter list. It does not reach the line with the panel closed, or History's `REMOTE_SAYS` copy. So the guard does not sweep every sync state.

"I could not look" is never silent for the photos. The photo-unreadable case used to return with no sign, so a blind push looked the same as a working one. The backup-unknown line was removed on 2026-10-12 (default 5). An unknown peek now shows nothing, and the backup watchdog is what catches a stopped mirror (`watchdog-catches-silent-failure`). Group 48 pins the photo case, and pins that a healthy device shows none of them.

Case 2 names the server. Its copy is `The sync server could not be reached — tap to fix`. The failure turns mirror mode off, so the plain GitHub path runs. Test 53.8b pins that the line names the server. A 413 reply does the same, and its copy is `The ledger is too big for the sync server — tap to fix`. Test 55.8 pins it. A 401 from the Worker shows the key-refused copy, and group 56 pins it.

Case 4 is the entrance to the sync key field when no other line shows. The home-screen app keeps its own storage, so a key set in Safari does not reach it. Its copy is `This device has no sync key — tap to paste it`. The Sync group holds a masked key field and `Save sync key`. Group 59 pins the copy. See `sync-revamp-cloudflare`.

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
- `sync-revamp-cloudflare` — the Worker whose failure case 2 names.
- `worker-keeps-snapshots` — the Worker that replaces the GitHub mirror.

**Pinned by:** 63.14 (the line takes the tab to Ledger), 63.15 (and opens the Sync panel there), 63.16 (an empty ledger still reaches Sync), 64.7 (an empty ledger still reaches the key box), 38b.1–38b.3 (the 24-hour and ahead cases), 53.8b (the server copy), 54.1c (no behind line with a key), 65.3 (no GitHub verb in the open Sync panel), 65.6 and 65.7 (no GitHub copy on the line), 66.5–66.9 (the word guard above).
