# Sync moves from GitHub to Cloudflare

Kind: build

Plan: docs/decisions/sync-revamp-cloudflare.md#web-plan (web)

Plan: docs/decisions/sync-revamp-cloudflare.md#worker-work-ahead (worker)

Plan: docs/decisions/sync-revamp-cloudflare.md#worker-work-ahead (native)

**Status:** ruled 2026-10-10. Owner ruling 2026-10-14 21:12 CDT: build the switch. Web syncs through Cloudflare only. The GitHub mirror stops being a live second copy, and the Worker's daily snapshots become the backup. Owner ruling 2026-10-14 21:55 CDT: photos move to the Worker, and the 8 photos on the GitHub photo branch are copied there once. The switch and the photo move merged in PR #100 (a214855). The copy ran on 2026-10-16, between 03:02 and 03:08 CDT. Debt: `web-photos-have-no-backup`. The server runs at `manifestnumberone.shivamsemwal01.workers.dev`. A device sends its ledger there once it has its key. Owner ruling 2026-10-27 20:19 CDT: the nightly orders job runs as a cron on this Worker, with the owner's TCGplayer cookie as a Worker secret. Debt: `orders-job-unbuilt`.

GitHub was added as a manual backup, not as a sync. Commit 2100b00 says so: "Deliberately a manual backup, not continuous sync." Auto-push and merge grew on top of it later, and no one chose a sync base again. A fresh choice, made on 2026-10-10, picked Cloudflare.

**Holds while:** `src/entry.jsx` still defines the GitHub photo adapter on `window.remote` (`PHOTOS`, `photoTarget` and the rest), and `src/app.jsx` still reads its `photoTarget` for the photo line. History still reads the frozen `data` branch through `window.remote.listVersions` and `getVersion`. The record closes when the GitHub adapter leaves the web build, the photo copy has run, and this file is rewritten as current text.

## Outcomes the revamp must give

- A check-in on one device shows on the other within seconds while both are open, with no tap. A closed home-screen app gets no live data on iOS, so it catches up when it opens.
- Un-checks and envelope deletes reach the other device.
- Every failure shows on the screen that must act. "I could not look" is never silent. This closes the photo case in `photo-ids-unreadable-local`, where a push that reads the local store as empty uploads nothing and shows nothing.
- A fresh phone recovers in one step.
- New orders arrive with no CSV export.
- No write is lost, and 30 days of history can be restored.

## The design

