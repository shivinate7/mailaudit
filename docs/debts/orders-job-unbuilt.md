# The nightly orders job is unbuilt

**What.** The owner ruled on 2026-10-27 at 20:19 CDT that the job runs as a cron on the existing Worker. The owner's cookie is a Worker secret, see `sync-revamp-cloudflare`. The secret, TCG_COOKIE, is set (measured at 20:27 CDT). Three parts are unbuilt: the cron job, a key test, and the screen that shows job status. The key test proves that the job builds the same item key as the CSV for the same orders. Claude will deploy the cron from main after the merge (planned).

The route is measured in two parts. A plain client (the Mac and a Worker) ran only the GET by page number, for 40 pages, and checked status, size and order count (one run). The form-token GET and the POST that set Last 120 Days ran only in the owner's signed-in browser, never from a plain client.

The planned design is that the Worker records the job's status, and a logon redirect or a fetch failure shows in the app. That detail is unbuilt and the owner has not ruled it. How the app shows a failed or stale run is a later screen lane.

Four items are unmeasured or unexplained:

- Two orders dated 2026-06-23 are in the CSV and not on the page's Last 120 Days list. The assumed cause: 2026-06-23 is 126 days before the probe day, 2026-10-27, so those orders fall outside a 120-day window counted from that day. The cause is unmeasured.
- The cookie's lifetime is unmeasured, and the logon redirect is only assumed to mean an expired cookie.
- Whether a plain client can set the date range (the form POST) is unmeasured, and so is whether its pages then match the browser's list.
- A full 120-day fetch is 60 pages. The probe fetched 40, and no cron run has fetched 60. A limit of 50 subrequests per run applies if the account is on the free plan. This is assumed, from a research lane's report on 2026-10-27 (Cloudflare limits docs, developers.cloudflare.com/workers/platform/limits). The account's Workers plan is not measured.

The gap closes when the cron merges one night's orders into the ledger and the key test is green. Job status must also show in the app, and the four items must be measured or ruled out.

**Status:** open. The fetch probe passed from a Worker and from the Mac. The host is ruled and the secret is set. The cron job, the key test and the status screen are unbuilt.

**Decision:** `sync-revamp-cloudflare`.
