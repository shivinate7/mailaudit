# The Worker keeps daily snapshots, and GitHub leaves the sync role

**Status:** ruled. The owner ruled on 2026-10-11: "Cloudflare does it all". The owner ruled on 2026-10-14 that the snapshots are the backup, see `sync-revamp-cloudflare`. Lane W3a built the snapshots. It landed on main in PR #79. Group 13 (tests 13.1 to 13.9) holds the snapshot tests. At W3a, `npm run test:worker` read 312 passed, 0 failed.

GitHub leaves the sync role entirely. The Worker keeps daily snapshots of the ledger for History and for backup. The backup watchdog checks the Worker. The public seed goes away. The owner ruled on 2026-10-11 to drop it, so the ledger stops being public and a visitor sees an empty app.

**Holds while:** the public seed, the backup watchdog and History still read the GitHub `data` branch.

Kind: build

Plan: decisions/worker-keeps-snapshots.md#snapshot-defaults (worker)

## Why

Since the switch, no device pushes to the `data` branch. The seed, the watchdog and History read that frozen branch. Native never holds a GitHub token, see `the-token-is-a-credential`.

## What the ruling means

- The Worker holds the truth and its history. It needs no GitHub token.
- History and backup read Worker snapshots, for the web app and for the native client. Web History does not read them yet, see `web-reads-no-worker-snapshots`.
- The watchdog checks the Worker in place of the `data` branch history.
- The web mirror is off since the switch. `sync-revamp-cloudflare` no longer carries mirror rulings.
- The Worker keeps exactly 180 daily snapshots: the window is today and the 179 days before it, with at most one snapshot per UTC day. They sit in a SQLite table of its Durable Object. The defaults are in the next section.

## Snapshot defaults

Orchestrator defaults of 2026-10-12, not owner rulings. The snapshot, `/health` and snapshot-route bullets landed on main with W3a, in PR #79. The last two bullets, on the data branch and on restore, have not.

- A snapshot holds the ledger as it was before the first changing write of its UTC day. Later changing writes that day write no snapshot.
- A snapshot is kept while it is within 180 days: today and the 179 days before it stay. A changing write removes the 180-day-old and older snapshots.
- Test 13.4 requires that a no-op POST, a 413, a 400 and a first POST to an empty store take no snapshot. It passes.
- GET /health needs no key. It replies only with the last write time. A no-op does not move it.
- The snapshot routes need a device key. The list gives only the day, rev and time of each snapshot, newest day first.
- The data branch is frozen when it retires. It is not deleted.
- A restore stamps new change times. Not built. Debt: `restore-stamps-new-change-times`.

## Rejected

- A Worker cron that mirrors to the `data` branch. It would put a GitHub token in a Worker secret.
- The Mac browser as the one mirror. The seed, History and the watchdog would go stale once both devices are native.

## Records that this dates when the replacement ships

These records stay true until then. Each one needs a rewrite or a removal when lane W3 ships.

- `the-public-seed` and `ledger-remote-needed-for-seed` — the seed and the build step that reads the data remote.
- `watchdog-catches-silent-failure` and `watchdog-lives-in-private-repo` — the watchdog that reads the `data` branch.
- `older-versions-come-off-branch` and `history-restores-a-saved-version` — History that reads the branch.
- `data-branch-setup` — the branch the mirror wrote before the switch.

## See also

- `sync-revamp-cloudflare` — the Worker and its history.
- `native-parity-table` — the web-only rows for the mirror and the seed.
- `native-build-lanes` — lane W3.
