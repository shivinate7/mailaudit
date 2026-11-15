# Orders by browser extension

**Status:** building, lane branch `claude/orders-extension-6be474`. Owner pick: waiting-page item 50, `orders-extension-go`, option a, 10:55 CST 2026-11-08 ("Go on the extension plan").

Decision: `sync-revamp-cloudflare`. Debt: `orders-job-unbuilt`. Replaces the closed draft PR #154 (Worker cron with a stored cookie), kept at `archive/b/orders-cron`.

This plan pins the contract between the Worker and the extension, so the test-author, the builders and the designer work from one shape.

## Why an extension

A stored TCGplayer cookie cannot run unattended. The buyer pages need a recent sign-in revalidation, and `BuyerRevalidationKey` expired 1 h after sign-in (measured 2026-10-28 16:52 CDT). Sign-in loads hCaptcha, so Claude never automates it. The owner's own signed-in browser already holds a fresh session, so the extension reads the orders there.

## Flow

1. The owner loads the unpacked extension once and pastes a device key into its options page.
2. The owner signs in to TCGplayer as usual. When a tab on `store.tcgplayer.com` finishes loading and the last success is more than 12 h old, the extension pulls. The options page also has a pull button.
3. The pull runs in that tab, same origin, so the page's own cookies go with each fetch:
   - GET `/myaccount/orderhistory`, read the form token;
   - POST the filter form with `DateRange` = `Last 120 Days` (fields `__RequestVerificationToken`, `ClearSessionFilters`, `SearchString`, `DateRange`, as measured 2026-10-27);
   - GET `?PageNumber=N` from 1 until a page holds no `div.orderWrap`. No page cap.
   - Each page is trimmed to the concatenated outer HTML of its `div.orderWrap` elements.
4. The background service worker POSTs the pages to the Worker. The device key lives only there.
5. The badge shows the outcome (see Badge).

## Failures the extension detects

| kind | when |
|---|---|
| `signed-out` | a fetch ends on a URL off `/myaccount/orderhistory` (a logon or revalidate redirect), or page 1 holds no `div.orderWrap` |
| `fetch` | a non-2xx reply, a network error, or a missing form token |
| `timeout` | one fetch takes longer than 30 s |

An empty page after page 1 can end the read. Three things must hold: its final URL is still the order-history page, it holds the filter form with a `DateRange` field, and it has no password field. Otherwise it is `signed-out`: a logon form served with 200 must not read as the end. A page that the read has already seen also ends the read. The real end page is unmeasured; this rule is the guess the owner's first live run tests. On any failure the extension sends no pages; it sends the failure kind instead.

## Worker contract

Both routes take `Authorization: Bearer <device key>`, the same check as `/ledger`. A wrong key gets 401.

### `POST /orders`

Body, JSON, one of:

- pages: `{ "v": 1, "pages": ["<orderWrap html>", ...] }`, page 1 first;
- failure: `{ "v": 1, "failure": "signed-out" | "fetch" | "timeout" }`.

The Worker runs #154's `parse` on each page, then the shared `parseItems` (so `parser-filters` holds), then `mergeIntoStore`, the one merge that `POST /ledger` also runs, with the shipping-status refresh (so `imports-merge-never-replace` holds).

Rules:

- A page that parses to zero orders is a failure, kind `empty`. It may be a logon page served with 200 (review finding 1).
- Zero items kept by `parseItems` across all pages is a failure, kind `no-items` (finding 2).
- A line whose price or quantity cell does not read as a number, or that has no product id (no image), is unreadable. It is dropped, never merged with a default (findings 3 and 4). The good lines still merge. The reply counts the dropped lines, and the status records kind `unreadable`.
- A shipping-status text the parser does not know reads as blank, so the refresh skips it (finding 7 asks a test for it).
- A failure (`empty`, `no-items`, or a posted failure kind) merges nothing.
- A status write that fails is not hidden: the route replies 500 (finding 6). The merge runs first and stands.
- `pages: []` is `empty`. Lines that are all unreadable leave nothing for `parseItems`, so they are `no-items`.
- A 400, 401 or 413 writes no status: it is not a run.
- `items` counts the lines this post kept. `added` is `stats.itemsAdded`, or on an empty store the lines merged. `lastFailure.count` is the unreadable count, present only for kind `unreadable`.

Replies:

| code | body |
|---|---|
| 200 | `{ "orders": n, "items": n, "added": n, "unreadable": n, "rev": n }` (`added` is `stats.itemsAdded` from the merge) |
| 200 | `{ "recorded": "<kind>" }` for a posted failure |
| 400 | `{ "error": "bad body" }`: not JSON, `v` is not 1, or neither `pages` (array of strings) nor a known `failure` |
| 401 | `{ "error": "unauthorized" }` |
| 413 | `{ "error": "too-large" }`: body over `MAX_ORDERS_BODY_BYTES` (8,000,000 UTF-8 bytes, a guess; payload size is unmeasured), or the merged ledger over `MAX_LEDGER_BYTES` |
| 422 | `{ "error": "empty" }` or `{ "error": "no-items" }` |

### `GET /orders/status`

`{ "lastSuccessAt": iso | null, "lastFailure": { "kind", "at", "count"? } | null }`. Stored under its own Durable Object key `orders-status`, never in the ledger. A success clears `lastFailure` unless the same run dropped unreadable lines.

## Extension

Chrome, Manifest V3, folder `extension/`. Host permissions: `https://store.tcgplayer.com/*` and the Worker origin. Pure logic sits in `extension/core.mjs`, tested in node: the 12 h gate, the page loop over an injected fetch, failure kinds, the trim, and the request builder.

- The key is stored in `chrome.storage.local`, read only by the background service worker, and sent only in the `Authorization` header. It never enters a page, a log, the body, or the badge (`the-token-is-a-credential`).
- No cookie value is read by extension code. The tab's fetches carry the cookies themselves.

### Badge

| state | badge |
|---|---|
| success | the `added` count, or empty when 0 |
| `signed-out` | `in` with a hint to sign in |
| any other failure | `!` |

The designer draws the options page and the badge states before the builder starts.

## Not in scope

- The app's screen that shows `/orders/status` (a later screen lane, debt `orders-job-unbuilt`).
- Minting the extension's own device key. `sync-revamp-cloudflare` rules one key per device, so the extension gets its own: Keychain service `mailaudit-sync`, account `extension`, its hash added to the Worker secret `DEVICE_KEY_HASHES` at deploy, on the coordinator's go. The build accepts any key the Worker lists.
- Removing the Worker secret `TCG_COOKIE` and the Keychain item `mailaudit-tcg-cookie`: after the endpoint is deployed and the owner's first live run passes.
