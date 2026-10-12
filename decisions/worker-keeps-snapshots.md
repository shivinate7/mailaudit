# The Worker keeps daily snapshots, and GitHub leaves the sync role

**Status:** ruled. The owner ruled on 2026-10-11: "Cloudflare does it all". Lane W3a builds the snapshots on draft PR #78. 305 of 310 worker assertions pass, and the 5 red are all in test 12.4. W3a has not landed.

GitHub leaves the sync role entirely. The Worker keeps daily snapshots of the ledger for History and for backup. The backup watchdog checks the Worker. The public seed goes away. The owner ruled on 2026-10-11 to drop it, so the ledger stops being public and a visitor sees an empty app.

**Holds while:** the Worker serves only `/ledger` and `/ws`, and `src/entry.jsx` still mirrors the ledger to the GitHub `data` branch.

## Why

Today only web devices push to the `data` branch. Once both devices run the native client, nobody pushes there. The seed, the watchdog and History would go stale. Native never holds a GitHub token, see `the-token-is-a-credential`.

## What the ruling means

- The Worker holds the truth and its history. It needs no GitHub token.
- History and backup read Worker snapshots, for the web app and for the native client.
- The watchdog checks the Worker in place of the `data` branch history.
- Web devices keep the GitHub mirror only until the replacement ships. The Stage 4b mirror rulings in `sync-revamp-cloudflare` describe that web path and retire with it.
- The Worker keeps 180 days of snapshots, one per UTC day, in a SQLite table of its Durable Object. The defaults are in the next section.

## Snapshot defaults

Orchestrator defaults of 2026-10-12, not owner rulings. None is on main yet.

- A snapshot holds the ledger as it was before the first changing write of its UTC day. Later changing writes that day write no snapshot.
- A snapshot is kept for 180 days. A changing write removes the snapshots older than that.
- Test 12.4 requires that a no-op POST, a 413, a 400 and a first POST to an empty store take no snapshot. It is red.
- GET /health needs no key. It replies only with the last write time. A no-op does not move it.
- The snapshot routes need a device key. The list gives only the day, rev and time of each snapshot, newest day first.
- The data branch is frozen when it retires. It is not deleted.
- A restore stamps new change times. Not built. Its lane is W3b, which is blocked, see `native-build-lanes`.

## Rejected

- A Worker cron that mirrors to the `data` branch. It would put a GitHub token in a Worker secret.
- The Mac browser as the one mirror. The seed, History and the watchdog would go stale once both devices are native.

## Records that this dates when the replacement ships

These records stay true until then. Each one needs a rewrite or a removal when lane W3 ships.

- `the-public-seed` and `ledger-remote-needed-for-seed` — the seed and the build step that reads the data remote.
- `watchdog-catches-silent-failure` and `watchdog-lives-in-private-repo` — the watchdog that reads the `data` branch.
- `older-versions-come-off-branch` and `history-restores-a-saved-version` — History that reads the branch.
- `data-branch-setup` — the branch that the mirror writes.

## See also

- `sync-revamp-cloudflare` — the Worker and its history.
- `native-parity-table` — the web-only rows for the mirror and the seed.
- `native-build-lanes` — lane W3.
