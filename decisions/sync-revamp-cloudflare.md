# Sync moves from GitHub to Cloudflare

**Status:** open. The design is decided. Nothing is built yet.

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

- **Sync base:** one Cloudflare Durable Object holds the ledger in SQLite. It holds the photos too, one row per photo id. The free plan gives 5 GB, and the photos come to near 100 MB. R2 is not used: it must be turned on in the dashboard by accepting terms, and the Durable Object already has the room. Devices connect over a WebSocket and resync on resume. The free tier covers this app many times over. Durable Object point-in-time recovery gives 30 days of history.
- **Rejected:** hardened GitHub (no live updates, and it rests on a conflict reply that has never run, see `the-conflict-guard-is-unverified`); a server on HA Green (no backups, and a full disk stops the house DNS); Supabase (pauses after a week idle, no free backups); Firebase (photos and jobs need billing); Yjs or Automerge (a large rewrite for flat keyed data); hosted local-first services (shutting down or too young).
- **The site stays on GitHub Pages.** The Worker answers the Pages origin across CORS. So no device moves to a new origin, and no device loses its stored ledger.
- **Sign-in:** one key per device, pasted once. A Cloudflare Access email code is the backup way in. The key stays a credential, see `the-token-is-a-credential`.
- **Orders:** a nightly job on HA Green replaces the OrderWand export. The owner chose HA Green over the MacBook. The job reads `store.tcgplayer.com/myaccount/orderhistory` with the owner's login cookie, as OrderWand 4.4.0 does. It GETs a form token, POSTs a date range, then reads each page. It sends the orders to the Worker. The Worker runs the same parser filters and the same merge, so `parser-filters` and `imports-merge-never-replace` still hold.
- **Item keys:** the job must build each key as `orderId|itemNumber|vendorProductId`, exactly as the CSV does. The item number is the line's position in its order. The product id comes from the card image URL. A different key would split one card into two lines, see `saved-state-shape`.
- **The job's host:** a small local add-on on HA Green, built like the Degen add-on. It starts once, and an HA automation starts it each night. It posts to the Worker, then exits. The cookie never runs inside HA Core. The add-on's DNS skips AdGuard Home, so the job cannot stall the house DNS. It keeps state in `/tmp` only and logs one line per run.
- **The cookie:** it can also reach the owner's seller account. It lives in the add-on's options as a password field. Root, the add-on and any HA admin can read it. It never goes to Cloudflare, to the ledger or to HA's shared secrets file. The owner pastes it in the add-on's Configuration tab.
- **Failure alerts:** the job sends a phone notice and exits nonzero on three events. These are a redirect to the logon page (an expired cookie), any non-2xx reply from the Worker, and any exception. TCGplayer's bot checks can block a client that is not a browser even with a good cookie, so the logon check must be strict. An HA automation alerts when no run has succeeded for 36 hours.

## Still open

- Whether a Cloudflare Access login survives in an iOS home-screen app. This is untested.
- Seed the Durable Object from the GitHub ledger before any device switches to it.

## See also

- `sync-runs-itself` — the GitHub sync this replaces.
- `ledger-private-source-public` — the private ledger repo the move retires.
- `orderwand-csv` — the CSV the nightly job replaces.
