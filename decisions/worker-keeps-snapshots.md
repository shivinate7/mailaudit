# The Worker keeps daily snapshots, and GitHub leaves the sync role

**Status:** ruled. The owner ruled on 2026-10-11: "Cloudflare does it all". The owner ruled on 2026-10-14 that the snapshots are the backup, see `sync-revamp-cloudflare`, and that the backup watchdog in the private repo is turned off, which the orchestrator carries out. Lane W3a built the snapshots. It landed on main in PR #79. Group 13 (tests 13.1 to 13.9) holds the snapshot tests. At W3a, `npm run test:worker` read 312 passed, 0 failed.

GitHub leaves the sync role entirely. The Worker keeps daily snapshots of the ledger for History and for backup. The owner turned the backup watchdog off on 2026-10-14. The public seed is gone. The owner ruled on 2026-10-11 and on 2026-10-14/15 to drop it, and `82e45d4` removed it. The page carries no ledger, so a visitor sees an empty app. The seed stays in public git history, see debt `seed-in-public-history`.

**Holds while:** History still reads the frozen `data` branch (`window.remote.listVersions` and `getVersion` in `src/app.jsx`), and no web code reads the Worker snapshot routes (`web-reads-no-worker-snapshots`).

Kind: build

Plan: decisions/worker-keeps-snapshots.md#snapshot-defaults (worker)

## Why

Since the switch, no device writes the `data` branch. History reads that frozen branch. Native never holds a GitHub token, see `the-token-is-a-credential`.

## What the ruling means

- The Worker holds the truth and its history. It needs no GitHub token.
- History and backup read Worker snapshots, for the web app and for the native client. Web History does not read them yet, see `web-reads-no-worker-snapshots`.
- The owner turned the backup watchdog off on 2026-10-14. No check reads the Worker's backup now, see `backup-unwatched`.
- The web mirror is off since the switch. `sync-revamp-cloudflare` no longer carries mirror rulings.
- The Worker keeps exactly 180 daily snapshots: the window is today and the 179 days before it, with at most one snapshot per UTC day. They sit in a SQLite table of its Durable Object. The defaults are in the next section.

## Snapshot defaults

Orchestrator defaults of 2026-10-12, not owner rulings. The snapshot, `/health` and snapshot-route bullets landed on main with W3a, in PR #79. The last two bullets, on the data branch and on restore, are in the switch lane and not yet merged.

- A snapshot holds the ledger as it was before the first changing write of its UTC day. Later changing writes that day write no snapshot.
- A snapshot is kept while it is within 180 days: today and the 179 days before it stay. A changing write removes the 180-day-old and older snapshots.
- Test 13.4 requires that a no-op POST, a 413, a 400 and a first POST to an empty store take no snapshot. It passes.
- GET /health needs no key. It replies only with the last write time. A no-op does not move it.
- The snapshot routes need a device key. The list gives only the day, rev and time of each snapshot, newest day first.
- The data branch is frozen. It is not deleted.
- A restore stamps new change times. The switch lane builds it (`restampRestore` in `src/merge-rules.mjs`, called from `applyBackup`). The owner ruled that this fix lands before the switch merges.

## Rejected

- A Worker cron that mirrors to the `data` branch. It would put a GitHub token in a Worker secret.
- The Mac browser as the one mirror. History and the watchdog would go stale once both devices are native.

## Records that the switch and the seed removal change

These records stay true until their replacement ships.

- `the-public-seed` and `ledger-remote-needed-for-seed` — retired. `82e45d4` removed the seed and the build step that read the data remote.
- `watchdog-catches-silent-failure` and `watchdog-lives-in-private-repo` — retired. The owner turned the watchdog off.
- `older-versions-come-off-branch` and `history-restores-a-saved-version` — History that reads the branch, until web reads the snapshots.
- `data-branch-setup` — the frozen branch.

## See also

- `sync-revamp-cloudflare` — the Worker and its history.
- `native-parity-table` — the web-only rows for the mirror and the seed.
- `native-build-lanes` — lane W3.
