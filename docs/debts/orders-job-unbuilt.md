# The orders extension is unbuilt

**What.** Orders will come from a browser extension. It reads the 120-day order history in the owner's signed-in TCGplayer tab and posts the pages to the Worker's `POST /orders`. The Worker parses and merges them. The plan and the Worker contract are in `docs/plans/orders-extension.md`. The extension, the Worker's `POST /orders` and `GET /orders/status`, and the app's status screen are all unbuilt. The app's status screen is a later screen lane, and it is part of this gap.

The route is measured in two parts. A plain client (the Mac and a Worker) ran only the GET by page number, for 40 pages, and checked status, size and order count (one run). The form-token GET and the POST that set Last 120 Days ran only in the owner's signed-in browser, never from a plain client.

Unmeasured:

- Whether the extension's fetches carry the sign-in revalidation. The plan relies on the tab's own cookies. A logon or revalidate redirect is assumed to mean an expired sign-in.
- The size of a trimmed 120-day payload. The 8,000,000-byte body limit is a guess.
- Two orders dated 2026-06-23 are in the CSV and not on the page's Last 120 Days list. The assumed cause: 2026-06-23 is 126 days before the probe day, 2026-10-27, so those orders fall outside a 120-day window counted from that day. The cause is unmeasured.

The gap closes when the owner's first live run merges a 120-day read into the ledger and the status screen exists. Then remove the TCG_COOKIE Worker secret and the Keychain item `mailaudit-tcg-cookie`, as the plan says.

**Status:** open. The plan is in `docs/plans/orders-extension.md`. The owner's go is waiting-page item 50 (`orders-extension-go`, the owner's go on the extension plan), option a, 10:55 CST 2026-11-08. Nothing of the extension or its routes is built.

**Decision:** `sync-revamp-cloudflare` (the Cloudflare sync decision).
