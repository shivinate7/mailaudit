# Sync moves from GitHub to Cloudflare

**Status:** open. Stage 4b is built, and the switch is pending. The server runs at `manifestnumberone.shivamsemwal01.workers.dev`. A device sends its ledger there once it has its key. The switch is the move to the new Durable Object, see Stage 4b rulings.

GitHub was added as a manual backup, not as a sync. Commit 2100b00 says so: "Deliberately a manual backup, not continuous sync." Auto-push and merge grew on top of it later, and no one chose a sync base again. A fresh choice, made on 2026-10-10, picked Cloudflare.

**Holds while:** `src/entry.jsx` still sends photos through the GitHub Contents API, and it mirrors the ledger there. The record closes when the Cloudflare base carries the ledger and the photos, and this file is rewritten as current text.

## Outcomes the revamp must give

- A check-in on one device shows on the other within seconds while both are open, with no tap. A closed home-screen app gets no live data on iOS, so it catches up when it opens.
- Un-checks and envelope deletes reach the other device.
- Every failure shows on the screen that must act. "I could not look" is never silent. This closes the photo case in `photo-ids-unreadable-local`, where a push that reads the local store as empty uploads nothing and shows nothing.
- A fresh phone recovers in one step.
- New orders arrive with no CSV export.
- No write is lost, and 30 days of history can be restored.

## The design

- **Sync base:** one Cloudflare Durable Object holds the ledger in SQLite. It holds the photos too, one row per photo id. The free plan gives 5 GB. On 2026-10-11 the photo repo held 8 photos in 5.3 MB, near 660 KB each, so 5 GB holds about 7,500 of them. R2 is not used: it must be turned on in the dashboard by accepting terms, and the Durable Object already has the room. Devices connect over a WebSocket and resync on resume. The free tier covers this app many times over. Durable Object point-in-time recovery gives 30 days of history.
- **Rejected:** hardened GitHub (no live updates, and it rests on a conflict reply that has never run, see `the-conflict-guard-is-unverified`); a server on HA Green (no backups, and a full disk stops the house DNS); Supabase (pauses after a week idle, no free backups); Firebase (photos and jobs need billing); Yjs or Automerge (a large rewrite for flat keyed data); hosted local-first services (shutting down or too young).
- **The site stays on GitHub Pages.** The Worker answers the Pages origin across CORS. So no device moves to a new origin, and no device loses its stored ledger.
- **Sign-in:** one key per device. A Cloudflare Access email code is the backup way in. The key stays a credential, see `the-token-is-a-credential`.
- **Key delivery:** the keys live in the Mac's Keychain. A script opens the app on the Mac with its key in the URL fragment, which no server receives. The app stores the key and clears the fragment. For the iPhone, the Mac shows the same link as a QR code. No key is printed.
- **GitHub becomes a mirror.** Each device still pushes the merged ledger to the GitHub `data` branch, once the server has answered. So the public seed, the backup watchdog and History keep working, and the Worker needs no GitHub token. The Durable Object holds the truth, so a GitHub conflict resolves by reading the new sha and writing again.
- **Live updates wait for a pause.** A change from the other device applies when this device has had no input for 10 seconds. No line says an update is waiting; the merge notice after the apply names what changed. A waiting line would have cost 40px of empty space at rest. This keeps `no-layout-shift-under-pointer`. One exception: the first reply after a saved key applies at once, because the owner just tapped Save and expects the ledger.
- **Un-checks and deletes:** each check-in key carries the time of its last change in a new saved key, and the later change wins. A discarded or assigned envelope stays as a tombstone with a deletion time, and every reader skips it. A ledger without these fields merges by today's rules, so an older build stays safe. The new key follows the six sites in `saved-state-shape`.
- **Orders:** a nightly job on HA Green replaces the OrderWand export. The owner chose HA Green over the MacBook. The job reads `store.tcgplayer.com/myaccount/orderhistory` with the owner's login cookie, as OrderWand 4.4.0 does. It GETs a form token, POSTs a date range, then reads each page. It sends the orders to the Worker. The Worker runs the same parser filters and the same merge, so `parser-filters` and `imports-merge-never-replace` still hold.
- **Item keys:** the job must build each key as `orderId|itemNumber|vendorProductId`, exactly as the CSV does. The item number is the line's position in its order. The product id comes from the card image URL. A different key would split one card into two lines, see `saved-state-shape`.
- **The job's host:** a small local add-on on HA Green, built like the Degen add-on. It starts once, and an HA automation starts it each night. It posts to the Worker, then exits. The cookie never runs inside HA Core. The add-on's DNS skips AdGuard Home, so the job cannot stall the house DNS. It keeps state in `/tmp` only and logs one line per run.
- **The cookie:** it can also reach the owner's seller account. It lives in the add-on's options as a password field. Root, the add-on and any HA admin can read it. It never goes to Cloudflare, to the ledger or to HA's shared secrets file. The owner pastes it in the add-on's Configuration tab.
- **Failure alerts:** the job sends a phone notice and exits nonzero on three events. These are a redirect to the logon page (an expired cookie), any non-2xx reply from the Worker, and any exception. TCGplayer's bot checks can block a client that is not a browser even with a good cookie, so the logon check must be strict. An HA automation alerts when no run has succeeded for 36 hours.

