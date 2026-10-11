# Sync moves from GitHub to Cloudflare

**Status:** open. Stage 2 is built: the server runs at `manifestnumberone.shivamsemwal01.workers.dev`, seeded from the GitHub ledger. The app does not use it yet.

GitHub was added as a manual backup, not as a sync. Commit 2100b00 says so: "Deliberately a manual backup, not continuous sync." Auto-push and merge grew on top of it later, and no one chose a sync base again. A fresh choice, made on 2026-10-10, picked Cloudflare.

**Holds while:** `src/entry.jsx` still syncs through the GitHub Contents API. The record closes when the Cloudflare base carries the ledger and the photos, and this file is rewritten as current text.

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
- **Key delivery:** the keys live in the Mac's Keychain. A script opens the app on the Mac with its key in the URL fragment, which no server receives. The app stores the key and clears the fragment. For the iPhone, the Mac shows the same link as a QR code that the owner scans once. No key is printed or pasted.
- **GitHub becomes a mirror.** Each device still pushes the merged ledger to the GitHub `data` branch. So the public seed, the backup watchdog and History keep working, and the Worker needs no GitHub token. The Durable Object holds the truth, so a GitHub conflict resolves by reading the new sha and writing again.
- **Live updates wait for a pause.** A change from the other device applies when this device has had no input for 10 seconds. Until then a quiet line says that updates are waiting. This keeps `no-layout-shift-under-pointer`.
- **Un-checks and deletes:** each check-in key carries the time of its last change in a new saved key, and the later change wins. A discarded or assigned envelope stays as a tombstone with a deletion time, and every reader skips it. A ledger without these fields merges by today's rules, so an older build stays safe. The new key follows the six sites in `saved-state-shape`.
- **Orders:** a nightly job on HA Green replaces the OrderWand export. The owner chose HA Green over the MacBook. The job reads `store.tcgplayer.com/myaccount/orderhistory` with the owner's login cookie, as OrderWand 4.4.0 does. It GETs a form token, POSTs a date range, then reads each page. It sends the orders to the Worker. The Worker runs the same parser filters and the same merge, so `parser-filters` and `imports-merge-never-replace` still hold.
- **Item keys:** the job must build each key as `orderId|itemNumber|vendorProductId`, exactly as the CSV does. The item number is the line's position in its order. The product id comes from the card image URL. A different key would split one card into two lines, see `saved-state-shape`.
- **The job's host:** a small local add-on on HA Green, built like the Degen add-on. It starts once, and an HA automation starts it each night. It posts to the Worker, then exits. The cookie never runs inside HA Core. The add-on's DNS skips AdGuard Home, so the job cannot stall the house DNS. It keeps state in `/tmp` only and logs one line per run.
- **The cookie:** it can also reach the owner's seller account. It lives in the add-on's options as a password field. Root, the add-on and any HA admin can read it. It never goes to Cloudflare, to the ledger or to HA's shared secrets file. The owner pastes it in the add-on's Configuration tab.
- **Failure alerts:** the job sends a phone notice and exits nonzero on three events. These are a redirect to the logon page (an expired cookie), any non-2xx reply from the Worker, and any exception. TCGplayer's bot checks can block a client that is not a browser even with a good cookie, so the logon check must be strict. An HA automation alerts when no run has succeeded for 36 hours.

## The server, as built

- `worker/core.mjs` holds the logic that can be pure, and `npm run test:worker` tests it. `worker/index.mjs` holds the Worker and the `Ledger` Durable Object, which keeps `{ledger, rev}` under one storage key.
- `POST /ledger` merges the incoming ledger into the stored one with `mergeLedger` from `src/merge-rules.mjs`, the same merge the app runs. The stored copy's view preferences win.
- A merged ledger over the size limit gets 413 and writes nothing. A Durable Object value caps at 2,000,000 bytes, and the limit keeps at least 100,000 bytes of headroom under that cap. The guard counts UTF-8 bytes, not characters.
- A WebSocket carries the key as the second of exactly two protocols, `mailaudit` and the key. A browser cannot set a header on a WebSocket.
- The device keys live in the macOS Keychain, service `mailaudit-sync`, accounts `iphone` and `macbook`. The Worker holds only their SHA-256 hashes, in a Worker secret.
- The server's merge cannot carry an un-check yet. A timestamp per check-in fixes that, as `max-cannot-express-an-uncheck` says.

## Still open

- Whether a Cloudflare Access login survives in an iOS home-screen app. This is untested.
- The GitHub ledger keeps moving until the devices switch. So seed the Durable Object again from it at the switch.

## See also

- `sync-runs-itself` — the GitHub sync this replaces.
- `ledger-private-source-public` — the private ledger repo the move retires.
- `orderwand-csv` — the CSV the nightly job replaces.
