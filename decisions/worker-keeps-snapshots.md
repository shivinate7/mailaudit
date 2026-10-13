# The Worker keeps daily snapshots, and GitHub leaves the sync role

**Status:** ruled. The owner ruled on 2026-10-11: "Cloudflare does it all". The snapshots are on main, and the probe in `live-verification` passed them on 2026-10-12. Group 13 holds the snapshot tests. `npm run test:worker` at `c48fc20` reads 499 passed, 3 failed. The three are 68.1 to 68.3 in `saved-state-shape`, which assert the old write order.

GitHub leaves the sync role entirely. The Worker keeps daily snapshots of the ledger for History and for backup. The backup watchdog checks the Worker. The public seed goes away. The owner ruled on 2026-10-11 to drop it, so the ledger stops being public and a visitor sees an empty app.

**Holds while:** the Worker serves only `/ledger` and `/ws`, and `src/entry.jsx` still mirrors the ledger to the GitHub `data` branch.

## Why

Today only web devices push to the `data` branch. Once both devices run the native client, nobody pushes there. The seed, the watchdog and History would go stale. Native never holds a GitHub token, see `the-token-is-a-credential`.

## What the ruling means

- The Worker holds the truth and its history. It needs no GitHub token.
- History and backup read Worker snapshots, for the web app and for the native client.
- The watchdog checks the Worker in place of the `data` branch history.
- Web devices keep the GitHub mirror only until the replacement ships. The Stage 4b mirror rulings in `sync-revamp-cloudflare` describe that web path and retire with it.
- The Worker keeps exactly 180 daily snapshots: the window is today and the 179 days before it, with at most one snapshot per UTC day. They sit in a SQLite table of its Durable Object. The defaults are in the next section.

## Snapshot defaults

Orchestrator defaults of 2026-10-12, not owner rulings. They are on main, and the 2026-10-12 probe passed them.

- A snapshot holds the ledger as it was before the first changing write of its UTC day. Later changing writes that day write no snapshot.
- A snapshot is kept while it is within 180 days: today and the 179 days before it stay. A changing write removes the 180-day-old and older snapshots.
- Test 13.4 requires that a no-op POST, a 413, a 400 and a first POST to an empty store take no snapshot. It passes.
- GET /health needs no key. It replies only with the last write time. A no-op does not move it.
- The snapshot routes need a device key. The list gives only the day, rev and time of each snapshot, newest day first.
- The data branch is frozen when it retires. It is not deleted.
- A restore stamps new change times. Not built. Its lane is W3b, which is blocked, see `native-build-lanes`.

## Kept originals

Orchestrator default of 2026-10-12, not an owner ruling. The reason is the owner ruling of 2026-10-12, "Keep a copy, then go on". Built at `c48fc20`, not deployed. The client side is in `saved-state-shape`.

- A POST that mends a damaged stored ledger writes the original to `kept` before the write, whatever the snapshots hold. A healthy stored ledger writes no `kept` row.
- A `kept` row holds the rev and the ledger, keyed by the ISO time it was kept. It sits in a SQLite table of the Durable Object, beside the snapshots.
- A changing write prunes `kept` to the snapshot window: today and the 179 days before it.
- GET /kept lists each row's time and rev, with no ledger body, newest first. GET /kept/<at> returns the ledger and rev, or 404. Both need a device key, as the snapshot routes do.
- A failed `kept` write leaves the stored ledger unchanged, and the POST is not answered 200 (Worker 69.6).
- Pinned by Worker 69.1 to 69.6, in `worker/core.test.mjs`, run by `npm run test:worker`. All six pass at `c48fc20`.

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