- **Sync base:** one Cloudflare Durable Object holds the ledger in SQLite. It holds the photos too, one row per photo id. The free plan gives 5 GB. On 2026-10-11 the photo repo held 8 photos in 5.3 MB, near 660 KB each, so 5 GB holds about 7,500 of them. R2 is not used: it must be turned on in the dashboard by accepting terms, and the Durable Object already has the room. Devices connect over a WebSocket and resync on resume. The free tier covers this app many times over. Durable Object point-in-time recovery gives 30 days of history. The photo route is a Worker route that serves both the web app and the native client, see Worker work ahead.
- **Rejected:** hardened GitHub (no live updates, and it rests on a GitHub conflict reply that never ran live); a server on HA Green (no backups, and a full disk stops the house DNS); Supabase (pauses after a week idle, no free backups); Firebase (photos and jobs need billing); Yjs or Automerge (a large rewrite for flat keyed data); hosted local-first services (shutting down or too young).
- **The site stays on GitHub Pages.** The Worker answers the Pages origin across CORS. So no device moves to a new origin, and no device loses its stored ledger.
- **Sign-in:** one key per device. A Cloudflare Access email code is the backup way in. The key stays a credential, see `the-token-is-a-credential`.
- **Key delivery:** the keys live in the Mac's Keychain. A script opens the app on the Mac with its key in the URL fragment, which no server receives. The app stores the key and clears the fragment. For the iPhone, the Mac shows the same link as a QR code. No key is printed.
- **GitHub leaves the sync role.** The owner ruled on 2026-10-11: "Cloudflare does it all". The Worker keeps daily snapshots for History and backup. The owner ruled on 2026-10-14 that the backup watchdog in the private repo is turned off, and the orchestrator does that. No alarm then watches the backup, see `backup-unwatched`. The public seed is removed, as the owner ruled on 2026-10-11 and on 2026-10-14/15, in `82e45d4`. The seed stays in public git history, see debt `seed-in-public-history`. The web build no longer reads the ledger remote. Web no longer writes the ledger to GitHub, and it no longer calls the mirror, auto-push, or the GitHub peek and merge. `window.remote` still defines them until slice S3 removes them. The `data` branch is frozen, and History still reads it. The Worker needs no GitHub token, and native never holds one. See `worker-keeps-snapshots`.
- **Live updates wait for a press.** A change from the other device applies as soon as the owner is not mid-press (owner ruling 2026-10-20), see `auto-apply-happens-now`. No line says an update is waiting; the merge notice after the apply names what changed. A waiting line would have cost 40px of empty space at rest. This keeps `no-layout-shift-under-pointer`. One exception: the cold reply to a saved key applies at once, whatever press is down or in its tail, because the owner just tapped Save (`auto-apply-happens-now` says what still holds it). The next reply waits again.
- **Un-checks and deletes:** each check-in key carries the time of its last change in a new saved key, and the later change wins. A discarded or assigned envelope stays as a tombstone with a deletion time, and every reader skips it. A ledger without these fields merges by today's rules, so an older build stays safe. The new key follows the six sites in `saved-state-shape`.
- **Orders:** a nightly job replaces the OrderWand export. On 2026-10-11 the owner said of the job: `we're gonna figure out how to just pull the tcgplayer orders list after we understood how orderwand did it`. The native client has no CSV import. Orders reach it through the Worker, see `csv-import-stays-web`. The job reads `store.tcgplayer.com/myaccount/orderhistory` with the owner's login cookie, as OrderWand 4.4.0 does. It runs as a cron on the existing Worker, manifestnumberone, and merges the orders there (owner ruling 2026-10-27 20:19 CDT). The design is that the Worker runs the same parser filters and the same merge, so `parser-filters` and `imports-merge-never-replace` still hold. The order-history page has no Type or Vendor column, so the job must emit Type purchase and Vendor TCG for `parser-filters` to keep the rows. None of this is built, debt `orders-job-unbuilt`.
- **The page route (measured on 2026-10-27, 19:15 to 19:45 CDT, in the owner's signed-in browser, with no cookie value read):** a GET of `?PageNumber=N` on that page returns 200 with the orders newest first, 10 orders a page. The job GETs a form token, then POSTs the filter form: the token `__RequestVerificationToken` and a date range of Last 120 Days. The POST returns 200. Then 60 pages give 597 orders and 1,066 items in about 2 minutes. The form-token POST ran only inside the owner's browser, never from a plain client. The probe below repeated only the GET by page number with a plain client.
- **The fetch probe (measured on 2026-10-27, 20:11 to 20:13 CDT):** 40 sequential GETs of `?PageNumber=N`, N from 1 to 40, with the owner's cookie. The client was plain HTTP, with no browser. Each page was checked for status, size and order count. From the owner's Mac (residential IP, Python urllib, sequential, redirects not followed): 40 of 40 returned 200 with 10 orders each, median 3,154 ms a page. From a throwaway Cloudflare Worker named orders-probe (workers.dev, colo DFW, sequential, redirect set to manual): 40 of 40 returned 200 with 10 orders each, median 2,622 ms a page, and no logon redirect. The Worker was deleted after the run. The account's Workers plan is not measured. So a Cloudflare datacenter IP was not blocked at this rate, in one run. The cookie's lifetime is still unmeasured.
- **Field match against the OrderWand export of 2026-10-27 (measured):** the export held 599 TCG purchase orders and 1,068 items, dated 2026-06-23 to 2026-10-25. The page and the export share 597 orders. On all 597, the item keys, quantities and unit prices are identical, and the order dates match. Shipping and tax match too, order by order. The shipping total ($695.41) and the tax total ($4,707.11) are measured: each is summed per order from the CSV's Shipping Amount and Tax Amount columns, and each is equal to the page's total. The seller matches on 595. The 2 misses are TCGplayer Direct orders, where the seller sits on each line ("Sold by X"), as OrderWand parses it. The name matches on 590. The 7 misses carry the listing note inside the name cell, and OrderWand parses the note apart. The shipping status differs on 20 orders. The export says unknown. The page shows tracking on 11 and no tracking on 9, so the page is newer than the export. The export holds 2 orders dated 2026-06-23 that are not on the page's Last 120 Days list. The cause is unmeasured, debt `orders-job-unbuilt`.
- **Item keys:** the job must build each key as `orderId|itemNumber|vendorProductId`, exactly as the CSV does. The item number is the line's position in its order, counted from 1. The product id comes from the card image URL. Both are measured: the keys match on 597 of 597 orders. A different key would split one card into two lines, see `saved-state-shape`.
- **Owner rulings of 2026-10-27:**
  - 19:14 CDT: "dont worry about bot blocking type stuff this is the same route banchi uses at an extremely lower cadence than it does. there's no TOS to be of a worry here. plus it's all my personal data". Banchi is the owner's separate seller tool repo. It reads TCGplayer sales through the seller order API, a different endpoint, with its own cookie.
  - 19:16 CDT (a paraphrase, the exact words were not kept): a scheduled real browser as the runner is a perk.
  - 19:20 CDT: "if there is a route via cloudflare so that i can skip my HA for this specifically i guess that is preferred due to the convenience of it all living in one place, but we can figure that out later".
  - 20:19 CDT: the owner chose between two options and answered "Yea let's do A". Option A was "Worker cron: everything lives in one place, at no cost; you give up keeping the cookie off Cloudflare". Option B was "HA add-on: cookie stays at home; you run a second place to maintain". So the orders job runs as a cron on the existing Worker, manifestnumberone, and the owner's TCGplayer cookie is stored as a Worker secret named TCG_COOKIE.
  - 20:26 CDT: "You have the cloudflare API you should be able to do all fo that for me". Claude set TCG_COOKIE on manifestnumberone at 20:27 CDT (measured: the secret list shows it, and `GET /ledger` still returns 401 without a key). Claude will deploy the cron from main after the merge (planned).
- **The job's host:** ruled 2026-10-27 20:19 CDT, see the rulings above. The job runs as a cron on the existing Worker, manifestnumberone. The HA Green add-on is rejected: the owner picked option A over option B, the add-on option.
- **The cookie:** it can also reach the owner's seller account. It lives in a Worker secret named TCG_COOKIE (owner ruling 2026-10-27 20:19 CDT), set at 20:27 CDT. It never goes into the ledger. A Keychain item with service `mailaudit-tcg-cookie` exists on the Mac (measured), separate from banchi's cookie. Claude read its value only by piping it into the probe and into the Worker secret. The cookie's lifetime is unmeasured, debt `orders-job-unbuilt`.
- **Failure alerts:** a failure must surface and never read as an empty order list. Three events count as a failure: a redirect to the logon page (assumed to mean an expired cookie, unmeasured), any non-2xx reply from TCGplayer, and any exception. The logon check stays strict. A plain client got 40 of 40 pages from the Mac and from a Worker on 2026-10-27, one run, so no bot block showed at that rate. A later block is unmeasured. If it comes, it would show as one of the failures above (assumed). The planned design is that the Worker records the job's status (unbuilt, a detail the owner has not ruled). How the app shows a failed or stale run is a later screen lane, debt `orders-job-unbuilt`. A run with no success for 36 hours counts as stale (a carried-over limit, not ruled for the Worker).

## The server, as built

- `worker/core.mjs` holds the logic that can be pure, and `npm run test:worker` tests it. `worker/index.mjs` holds the Worker and the `Ledger` Durable Object, which keeps `{ledger, rev}` under one storage key.
- `POST /ledger` merges the incoming ledger into the stored one with `mergeLedger` from `src/merge-rules.mjs`, the same merge the app runs. The stored copy's view preferences win. A POST that changes nothing writes nothing and sends no broadcast.
- The Durable Object takes its name from a deploy setting, and the default is ledger-v3. A probe deploy sets its own name, so a live test never writes to the real store. The object named `ledger` holds the stage 2 seed. The object named `ledger-v2` holds a live probe's test data, and no device may use it.
- A Worker call gives up after `SYNC_TIMEOUT_MS`, and then reads as unknown. The adapter aborts the fetch, and the app also races each call against the same limit. The second guard is the one the test harness can reach, because the harness does not load the adapter.
- A device's own write causes no GET. A rev heard while its POST is in flight waits for the reply. After a 401 the device stops calling the Worker until the page reloads.
- The app sends its key as a Bearer token in the `Authorization` header. A key that matches no stored hash gets 401. A body that is not a ledger gets 400. `GET /ledger` returns 404 until the first POST seeds the store.
- A merged ledger over the size limit gets 413 and writes nothing. A Durable Object value caps at 2,000,000 bytes, and the limit keeps at least 100,000 bytes of headroom under that cap. The guard counts UTF-8 bytes, not characters.
- A WebSocket carries the key as the second of exactly two protocols, `mailaudit` and the key. A browser cannot set a header on a WebSocket.
- A Durable Object that accepts a WebSocket sends it `{rev}` of the stored ledger at once, when a ledger is stored. A socket that was down across a broadcast learns the rev when it reconnects. The client fetches only a rev newer than the one it holds. So a newer hello fetches the change the socket missed, and a hello at the held rev starts no GET. A store with no ledger sends nothing. A refused key gets no socket and no rev. The hello is a courtesy: if the store cannot be read, or the socket refuses the send, the upgrade still succeeds and the socket opens with no hello. Worker tests 70.1 to 70.5 (`npm run test:worker`) and app test 75.11 pin it.
- The device keys live in the macOS Keychain, service `mailaudit-sync`, accounts `iphone` and `macbook`. The Worker holds only their SHA-256 hashes, in a Worker secret.
- The server's merge carries an un-check when its side has a time. `mergeLedger` takes the later `receivedAt` per key, and test 4.9 pins it. `max-cannot-express-an-uncheck` records that fix.
- Ruling, made by the orchestrator under the owner's grant to run the stages: a timed un-check beats a count that has no time. A timed absence exists only when someone made an un-check.
- `mergeReceived` follows that ruling, and group 50 pins it. A merge that removes a check-in or an envelope says so in its notice.

## Stage 4b rulings

The orchestrator made these under the owner's grant to run the stages, on 2026-10-11.

- **Switch:** the Worker moves to a new, empty Durable Object. Each device's first POST seeds it. The old object stays as the rollback copy. A re-seed from the old object could bring back an un-check through the per-key max.
- **Milestones on a live apply:** a live apply takes a milestone only when it removes something. Otherwise the recent version is enough. A milestone on every apply would fill the 60-slot list in one mail day.
- **A Worker failure never falls back to GitHub:** any failure sets the advisory state, and Worker retries wait on `backoffMs`.
- **The server copy only grows:** the device keeps the last server ledger as a merge of every reply. An older reply can never replace a newer one.
- **An empty store gets seeded:** a cold open that finds the store empty POSTs local check-ins, envelopes and stamps. That is the switch-day path.
- **The seed POST is cancelled on unmount:** the cold-open timer is held in a ref, and the sync effect's cleanup clears it. It already ran through `bgTimeout`, so it was unref'd. The defect was that it was untracked. Orchestrator decision 2026-10-12. It is a defect fix, and Decide, gallery does not cover it. Two cold cycles can overlap: a second paste of the key can arm while the first GET is still out. Each arm used to overwrite the one ref, so the first timer outlived the unmount. Now a cycle clears the prior handle before it arms (`cbac3a0`). That overlap fix is a defect fix in this lane, not a ruling. Pinned by 69.1 and 69.3b, each red before its fix and green after. Its controls 69.1a0 and 69.3a0 are green both times.
- **A refused key says so:** a 401 shows its own advisory line.
- **iPhone key:** the home-screen app keeps its own storage, so a QR scan reaches Safari only. The sync panel holds a masked key field. The owner pastes the key there from the Mac clipboard, and the clipboard is cleared after. Claude never types or pastes a key.
- **QR code:** macOS draws it with its own image tools. No new package is installed.

## Web plan

Slice S1 built the ledger switch. Slice S2 moves photos in the same lane: `window.sync` has `photoList`, `photoGet` and `photoPut` against the Worker `/photos` route. A held reply downloads the photos it names before it applies, and a photo push follows a ledger POST. `scripts/copy-photos-to-worker.mjs` copies the GitHub photo branch once, and it is a dry run by default. The copy ran on 2026-10-16, between 03:02 and 03:08 CDT. Slice S3 removes the GitHub adapter's photo and write paths. Until then the adapter stays defined on `window.remote` in `src/entry.jsx`. Debt: `web-photos-have-no-backup`. The switch itself is in Stage 4b rulings.

## Worker work ahead

The native build needs these changes to the Worker. On main the Worker serves `/ledger` and `/ws`, with no import route. Lanes W2a and W3a added the photo route and the snapshot routes on main, in PRs #77 and #79. The lanes are in `native-build-lanes`.

- **Stats in the reply (lane W1, landed in PR #61):** the POST reply carries `stats` from `mergeLedger`, as it carries the ledger and the rev now. A first POST to an empty store replies with zero stats, so the seeding device sees nothing as new (owner-delegated ruling, 2026-10-11). A client then shows the merge notice without running the merge.
- **Photo route (lane W2):** the owner ruled on 2026-10-11: "Build server photo route first". The route serves both clients before native photo lane N10. It stores photos as rows by photo id, as the design section says. Lane W2a built it, in PR #77. Orchestrator defaults of 2026-10-12, not owner rulings: a photo over 1.9 MB is refused with 413, there is no delete route, and a repeat POST keeps the first bytes.
- **Daily snapshots (lane W3):** the Worker keeps exactly 180 daily snapshots for History and backup, see `worker-keeps-snapshots`. Lane W3a built them, in PR #79. Group 13 (tests 13.1 to 13.9) holds the snapshot tests. At W3a, `npm run test:worker` read 312 passed, 0 failed. Lanes W3b to W3e are named in `native-build-lanes`. W3b is blocked.
- **Universal-link file:** the universal-link fallback needs a Worker route for the apple-app-site-association file. The owner ruled the fallback on 2026-10-11. Neither the route nor the fallback is built. The fallback is built only if the N11 Camera check fails the custom scheme, see `native-key-via-url-scheme`.

## Still open

- Web photos: the one-time copy of the 8 GitHub photos ran on 2026-10-16, between 03:02 and 03:08 CDT. The GitHub adapter's photo and write paths (slice S3) are not removed. Debts: `web-photos-have-no-backup`, `photo-put-unrun-on-github`.
- The History-restore fix is built in this lane (`restampRestore`, called from `applyBackup`). It lands before the switch merges, as the owner ruled.
- Whether a Cloudflare Access login survives in an iOS home-screen app. This is untested. Debt: `cloudflare-access-login-untested`.
- Live updates use a WebSocket. A new rev from the other device starts one GET, and the reply waits only for a press and its tail. A socket that stays open and hears nothing is not noticed until the next resume. Debt: `half-open-socket-has-no-ping`.
- The orders job: its host is ruled (a cron on the existing Worker, with the cookie as a Worker secret, 2026-10-27 20:19 CDT), and the secret is set. The cron job, the key-match test and the screen that shows job status are unbuilt. Debt: `orders-job-unbuilt`.
- A 413 from the Worker sets the advisory state, as an unknown answer does. The advisory line names the size problem.

## Named limits

- No alarm watches the Worker backup. The owner accepted that on 2026-10-14 at 21:55 CDT, after turning the watchdog off. Named limit, not an open item: `backup-unwatched`.
- The `SWEEP_WAIT` settle (2600 ms) after test 19.6 hides an unexplained stall at 30.13. Named limit, debt: `sweep-settle-masks-30-13-stall`.
- A photo that this device and the Worker both lack shows as lost only after its envelope is 7 days old. The clock is the envelope's age, not the time since the other device could upload. Named limit: `pull-warns-on-what-it-drops`, debt `lost-photo-clock-is-envelope-age`.

## See also

- `sync-runs-itself` — the retired GitHub sync rule. Its no-toggle rule still stands.
- `ledger-private-source-public` — the private ledger repo the move retires.
- `orderwand-csv` — the CSV the nightly job replaces.
- `ruled-head-one-advisory-entrance` — the one line that names a failed server.
- `worker-keeps-snapshots` — GitHub leaves the sync role.
- `native-swift-rebuild` — the native client that talks to this Worker.