## The server, as built

- `worker/core.mjs` holds the logic that can be pure, and `npm run test:worker` tests it. `worker/index.mjs` holds the Worker and the `Ledger` Durable Object, which keeps `{ledger, rev}` under one storage key.
- `POST /ledger` merges the incoming ledger into the stored one with `mergeLedger` from `src/merge-rules.mjs`, the same merge the app runs. The stored copy's view preferences win. A POST that changes nothing writes nothing and sends no broadcast.
- The Durable Object takes its name from a deploy setting, and the default is ledger-v3. A probe deploy sets its own name, so a live test never writes to the real store. The object named `ledger` holds the stage 2 seed. The object named `ledger-v2` holds a live probe's test data, and no device may use it.
- A Worker call gives up after `SYNC_TIMEOUT_MS`, and then reads as unknown. The adapter aborts the fetch, and the app also races each call against the same limit. The second guard is the one the test harness can reach, because the harness does not load the adapter.
- The mirror pushes only after the ledger changes. So work that a past session never mirrored waits for the next change. The Worker holds it meanwhile, so nothing is lost. A push on every resume would read GitHub each time.
- A device's own write causes no GET. A rev heard while its POST is in flight waits for the reply. After a 401 the device stops calling the Worker until the page reloads.
- The app sends its key as a Bearer token in the `Authorization` header. A key that matches no stored hash gets 401. A body that is not a ledger gets 400. `GET /ledger` returns 404 until the first POST seeds the store.
- A merged ledger over the size limit gets 413 and writes nothing. A Durable Object value caps at 2,000,000 bytes, and the limit keeps at least 100,000 bytes of headroom under that cap. The guard counts UTF-8 bytes, not characters.
- A WebSocket carries the key as the second of exactly two protocols, `mailaudit` and the key. A browser cannot set a header on a WebSocket.
- The device keys live in the macOS Keychain, service `mailaudit-sync`, accounts `iphone` and `macbook`. The Worker holds only their SHA-256 hashes, in a Worker secret.
- The server's merge carries an un-check when its side has a time. `mergeLedger` takes the later `receivedAt` per key, and test 4.9 pins it. `max-cannot-express-an-uncheck` records that fix.
- Ruling, made by the orchestrator under the owner's grant to run the stages: a timed un-check beats a count that has no time. A timed absence exists only when someone made an un-check.
- `mergeReceived` follows that ruling, and group 50 pins it. A merge that removes a check-in or an envelope says so in its notice.

## Stage 4b rulings

The orchestrator made these under the owner's grant to run the stages, on 2026-10-11.

- **Switch:** the Worker moves to a new, empty Durable Object. Each device's first POST seeds it. The old object stays as the rollback copy. A re-seed from the old object could bring back an un-check through the per-key max.
- **Milestones on a live apply:** a live apply takes a milestone only when it removes something. Otherwise the recent version is enough. A milestone on every apply would fill the 60-slot list in one mail day.
- **Mirror mode needs a healthy server:** GitHub becomes a mirror only after the Worker answers `ok` or `empty` in this session. Any failure turns mirror mode off, and the device then runs the plain GitHub path. Worker retries wait on `backoffMs`. A per-cycle fallback merge pulled and took a milestone on every save, so it is gone.
- **The mirror pushes the merged ledger:** it merges the local ledger with the last server reply. On a conflict it reads the GitHub ledger and merges that in too, then writes with the fresh sha. It never force-writes its own copy, so no device can shrink the GitHub copy. That holds even when the server store starts empty.
- **The server copy only grows:** the device keeps the last server ledger as a merge of every reply. An older reply can never replace a newer one, so no push can shrink GitHub.
- **An empty store gets seeded:** a cold open that finds the store empty POSTs local check-ins, envelopes and stamps. That is the switch-day path.
- **A failed merge POST peeks once:** the next push takes the GitHub path and its peek, even if mirror mode returns.
- **A refused key says so:** a 401 shows its own advisory line.
- **iPhone key:** the home-screen app keeps its own storage, so a QR scan reaches Safari only. The sync panel holds a masked key field. The owner pastes the key there from the Mac clipboard, and the clipboard is cleared after. Claude never types or pastes a key.
- **QR code:** macOS draws it with its own image tools. No new package is installed.

## Still open

- Whether a Cloudflare Access login survives in an iOS home-screen app. This is untested.
- Live updates use a WebSocket. A new rev from the other device starts one GET, and the reply waits for the idle gate.
- A 413 from the Worker turns mirror mode off, as an unknown answer does. The advisory line names the size problem.

## See also

- `sync-runs-itself` — the GitHub sync this replaces.
- `ledger-private-source-public` — the private ledger repo the move retires.
- `orderwand-csv` — the CSV the nightly job replaces.
- `ruled-head-one-advisory-entrance` — the one line that names a failed server.
