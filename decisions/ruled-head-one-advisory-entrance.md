# One advisory line leads to the Sync group

On the happy path, no sync vocabulary appears on the working screens. There is no toggle, no Merge control, and no notice that the other device is ahead. Sync either happens or it does not. Only the failed case deserves a pixel. A ledger that quietly stopped reaching the server is exactly the failure the remote exists to prevent. It is invisible by nature.

**Holds while:** `SYNC_STALE_MS` in `src/app.jsx` is 24 hours. `syncBroken` checks its cases in the priority order listed below. It is a `useMemo` over `seedShown`, `syncedAt`, `photoUnreadable`, `serverDown`, `workerKeySet` and `syncOpen`. `syncedAt` is `workerSyncedAt` (`ruled-head-stale-clock-agreement`). `syncSays` gives the line's copy.

There is **one line** on the working screens. It is advisory manila, full width. It shows on Orphaned, Tally and Packages when `syncBroken` is set. It does not show on the Ledger tab. On the Ledger tab the Sync row shows the state instead. One example of the line's copy is `Not backed up since Aug 30 — tap to fix`.

Tapping the line closes History, opens the Sync group, and takes the view to the Ledger tab (63.14, 63.15). The Sync row on the Ledger tab is a second way in. It shows when the device has a remote or a Worker.

`syncBroken` decides whether the line shows. It checks these cases in priority order:

1. The page shows the public seed.
2. The last Worker call failed. It was unknown, refused the key, or found the ledger too big. Mirror mode is then off.
3. This device's photos could not be read.
4. This device has no Worker key, while the sync panel is closed.
5. The last Worker agreement is older than `SYNC_STALE_MS`.

Before the first Worker agreement, no line shows. There is no "never" state. A Worker reply that waits for the idle gate shows no line. Test 55.5 pins it.

The copy for each case, from `syncSays`:

- Seed: `A snapshot of someone else’s ledger — anything you change stays on this device`.
- Unknown failure: `The sync server could not be reached — tap to fix`. Test 53.8b pins that the line names the server.
- Too big: `The ledger is too big for the sync server — tap to fix`. A 413 reply does this. Test 55.8b pins it.
- Key refused: `This device’s sync key was refused — tap to fix`. A 401 from the Worker does this. Group 56 pins it.
- Photos unreadable: `This device’s photos could not be read, so no new photos were backed up — tap to fix`.
- No key: `This device has no sync key — tap to paste it`. Group 59 pins the copy. The home-screen app keeps its own storage, so a key set in Safari does not reach it. The Sync group holds a masked key field and `Save sync key`. See `sync-revamp-cloudflare`.
- Stale: `Not backed up since <date> — tap to fix`.

The line is deliberately **not gated on local data**. A device with an empty ledger and no key is a fresh phone. The Sync row on the Ledger tab gives it the key box (64.7).

The stale limit is 24h. Push is automatic and idle-debounced. A shorter limit would fire on an ordinary evening with the phone face down. A longer limit would stop being a warning.

The 24-hour check is frozen too. `syncBroken` reads `Date.now()` inside its `useMemo`. A stalled device changes none of its dependencies, so the comparison does not re-run. Tests 38b.1–38b.3 pin this.

## Orchestrator default, 2026-10-12 (default 5)

This is an orchestrator default, not an owner ruling. The owner may overrule it. As rewritten on 2026-10-12:

- The UI never names GitHub, Push, Pull, Merge, a key for GitHub, or a token.
- The sync advisory line, the Sync panel status, "Last sync" and the staleness clock read Worker state only: `workerSyncedAt` and the Worker reply. They never read `pushState`, `pushedAt` or a GitHub peek.
- A failure of something the user can still press stays visible, worded with no GitHub control. That is History load and restore errors (`unwritable-store-says-so`, `recovery-control-not-state-gated`), and a last-copy photo about to be lost (`pull-warns-on-what-it-drops`).
- Merge notices stay. A merge that removes something says so (`sync-revamp-cloudflare`).

The conflict, behind, no-key, no-access, errored-attempt and backup-unknown cases were removed, with their GitHub copy. A conflict, a behind copy, a missing GitHub key and an unreachable GitHub copy show nothing to the user. The mirror resolves a conflict itself. A missing GitHub token only stops the mirror. Pinned by 65.3, 65.6 and 65.7.

Being behind used to reach this line. Auto-push declines while the remote is ahead, and the automatic merge runs only on a fresh session. So a device that fell behind mid-session stopped backing up for the rest of that session. The manila "pushed newer lines" notice sat in the sync panel, and L11b removed it with the Merge control. Being behind now raises no line. With a Worker key and a healthy server, GitHub is a mirror. Then no peek runs, and a remote that is ahead raises no behind line. Test 54.1c pins that.

"I could not look" is never silent for the photos. The photo-unreadable case used to return with no sign, so a blind push looked the same as a working one. An unknown GitHub peek now shows nothing. The backup watchdog catches a stopped mirror (`watchdog-catches-silent-failure`). Group 48 pins the photo case, and pins that a healthy device shows none of them.

**Status:** partly built at 3f3d426.

- Built: the line, the Sync panel status, "Last sync" and the clock read the Worker only. `REMOTE_SAYS`, which feeds the History errors, names no GitHub, Push or Pull word.
- Open for a builder: `PHOTO_SAYS.no-access` says "pulling" and "your key". `PHOTO_SAYS.no-key` says "a key to sync". Whether that key is the GitHub key needs a ruling.
- Open for a builder: the "Pulled from GitHub" notice at `src/app.jsx` line 3525 is a dead branch. No caller passes source `"remote"`.
- Open for a builder: code comments at `src/app.jsx` lines 2967 and 3222 call this rule an owner ruling.

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

**Pinned by:**

- 63.14 and 63.15: the line takes the tab to Ledger and opens the Sync panel there.
- 63.16 and 64.7: an empty ledger still reaches Sync and the key box.
- 38b.1–38b.3: the 24-hour and ahead cases.
- 53.8b, 55.8b and group 56: the server, too-big and key-refused copy.
- 54.1c: no behind line with a key.
- 55.5: no line while a reply is held.
- Group 59: the no-key copy.
- Group 48: the photo case, and a healthy device shows none of it.
- 65.3, 65.6 and 65.7: no GitHub verb or copy in the Sync panel or on the line.
- 66.1 and 66.2: no GitHub word in the rendered text.
