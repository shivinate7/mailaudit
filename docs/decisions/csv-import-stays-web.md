# CSV import stays on the web app

Kind: build

Plan: docs/plans/orders-extension.md#worker-contract (worker)

Plan: docs/plans/orders-extension.md#extension (extension)

**Status:** ruled. The owner accepted this on 2026-10-11 with "all seem fine". The native client has no CSV import and no upload zone.

Orders enter the ledger through the web app's CSV import, and through the browser extension's pages at the Worker's `POST /orders` (plan `docs/plans/orders-extension.md`). The Worker syncs them to the native client. The Worker runs the same `parseItems` on the extension's pages, so `parser-filters` (the parser keeps only TCG purchases) keeps one home. A Swift port of the importer would give it a second home.

**Holds while:** `parseItems` is the only code that applies `parser-filters` (the web import calls it, and `POST /orders` will too), and the native client has no CSV import.

## Why

- `parser-filters` keeps only TCG purchases. One parser enforces it. A Swift parser would need its own tests for the same rule.
- `imports-merge-never-replace` holds for the one merge. A second importer would need the same proof.
- The browser extension replaces the OrderWand export, see `sync-revamp-cloudflare`. The order-history page has no Type or Vendor column. The Worker's parse keeps a blank Type and a blank Vendor, so the rows pass. To emit Type purchase and Vendor TCG is a design choice, not a requirement (design, unbuilt). The extension is unbuilt, debt `orders-job-unbuilt`. Its orders reach both clients through the sync, so a native import would serve only the gap before the extension exists.

## Rejected

A Worker route `POST /import` for CSV. It is rejected, because `POST /orders` is the one route for orders. The extension's pages go there, and the Worker runs the same `parseItems` and the same merge on them. A second route would be a second importer, with its own proof.

## See also

- `orderwand-csv` — the CSV schema and its quirks.
- `native-parity-table` — the row for CSV import.
- `sync-revamp-cloudflare` — the orders extension and its decision.
- `docs/plans/orders-extension.md` — the extension plan and the Worker contract.
