# What a cloud session can reach: the Worker, GitHub and the Mac

This record says what a cloud session of this repo can do against the live Worker, GitHub and the owner's Mac. Each claim has one probe that proves it. Run the probe before you answer that you cannot. A session once said it could not write to the Worker, and it was wrong.

**Holds while:** the cloud environment keeps a network secret for the Worker host `manifestnumberone.shivamsemwal01.workers.dev`, so the agent proxy adds the device key to requests for it. If that secret is removed or the host changes, the Worker claims are stale: re-run the probes. Measured 2026-11-15 13:24 CST by the coordinator, and re-read by this lane (GETs only) on 2026-11-15. The device key is never in the session, never in an environment variable and never in this repo (`the-token-is-a-credential`).

## What reaches what

| Target | Reach | Probe (proves the claim) |
|---|---|---|
| Worker, read | works: `/health`, `/ledger`, `/snapshots`, `/kept`, `/photos` all answer 200 | `curl -sS -o /dev/null -w "%{http_code}\n" https://manifestnumberone.shivamsemwal01.workers.dev/ledger` prints 200 (401 means that the proxy is not adding the key) |
| Worker, write | works: `POST /ledger` with `{"ledger": ...}` | `curl -sS -o /dev/null -w "%{http_code}\n" -X POST -H 'content-type: application/json' -d '{"ledger":{}}' <host>/ledger` prints 400 `bad ledger`: the key is accepted and the shape check refuses it, so nothing is stored |
| GitHub, this repo | REST works through `gh api repos/{owner}/{repo}/...` and the GitHub MCP tools; branches push | `gh api repos/shivinate7/mailaudit --jq .full_name` prints the name |
| GitHub, `gh pr`, `gh issue`, GraphQL | refused with 403 | `gh pr list -R shivinate7/mailaudit -L1` prints HTTP 403 |
| GitHub, a repo not attached to the session (`mailaudit-data`) | refused with 403 until the add-repo tool attaches it | `gh api repos/shivinate7/mailaudit-data` prints 403 |
| Mac | not reachable: the owner's computer serves no folder to a cloud session | the cloud session's computer-folders tool lists no usable folder, and shows the Mac folders as not available |
| Xcode, simulators, `swift test` | not available: Ubuntu VM | these run in macOS CI (`native-ci-on-hosted-macos`) |
| Phone install | not available: it runs on the Mac | the CI route is the manual `testflight` dispatch (`native-ships-via-testflight`) |

The proxy adds the key outside the VM, so `env` shows no key. A script that checks the key's shape in the VM cannot run: `scripts/copy-photos-to-worker.mjs` refuses without a key it can read. Use curl or `fetch` against the host.

A live Worker **deploy** is unmeasured from the cloud: it would need `api.cloudflare.com` and a Cloudflare token as a network secret, and it needs the owner's word either way (`live-verification`). A write to `/ledger` is a data write, and `imports-merge-never-replace` governs it.

## Import a CSV from a cloud session

The web app's import has a second way in, for a session that holds the CSV. It needs the same care as the web import, minus its safety copy.

1. Copy the live ledger first: `curl -sS <host>/ledger > before.json`. The web import saves a "before import" version before it merges. This route does not. The Worker also keeps one daily snapshot (`/snapshots`), taken at the first changing write of a day, which is the fallback and not a substitute.
2. Parse the CSV with the repo's own parser: `Papa.parse(text, { header: true, skipEmptyLines: true })`, then `parseItems(rows)` from `src/view-rules.mjs`. Never hand-roll a second parser (`parser-filters`).
3. Merge with `mergeItems(base.ledger.items, parsed)` from `src/merge-rules.mjs`, where `base` is the copy from step 1. The result is `{items, added}` (`mergeItems` called without the refresh option): put its `items` back in the ledger, keep every other field as read, and note `added`.
4. POST `{"ledger": <ledger>}` to `/ledger`. The Worker merges again server-side, so the POST cannot replace what is stored (`imports-merge-never-replace`).
5. Read back: when `added` is above 0, `rev` rose by one (an unchanged ledger keeps its rev), `items` grew by `added`, and `received` and `receivedAt` are byte-equal to the copy.

Figures from the one run so far: `cloud-csv-import`.

**Status:** open. The owner ruled that a re-import refreshes `tracking` (item 89 b, 2026-11-15 13:38 CST, `imports-merge-never-replace`). The web import does. This route adds new lines only and refreshes no `tracking`: `POST /ledger` merges with the stored copy as the base, and an incoming line with no later `trackingAt` never beats a stored one. A web refresh reaches the stored ledger through its `trackingAt` stamp, once built and deployed (`merge-later-change-wins`). The name refresh stays on the importing device (debt `reimport-refresh-stays-on-device`).

## See also

- `live-verification` — what has run against the live Worker, GitHub and a device.
- `csv-import-stays-web` — the native app has no CSV import; this route is a web-parser route.
- `the-token-is-a-credential` — the device key stays out of the session, the repo and the ledger.
- `cloud-csv-import` — the figures of the one run.
- `orderwand-csv` — the CSV schema and quirks.
- `build-and-deploy` — commands, and why a deploy needs the owner's word.
